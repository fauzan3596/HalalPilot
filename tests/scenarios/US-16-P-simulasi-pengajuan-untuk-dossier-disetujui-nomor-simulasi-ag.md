---
id: US-16-P
judul: Simulasi pengajuan untuk dossier disetujui → nomor simulasi, agent menyatakan simulasi
level: pengguna
tipe: positif
terkait: FR-16
prioritas: S
komponen: mocks/sihalal
otomasi: manual (Telegram + dashboard)
status: belum diuji
---

# US-16-P — Simulasi pengajuan untuk dossier disetujui → nomor simulasi, agent menyatakan simulasi

## Tujuan
Simulasi jelas berlabel dan mengubah status dengan benar.

## Prasyarat
- Orchestrator berjalan (`npm run dev`), DB hasil `npm run migrate && npm run seed:demo`
- OpenClaw gateway aktif, agent `halalpilot`, skill termuat, Telegram allowlist berisi akun uji
- Pendamping koperasi (seed), akun Telegram TG_PENDAMPING
- UMK-017 siap_unggah

## Data uji
- Pesan: 'ajukan UMK-017'

## Langkah
1. Kirim dari pendamping.
2. Cek submission_mock dan status.

## Hasil yang diharapkan
- submission_mock berisi nomor_simulasi; umk.status=diajukan_simulasi lalu selesai_simulasi (jika diterima).
- Pesan agent mengandung kata 'simulasi' dan menegaskan bukan portal asli.
- Kuota mock provinsi terpakai +1.

## Kriteria lolos
- Kata 'simulasi' ada di pesan.
- Status berubah.

## Catatan
- Rujukan: SPECS.md (FR-16). Skenario positif level pengguna.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/US-16-P/` bila dijalankan di VPS.
