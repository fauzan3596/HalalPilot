// Seed data sintetis HalalPilot. Idempoten: menghapus & mengisi ulang seluruh data demo.
// Entitas fiktif: Koperasi Produsen Pangan "Berkah Nusantara", 120 UMK (3 skenario + 117 acak deterministik).
//   npm run seed:demo            → isi ulang semua
//   npm run seed:demo -- --keep-actors   → pertahankan pemetaan akun Telegram yang sudah ada
import Database from "better-sqlite3";
import { join } from "node:path";
import { classify, productFlags } from "../src/rules/classifier.js";
import { loadRules } from "../src/rules/loader.js";

const db = new Database(join(process.env.DATA_DIR ?? "./data", "halalpilot.db"));
db.pragma("foreign_keys = ON");
const rules = loadRules(process.env.RULES_DIR ?? "./rules");
const keepActors = process.argv.includes("--keep-actors");

const TG = {
  pendamping: process.env.TG_PENDAMPING || "900000001",
  umk1: process.env.TG_UMK_1 || "900000017",
  umk2: process.env.TG_UMK_2 || process.env.TG_UMK_1 || "900000042",
  umk3: process.env.TG_UMK_3 || process.env.TG_UMK_1 || "900000088",
  pemasok: process.env.TG_PEMASOK || "900000200",
};

// ---------- 3 UMK skenario (dipakai video & skenario uji) ----------
export const SKENARIO = [
  { kode: "UMK-017", nama_usaha: "Dapur Bu Ratih", nib: "1309170000017", skala: "mikro", kbli: "10710", alamat: "Jl. Kenanga No. 5, Condongcatur, Depok, Sleman", omzet_tahunan: 240_000_000, peralatan: "manual", penyelia_halal: "Ratih (fiktif)", tg: TG.umk1,
    produk: { kode: "P-017-1", nama: "Nastar", jenis: "kue kering", bahan: ["tepung terigu", "margarin", "telur", "gula pasir", "selai nanas", "vanili"] } },
  { kode: "UMK-042", nama_usaha: "Sambal Mak Ijah", nib: "1309170000042", skala: "mikro", kbli: "10772", alamat: "Jl. Melati No. 12, Maguwoharjo, Depok, Sleman", omzet_tahunan: 180_000_000, peralatan: "manual", penyelia_halal: "Ijah (fiktif)", tg: TG.umk2,
    produk: { kode: "P-042-1", nama: "Sambal Bawang", jenis: "sambal", bahan: ["cabai", "bawang merah", "bawang putih", "garam", "gula pasir", "minyak goreng", "terasi"] },
    oss_override: { kbli: ["47241"] } },   // NIB masih KBLI perdagangan → E15
  { kode: "UMK-088", nama_usaha: "Bakso Pak Darto", nib: "1309170000088", skala: "kecil", kbli: "10131", alamat: "Jl. Anggrek No. 3, Caturtunggal, Depok, Sleman", omzet_tahunan: 900_000_000, peralatan: "semi_otomatis", penyelia_halal: "Darto (fiktif)", tg: TG.umk3,
    produk: { kode: "P-088-1", nama: "Bakso Sapi", jenis: "bakso", bahan: ["daging sapi", "tapioka", "bawang putih", "garam", "penyedap rasa"], daging_giling: 1 } },
];

// ---------- Registry sertifikat pemasok (mock BPJPH) ----------
export const REGISTRY_PEMASOK = [
  { nomor_sertifikat: "ID00110000123450226", nama_pemasok: "PT Palmindo Lestari", bahan: ["margarin", "minyak_sawit", "shortening"], berlaku_sampai: "2027-08-31", status: "valid" },
  { nomor_sertifikat: "ID00410000998870124", nama_pemasok: "RPH Sumber Rejeki", bahan: ["daging_sapi", "jeroan", "tulang"], berlaku_sampai: "2026-01-31", status: "kedaluwarsa" },
  { nomor_sertifikat: "ID00410000556670325", nama_pemasok: "RPH Barokah Sleman", bahan: ["daging_sapi", "daging_kambing"], berlaku_sampai: "2028-03-31", status: "valid" },
  { nomor_sertifikat: "ID00410000334450225", nama_pemasok: "RPU Ayam Sehat Godean", bahan: ["daging_ayam"], berlaku_sampai: "2027-11-30", status: "valid" },
  { nomor_sertifikat: "ID00110000777880125", nama_pemasok: "CV Aroma Nusantara", bahan: ["perisa", "vanili", "pewarna"], berlaku_sampai: "2027-01-31", status: "valid" },
  { nomor_sertifikat: "ID00110000445560125", nama_pemasok: "PT Gelatindo Prima", bahan: ["gelatin"], berlaku_sampai: "2027-05-31", status: "valid" },
  { nomor_sertifikat: "ID00110000221130325", nama_pemasok: "PT Sedap Bumbu Indonesia", bahan: ["msg", "kaldu_bubuk", "bumbu_instan"], berlaku_sampai: "2028-01-31", status: "valid" },
  { nomor_sertifikat: "ID00110000665540125", nama_pemasok: "UD Keju Nusantara", bahan: ["keju", "mentega", "whey"], berlaku_sampai: "2027-09-30", status: "valid" },
  { nomor_sertifikat: "ID00510000101010125", nama_pemasok: "Jasa Giling Pasar Condongcatur", bahan: ["giling"], berlaku_sampai: "2027-06-30", status: "valid" },
  { nomor_sertifikat: "ID00110000909090125", nama_pemasok: "PT Cokelat Jaya", bahan: ["cokelat_compound", "cokelat_bubuk"], berlaku_sampai: "2027-12-31", status: "valid" },
];

