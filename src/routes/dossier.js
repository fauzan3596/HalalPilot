import { Router } from "express";
import { z } from "zod";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { db, tx } from "../db.js";
import { audit } from "../audit.js";
import { parse, wrap, notFound, conflict, forbidden, parseActor, authorizeUmk, normKode } from "../http.js";
import { getUmkOr404, lastDecision, documents } from "../services/umk-service.js";
import { buildDossier } from "../dossier/builder.js";
import { postToAgent } from "../scheduler/hooks-client.js";
import { createChaseTasks } from "../scheduler/chase.js";
import { runEvaluate } from "../services/evaluate-service.js";

const r = Router();
const q = {
  dossier: db.prepare("SELECT d.*, u.kode, u.nama_usaha, u.koperasi_id FROM dossier d JOIN umk u ON u.id = d.umk_id WHERE d.id = ?"),
  pendampingTg: db.prepare("SELECT a.telegram_id FROM koperasi k JOIN actor a ON a.id = k.pendamping_actor_id WHERE k.id = ?"),
  actorByTg: db.prepare("SELECT id, role FROM actor WHERE telegram_id = ?"),
  kopPend: db.prepare("SELECT pendamping_actor_id FROM koperasi WHERE id = ?"),
  umkTg: db.prepare("SELECT telegram_id FROM actor WHERE role = 'umk' AND umk_id = ? LIMIT 1"),
  setDossier: db.prepare("UPDATE dossier SET status = ?, catatan_pendamping = ? WHERE id = ?"),
  setUmk: db.prepare("UPDATE umk SET status = ?, updated_at = datetime('now') WHERE id = ?"),
  docTolak: db.prepare(`INSERT INTO document_req (umk_id, kode, status, catatan, updated_at) VALUES (?, ?, 'ditolak', ?, datetime('now'))
    ON CONFLICT(umk_id, kode) DO UPDATE SET status = 'ditolak', catatan = excluded.catatan, updated_at = datetime('now')`),
};

// POST /umk/:id/dossier
r.post("/umk/:id/dossier", wrap(async (req, res) => {
  const u = getUmkOr404(req.params.id);
  authorizeUmk(parseActor(req.actor), u);
  const dec = lastDecision(u.id);
  if (!dec) throw conflict("belum ada evaluasi; jalankan evaluate dulu");
  if (dec.jalur !== "SELF_DECLARE_SIAP") {
    const kurang = documents(u.id).filter((d) => ["kurang", "diminta", "ditolak"].includes(d.status)).map((d) => d.kode);
    throw conflict(`dossier hanya untuk jalur SELF_DECLARE_SIAP (saat ini ${dec.jalur}). Dokumen kurang: ${kurang.join(", ") || "-"}`);
  }
  if (["siap_unggah", "diajukan_simulasi", "selesai_simulasi"].includes(u.status)) throw conflict(`UMK sudah ${u.status}`);
  const out = await buildDossier(u, req.app.locals.rules, req.actor);
  // Notifikasi pendamping (non-blocking)
  const to = q.pendampingTg.get(u.koperasi_id)?.telegram_id;
  if (to) postToAgent({ to, idempotencyKey: `dossier-notify:${out.dossier_id}`, message: `[NOTIFY] Beri tahu pendamping: dossier ${u.kode} (${u.nama_usaha}) versi ${out.versi} siap review, skor ${dec.skor_kesiapan}. Balas "setuju ${u.kode}" atau "kembalikan ${u.kode} <alasan>". Tautan: ${out.url_dashboard}` }).catch(() => {});
  res.status(201).json({ ...out, status: "menunggu_review", pesan: "Dossier disusun dan dikirim ke pendamping untuk review. Bukan sertifikat." });
}));

// GET /dossier/:did/pdf  (unduh berkas untuk dashboard/pendamping)
r.get("/dossier/:did/pdf", wrap((req, res) => {
  const d = q.dossier.get(Number(req.params.did));
  if (!d) throw notFound("dossier");
  const a = parseActor(req.actor);
  if (a.kind === "umk") authorizeUmk(a, { id: d.umk_id, koperasi_id: d.koperasi_id });
  res.setHeader("Content-Disposition", `inline; filename="${d.kode}-dossier-v${d.versi}.pdf"`);
  if (!existsSync(d.pdf_path)) throw notFound("file PDF");
  res.type("application/pdf").sendFile(resolve(d.pdf_path), (err) => { if (err && !res.headersSent) res.status(404).json({ error: "not_found", detail: "file PDF tidak ada" }); });
}));

