---
id: SYS-11-P
judul: V1: foto Telegram sampai ke imageModel dan menghasilkan daftar bahan
level: sistem
tipe: positif
terkait: FR-04, V1
prioritas: M
komponen: OpenClaw media → imageModel
otomasi: manual (Telegram + dashboard)
status: belum diuji
---

# SYS-11-P — V1: foto Telegram sampai ke imageModel dan menghasilkan daftar bahan

## Tujuan
Jalur vision utama terverifikasi di versi OpenClaw yang dipakai.

## Prasyarat
- VPS Batch 2 aktif; semua unit hidup (openclaw, halalpilot-api)
- agents.defaults.imageModel gemini-2.5-flash-lite

## Data uji
- Foto label Nastar

## Langkah
1. Kirim foto dari UMK-017.
2. Cek log gateway: media diteruskan ke imageModel.

## Hasil yang diharapkan
- Agent menulis ≥ 5 dari 6 bahan benar.
- Log menunjukkan pemanggilan imageModel.

## Kriteria lolos
- ≥ 5/6 bahan; catat hasil di docs/h1-evidence/v1.md.

## Catatan
- Rujukan: SPECS.md (FR-04, V1). Skenario positif level sistem.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/SYS-11-P/` bila dijalankan di VPS.
