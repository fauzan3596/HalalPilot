---
id: SYS-12-N
judul: Versi OpenClaw prainstal berbeda → dipin ulang tanpa merusak konfigurasi
level: sistem
tipe: negatif
terkait: NFR-10
prioritas: M
komponen: deploy
otomasi: manual (Telegram + dashboard)
status: belum diuji
---

# SYS-12-N — Versi OpenClaw prainstal berbeda → dipin ulang tanpa merusak konfigurasi

## Tujuan
Penanganan ketidakcocokan versi.

## Prasyarat
- VPS dengan versi lain (mis. 2026.8.1)

## Data uji
- —

## Langkah
1. `npm i -g openclaw@2026.8.2`; `openclaw gateway restart`; `openclaw channels status`.

## Hasil yang diharapkan
- Versi 2026.8.2; konfigurasi dan pairing Telegram tetap; automations tetap.

## Kriteria lolos
- 3/3 tetap.

## Catatan
- Rujukan: SPECS.md (NFR-10). Skenario negatif level sistem.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/SYS-12-N/` bila dijalankan di VPS.
