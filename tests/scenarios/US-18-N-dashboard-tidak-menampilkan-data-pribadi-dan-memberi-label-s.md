---
id: US-18-N
judul: Dashboard tidak menampilkan data pribadi dan memberi label 'Simulasi' pada semua data mock
level: pengguna
tipe: negatif
terkait: FR-18, NFR-07
prioritas: S
komponen: dashboard
otomasi: manual (Telegram + dashboard)
status: belum diuji
---

# US-18-N — Dashboard tidak menampilkan data pribadi dan memberi label 'Simulasi' pada semua data mock

## Tujuan
Tampilan patuh minimalisasi data dan jujur soal mock.

## Prasyarat
- Dashboard aktif

## Data uji
- —

## Langkah
1. Telusuri semua halaman.
2. Cari label pada bagian OSS, kuota, pengajuan.

## Hasil yang diharapkan
- Tidak ada kolom NIK/HP/rekening.
- Bagian OSS/kuota/pengajuan berlabel 'Simulasi'.

## Kriteria lolos
- 0 field pribadi; 3/3 label simulasi.

## Catatan
- Rujukan: SPECS.md (FR-18, NFR-07). Skenario negatif level pengguna.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/US-18-N/` bila dijalankan di VPS.
