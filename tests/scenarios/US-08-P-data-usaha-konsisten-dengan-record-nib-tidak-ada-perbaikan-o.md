---
id: US-08-P
judul: Data usaha konsisten dengan record NIB → tidak ada PERBAIKAN_OSS
level: pengguna
tipe: positif
terkait: FR-08
prioritas: M
komponen: rules/oss-check, mocks/oss
otomasi: otomatis (node:test)
status: belum diuji
---

# US-08-P — Data usaha konsisten dengan record NIB → tidak ada PERBAIKAN_OSS

## Tujuan
Pembanding tidak menghasilkan false positive pada data yang cocok.

## Prasyarat
- Seed UMK-017 dan record OSS mock-nya identik (nama, alamat, KBLI 10710, mikro, aktif)

## Data uji
- UMK-017

## Langkah
1. `POST /umk/{id}/evaluate` untuk UMK-017.
2. Panggil fungsi oss-check langsung dalam unit test.

## Hasil yang diharapkan
- mismatch = [] ; E15 lolos.
- Variasi kecil (nama 'Dapur Bu Ratih' vs 'DAPUR BU RATIH', nomor rumah beda) tetap cocok.

## Kriteria lolos
- Unit test 3 variasi hijau.

## Catatan
- Rujukan: SPECS.md (FR-08). Skenario positif level pengguna.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/US-08-P/` bila dijalankan di VPS.
