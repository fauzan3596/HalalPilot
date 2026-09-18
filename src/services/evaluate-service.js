// Orkestrasi evaluasi: bangun konteks dari DB → engine + oss-check → simpan decision → sinkron document_req → status UMK → chase.
import { db, tx } from "../db.js";
import { evaluate } from "../rules/engine.js";
import { ossCheck } from "../rules/oss-check.js";
import { lookupOss } from "../mocks/oss.js";
import { productsWithIngredients, documents } from "./umk-service.js";
import { createChaseTasks } from "../scheduler/chase.js";
import { audit } from "../audit.js";

const q = {
  insDecision: db.prepare("INSERT INTO decision (umk_id, jalur, skor_kesiapan, alasan_json, rules_version) VALUES (?,?,?,?,?)"),
  insDoc: db.prepare("INSERT OR IGNORE INTO document_req (umk_id, kode, status) VALUES (?,?,'kurang')"),
  docStatus: db.prepare("SELECT kode, status FROM document_req WHERE umk_id = ?"),
  setStatus: db.prepare("UPDATE umk SET status = ?, updated_at = datetime('now') WHERE id = ?"),
};

const DAPAT_DIEVALUASI = new Set(["baru", "intake", "menunggu_dokumen", "dikembalikan", "siap_review", "ditolak_simulasi"]);

/**
 * @param {object} umk baris umk
 * @param {object} rules hasil loadRules
 * @param {string} actor untuk audit
 */
const qGen = db.prepare("UPDATE document_req SET status = 'dihasilkan', catatan = ?, updated_at = datetime('now') WHERE umk_id = ? AND kode = ? AND status IN ('kurang','diminta')");
const qUngen = db.prepare("UPDATE document_req SET status = 'kurang', updated_at = datetime('now') WHERE umk_id = ? AND kode = ? AND status = 'dihasilkan'");

/**
 * Dokumen yang DIHASILKAN SISTEM (bukan diminta dari UMK) ditandai otomatis agar E13 hanya menagih dokumen yang benar-benar
 * harus datang dari UMK (NIB, PENYELIA, FOTO_PRODUK, PROSES, sertifikat pemasok):
 * - PERMOHONAN, PERNYATAAN_HALAL, IKRAR, MANUAL_SJPH: dari template saat dossier → selalu 'dihasilkan'.
 * - DAFTAR_BAHAN: 'dihasilkan' jika ada bahan dan semuanya dikonfirmasi UMK; jika belum → kembali 'kurang'.
 * - PROSES: 'dihasilkan' jika UMK sudah memberi cerita proses (product.proses_ringkas); jika belum → tetap kurang (agent bertanya).
 */
export function syncGeneratedDocs(umkId, products) {
  for (const k of ["PERMOHONAN", "PERNYATAAN_HALAL", "IKRAR", "MANUAL_SJPH"]) {
    q.insDoc.run(umkId, k); // baris mungkin belum ada pada UMK yang dibuat sebelum daftar dokumen wajib bertambah
    qGen.run("dihasilkan sistem dari template saat dossier", umkId, k);
  }
  const allIng = products.flatMap((p) => p.ingredients ?? []);
  if (allIng.length && allIng.every((i) => i.dikonfirmasi_umk)) qGen.run(`${allIng.length} bahan terkonfirmasi UMK`, umkId, "DAFTAR_BAHAN"); else qUngen.run(umkId, "DAFTAR_BAHAN");
  // PROSES hanya dinaikkan (dari cerita proses UMK); status 'diterima'/'dihasilkan' yang sudah ada tidak pernah diturunkan
  if (products.some((p) => p.proses_ringkas && p.proses_ringkas.trim().length >= 20)) qGen.run("dari keterangan proses UMK", umkId, "PROSES");
}

/** @param {{updateStatus?: boolean}} [opts] updateStatus=false: keputusan baru dicatat, status UMK (mis. "dikembalikan") tidak diubah */
export function runEvaluate(umk, rules, actor = "agent", { updateStatus = true } = {}) {
  const products = productsWithIngredients(umk.id);
  syncGeneratedDocs(umk.id, products);
  const docs = documents(umk.id);
  const oss = ossCheck(umk, lookupOss(umk.nib), rules);
  const ctx = { umk, products, documents: docs, oss };
  const d = evaluate(ctx, rules);
  if (oss.pesan?.length) d.oss_pesan = oss.pesan;

  return tx(() => {
    const r = q.insDecision.run(umk.id, d.jalur, d.skor_kesiapan, JSON.stringify(d.alasan), d.rules_version);
    for (const kode of d.dokumen_diminta) q.insDoc.run(umk.id, kode);

    // Status UMK (SPECS §8.2). Tidak menurunkan status yang sudah lewat review.
    let status = umk.status;
    if (updateStatus && DAPAT_DIEVALUASI.has(umk.status)) {
      status = d.jalur === "SELF_DECLARE_SIAP" ? "siap_review" : "menunggu_dokumen";
      if (status !== umk.status) q.setStatus.run(status, umk.id);
    }

    // Pengejaran hanya untuk dokumen yang harus DITERIMA dari UMK (bukan yang dihasilkan sistem)
    const dihasilkanSistem = new Set(["DAFTAR_BAHAN", "PROSES", "MANUAL_SJPH", "PERNYATAAN_HALAL", "IKRAR", "PERMOHONAN", "PEMBAGIAN_PENGAJUAN"]);
    const kurang = q.docStatus.all(umk.id).filter((x) => x.status === "kurang" && !dihasilkanSistem.has(x.kode) && d.dokumen_diminta.includes(x.kode)).map((x) => x.kode);
    const chase = kurang.length ? createChaseTasks(umk.id, kurang, rules) : 0;

    audit({ umkId: umk.id, actor, aksi: "EVALUATE", detail: { decision_id: r.lastInsertRowid, jalur: d.jalur, skor: d.skor_kesiapan, dokumen: d.dokumen_diminta, rules_version: d.rules_version, chase_dibuat: chase, oss_mismatch: oss.mismatch } });
    return { decision_id: r.lastInsertRowid, umk_status: status, ...d, oss: { mismatch: oss.mismatch, simulasi: true } };
  });
}
