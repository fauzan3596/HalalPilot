// Mock registry sertifikat halal pemasok (data sintetis dari seed). Berlabel simulasi.
import { db } from "../db.js";

const get = db.prepare("SELECT nomor_sertifikat, nama_pemasok, bahan_json, berlaku_sampai, status FROM supplier_registry WHERE nomor_sertifikat = ?");
const byName = db.prepare("SELECT nomor_sertifikat, nama_pemasok, bahan_json, berlaku_sampai, status FROM supplier_registry WHERE lower(nama_pemasok) LIKE ?");

/**
 * Periksa nomor sertifikat. Status efektif: 'tidak_ditemukan' | 'kedaluwarsa' | 'valid' (juga 'dicabut' → tidak_ditemukan untuk UMK).
 * Kedaluwarsa dihitung ulang dari tanggal (today) agar seed tetap benar setelah 2026.
 */
export function checkCertificate(nomor, { today = new Date() } = {}) {
  const r = get.get(String(nomor ?? "").replace(/\s+/g, "").toUpperCase());
  if (!r || r.status === "dicabut") return { status: "tidak_ditemukan", simulasi: true };
  const exp = r.berlaku_sampai ? new Date(r.berlaku_sampai + "T23:59:59") : null;
  const status = r.status === "kedaluwarsa" || (exp && exp < today) ? "kedaluwarsa" : "valid";
  return { status, nomor_sertifikat: r.nomor_sertifikat, nama_pemasok: r.nama_pemasok, bahan: JSON.parse(r.bahan_json), berlaku_sampai: r.berlaku_sampai, simulasi: true };
}

export function findSupplier(namaSebagian) {
  return byName.all(`%${String(namaSebagian ?? "").toLowerCase()}%`).map((r) => ({ ...r, bahan: JSON.parse(r.bahan_json), simulasi: true }));
}
