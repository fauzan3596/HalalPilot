// Ringkasan & pembacaan UMK (tanpa logika hukum).
import { db } from "../db.js";
import { notFound } from "../http.js";

const q = {
  umk: db.prepare("SELECT * FROM umk WHERE id = ? AND status <> 'dihapus'"),
  umkByKode: db.prepare("SELECT * FROM umk WHERE kode = ? AND status <> 'dihapus'"),
  products: db.prepare("SELECT * FROM product WHERE umk_id = ? ORDER BY id"),
  ingredients: db.prepare(`SELECT i.*, sc.status AS cert_status, sc.nama_pemasok AS cert_pemasok, sc.berlaku_sampai AS cert_berlaku
    FROM ingredient i LEFT JOIN supplier_cert sc ON sc.id = i.supplier_cert_id WHERE i.product_id = ? ORDER BY i.id`),
  documents: db.prepare("SELECT kode, status, media_id, catatan, requested_at, updated_at FROM document_req WHERE umk_id = ? ORDER BY kode"),
  lastDecision: db.prepare("SELECT * FROM decision WHERE umk_id = ? ORDER BY id DESC LIMIT 1"),
  certs: db.prepare("SELECT id, nama_pemasok, nomor_sertifikat, berlaku_sampai, status FROM supplier_cert WHERE umk_id = ? ORDER BY id"),
  dossiers: db.prepare("SELECT id, versi, status, catatan_pendamping, created_at FROM dossier WHERE umk_id = ? ORDER BY versi DESC"),
  nextKode: db.prepare("SELECT kode FROM umk ORDER BY CAST(substr(kode, 5) AS INTEGER) DESC LIMIT 1"),
};

/** Hari tersisa ke tenggat (akhir hari WIB), dibulatkan ke atas; satu rumus untuk semua tampilan. */
export const hariTersisa = (targetDate = "2026-10-17", now = Date.now()) => Math.ceil((new Date(`${targetDate}T23:59:59+07:00`) - now) / 86400000);

export function getUmkOr404(id) {
  // Menerima id numerik ATAU kode "UMK-017" (agent sering memakai kode; angka 17 ≠ id 17)
  const u = /^umk-\d{3}$/i.test(String(id)) ? q.umkByKode.get(String(id).toUpperCase()) : q.umk.get(Number(id));
  if (!u) throw notFound("UMK");
  return u;
}
export const getUmkByKode = (kode) => q.umkByKode.get(kode) ?? null;

export function nextUmkKode() {
  const last = q.nextKode.get()?.kode ?? "UMK-000";
  return `UMK-${String(Number(last.slice(4)) + 1).padStart(3, "0")}`;
}

export function productsWithIngredients(umkId) {
  return q.products.all(umkId).map((p) => ({
    ...p,
    ingredients: q.ingredients.all(p.id).map((i) => ({
      ...i,
      supplier_cert: i.supplier_cert_id ? { id: i.supplier_cert_id, status: i.cert_status, nama_pemasok: i.cert_pemasok, berlaku_sampai: i.cert_berlaku } : null,
    })),
  }));
}

export function documents(umkId) { return q.documents.all(umkId); }
export function lastDecision(umkId) {
  const d = q.lastDecision.get(umkId);
  return d ? { ...d, alasan: JSON.parse(d.alasan_json) } : null;
}

/** Ringkasan untuk whoami / GET /umk/{id} */
export function umkSummary(u) {
  const d = lastDecision(u.id);
  const docs = documents(u.id);
  return {
    id: u.id, kode: u.kode, nama_usaha: u.nama_usaha, status: u.status,
    skor_kesiapan: d?.skor_kesiapan ?? null,
    jalur_terakhir: d?.jalur ?? null,
    dokumen_kurang: docs.filter((x) => ["kurang", "diminta", "ditolak"].includes(x.status)).map((x) => x.kode),
    hari_tersisa: hariTersisa(),
  };
}

export function umkDetail(u) {
  const { alasan_json: _alasan_json, ...d } = lastDecision(u.id) ?? {};
  return {
    ...umkSummary(u),
    profil: { nib: u.nib, skala: u.skala, kbli: u.kbli, alamat: u.alamat, omzet_tahunan: u.omzet_tahunan, jumlah_fasilitas_produksi: u.jumlah_fasilitas_produksi, jumlah_outlet: u.jumlah_outlet, fasilitas_terpisah_nonhalal: u.fasilitas_terpisah_nonhalal, peralatan: u.peralatan, penyelia_halal: u.penyelia_halal, consent_at: u.consent_at },
    products: productsWithIngredients(u.id).map((p) => ({ id: p.id, kode: p.kode, nama: p.nama, jenis: p.jenis, flags: { sembelihan: p.mengandung_hewan_sembelihan, giling: p.daging_giling, berbahaya: p.bahan_berbahaya }, ingredients: p.ingredients.map((i) => ({ id: i.id, nama_asli: i.nama_asli, nama_normal: i.nama_normal, kelas: i.kelas, rule_id: i.rule_id, butuh_sertifikat_pemasok: !!i.butuh_sertifikat_pemasok, dikonfirmasi_umk: !!i.dikonfirmasi_umk, supplier_cert: i.supplier_cert })) })),
    documents: documents(u.id),
    supplier_certs: q.certs.all(u.id),
    dossiers: q.dossiers.all(u.id),           // terbaru dulu; review/mock_submit memakai dossiers[0].id
    keputusan_terakhir: d.id ? d : null,
  };
}
