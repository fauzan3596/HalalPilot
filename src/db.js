import Database from "better-sqlite3";
import { join } from "node:path";
import { config } from "./config.js";

export const db = new Database(join(config.dataDir, "halalpilot.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Gagal cepat jika migrasi belum dijalankan (prepared statement di modul lain butuh tabel ini).
for (const t of ["umk", "idempotency", "oss_mock", "supplier_registry", "supplier_cert_bahan"]) {
  if (!db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(t)) {
    console.error(`Tabel '${t}' belum ada. Jalankan: npm run migrate`);
    process.exit(2);
  }
}

/** Jalankan fn dalam transaksi; mengembalikan hasil fn. */
export const tx = (fn) => db.transaction(fn)();

export const now = () => new Date().toISOString().replace("T", " ").slice(0, 19);
