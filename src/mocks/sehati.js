// Mock kuota SEHATI per provinsi (sintetis). Berlabel simulasi.
import { db } from "../db.js";

const all = db.prepare("SELECT provinsi, kuota_total, kuota_terpakai, updated_at FROM quota_mock ORDER BY provinsi");
const use = db.prepare("UPDATE quota_mock SET kuota_terpakai = kuota_terpakai + 1, updated_at = datetime('now') WHERE provinsi = ? AND kuota_terpakai < kuota_total");

export function quota() {
  return all.all().map((r) => ({ ...r, sisa: r.kuota_total - r.kuota_terpakai, sisa_persen: Number(((r.kuota_total - r.kuota_terpakai) / r.kuota_total * 100).toFixed(1)), simulasi: true }));
}

/** Pakai satu slot kuota; false jika habis. */
export function consumeQuota(provinsi) {
  return use.run(provinsi).changes === 1;
}
