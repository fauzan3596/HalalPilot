// Mock eksternal berlabel simulasi: OSS, SEHATI, SiHalal.
import { Router } from "express";
import { z } from "zod";
import { db, tx } from "../db.js";
import { audit } from "../audit.js";
import { parse, wrap, notFound, conflict } from "../http.js";
import { lookupOss } from "../mocks/oss.js";
import { quota, consumeQuota } from "../mocks/sehati.js";
import { createChaseTasks } from "../scheduler/chase.js";
import { postToAgent } from "../scheduler/hooks-client.js";
import { runEvaluate } from "../services/evaluate-service.js";
import { getUmkOr404 } from "../services/umk-service.js";

const r = Router();
const q = {
  dossier: db.prepare("SELECT d.*, u.kode, u.nama_usaha, u.status AS umk_status FROM dossier d JOIN umk u ON u.id = d.umk_id WHERE d.id = ?"),
  insSub: db.prepare("INSERT INTO submission_mock (umk_id, dossier_id, nomor_simulasi, status, alasan) VALUES (?,?,?,?,?)"),
  setUmk: db.prepare("UPDATE umk SET status = ?, updated_at = datetime('now') WHERE id = ?"),
  docTolak: db.prepare(`INSERT INTO document_req (umk_id, kode, status, catatan, updated_at) VALUES (?, ?, 'ditolak', ?, datetime('now'))
    ON CONFLICT(umk_id, kode) DO UPDATE SET status = 'ditolak', catatan = excluded.catatan, updated_at = datetime('now')`),
  umkTg: db.prepare("SELECT telegram_id FROM actor WHERE role = 'umk' AND umk_id = ? LIMIT 1"),
  countSub: db.prepare("SELECT COUNT(*) n FROM submission_mock"),
};
const ALASAN_UMUM = [
  { alasan: "foto label tidak terbaca", dokumen: "FOTO_PRODUK" },
  { alasan: "KBLI tidak sesuai dengan produk", dokumen: "PERBAIKAN_OSS" },
  { alasan: "nama penyelia halal tidak diisi", dokumen: "PENYELIA" },
];

r.get("/mock/oss/:nib", wrap((req, res) => {
  const rec = lookupOss(req.params.nib);
  if (!rec) throw notFound("NIB (simulasi OSS)");
  res.json(rec);
}));

r.get("/mock/sehati/quota", wrap((req, res) => res.json({ simulasi: true, provinsi: quota() })));

const Submit = z.object({ dossier_id: z.number().int().positive(), provinsi: z.string().default("DI Yogyakarta"), force_result: z.enum(["diterima", "dikembalikan"]).optional() });
r.post("/mock/sihalal/submit", wrap((req, res) => {
  const b = parse(Submit, req.body);
  const d = q.dossier.get(b.dossier_id);
  if (!d) throw notFound("dossier");
  if (d.status !== "disetujui") throw conflict(`dossier belum disetujui pendamping (status ${d.status})`);
  if (!["siap_unggah", "ditolak_simulasi"].includes(d.umk_status)) throw conflict(`UMK berstatus ${d.umk_status}`);
  // Deterministik ~20% dikembalikan: berdasarkan urutan pengajuan (setiap ke-5), kecuali dipaksa
  const n = q.countSub.get().n + 1;
  const dikembalikan = b.force_result ? b.force_result === "dikembalikan" : n % 5 === 0;
  const alasan = dikembalikan ? ALASAN_UMUM[n % ALASAN_UMUM.length] : null;
  const nomor = `SIM-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(n).padStart(4, "0")}`;
  const out = tx(() => {
    if (!dikembalikan && !consumeQuota(b.provinsi)) throw conflict(`kuota SEHATI ${b.provinsi} habis (simulasi)`);
    q.insSub.run(d.umk_id, d.id, nomor, dikembalikan ? "dikembalikan" : "diterima", alasan?.alasan ?? null);
    if (dikembalikan) {
      q.setUmk.run("menunggu_dokumen", d.umk_id);
      q.docTolak.run(d.umk_id, alasan.dokumen, `dikembalikan SiHalal (simulasi): ${alasan.alasan}`);
      const chase = createChaseTasks(d.umk_id, [alasan.dokumen], req.app.locals.rules);
      runEvaluate({ ...getUmkOr404(d.umk_id), status: "menunggu_dokumen" }, req.app.locals.rules, "sihalal_simulasi", { updateStatus: false }); // keputusan menyusul dokumen yang ditolak
      audit({ umkId: d.umk_id, actor: req.actor, aksi: "SUBMIT_SIMULASI_DIKEMBALIKAN", detail: { nomor, alasan: alasan.alasan, dokumen: alasan.dokumen, chase } });
      return { nomor_simulasi: nomor, status: "dikembalikan", alasan: alasan.alasan, dokumen_diminta: [alasan.dokumen], umk_status: "menunggu_dokumen" };
    }
    q.setUmk.run("selesai_simulasi", d.umk_id);
    audit({ umkId: d.umk_id, actor: req.actor, aksi: "SUBMIT_SIMULASI_DITERIMA", detail: { nomor, provinsi: b.provinsi } });
    return { nomor_simulasi: nomor, status: "diterima", umk_status: "selesai_simulasi" };
  });
  const tg = q.umkTg.get(d.umk_id)?.telegram_id;
  if (tg) postToAgent({ to: tg, idempotencyKey: `submit-notify:${nomor}`, message: `[NOTIFY] Beri tahu UMK ${d.nama_usaha}: pengajuan SIMULASI ${nomor} berstatus ${out.status}${out.alasan ? ` dengan alasan "${out.alasan}"; minta ${out.dokumen_diminta.join(", ")} diperbaiki` : ""}. Tegaskan ini simulasi, bukan portal SiHalal asli.` }).catch(() => {});
  res.json({ ...out, simulasi: true, pesan: "SIMULASI SiHalal, bukan pengajuan resmi." });
}));

export default r;
