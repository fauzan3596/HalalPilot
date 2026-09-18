---
id: SYS-08-P
judul: Setiap keputusan dapat ditelusuri: alasan_json lengkap dan rules_version terisi; /health informatif
level: sistem
tipe: positif
terkait: NFR-09
prioritas: M
komponen: engine, health
otomasi: otomatis (node:test)
status: belum diuji
---

# SYS-08-P — Setiap keputusan dapat ditelusuri: alasan_json lengkap dan rules_version terisi; /health informatif

## Tujuan
Observabilitas keputusan dan layanan.

## Prasyarat
- Orchestrator lokal dengan beberapa evaluate

## Data uji
- —

## Langkah
1. `SELECT COUNT(*) FROM decision WHERE alasan_json IS NULL OR rules_version IS NULL`.
2. `GET /health`.

## Hasil yang diharapkan
- 0 baris tanpa alasan/versi.
- /health memuat ok, rules_version, chase_due, last_sweep, time.

## Kriteria lolos
- Test hijau.

## Catatan
- Rujukan: SPECS.md (NFR-09). Skenario positif level sistem.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/SYS-08-P/` bila dijalankan di VPS.
