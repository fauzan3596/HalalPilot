// Mock OSS (data sintetis dari seed). Semua respons berlabel simulasi.
import { db } from "../db.js";

const get = db.prepare("SELECT nib, nama, alamat, kbli_json, skala, status_nib FROM oss_mock WHERE nib = ?");

/** @returns {null | {nib, nama, alamat, kbli: string[], skala, status_nib, simulasi: true}} */
export function lookupOss(nib) {
  const r = get.get(String(nib ?? ""));
  if (!r) return null;
  return { nib: r.nib, nama: r.nama, alamat: r.alamat, kbli: JSON.parse(r.kbli_json), skala: r.skala, status_nib: r.status_nib, simulasi: true };
}
