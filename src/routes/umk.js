import { Router } from "express";
import { z } from "zod";
import { createHash } from "node:crypto";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { db, tx } from "../db.js";
import { config } from "../config.js";
import { audit } from "../audit.js";
import { parse, wrap, badRequest, conflict, forbidden, parseActor, authorizeUmk, notFound, normKode } from "../http.js";
import { getUmkOr404, nextUmkKode, umkSummary, umkDetail } from "../services/umk-service.js";
import { runEvaluate } from "../services/evaluate-service.js";
import { cancelChaseFor } from "../scheduler/chase.js";
import { checkCertificate } from "../mocks/registry.js";

const r = Router();
const DOK_WAJIB = ["NIB", "PERMOHONAN", "PERNYATAAN_HALAL", "IKRAR", "PENYELIA", "DAFTAR_BAHAN", "PROSES", "FOTO_PRODUK", "MANUAL_SJPH"];

const q = {
  actorByTg: db.prepare("SELECT id, role, umk_id FROM actor WHERE telegram_id = ?"),
  insUmk: db.prepare("INSERT INTO umk (koperasi_id, kode, nama_usaha, nib, status, consent_at) VALUES (1, ?, ?, ?, 'intake', datetime('now'))"),
  insActor: db.prepare("INSERT INTO actor (telegram_id, role, display_name, umk_id) VALUES (?, 'umk', ?, ?)"),
  insDoc: db.prepare("INSERT OR IGNORE INTO document_req (umk_id, kode, status) VALUES (?, ?, 'kurang')"),
  insProduct: db.prepare("INSERT INTO product (umk_id, kode, nama, jenis) VALUES (?, ?, ?, ?)"),
  countProducts: db.prepare("SELECT COUNT(*) n FROM product WHERE umk_id = ?"),
  media: db.prepare("SELECT id FROM media WHERE id = ? AND umk_id = ?"),
  docUpsert: db.prepare(`INSERT INTO document_req (umk_id, kode, status, media_id, catatan, updated_at) VALUES (?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(umk_id, kode) DO UPDATE SET status = excluded.status, media_id = excluded.media_id, catatan = excluded.catatan, updated_at = datetime('now')`),
  insCert: db.prepare("INSERT INTO supplier_cert (umk_id, nama_pemasok, nomor_sertifikat, berlaku_sampai, media_id, status) VALUES (?,?,?,?,?,?)"),
  insCertBahan: db.prepare("INSERT OR IGNORE INTO supplier_cert_bahan (supplier_cert_id, umk_id, bahan) VALUES (?,?,?)"),
  linkIng: db.prepare(`UPDATE ingredient SET supplier_cert_id = ? WHERE nama_normal = ? AND product_id IN (SELECT id FROM product WHERE umk_id = ?)
    AND (supplier_cert_id IS NULL OR supplier_cert_id NOT IN (SELECT id FROM supplier_cert WHERE status = 'valid'))`),
  mediaPaths: db.prepare("SELECT path FROM media WHERE umk_id = ?"),
  actorsOfUmk: db.prepare("DELETE FROM actor WHERE umk_id = ?"),
  delUmk: db.prepare("DELETE FROM umk WHERE id = ?"),
  delEvents: db.prepare("DELETE FROM event_log WHERE umk_id = ?"),
  fingerprint: db.prepare("SELECT kode, nama_usaha, nib, created_at FROM umk WHERE id = ?"),
};

// ---------- POST /umk ----------
const CreateUmk = z.object({
  telegram_id: z.string().regex(/^\d{3,20}$/),
  nama_usaha: z.string().trim().min(3).max(80),
  nib: z.string().regex(/^\d{13}$/, "NIB 13 digit").nullable().optional(),
  consent: z.boolean(),
});
r.post("/umk", wrap((req, res) => {
  const b = parse(CreateUmk, req.body);
  if (!b.consent) throw badRequest("Pendaftaran memerlukan persetujuan pemrosesan data usaha (consent=true). Tidak ada data yang disimpan.");
  const existing = q.actorByTg.get(b.telegram_id);
  if (existing) throw conflict(`akun ${b.telegram_id} sudah terdaftar sebagai ${existing.role}`);
  const out = tx(() => {
    const kode = nextUmkKode();
    const u = q.insUmk.run(kode, b.nama_usaha, b.nib ?? null);
    const umkId = u.lastInsertRowid;
    q.insActor.run(b.telegram_id, b.nama_usaha, umkId);
    for (const k of DOK_WAJIB) q.insDoc.run(umkId, k);
    if (b.nib) q.docUpsert.run(umkId, "NIB", "diterima", null, "dari pendaftaran");
    audit({ umkId, actor: `umk:${b.telegram_id}`, aksi: "CONSENT", detail: { teks: "UMK menyetujui pemrosesan data usaha untuk penyiapan berkas sertifikasi halal (self-declare). Tanpa data pribadi.", kode } });
    audit({ umkId, actor: req.actor, aksi: "INTAKE", detail: { kode } });
    return getUmkOr404(umkId);
  });
  res.status(201).json(umkSummary(out));
}));

