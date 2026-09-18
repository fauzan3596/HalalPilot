---
id: SYS-13-N
judul: Backup tanpa checkpoint WAL → terdeteksi dan diulang dengan checkpoint
level: sistem
tipe: negatif
terkait: NFR-10
prioritas: S
komponen: deploy/backup.sh
otomasi: semi-otomatis (skrip + manual)
status: belum diuji
---

# SYS-13-N — Backup tanpa checkpoint WAL → terdeteksi dan diulang dengan checkpoint

## Tujuan
Skrip backup menolak arsip yang tidak konsisten.

## Prasyarat
- —

## Data uji
- Simulasi: salin .db tanpa .db-wal saat ada transaksi tertunda

## Langkah
1. Jalankan backup.sh mode uji tanpa checkpoint; restore; integrity_check.
2. Jalankan backup.sh normal.

## Hasil yang diharapkan
- Mode uji: skrip memperingatkan/menggagalkan karena WAL ada; mode normal: `PRAGMA wal_checkpoint(TRUNCATE)` dijalankan, integrity ok.

## Kriteria lolos
- backup.sh normal selalu checkpoint (grep skrip).

## Catatan
- Rujukan: SPECS.md (NFR-10). Skenario negatif level sistem.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/SYS-13-N/` bila dijalankan di VPS.
