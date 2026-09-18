// Seed "portofolio sedang bergerak" — dijalankan SETELAH seed/demo.mjs (--keep-actors), untuk adegan pembuka/penutup video.
// Video yang dibuka dengan 0/120 dan 0% memberi kesan produk tidak bekerja. Skrip ini memajukan sebagian UMK sintetis ke tahap
// yang wajar tanpa menyentuh 3 UMK skenario (UMK-017/042/088) yang dimainkan langsung di Telegram.
//   npm run seed:bergerak
// Yang dibuat (semua fiktif, deterministik dari kode UMK):
//   - 12 selesai (simulasi), 6 siap unggah, 6 menunggu review (dossier PDF asli dibangun), 3 eskalasi tahap 4, sisanya seperti seed.
//   - event_log dimundurkan 1–13 hari supaya "hari diam" beragam dan laju 7 hari terakhir > 0.
import { db } from "../src/db.js";
import { loadRules } from "../src/rules/loader.js";
import { buildDossier } from "../src/dossier/builder.js";
import { config } from "../src/config.js";

const rules = loadRules(config.rulesDir);
const SKENARIO = new Set(["UMK-017", "UMK-042", "UMK-088"]);
const q = {
  umkDenganProduk: db.prepare("SELECT u.* FROM umk u WHERE u.koperasi_id = 1 AND EXISTS (SELECT 1 FROM product p WHERE p.umk_id = u.id) ORDER BY CAST(substr(u.kode,5) AS INTEGER)"),
  umkTanpaProduk: db.prepare("SELECT u.* FROM umk u WHERE u.koperasi_id = 1 AND NOT EXISTS (SELECT 1 FROM product p WHERE p.umk_id = u.id) ORDER BY CAST(substr(u.kode,5) AS INTEGER)"),
  setStatus: db.prepare("UPDATE umk SET status = ?, updated_at = datetime('now', ?) WHERE id = ?"),
  setDoc: db.prepare("UPDATE document_req SET status = ?, catatan = COALESCE(?, catatan), requested_at = COALESCE(requested_at, datetime('now', ?)), updated_at = datetime('now', ?) WHERE umk_id = ? AND kode = ?"),
  konfirmasi: db.prepare("UPDATE ingredient SET dikonfirmasi_umk = 1 WHERE product_id IN (SELECT id FROM product WHERE umk_id = ?)"),
  insDecision: db.prepare("INSERT INTO decision (umk_id, jalur, skor_kesiapan, alasan_json, rules_version, created_at) VALUES (?, ?, ?, ?, ?, datetime('now', ?))"),
  insEvent: db.prepare("INSERT INTO event_log (umk_id, actor, aksi, detail_json, created_at) VALUES (?, ?, ?, ?, datetime('now', ?))"),
  insChase: db.prepare("INSERT OR IGNORE INTO chase_task (umk_id, document_kode, target_actor_id, tahap, due_at, sent_at, status, idempotency_key) VALUES (?, ?, ?, ?, datetime('now', ?), datetime('now', ?), ?, ?)"),
  pendamping: db.prepare("SELECT COALESCE((SELECT pendamping_actor_id FROM koperasi WHERE id = 1), (SELECT id FROM actor WHERE role='pendamping' ORDER BY id LIMIT 1)) AS id"),
  umkActor: db.prepare("SELECT id FROM actor WHERE role = 'umk' AND umk_id = ? LIMIT 1"),
  setDossier: db.prepare("UPDATE dossier SET status = ?, catatan_pendamping = ? WHERE umk_id = ?"),
};
const alasanLolos = JSON.stringify(rules.eligibility.rules.map((r) => ({ rule_id: r.id, hasil: "lolos" })));
const hariLalu = (n) => `-${n} days`;
const rnd = (seed, mod) => (Array.from(seed).reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 9973, 7) % mod);

function lengkapkanDokumen(umkId, offset) {
  for (const k of ["FOTO_PRODUK", "PROSES", "PENYELIA", "NIB"]) q.setDoc.run("diterima", "dari UMK (seed bergerak)", offset, offset, umkId, k);
  for (const k of ["PERMOHONAN", "PERNYATAAN_HALAL", "IKRAR", "MANUAL_SJPH", "DAFTAR_BAHAN"]) q.setDoc.run("dihasilkan", "disusun sistem (seed bergerak)", offset, offset, umkId, k);
  q.konfirmasi.run(umkId);
}
function keputusanSiap(umkId, offset) {
  q.insDecision.run(umkId, "SELF_DECLARE_SIAP", 100, alasanLolos, rules.version, offset);
  q.insEvent.run(umkId, "agent", "EVALUATE", JSON.stringify({ jalur: "SELF_DECLARE_SIAP", skor: 100, rules_version: rules.version, seed: "bergerak" }), offset);
}

const kandidat = q.umkDenganProduk.all().filter((u) => !SKENARIO.has(u.kode));
const tanpa = q.umkTanpaProduk.all().filter((u) => !SKENARIO.has(u.kode));
// Target eskalasi = pendamping koperasi; bila koperasi sedang tanpa pendamping DAN tidak ada aktor pendamping (satu akun demo
// yang berperan UMK saat seed), buat aktor pendamping pengganti 900000001 (pola seed) agar tugas tahap 4 tetap tersimpan.
let pend = q.pendamping.get()?.id;
if (!pend) {
  pend = db.prepare("INSERT INTO actor (telegram_id, role, display_name) VALUES ('900000001', 'pendamping', 'Pendamping Koperasi (pengganti)') ON CONFLICT(telegram_id) DO UPDATE SET role='pendamping' RETURNING id").get().id;
}
const hanyaEskalasi = process.argv.includes("--hanya-eskalasi");
let n = { selesai: 0, siap_unggah: 0, review: 0, eskalasi: 0, diam: 0 };

