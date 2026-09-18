---
id: US-08-N2
judul: NIB tidak ditemukan / tidak aktif di OSS mock → diminta cek NIB, tidak dievaluasi sebagai cocok
level: pengguna
tipe: negatif
terkait: FR-08
prioritas: S
komponen: mocks/oss, rules/oss-check
otomasi: otomatis (node:test)
status: belum diuji
---

# US-08-N2 — NIB tidak ditemukan / tidak aktif di OSS mock → diminta cek NIB, tidak dievaluasi sebagai cocok

## Tujuan
Ketiadaan record tidak dianggap cocok.

## Prasyarat
- Mock OSS mengembalikan 404 untuk NIB 9999999999999 dan status 'nonaktif' untuk NIB 1309170000000

## Data uji
- Dua UMK uji dengan NIB tersebut

## Langkah
1. Evaluate keduanya.

## Hasil yang diharapkan
- Keduanya: mismatch memuat 'status_nib' (atau 'nib_tidak_ditemukan'), PERBAIKAN_OSS diminta.
- Pesan agent meminta UMK mengecek NIB di OSS.

## Kriteria lolos
- Tidak ada SELF_DECLARE_SIAP.

## Catatan
- Rujukan: SPECS.md (FR-08). Skenario negatif level pengguna.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/US-08-N2/` bila dijalankan di VPS.
