// Terapkan db/schema.sql (idempoten: hanya jika tabel belum ada) + tabel idempotency + kolom tambahan.
import Database from "better-sqlite3";
import { readFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.DATA_DIR ?? join(here, "..", "data");
mkdirSync(dataDir, { recursive: true });
mkdirSync(process.env.PDF_DIR ?? join(dataDir, "pdf"), { recursive: true });
const dbPath = join(dataDir, "halalpilot.db");
const db = new Database(dbPath);

const has = (t) => db.prepare("SELECT 1 FROM sqlite_master WHERE type IN ('table','view') AND name=?").get(t);
if (!has("umk")) {
  db.exec(readFileSync(join(here, "schema.sql"), "utf8"));
  console.log("schema.sql diterapkan");
}
db.exec(`CREATE TABLE IF NOT EXISTS idempotency (
  key TEXT PRIMARY KEY, response_json TEXT NOT NULL, status INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')))`);
// Mock eksternal (data sintetis, diisi seed)
db.exec(`CREATE TABLE IF NOT EXISTS oss_mock (
  nib TEXT PRIMARY KEY, nama TEXT NOT NULL, alamat TEXT NOT NULL, kbli_json TEXT NOT NULL,
  skala TEXT NOT NULL, status_nib TEXT NOT NULL DEFAULT 'aktif')`);
db.exec(`CREATE TABLE IF NOT EXISTS supplier_registry (
  nomor_sertifikat TEXT PRIMARY KEY, nama_pemasok TEXT NOT NULL, bahan_json TEXT NOT NULL,
  berlaku_sampai TEXT, status TEXT NOT NULL CHECK (status IN ('valid','kedaluwarsa','dicabut')))`);
// Cakupan bahan per sertifikat pemasok (diisi POST /umk/{id}/supplier-certs)
db.exec(`CREATE TABLE IF NOT EXISTS supplier_cert_bahan (
  supplier_cert_id INTEGER NOT NULL REFERENCES supplier_cert(id) ON DELETE CASCADE,
  umk_id INTEGER NOT NULL REFERENCES umk(id) ON DELETE CASCADE,
  bahan TEXT NOT NULL, PRIMARY KEY (supplier_cert_id, bahan))`);
const cols = db.prepare("PRAGMA table_info(document_req)").all().map((c) => c.name);
if (!cols.includes("requested_at")) db.exec("ALTER TABLE document_req ADD COLUMN requested_at TEXT");
const pcols = db.prepare("PRAGMA table_info(product)").all().map((c) => c.name);
if (!pcols.includes("giling_sendiri")) db.exec("ALTER TABLE product ADD COLUMN giling_sendiri INTEGER DEFAULT 0");
console.log("migrasi selesai →", dbPath);