if (!hanyaEskalasi) {
// 1) 12 selesai (simulasi) — APPROVE & SUBMIT tersebar 1–12 hari lalu (≥4 dalam 7 hari terakhir → laju > 0)
const selesai = kandidat.slice(0, 12);
db.transaction(() => {
  selesai.forEach((u, i) => {
    const d = 1 + (i % 12); const off = hariLalu(d);
    lengkapkanDokumen(u.id, off); keputusanSiap(u.id, off);
    q.setStatus.run("selesai_simulasi", off, u.id);
    q.insEvent.run(u.id, "pendamping:900000001", "APPROVE", JSON.stringify({ versi: 1, seed: "bergerak" }), off);
    q.insEvent.run(u.id, "pendamping:900000001", "SUBMIT_SIMULASI_DITERIMA", JSON.stringify({ nomor: `SIM-2026090${(d % 9) + 1}-00${10 + i}`, seed: "bergerak" }), off);
    n.selesai++;
  });
  // 2) 6 siap unggah (disetujui, belum diajukan)
  kandidat.slice(12, 18).forEach((u, i) => {
    const off = hariLalu(1 + (i % 5)); lengkapkanDokumen(u.id, off); keputusanSiap(u.id, off);
    q.setStatus.run("siap_unggah", off, u.id);
    q.insEvent.run(u.id, "pendamping:900000001", "APPROVE", JSON.stringify({ versi: 1, seed: "bergerak" }), off); n.siap_unggah++;
  });
})();

// 3) 6 menunggu review — dossier PDF asli dibangun (butuh keputusan SIAP + dokumen lengkap)
for (const [i, u] of kandidat.slice(18, 24).entries()) {
  const off = hariLalu(i % 4);
  db.transaction(() => { lengkapkanDokumen(u.id, off); keputusanSiap(u.id, off); q.setStatus.run("siap_review", off, u.id); })();
  await buildDossier(u, rules, "agent");
  n.review++;
}

}

// 4) 3 eskalasi tahap 4 (dokumen diminta 12 hari lalu, 3 pengingat terkirim, eskalasi ke pendamping) + hari diam beragam untuk sisanya
db.transaction(() => {
  kandidat.slice(24, 27).forEach((u, i) => {
    const off = hariLalu(12 + i);
    q.setStatus.run("menunggu_dokumen", off, u.id);
    q.setDoc.run("diminta", "3 pengingat tanpa respons (seed bergerak)", off, off, u.id, "FOTO_PRODUK");
    q.insDecision.run(u.id, "SELF_DECLARE_KURANG_DOKUMEN", 60, JSON.stringify([{ rule_id: "E13_DOKUMEN_WAJIB", hasil: "butuh_dokumen", dokumen: ["FOTO_PRODUK"] }]), rules.version, off);
    q.insEvent.run(u.id, "agent", "EVALUATE", JSON.stringify({ jalur: "SELF_DECLARE_KURANG_DOKUMEN", skor: 60, rules_version: rules.version, seed: "bergerak" }), off);
    const target = q.umkActor.get(u.id)?.id ?? pend;
    for (const [t, h] of [[1, 24], [2, 72], [3, 168]]) { const off2 = `-${(12 + i) * 24 - h} hours`; q.insChase.run(u.id, "FOTO_PRODUK", target, t, off2, off2, "terkirim", `chase:${u.id}:FOTO_PRODUK:${t}:seed`); q.insEvent.run(u.id, "scheduler", "CHASE_SENT", JSON.stringify({ tahap: t, dokumen: ["FOTO_PRODUK"], seed: "bergerak" }), off2); }
    const r4 = q.insChase.run(u.id, "FOTO_PRODUK", pend, 4, `-${2 + i} days`, `-${2 + i} days`, "terkirim", `chase:${u.id}:FOTO_PRODUK:4:seed`);
    if (r4.changes) { q.insEvent.run(u.id, "scheduler", "ESKALASI_SENT", JSON.stringify({ tahap: 4, dokumen: ["FOTO_PRODUK"], seed: "bergerak" }), `-${2 + i} days`); n.eskalasi++; }
  });
  // sisanya: aktivitas terakhir tersebar 0–13 hari supaya "hari diam" bervariasi
  if (!hanyaEskalasi) for (const u of [...kandidat.slice(27), ...tanpa]) {
    if (SKENARIO.has(u.kode)) continue;
    const d = rnd(u.kode, 14); q.insEvent.run(u.id, "agent", "INTAKE", JSON.stringify({ seed: "bergerak" }), hariLalu(d)); n.diam++;
  }
})();

db.prepare("INSERT INTO event_log (actor, aksi, detail_json) VALUES ('system', 'SEED', ?)").run(JSON.stringify({ seed: "bergerak", ...n }));
console.log(JSON.stringify({ seed: "bergerak", ...n, catatan: "UMK-017/042/088 tidak disentuh" }));
