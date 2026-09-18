-- HalalPilot — SQLite schema (Express). Semua data sintetis.
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- Pemetaan identitas Telegram → peran. Tidak menyimpan nomor telepon/KTP.
CREATE TABLE actor (
  id            INTEGER PRIMARY KEY,
  telegram_id   TEXT UNIQUE NOT NULL,         -- numeric Telegram user id sebagai string
  role          TEXT NOT NULL CHECK (role IN ('umk','pendamping','admin')),
  display_name  TEXT NOT NULL,
  umk_id        INTEGER REFERENCES umk(id),   -- diisi jika role='umk'
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE koperasi (
  id            INTEGER PRIMARY KEY,
  nama          TEXT NOT NULL,
  pendamping_actor_id INTEGER REFERENCES actor(id),
  target_date   TEXT NOT NULL DEFAULT '2026-10-17'   -- tenggat penahapan UMK mamin
);

CREATE TABLE umk (
  id            INTEGER PRIMARY KEY,
  koperasi_id   INTEGER NOT NULL REFERENCES koperasi(id),
  kode          TEXT UNIQUE NOT NULL,          -- "UMK-017"
  nama_usaha    TEXT NOT NULL,
  nib           TEXT,                          -- 13 digit sintetis
  skala         TEXT CHECK (skala IN ('mikro','kecil','menengah','besar')),
  kbli          TEXT,                          -- "10792"
  alamat        TEXT,
  omzet_tahunan INTEGER,                       -- rupiah, pernyataan mandiri
  jumlah_fasilitas_produksi INTEGER DEFAULT 1,
  jumlah_outlet INTEGER DEFAULT 1,
  fasilitas_terpisah_nonhalal INTEGER DEFAULT 1,   -- 1 = terpisah / tidak ada produksi non-halal
  peralatan     TEXT CHECK (peralatan IN ('manual','semi_otomatis','otomatis_pabrik')),
  penyelia_halal TEXT,                          -- nama penyelia (fiktif)
  consent_at    TEXT,                          -- waktu persetujuan pemrosesan data
  status        TEXT NOT NULL DEFAULT 'baru'
                CHECK (status IN ('baru','intake','menunggu_dokumen','siap_review','disetujui','dikembalikan','siap_unggah','diajukan_simulasi','ditolak_simulasi','selesai_simulasi','dihapus')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE product (
  id            INTEGER PRIMARY KEY,
  umk_id        INTEGER NOT NULL REFERENCES umk(id) ON DELETE CASCADE,
  kode          TEXT UNIQUE NOT NULL,          -- "P-017-1"
  nama          TEXT NOT NULL,
  jenis         TEXT,                          -- kategori produk (mis. "kue kering", "sambal", "bakso")
  mengandung_hewan_sembelihan INTEGER DEFAULT 0,
  daging_giling INTEGER DEFAULT 0,
  teknik_pengawetan_count INTEGER DEFAULT 0,   -- Kepkaban 146/2025: maks 1 teknik sederhana
  bahan_berbahaya INTEGER DEFAULT 0,
  foto_label_media_id INTEGER REFERENCES media(id),
  foto_proses_media_id INTEGER REFERENCES media(id),
  proses_ringkas TEXT,                         -- hasil ekstraksi / konfirmasi UMK
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE media (
  id            INTEGER PRIMARY KEY,
  umk_id        INTEGER NOT NULL REFERENCES umk(id) ON DELETE CASCADE,
  kind          TEXT NOT NULL CHECK (kind IN ('label','proses','sertifikat_pemasok','nib','lainnya')),
  path          TEXT NOT NULL,                 -- path lokal (disalin dari inbound OpenClaw)
  sha256        TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE ingredient (
  id            INTEGER PRIMARY KEY,
  product_id    INTEGER NOT NULL REFERENCES product(id) ON DELETE CASCADE,
  nama_asli     TEXT NOT NULL,                 -- teks hasil ekstraksi vision
  nama_normal   TEXT,                          -- hasil normalisasi ke kamus rules/ingredients.yaml
  kelas         TEXT CHECK (kelas IN ('dikecualikan_A','dikecualikan_B','dikecualikan_C','positif','kritis','tidak_dikenal')),
  rule_id       TEXT,                          -- id aturan yang menetapkan kelas
  butuh_sertifikat_pemasok INTEGER DEFAULT 0,
  supplier_cert_id INTEGER REFERENCES supplier_cert(id),
  dikonfirmasi_umk INTEGER DEFAULT 0,          -- 1 setelah UMK membenarkan hasil ekstraksi
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE supplier_cert (
  id            INTEGER PRIMARY KEY,
  umk_id        INTEGER NOT NULL REFERENCES umk(id) ON DELETE CASCADE,
  nama_pemasok  TEXT NOT NULL,
  nomor_sertifikat TEXT,                       -- sintetis, dicek ke mock registry
  berlaku_sampai TEXT,
  media_id      INTEGER REFERENCES media(id),
  status        TEXT NOT NULL DEFAULT 'menunggu'
                CHECK (status IN ('menunggu','valid','kedaluwarsa','tidak_ditemukan')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Checklist dokumen per UMK (turunan dari Kepkaban 146/2025)
CREATE TABLE document_req (
  id            INTEGER PRIMARY KEY,
  umk_id        INTEGER NOT NULL REFERENCES umk(id) ON DELETE CASCADE,
  kode          TEXT NOT NULL,                 -- 'NIB','PERNYATAAN_HALAL','IKRAR','PENYELIA','DAFTAR_BAHAN','PROSES','FOTO_PRODUK','MANUAL_SJPH','SERT_PEMASOK:<supplier_cert_id>'
  status        TEXT NOT NULL DEFAULT 'kurang' CHECK (status IN ('kurang','diminta','diterima','ditolak','dihasilkan')),
  media_id      INTEGER REFERENCES media(id),
  catatan       TEXT,
  updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (umk_id, kode)
);

-- Hasil mesin keputusan (append-only; keputusan terbaru = MAX(id) per umk)
CREATE TABLE decision (
  id            INTEGER PRIMARY KEY,
  umk_id        INTEGER NOT NULL REFERENCES umk(id) ON DELETE CASCADE,
  jalur         TEXT NOT NULL CHECK (jalur IN ('SELF_DECLARE_SIAP','SELF_DECLARE_KURANG_DOKUMEN','REGULER','TIDAK_LAYAK')),
  skor_kesiapan INTEGER NOT NULL,              -- 0..100
  alasan_json   TEXT NOT NULL,                 -- [{rule_id, hasil, pesan}]
  rules_version TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Tugas pengejaran (dibaca scheduler, dieksekusi lewat /hooks/agent)
CREATE TABLE chase_task (
  id            INTEGER PRIMARY KEY,
  umk_id        INTEGER NOT NULL REFERENCES umk(id) ON DELETE CASCADE,
  document_kode TEXT NOT NULL,
  target_actor_id INTEGER NOT NULL REFERENCES actor(id),   -- UMK atau pendamping (eskalasi)
  tahap         INTEGER NOT NULL DEFAULT 1,   -- 1=D+1, 2=D+3, 3=D+7, 4=eskalasi D+10
  due_at        TEXT NOT NULL,
  sent_at       TEXT,
  status        TEXT NOT NULL DEFAULT 'terjadwal' CHECK (status IN ('terjadwal','terkirim','selesai','dibatalkan')),
  idempotency_key TEXT UNIQUE NOT NULL         -- "chase:<umk>:<doc>:<tahap>"
);

CREATE TABLE dossier (
  id            INTEGER PRIMARY KEY,
  umk_id        INTEGER NOT NULL REFERENCES umk(id) ON DELETE CASCADE,
  versi         INTEGER NOT NULL,
  pdf_path      TEXT NOT NULL,
  sha256        TEXT NOT NULL,
  manual_sjph_path TEXT,
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','menunggu_review','disetujui','dikembalikan')),
  catatan_pendamping TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (umk_id, versi)
);

-- Mock kuota SEHATI (per provinsi) & mock pengajuan SiHalal
CREATE TABLE quota_mock (
  provinsi      TEXT PRIMARY KEY,
  kuota_total   INTEGER NOT NULL,
  kuota_terpakai INTEGER NOT NULL,
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE submission_mock (
  id            INTEGER PRIMARY KEY,
  umk_id        INTEGER NOT NULL REFERENCES umk(id),
  dossier_id    INTEGER NOT NULL REFERENCES dossier(id),
  nomor_simulasi TEXT NOT NULL,
  status        TEXT NOT NULL CHECK (status IN ('diajukan','dikembalikan','diterima')),
  alasan        TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Audit log: semua aksi agent & manusia (dipakai di video sebagai bukti "agent bertindak")
CREATE TABLE event_log (
  id            INTEGER PRIMARY KEY,
  umk_id        INTEGER REFERENCES umk(id),
  actor         TEXT NOT NULL,                 -- 'agent','umk:<id>','pendamping:<id>','scheduler','system'
  aksi          TEXT NOT NULL,                 -- 'INTAKE','EXTRACT','EVALUATE','CHASE_SENT','APPROVE','RETURN','DOSSIER_BUILT',...
  detail_json   TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_chase_due ON chase_task(status, due_at);
CREATE INDEX idx_umk_status ON umk(koperasi_id, status);
CREATE INDEX idx_event_umk ON event_log(umk_id, created_at);

-- View ringkasan portofolio untuk dashboard & digest
CREATE VIEW v_portfolio AS
SELECT k.id AS koperasi_id, k.nama,
       COUNT(u.id) AS total_umk,
       SUM(u.status IN ('siap_unggah','diajukan_simulasi','selesai_simulasi')) AS siap_unggah,
       SUM(u.status = 'menunggu_dokumen') AS menunggu_dokumen,
       SUM(u.status IN ('baru','intake')) AS belum_mulai,
       CAST(julianday(k.target_date) - julianday('now') AS INTEGER) AS hari_tersisa
FROM koperasi k LEFT JOIN umk u ON u.koperasi_id = k.id AND u.status <> 'dihapus'
GROUP BY k.id;
