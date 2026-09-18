---
id: SYS-09-N
judul: Variabel env wajib kosong → server menolak start dengan pesan yang menyebut variabelnya
level: sistem
tipe: negatif
terkait: NFR-10
prioritas: M
komponen: config.js
otomasi: otomatis (node:test)
status: belum diuji
---

# SYS-09-N — Variabel env wajib kosong → server menolak start dengan pesan yang menyebut variabelnya

## Tujuan
Gagal cepat dan jelas, bukan error samar saat runtime.

## Prasyarat
- —

## Data uji
- Hapus HOOKS_TOKEN dari env

## Langkah
1. `node src/server.js`.

## Hasil yang diharapkan
- Exit code 2; stderr 'Variabel wajib kosong: HOOKS_TOKEN'.

## Kriteria lolos
- Test hijau (spawn child process).

## Catatan
- Rujukan: SPECS.md (NFR-10). Skenario negatif level sistem.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/SYS-09-N/` bila dijalankan di VPS.
