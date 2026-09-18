---
id: SYS-01-P
judul: Total RAM semua proses ≤ 2,5 GB setelah seluruh sistem hidup
level: sistem
tipe: positif
terkait: NFR-01
prioritas: M
komponen: deployment
otomasi: semi-otomatis (skrip + manual)
status: belum diuji
---

# SYS-01-P — Total RAM semua proses ≤ 2,5 GB setelah seluruh sistem hidup

## Tujuan
Sistem muat di VPS 4 GB dengan margin.

## Prasyarat
- VPS Batch 2 aktif; semua unit hidup (openclaw, halalpilot-api)
- Seed 120 UMK; 3 automations terpasang

## Data uji
- —

## Langkah
1. `free -m`, `systemd-cgtop -1`, `ps -o rss,cmd -C node`.
2. Jalankan US-04-P (foto) lalu ukur lagi puncak.

## Hasil yang diharapkan
- used ≤ 2,5 GB idle; puncak saat vision ≤ 3,2 GB; swap terpakai < 200 MB.
- Output disimpan ke docs/h1-evidence/ram.txt.

## Kriteria lolos
- Angka di bawah ambang.

## Catatan
- Rujukan: SPECS.md (NFR-01). Skenario positif level sistem.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/SYS-01-P/` bila dijalankan di VPS.