// ---------- GET /umk (daftar untuk papan dashboard & pendamping) ----------
const listStmt = db.prepare(`SELECT u.id, u.kode, u.nama_usaha, u.status, u.kbli, u.updated_at,
    d.jalur, d.skor_kesiapan,
    (SELECT COUNT(*) FROM document_req dr WHERE dr.umk_id = u.id AND dr.status IN ('kurang','diminta','ditolak')) AS dokumen_kurang,
    (SELECT COUNT(*) FROM chase_task ct WHERE ct.umk_id = u.id AND ct.tahap = 4 AND ct.status = 'terkirim') AS eskalasi,
    (SELECT nama FROM product p WHERE p.umk_id = u.id ORDER BY p.id LIMIT 1) AS produk,
    (SELECT COUNT(*) FROM document_req dr WHERE dr.umk_id = u.id AND dr.kode NOT LIKE 'SERT_PEMASOK:%' AND dr.kode <> 'KONFIRMASI_BAHAN' AND dr.kode <> 'PERBAIKAN_OSS') AS dokumen_total,
    (SELECT COUNT(*) FROM document_req dr WHERE dr.umk_id = u.id AND dr.kode NOT LIKE 'SERT_PEMASOK:%' AND dr.kode <> 'KONFIRMASI_BAHAN' AND dr.kode <> 'PERBAIKAN_OSS' AND dr.status IN ('diterima','dihasilkan')) AS dokumen_diterima,
    (SELECT MAX(created_at) FROM event_log e WHERE e.umk_id = u.id AND e.aksi NOT IN ('SEED','ROLE_SWITCH')) AS last_activity_at,
    CAST(julianday('now') - julianday(COALESCE((SELECT MAX(created_at) FROM event_log e WHERE e.umk_id = u.id AND e.aksi NOT IN ('SEED','ROLE_SWITCH')), u.updated_at, u.created_at)) AS INTEGER) AS hari_diam,
    (u.consent_at IS NOT NULL) AS consent
  FROM umk u LEFT JOIN decision d ON d.id = (SELECT MAX(id) FROM decision WHERE umk_id = u.id)
  WHERE u.koperasi_id = ? AND u.status <> 'dihapus' ORDER BY CAST(substr(u.kode, 5) AS INTEGER)`);
r.get("/umk", wrap((req, res) => {
  const { koperasi_id } = parse(z.object({ koperasi_id: z.coerce.number().int().positive().default(1) }), req.query);
  const a = parseActor(req.actor);
  if (a.kind === "umk") throw badRequest("daftar UMK hanya untuk pendamping/agent");
  res.json({ koperasi_id, umk: listStmt.all(koperasi_id) });
}));

// ---------- GET/PATCH/DELETE /umk/:id ----------
r.get("/umk/:id", wrap((req, res) => {
  const u = getUmkOr404(req.params.id);
  authorizeUmk(parseActor(req.actor), u);
  res.json(umkDetail(u));
}));

const PatchUmk = z.object({
  nama_usaha: z.string().trim().min(3).max(80).optional(),
  nib: z.string().regex(/^\d{13}$/, "NIB 13 digit").optional(),
  skala: z.enum(["mikro", "kecil", "menengah", "besar"]).optional(),
  kbli: z.string().regex(/^\d{5}$/, "KBLI 5 digit").optional(),
  alamat: z.string().trim().min(5).max(200).optional(),
  omzet_tahunan: z.number().int().nonnegative().max(1e13).optional(),
  jumlah_fasilitas_produksi: z.number().int().min(1).max(50).optional(),
  jumlah_outlet: z.number().int().min(0).max(50).optional(),
  fasilitas_terpisah_nonhalal: z.union([z.literal(0), z.literal(1)]).optional(),
  peralatan: z.enum(["manual", "semi_otomatis", "otomatis_pabrik"]).optional(),
  penyelia_halal: z.string().trim().min(2).max(80).optional(),
  status: z.enum(["ditunda"]).optional(),   // hanya pendamping (M3 eskalasi)
}).strict();
r.patch("/umk/:id", wrap((req, res) => {
  const u = getUmkOr404(req.params.id);
  authorizeUmk(parseActor(req.actor), u);
  const b = parse(PatchUmk, req.body);
  const keys = Object.keys(b);
  if (!keys.length) throw badRequest("tidak ada field yang diubah");
  if (b.status && parseActor(req.actor).kind === "umk") throw forbidden("status 'ditunda' hanya dapat diset pendamping");
  const sets = keys.map((k) => `${k} = @${k}`).join(", ");
  db.prepare(`UPDATE umk SET ${sets}, updated_at = datetime('now') WHERE id = @id`).run({ ...b, id: u.id });
  if (b.nib) q.docUpsert.run(u.id, "NIB", "diterima", null, "dari profil");
  if (b.penyelia_halal) q.docUpsert.run(u.id, "PENYELIA", "diterima", null, b.penyelia_halal);
  audit({ umkId: u.id, actor: req.actor, aksi: "PROFIL", detail: { fields: keys } });
  res.json(umkDetail(getUmkOr404(u.id)));
}));