// ---------- Data acak deterministik ----------
let seedState = 20260917;
const rnd = () => (seedState = (seedState * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const NAMA_DEPAN = ["Bu", "Pak", "Mbak", "Mas", "Ibu", "Bapak"];
const NAMA = ["Sari", "Wati", "Tono", "Rini", "Agus", "Dewi", "Joko", "Ani", "Slamet", "Yuni", "Bambang", "Siti", "Eko", "Lestari", "Hadi", "Nur", "Wahyu", "Tri", "Dwi", "Endang"];
const JENIS = [
  { jenis: "keripik", kbli: "10794", bahan: ["singkong", "minyak goreng", "garam", "bawang putih"] },
  { jenis: "kue basah", kbli: "10792", bahan: ["tepung terigu", "gula pasir", "telur", "santan", "pewarna makanan"] },
  { jenis: "roti", kbli: "10710", bahan: ["tepung terigu", "gula pasir", "ragi", "margarin", "susu bubuk", "telur"] },
  { jenis: "minuman", kbli: "11040", bahan: ["air", "gula pasir", "perisa", "asam sitrat"] },
  { jenis: "sambal", kbli: "10772", bahan: ["cabai", "bawang merah", "bawang putih", "garam", "gula pasir", "minyak goreng"] },
  { jenis: "abon", kbli: "10131", bahan: ["daging sapi", "santan", "bawang merah", "gula pasir", "garam"] },
  { jenis: "kerupuk", kbli: "10794", bahan: ["tepung tapioka", "ikan", "garam", "bawang putih"] },
  { jenis: "tempe", kbli: "10793", bahan: ["kedelai", "ragi"] },
  { jenis: "kue kering", kbli: "10710", bahan: ["tepung terigu", "margarin", "gula pasir", "telur", "cokelat bubuk"] },
  { jenis: "bumbu", kbli: "10772", bahan: ["bawang putih", "ketumbar", "garam", "penyedap rasa"] },
];
const KELURAHAN = ["Condongcatur", "Maguwoharjo", "Caturtunggal", "Sinduadi", "Sendangadi", "Tlogoadi", "Trihanggo", "Nogotirto"];
const STATUS_AWAL = ["baru", "baru", "baru", "intake", "menunggu_dokumen"];   // mayoritas belum mulai

// ---------- Prepared statements ----------
const q = {
  insKop: db.prepare("INSERT INTO koperasi (id, nama, target_date) VALUES (1, 'Koperasi Produsen Pangan Berkah Nusantara', '2026-10-17')"),
  insActor: db.prepare("INSERT OR REPLACE INTO actor (telegram_id, role, display_name, umk_id) VALUES (?, ?, ?, ?)"),
  insUmk: db.prepare(`INSERT INTO umk (koperasi_id, kode, nama_usaha, nib, skala, kbli, alamat, omzet_tahunan, jumlah_fasilitas_produksi, jumlah_outlet,
    fasilitas_terpisah_nonhalal, peralatan, penyelia_halal, consent_at, status) VALUES (1,?,?,?,?,?,?,?,1,1,1,?,?,?,?)`),
  insProd: db.prepare("INSERT INTO product (umk_id, kode, nama, jenis, mengandung_hewan_sembelihan, daging_giling, bahan_berbahaya) VALUES (?,?,?,?,?,?,?)"),
  insIng: db.prepare("INSERT INTO ingredient (product_id, nama_asli, nama_normal, kelas, rule_id, butuh_sertifikat_pemasok, dikonfirmasi_umk) VALUES (?,?,?,?,?,?,?)"),
  insDoc: db.prepare("INSERT OR IGNORE INTO document_req (umk_id, kode, status) VALUES (?,?,?)"),
  insOss: db.prepare("INSERT OR REPLACE INTO oss_mock (nib, nama, alamat, kbli_json, skala, status_nib) VALUES (?,?,?,?,?,?)"),
  insReg: db.prepare("INSERT OR REPLACE INTO supplier_registry (nomor_sertifikat, nama_pemasok, bahan_json, berlaku_sampai, status) VALUES (?,?,?,?,?)"),
  insQuota: db.prepare("INSERT OR REPLACE INTO quota_mock (provinsi, kuota_total, kuota_terpakai) VALUES (?,?,?)"),
  log: db.prepare("INSERT INTO event_log (umk_id, actor, aksi, detail_json) VALUES (?,?,?,?)"),
};
const DOK_WAJIB = ["NIB", "PERMOHONAN", "PERNYATAAN_HALAL", "IKRAR", "PENYELIA", "DAFTAR_BAHAN", "PROSES", "FOTO_PRODUK", "MANUAL_SJPH"];

function tambahUmk(u, { withIngredients, confirmed }) {
  const r = q.insUmk.run(u.kode, u.nama_usaha, u.nib, u.skala, u.kbli, u.alamat, u.omzet_tahunan, u.peralatan, u.penyelia_halal ?? null, u.consent_at ?? null, u.status ?? "baru");
  const umkId = r.lastInsertRowid;
  // OSS mock: default konsisten dengan data UMK; override untuk skenario
  const oss = { nama: u.nama_usaha, alamat: u.alamat, kbli: [u.kbli], skala: u.skala, status_nib: "aktif", ...(u.oss_override ?? {}) };
  q.insOss.run(u.nib, oss.nama, oss.alamat, JSON.stringify(oss.kbli), oss.skala, oss.status_nib);
  if (u.produk) {
    const items = u.produk.bahan.map((b) => classify(b, rules));
    const flags = productFlags(items);
    const p = q.insProd.run(umkId, u.produk.kode, u.produk.nama, u.produk.jenis, flags.mengandung_hewan_sembelihan, u.produk.daging_giling ?? 0, flags.bahan_berbahaya);
    if (withIngredients) for (const i of items) q.insIng.run(p.lastInsertRowid, i.nama_asli, i.nama_normal, i.kelas, i.rule_id, i.butuh_sertifikat_pemasok ? 1 : 0, confirmed ? 1 : 0);
  }
  for (const k of DOK_WAJIB) q.insDoc.run(umkId, k, "kurang");
  // Dokumen yang sudah tersedia dari profil ditandai diterima
  if (u.nib) db.prepare("UPDATE document_req SET status='diterima', catatan='dari profil (seed)' WHERE umk_id=? AND kode='NIB'").run(umkId);
  if (u.penyelia_halal) db.prepare("UPDATE document_req SET status='diterima', catatan=? WHERE umk_id=? AND kode='PENYELIA'").run(u.penyelia_halal, umkId);
  return umkId;
}

const seed = db.transaction(() => {
  const actors = keepActors ? db.prepare("SELECT telegram_id, role, display_name, umk_id FROM actor").all() : [];
  const kodeByUmkId = keepActors ? Object.fromEntries(db.prepare("SELECT id, kode FROM umk").all().map((r) => [r.id, r.kode])) : {};

  // Kosongkan SEMUA tabel pengguna dengan pemeriksaan FK dimatikan sementara (10 Sep: urutan hapus manual dua kali gagal —
  // product→media, ingredient→supplier_cert, supplier_cert_bahan). Daftar tabel dibaca dari sqlite_master agar tabel baru ikut.
  db.exec("UPDATE koperasi SET pendamping_actor_id = NULL");
  for (const { name } of db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").all()) db.exec(`DELETE FROM "${name}"`);

  q.insKop.run();

  // 3 skenario: produk ada, bahan belum diekstrak (intake dimulai dari foto di demo). status 'intake' + consent sudah ada.
  const ids = {};
  for (const s of SKENARIO) ids[s.kode] = tambahUmk({ ...s, status: "intake", consent_at: "2026-09-01 09:00:00" }, { withIngredients: false });

  // 117 UMK acak
  for (let n = 1; n <= 120; n++) {
    const kode = `UMK-${String(n).padStart(3, "0")}`;
    if (ids[kode]) continue;
    const j = pick(JENIS);
    const nama = `${pick(NAMA_DEPAN)} ${pick(NAMA)}`;
    const status = pick(STATUS_AWAL);
    const u = { kode, nama_usaha: `${j.jenis[0].toUpperCase() + j.jenis.slice(1)} ${nama}`, nib: `13091700${String(n).padStart(5, "0")}`, skala: rnd() < 0.85 ? "mikro" : "kecil", kbli: j.kbli,
      alamat: `Jl. ${pick(["Mawar", "Kenari", "Dahlia", "Cempaka", "Flamboyan"])} No. ${1 + Math.floor(rnd() * 60)}, ${pick(KELURAHAN)}, Sleman`,
      omzet_tahunan: 60_000_000 + Math.floor(rnd() * 900) * 1_000_000, peralatan: rnd() < 0.8 ? "manual" : "semi_otomatis", penyelia_halal: status === "baru" ? null : nama.split(" ")[1],
      consent_at: status === "baru" ? null : "2026-08-2" + (1 + Math.floor(rnd() * 9)) + " 10:00:00", status,
      produk: status === "baru" ? null : { kode: `P-${String(n).padStart(3, "0")}-1`, nama: `${j.jenis} ${nama.split(" ")[1]}`, jenis: j.jenis, bahan: j.bahan } };
    tambahUmk(u, { withIngredients: status === "menunggu_dokumen", confirmed: true });
  }

  for (const r of REGISTRY_PEMASOK) q.insReg.run(r.nomor_sertifikat, r.nama_pemasok, JSON.stringify(r.bahan), r.berlaku_sampai, r.status);
  q.insQuota.run("DI Yogyakarta", 34000, 31000);        // sisa 8,8% → memicu US-22-P
  q.insQuota.run("Jawa Tengah", 120000, 74000);
  q.insQuota.run("Jawa Timur", 150000, 98000);
  q.insQuota.run("Jawa Barat", 160000, 121000);

  // Akun Telegram
  if (keepActors && actors.length) {
    const idByKode = Object.fromEntries(db.prepare("SELECT id, kode FROM umk").all().map((r) => [r.kode, r.id]));
    for (const a of actors) q.insActor.run(a.telegram_id, a.role, a.display_name, a.umk_id ? idByKode[kodeByUmkId[a.umk_id]] ?? null : null);
  } else {
    const pend = q.insActor.run(TG.pendamping, "pendamping", "Pendamping Koperasi", null);
    db.prepare("UPDATE koperasi SET pendamping_actor_id = ? WHERE id = 1").run(pend.lastInsertRowid);
    // Jika semua TG_UMK sama (hanya 1 akun), akun itu dipetakan ke UMK-017; pindah dengan `npm run seed:switch`.
    const seen = new Set([TG.pendamping]);
    for (const [tg, kode] of [[TG.umk1, "UMK-017"], [TG.umk2, "UMK-042"], [TG.umk3, "UMK-088"]]) {
      if (seen.has(tg)) continue; seen.add(tg);
      q.insActor.run(tg, "umk", SKENARIO.find((s) => s.kode === kode).nama_usaha, ids[kode]);
    }
    if (!seen.has(TG.pemasok)) q.insActor.run(TG.pemasok, "admin", "Pemasok (fiktif)", null);
  }
  q.log.run(null, "system", "SEED", JSON.stringify({ umk: 120, skenario: SKENARIO.map((s) => s.kode), rules_version: rules.version }));
});

// PRAGMA foreign_keys tidak berefek DI DALAM transaksi (SQLite) → matikan sebelum, nyalakan sesudah
db.pragma("foreign_keys = OFF");
try { seed(); } finally { db.pragma("foreign_keys = ON"); }
const c = (t) => db.prepare(`SELECT COUNT(*) n FROM ${t}`).get().n;
console.log(JSON.stringify({ koperasi: c("koperasi"), umk: c("umk"), product: c("product"), ingredient: c("ingredient"), document_req: c("document_req"), oss_mock: c("oss_mock"), supplier_registry: c("supplier_registry"), quota_mock: c("quota_mock"), actor: c("actor") }));
console.log("Akun:", JSON.stringify(db.prepare("SELECT telegram_id, role, display_name FROM actor").all()));
if (!keepActors && [TG.umk1, TG.umk2, TG.umk3].every((t) => t === TG.pendamping)) {
  console.log(`Catatan: TG_UMK_* sama dengan TG_PENDAMPING → akun ${TG.pendamping} dipetakan sebagai PENDAMPING. Untuk menguji alur UMK: npm run seed:switch -- ${TG.pendamping} UMK-017`);
}
