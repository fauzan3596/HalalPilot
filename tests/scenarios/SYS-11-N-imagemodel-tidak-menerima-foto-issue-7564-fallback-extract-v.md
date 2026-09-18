---
id: SYS-11-N
judul: imageModel tidak menerima foto (issue #7564) → fallback extract via OpenRouter bekerja
level: sistem
tipe: negatif
terkait: FR-04, V1
prioritas: M
komponen: routes/extract
otomasi: semi-otomatis (skrip + manual)
status: belum diuji
---

# SYS-11-N — imageModel tidak menerima foto (issue #7564) → fallback extract via OpenRouter bekerja

## Tujuan
Cadangan V1 siap sebelum demo.

## Prasyarat
- Nonaktifkan imageModel sementara

## Data uji
- Foto label Nastar; media_id dari save_media

## Langkah
1. Kirim foto → agent menerima placeholder → memanggil save_media + extract.
2. Cek respons extract.

## Hasil yang diharapkan
- extract mengembalikan bahan[] ≥ 5/6 benar, confidence ≥ 0,6.
- Alur konfirmasi berlanjut normal.

## Kriteria lolos
- ≥ 5/6.

## Catatan
- Rujukan: SPECS.md (FR-04, V1). Skenario negatif level sistem.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/SYS-11-N/` bila dijalankan di VPS.
