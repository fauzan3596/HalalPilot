---
id: US-13-P
judul: Dengan izin eksplisit, agent menghubungi pemasok untuk meminta sertifikat
level: pengguna
tipe: positif
terkait: FR-13
prioritas: C
komponen: skill, chase-policy pengejaran_pemasok
otomasi: manual (Telegram + dashboard)
status: belum diuji
---

# US-13-P — Dengan izin eksplisit, agent menghubungi pemasok untuk meminta sertifikat

## Tujuan
Agent boleh menghubungi pihak ketiga hanya setelah izin tegas.

## Prasyarat
- Orchestrator berjalan (`npm run dev`), DB hasil `npm run migrate && npm run seed:demo`
- OpenClaw gateway aktif, agent `halalpilot`, skill termuat, Telegram allowlist berisi akun uji
- UMK-088 'Bakso Pak Darto' (seed), akun Telegram TG_UMK_3
- Akun TG_PEMASOK di allowlist dan terdaftar sebagai actor role=pemasok (atau umk khusus)

## Data uji
- UMK-088: 'boleh hubungi pemasok saya, ini kontaknya @pemasok_fiktif'

## Langkah
1. Kirim izin + kontak.
2. Amati akun pemasok.

## Hasil yang diharapkan
- Pemasok menerima pesan sesuai template (menyebut UMK, bahan, cukup nomor & masa berlaku).
- event_log `SUPPLIER_CONTACTED` dengan bukti izin (kutipan pesan UMK).

## Kriteria lolos
- Pesan tidak meminta data selain nomor sertifikat dan masa berlaku.

## Catatan
- Rujukan: SPECS.md (FR-13). Skenario positif level pengguna.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/US-13-P/` bila dijalankan di VPS.
