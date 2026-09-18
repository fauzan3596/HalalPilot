---
id: US-05-P
judul: Klasifikasi bahan Nastar sesuai kamus
level: pengguna
tipe: positif
terkait: FR-05
prioritas: M
komponen: rules/classifier
otomasi: otomatis (node:test)
status: belum diuji
---

# US-05-P — Klasifikasi bahan Nastar sesuai kamus

## Tujuan
Setiap bahan mendapat kelas dan rule_id yang benar.

## Prasyarat
- `npm ci`
- rules/ingredients.yaml versi repo

## Data uji
- tepung terigu→positif (POS_OLAHAN), margarin→kritis (KRITIS_WAJIB_SERT), telur→dikecualikan_A (KMA 1360 a.2), gula pasir→positif (bukan bahan dikecualikan KMA), vanili→positif, selai nanas→positif (selai)

## Langkah
1. Jalankan `npm test` (test/rules/engine.test.mjs).
2. Atau panggil `PUT /products/{pid}/ingredients` dengan 6 bahan dan baca respons.

## Hasil yang diharapkan
- Kelas dan rule_id sesuai tabel data uji.
- Ringkasan menyebut jumlah per kelas.
- `perlu_konfirmasi=true` selama dikonfirmasi_umk=false.

## Kriteria lolos
- Test hijau.
- Respons API cocok 6/6.

## Catatan
- Rujukan: SPECS.md (FR-05). Skenario positif level pengguna.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/US-05-P/` bila dijalankan di VPS.