r.delete("/umk/:id", wrap((req, res) => {
  const u = getUmkOr404(req.params.id);
  authorizeUmk(parseActor(req.actor), u);
  const fp = q.fingerprint.get(u.id);
  const hash = createHash("sha256").update(JSON.stringify({ ...fp, deleted_at: new Date().toISOString() })).digest("hex");
  const paths = q.mediaPaths.all(u.id).map((m) => m.path);
  tx(() => {
    // Urutan penting: tabel tanpa ON DELETE CASCADE / yang merujuk actor dihapus lebih dulu
    db.prepare("DELETE FROM submission_mock WHERE umk_id = ?").run(u.id);   // merujuk dossier & umk
    db.prepare("DELETE FROM chase_task WHERE umk_id = ?").run(u.id);        // merujuk actor (target_actor_id)
    q.actorsOfUmk.run(u.id);                                                // actor.umk_id tanpa cascade
    q.delEvents.run(u.id);                                                  // event_log.umk_id tanpa cascade
    q.delUmk.run(u.id);             // cascade: product, ingredient, media, document_req, decision, dossier, supplier_cert, supplier_cert_bahan
    audit({ umkId: null, actor: req.actor, aksi: "DATA_DELETED", detail: { kode: fp.kode, hash_bukti: hash } });
  });
  for (const p of paths) { try { rmSync(p, { force: true }); } catch { /* abaikan */ } }
  try { rmSync(join(config.pdfDir, fp.kode), { recursive: true, force: true }); } catch { /* abaikan */ }
  res.json({ deleted: true, kode: fp.kode, hash_bukti: hash, pesan: "Seluruh data usaha, produk, bahan, dokumen, keputusan, dan berkas telah dihapus. Simpan hash ini sebagai bukti." });
}));

// ---------- POST /umk/:id/products ----------
const CreateProduct = z.object({ nama: z.string().trim().min(2).max(80), jenis: z.string().trim().min(2).max(40).optional(), kbli: z.string().regex(/^\d{5}$/).nullable().optional() });
r.post("/umk/:id/products", wrap((req, res) => {
  const u = getUmkOr404(req.params.id);
  authorizeUmk(parseActor(req.actor), u);
  const b = parse(CreateProduct, req.body);
  const n = q.countProducts.get(u.id).n + 1;
  const kode = `P-${u.kode.slice(4)}-${n}`;
  const p = q.insProduct.run(u.id, kode, b.nama, b.jenis ?? null);
  if (b.kbli && !u.kbli) db.prepare("UPDATE umk SET kbli = ? WHERE id = ?").run(b.kbli, u.id);
  audit({ umkId: u.id, actor: req.actor, aksi: "PRODUK_DITAMBAH", detail: { product_id: p.lastInsertRowid, kode } });
  res.status(201).json({ id: p.lastInsertRowid, kode, nama: b.nama, jenis: b.jenis ?? null, langkah: "Minta foto label komposisi dan foto/cerita proses produksi." });
}));

// ---------- POST /umk/:id/evaluate ----------
r.post("/umk/:id/evaluate", wrap((req, res) => {
  const u = getUmkOr404(req.params.id);
  authorizeUmk(parseActor(req.actor), u);
  if (u.status === "dihapus") throw notFound("UMK");
  res.json(runEvaluate(u, req.app.locals.rules, req.actor));
}));