// POST /dossier/:did/review
const Review = z.object({ aksi: z.enum(["setuju", "kembalikan"]), catatan: z.string().max(500).optional(), pendamping_telegram_id: z.string().regex(/^\d{3,20}$/), dokumen_ulang: z.array(z.string()).max(10).optional() });
r.post("/dossier/:did/review", wrap(async (req, res) => {
  const d = q.dossier.get(Number(req.params.did));
  if (!d) throw notFound("dossier");
  const b = parse(Review, req.body);
  const a = q.actorByTg.get(b.pendamping_telegram_id);
  if (!a || a.role !== "pendamping" || q.kopPend.get(d.koperasi_id)?.pendamping_actor_id !== a.id) {
    audit({ umkId: d.umk_id, actor: req.actor, aksi: "REVIEW_DENIED", detail: { dossier_id: d.id, telegram_id_suffix: b.pendamping_telegram_id.slice(-3) } });
    throw forbidden("hanya pendamping koperasi ini yang dapat menyetujui/mengembalikan dossier");
  }
  if (d.status === "disetujui" && b.aksi === "setuju") throw conflict("dossier sudah disetujui");
  if (b.aksi === "kembalikan" && !b.catatan) throw conflict("pengembalian memerlukan catatan alasan");

  const umkTg = q.umkTg.get(d.umk_id)?.telegram_id;
  if (b.aksi === "setuju") {
    tx(() => { q.setDossier.run("disetujui", b.catatan ?? null, d.id); q.setUmk.run("siap_unggah", d.umk_id); audit({ umkId: d.umk_id, actor: `pendamping:${b.pendamping_telegram_id}`, aksi: "APPROVE", detail: { dossier_id: d.id, versi: d.versi } }); });
    if (umkTg) postToAgent({ to: umkTg, idempotencyKey: `approve-notify:${d.id}`, message: `[NOTIFY] Beri tahu UMK ${d.nama_usaha}: berkas self-declare versi ${d.versi} telah disetujui pendamping dan siap diunggah pendamping ke SiHalal. Ini belum sertifikat; keputusan akhir milik BPJPH.` }).catch(() => {});
    return res.json({ dossier_id: d.id, status: "disetujui", umk_status: "siap_unggah", langkah: "Pendamping mengunggah paket ke SiHalal. Untuk simulasi: 'ajukan <kode>'." });
  }
  const dokumenUlang = (b.dokumen_ulang?.length ? b.dokumen_ulang : ["FOTO_PRODUK"]).map(normKode);
  const rules = req.app.locals.rules;
  const created = tx(() => {
    q.setDossier.run("dikembalikan", b.catatan, d.id);
    q.setUmk.run("dikembalikan", d.umk_id);
    for (const k of dokumenUlang) q.docTolak.run(d.umk_id, k, `dikembalikan pendamping: ${b.catatan}`);
    audit({ umkId: d.umk_id, actor: `pendamping:${b.pendamping_telegram_id}`, aksi: "RETURN", detail: { dossier_id: d.id, catatan: b.catatan, dokumen_ulang: dokumenUlang } });
    const n = createChaseTasks(d.umk_id, dokumenUlang, rules);
    // Keputusan lama (SIAP, skor 100) tidak lagi mencerminkan dokumen yang ditolak → catat keputusan baru; status UMK tetap "dikembalikan"
    runEvaluate({ ...getUmkOr404(d.umk_id), status: "dikembalikan" }, rules, `pendamping:${b.pendamping_telegram_id}`, { updateStatus: false });
    return n;
  });
  if (umkTg) postToAgent({ to: umkTg, idempotencyKey: `return-notify:${d.id}:${Date.now() / 60000 | 0}`, message: `[NOTIFY] Beri tahu UMK ${d.nama_usaha}: pendamping mengembalikan berkas dengan catatan: "${b.catatan}". Minta ${dokumenUlang.join(", ")} dikirim ulang.` }).catch(() => {});
  res.json({ dossier_id: d.id, status: "dikembalikan", umk_status: "dikembalikan", dokumen_ulang: dokumenUlang, chase_dibuat: created });
}));

export default r;
