---
id: SYS-13-P
judul: Backup malam dipulihkan di laptop dan DB konsisten
level: sistem
tipe: positif
terkait: NFR-10
prioritas: M
komponen: deploy/backup.sh
otomasi: semi-otomatis (skrip + manual)
status: belum diuji
---

# SYS-13-P — Backup malam dipulihkan di laptop dan DB konsisten

## Tujuan
Arsip setelah VM mati dapat dipakai retake dan bukti.

## Prasyarat
- backup.sh berjalan H1–H5 (checkpoint WAL sebelum tar)

## Data uji
- Arsip H3

## Langkah
1. Ekstrak di laptop; `sqlite3 halalpilot.db 'PRAGMA integrity_check'`; jalankan orchestrator dengan DATA_DIR arsip; buka dashboard.

## Hasil yang diharapkan
- integrity_check = ok; jumlah UMK dan dossier sama dengan catatan H3; PDF terbuka.

## Kriteria lolos
- ok + angka cocok.

## Catatan
- Rujukan: SPECS.md (NFR-10). Skenario positif level sistem.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/SYS-13-P/` bila dijalankan di VPS.
