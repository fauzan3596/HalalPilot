---
id: SYS-14-N
judul: Hooks menerima (200) tetapi agent tidak memanggil mark_chase_sent → sweep berikutnya tidak mengirim ulang
level: sistem
tipe: negatif
terkait: NFR-05
prioritas: M
komponen: scheduler
otomasi: otomatis (node:test)
status: belum diuji
---

# SYS-14-N — Hooks menerima (200) tetapi agent tidak memanggil mark_chase_sent → sweep berikutnya tidak mengirim ulang

## Tujuan
Ketiadaan konfirmasi dari agent tidak menyebabkan pengiriman ganda.

## Prasyarat
- Server hooks palsu selalu 200 ok

## Data uji
- Task tahap 1

## Langkah
1. Sweep (hook 200, tanpa mark).
2. Tunggu > 10 menit (clock injeksi); sweep lagi.

## Hasil yang diharapkan
- Task ditandai terkirim berdasarkan ok:true setelah tenggang; sweep kedua dispatched=0.

## Kriteria lolos
- Test hijau.

## Catatan
- Rujukan: SPECS.md (NFR-05). Skenario negatif level sistem.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/SYS-14-N/` bila dijalankan di VPS.
