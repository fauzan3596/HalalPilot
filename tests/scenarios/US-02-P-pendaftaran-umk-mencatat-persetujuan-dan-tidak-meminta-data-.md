---
id: US-02-P
judul: Pendaftaran UMK mencatat persetujuan dan tidak meminta data pribadi
level: pengguna
tipe: positif
terkait: FR-02, NFR-07
prioritas: M
komponen: skill, routes/umk
otomasi: manual (Telegram + dashboard)
status: belum diuji
---

# US-02-P — Pendaftaran UMK mencatat persetujuan dan tidak meminta data pribadi

## Tujuan
Pendaftaran menghasilkan baris umk dengan consent_at terisi dan percakapan bebas permintaan KTP/HP/rekening.

## Prasyarat
- Orchestrator berjalan (`npm run dev`), DB hasil `npm run migrate && npm run seed:demo`
- OpenClaw gateway aktif, agent `halalpilot`, skill termuat, Telegram allowlist berisi akun uji
- Akun TG_BARU belum terdaftar

## Data uji
- Nama usaha: 'Keripik Bu Wati'

## Langkah
1. Kirim 'halo' dari TG_BARU.
2. Agent menawarkan pendaftaran; balas nama usaha.
3. Agent meminta persetujuan pemrosesan data usaha; balas 'setuju'.
4. Periksa tabel umk, actor, event_log.

## Hasil yang diharapkan
- Baris umk baru status `intake`, `consent_at` terisi.
- Baris actor role=umk tertaut.
- event_log `CONSENT` dengan teks persetujuan (tanpa data pribadi).
- Transkrip tidak berisi permintaan NIK/KTP/HP/rekening.

## Kriteria lolos
- consent_at NOT NULL.
- grep transkrip untuk 'KTP', 'NIK', 'nomor HP', 'rekening' = 0 kemunculan sebagai permintaan.

## Catatan
- Rujukan: SPECS.md (FR-02, NFR-07). Skenario positif level pengguna.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/US-02-P/` bila dijalankan di VPS.