// ---------- PUT /umk/:id/documents/:kode ----------
const PutDoc = z.object({ media_id: z.number().int().positive().optional(), catatan: z.string().max(300).optional(), status: z.enum(["diterima", "dihasilkan"]).default("diterima") });
r.put("/umk/:id/documents/:kode", wrap((req, res) => {
  const u = getUmkOr404(req.params.id);
  authorizeUmk(parseActor(req.actor), u);
  const kode = normKode(req.params.kode);
  const b = parse(PutDoc, req.body ?? {});
  if (b.media_id && !q.media.get(b.media_id, u.id)) throw badRequest("media_id bukan milik UMK ini");
  q.docUpsert.run(u.id, kode, b.status, b.media_id ?? null, b.catatan ?? null);
  const dibatalkan = cancelChaseFor(u.id, kode);
  audit({ umkId: u.id, actor: req.actor, aksi: "DOKUMEN_DITERIMA", detail: { kode, status: b.status, media_id: b.media_id ?? null, chase_dibatalkan: dibatalkan } });
  res.json({ kode, status: b.status, chase_dibatalkan: dibatalkan, dokumen_kurang: umkSummary(getUmkOr404(u.id)).dokumen_kurang });
}));

// ---------- POST /umk/:id/supplier-certs ----------
const CreateCert = z.object({
  nama_pemasok: z.string().trim().min(2).max(120),
  nomor_sertifikat: z.string().trim().min(6).max(40),
  berlaku_sampai: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  media_id: z.number().int().positive().nullable().optional(),
  untuk_bahan: z.array(z.string().min(1)).max(20).optional(),
});
r.post("/umk/:id/supplier-certs", wrap((req, res) => {
  const u = getUmkOr404(req.params.id);
  authorizeUmk(parseActor(req.actor), u);
  const b = parse(CreateCert, req.body);
  if (b.media_id && !q.media.get(b.media_id, u.id)) throw badRequest("media_id bukan milik UMK ini");
  const reg = checkCertificate(b.nomor_sertifikat);
  const rules = req.app.locals.rules;
  const bahanCakupan = [...new Set([...(reg.bahan ?? []), ...(b.untuk_bahan ?? []).map((x) => normalizeName(x, rules))].filter(Boolean))];
  const out = tx(() => {
    const c = q.insCert.run(u.id, reg.nama_pemasok ?? b.nama_pemasok, b.nomor_sertifikat.replace(/\s+/g, "").toUpperCase(), reg.berlaku_sampai ?? b.berlaku_sampai ?? null, b.media_id ?? null, reg.status);
    const certId = c.lastInsertRowid;
    for (const bahan of bahanCakupan) {
      q.insCertBahan.run(certId, u.id, bahan);
      if (reg.status === "valid") {
        q.linkIng.run(certId, bahan, u.id);
        q.docUpsert.run(u.id, `SERT_PEMASOK:${bahan}`, "diterima", b.media_id ?? null, `${reg.nama_pemasok} s.d. ${reg.berlaku_sampai}`);
        cancelChaseFor(u.id, `SERT_PEMASOK:${bahan}`);
        if (bahan === "giling") { q.docUpsert.run(u.id, "SERT_PEMASOK:GILING", "diterima", b.media_id ?? null, reg.nama_pemasok); cancelChaseFor(u.id, "SERT_PEMASOK:GILING"); }
        if (rules.ingredients.sembelihan?.includes(bahan)) { q.docUpsert.run(u.id, "SERT_PEMASOK:RPH", "diterima", b.media_id ?? null, reg.nama_pemasok); cancelChaseFor(u.id, "SERT_PEMASOK:RPH"); }
      }
    }
    audit({ umkId: u.id, actor: req.actor, aksi: "SERT_PEMASOK", detail: { supplier_cert_id: certId, status: reg.status, bahan: bahanCakupan, simulasi: true } });
    return { id: certId, status: reg.status, nama_pemasok: reg.nama_pemasok ?? b.nama_pemasok, berlaku_sampai: reg.berlaku_sampai ?? b.berlaku_sampai ?? null, bahan: bahanCakupan, simulasi: true };
  });
  // Evaluasi ulang otomatis (FR-10)
  const decision = runEvaluate(getUmkOr404(u.id), rules, req.actor);
  const pesan = reg.status === "valid" ? "Sertifikat valid (simulasi registry). Evaluasi diperbarui."
    : reg.status === "kedaluwarsa" ? "Sertifikat sudah kedaluwarsa. Minta sertifikat yang masih berlaku dari pemasok."
    : "Nomor sertifikat tidak ditemukan di registry (simulasi). Periksa nomor dan nama pemasok.";
  res.status(201).json({ ...out, pesan, decision });
}));

function normalizeName(raw, rules) {
  const syn = rules.ingredients.normalisasi ?? {};
  const s = String(raw).toLowerCase().trim();
  return syn[s] ?? s.replace(/\s+/g, "_");
}

export default r;
