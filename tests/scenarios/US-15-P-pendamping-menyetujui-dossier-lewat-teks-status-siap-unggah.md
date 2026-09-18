---
id: US-15-P
judul: Pendamping menyetujui dossier lewat teks → status siap unggah
level: pengguna
tipe: positif
terkait: FR-15
prioritas: M
komponen: skill, routes/review
otomasi: manual (Telegram + dashboard)
status: belum diuji
---

# US-15-P — Pendamping menyetujui dossier lewat teks → status siap unggah

## Tujuan
Perintah teks sederhana dari pendamping yang berwenang mengubah status.

## Prasyarat
- Orchestrator berjalan (`npm run dev`), DB hasil `npm run migrate && npm run seed:demo`
- OpenClaw gateway aktif, agent `halalpilot`, skill termuat, Telegram allowlist berisi akun uji
- Pendamping koperasi (seed), akun Telegram TG_PENDAMPING
- Dossier UMK-017 v1 menunggu_review

## Data uji
- Pesan: 'setuju UMK-017'

## Langkah
1. Kirim dari akun pendamping.
2. Cek DB dan dashboard.

## Hasil yang diharapkan
- review(setuju) dipanggil dengan pendamping_telegram_id; dossier.status=disetujui; umk.status=siap_unggah.
- Agent mengonfirmasi dan menyebut langkah berikutnya (unggah ke SiHalal oleh pendamping / 'ajukan' untuk simulasi).
- Dashboard hijau ≤ 10 detik; event_log APPROVE.

## Kriteria lolos
- Status berubah.
- UMK-017 menerima kabar berkas disetujui.

## Catatan
- Rujukan: SPECS.md (FR-15). Skenario positif level pengguna.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/US-15-P/` bila dijalankan di VPS.
