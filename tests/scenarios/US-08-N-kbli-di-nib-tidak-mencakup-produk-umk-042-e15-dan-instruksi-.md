---
id: US-08-N
judul: KBLI di NIB tidak mencakup produk (UMK-042) → E15 dan instruksi perbaikan
level: pengguna
tipe: negatif
terkait: FR-08
prioritas: M
komponen: rules/oss-check
otomasi: otomatis (node:test)
status: belum diuji
---

# US-08-N — KBLI di NIB tidak mencakup produk (UMK-042) → E15 dan instruksi perbaikan

## Tujuan
Ketidakcocokan KBLI terdeteksi dan pesan dapat ditindak.

## Prasyarat
- Seed UMK-042 dengan oss_override kbli ['47241']

## Data uji
- Produk sambal, KBLI produk 10772

## Langkah
1. Evaluate UMK-042.
2. Baca pesan agent (uji manual).

## Hasil yang diharapkan
- mismatch memuat 'kbli'; dokumen_diminta memuat PERBAIKAN_OSS; jalur KURANG_DOKUMEN meski bahan aman.
- Pesan menyebut KBLI 10772 dan langkah menambah KBLI di OSS.

## Kriteria lolos
- Hanya E15 yang butuh_dokumen (test 'Sambal').
- Pesan menyebut angka KBLI yang benar.

## Catatan
- Rujukan: SPECS.md (FR-08). Skenario negatif level pengguna.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/US-08-N/` bila dijalankan di VPS.
