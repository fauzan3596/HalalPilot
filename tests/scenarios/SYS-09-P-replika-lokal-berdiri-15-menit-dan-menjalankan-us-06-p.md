---
id: SYS-09-P
judul: Replika lokal berdiri < 15 menit dan menjalankan US-06-P
level: sistem
tipe: positif
terkait: NFR-10
prioritas: M
komponen: docker-compose, docs
otomasi: semi-otomatis (skrip + manual)
status: belum diuji
---

# SYS-09-P — Replika lokal berdiri < 15 menit dan menjalankan US-06-P

## Tujuan
Sistem dapat direplikasi (klaim untuk juri dan retake video).

## Prasyarat
- Laptop bersih (folder baru), Docker, Node 22

## Data uji
- —

## Langkah
1. `git clone`, `cp .env.example .env`, isi token dummy, `docker compose up -d`, `npm run seed:demo`, curl evaluate UMK-017.
2. Catat waktu.

## Hasil yang diharapkan
- /health ok; evaluate mengembalikan KURANG_DOKUMEN E11.
- Total waktu < 15 menit.

## Kriteria lolos
- Waktu tercatat.

## Catatan
- Rujukan: SPECS.md (NFR-10). Skenario positif level sistem.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/SYS-09-P/` bila dijalankan di VPS.
