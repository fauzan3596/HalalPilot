---
id: SYS-02-P
judul: Latensi balasan agent non-vision p50 ≤ 8 s, p95 ≤ 20 s
level: sistem
tipe: positif
terkait: NFR-02
prioritas: S
komponen: model, skill
otomasi: semi-otomatis (skrip + manual)
status: belum diuji
---

# SYS-02-P — Latensi balasan agent non-vision p50 ≤ 8 s, p95 ≤ 20 s

## Tujuan
Percakapan cukup cepat untuk demo tanpa pemotongan.

## Prasyarat
- VPS Batch 2 aktif; semua unit hidup (openclaw, halalpilot-api)
- Model primary aktif

## Data uji
- 20 pesan 'status saya' dari UMK-017

## Langkah
1. Kirim 20 pesan berjarak 15 s; catat timestamp kirim/balas dari log gateway.
2. Hitung p50/p95.

## Hasil yang diharapkan
- p50 ≤ 8 s, p95 ≤ 20 s.
- Hasil disimpan docs/h1-evidence/latency.csv.

## Kriteria lolos
- Kedua ambang terpenuhi; jika tidak, ganti primary ke DeepSeek V3.2 dan ulangi.

## Catatan
- Rujukan: SPECS.md (NFR-02). Skenario positif level sistem.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/SYS-02-P/` bila dijalankan di VPS.
