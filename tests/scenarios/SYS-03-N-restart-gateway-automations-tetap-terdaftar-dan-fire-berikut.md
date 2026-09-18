---
id: SYS-03-N
judul: Restart gateway → automations tetap terdaftar dan fire berikutnya tepat waktu
level: sistem
tipe: negatif
terkait: NFR-04
prioritas: M
komponen: OpenClaw
otomasi: semi-otomatis (skrip + manual)
status: belum diuji
---

# SYS-03-N — Restart gateway → automations tetap terdaftar dan fire berikutnya tepat waktu

## Tujuan
Jadwal persisten di SQLite gateway.

## Prasyarat
- VPS Batch 2 aktif; semua unit hidup (openclaw, halalpilot-api)

## Data uji
- —

## Langkah
1. `systemctl restart openclaw`.
2. `openclaw automations list`; tunggu run berikutnya.

## Hasil yang diharapkan
- 3 automations masih ada; run berikutnya terjadi sesuai jadwal.
- Sesi Telegram tetap terhubung.

## Kriteria lolos
- 3/3 automations; run tepat waktu ± 1 menit.

## Catatan
- Rujukan: SPECS.md (NFR-04). Skenario negatif level sistem.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/SYS-03-N/` bila dijalankan di VPS.
