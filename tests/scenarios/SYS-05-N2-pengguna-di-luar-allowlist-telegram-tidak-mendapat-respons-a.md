---
id: SYS-05-N2
judul: Pengguna di luar allowlist Telegram tidak mendapat respons apa pun dari gateway
level: sistem
tipe: negatif
terkait: NFR-06
prioritas: M
komponen: OpenClaw dmPolicy allowlist
otomasi: manual (Telegram + dashboard)
status: belum diuji
---

# SYS-05-N2 — Pengguna di luar allowlist Telegram tidak mendapat respons apa pun dari gateway

## Tujuan
Bot tidak melayani publik selama demo.

## Prasyarat
- VPS Batch 2 aktif; semua unit hidup (openclaw, halalpilot-api)
- Akun Telegram pribadi penulis tidak ada di allowFrom

## Data uji
- Pesan 'halo' dari akun tersebut

## Langkah
1. Kirim pesan; tunggu 2 menit; cek log gateway.

## Hasil yang diharapkan
- Tidak ada balasan; log menunjukkan pesan ditolak oleh policy.
- Tidak ada panggilan whoami.

## Kriteria lolos
- 0 balasan; 0 API call.

## Catatan
- Rujukan: SPECS.md (NFR-06). Skenario negatif level sistem.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/SYS-05-N2/` bila dijalankan di VPS.
