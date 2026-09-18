---
id: US-09-P
judul: Produk berdaging tanpa sertifikat RPH dan digiling di pasar → E09 dan E10
level: pengguna
tipe: positif
terkait: FR-09
prioritas: M
komponen: rules/engine, classifier flags
otomasi: otomatis (node:test)
status: belum diuji
---

# US-09-P — Produk berdaging tanpa sertifikat RPH dan digiling di pasar → E09 dan E10

## Tujuan
Flag sembelihan dan giling diturunkan dari bahan dan memicu dokumen yang tepat.

## Prasyarat
- Seed UMK-088

## Data uji
- daging sapi, tapioka, bawang putih, garam, penyedap rasa; daging_giling=1

## Langkah
1. Evaluate UMK-088.
2. Uji manual: UMK-088 menjawab 'digiling di pasar'.

## Hasil yang diharapkan
- product.mengandung_hewan_sembelihan=1 otomatis.
- dokumen_diminta memuat SERT_PEMASOK:RPH, SERT_PEMASOK:GILING, SERT_PEMASOK:daging_sapi, SERT_PEMASOK:msg.
- Agent menanyakan nama RPH/pemasok dan jasa giling; menawarkan menghubungi pemasok jika diizinkan.

## Kriteria lolos
- Test 'Bakso' hijau.
- Pesan menyebut (E09) dan (E10).

## Catatan
- Rujukan: SPECS.md (FR-09). Skenario positif level pengguna.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/US-09-P/` bila dijalankan di VPS.
