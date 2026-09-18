---
id: US-05-N
judul: Typo OCR dan bahan tak dikenal ditangani tanpa salah kelas
level: pengguna
tipe: negatif
terkait: FR-05
prioritas: M
komponen: rules/normalizer, classifier
otomasi: otomatis (node:test)
status: belum diuji
---

# US-05-N — Typo OCR dan bahan tak dikenal ditangani tanpa salah kelas

## Tujuan
Fuzzy ≤ 2 memperbaiki typo; bahan di luar kamus tidak dipaksakan ke kelas aman.

## Prasyarat
- `npm ci`

## Data uji
- 'Margarine' → margarin (kritis)
- 'Gula Pasir 20%' → gula_pasir
- 'xanthan gum' → tidak_dikenal
- 'garamm' → garam

## Langkah
1. Jalankan test 'Normalisasi typo OCR' dan 'Bahan tak dikenal'.
2. Tambah kasus 'garamm' dan 'Gula Pasir 20%' bila belum ada.

## Hasil yang diharapkan
- 4/4 sesuai.
- Tidak ada bahan tak dikenal yang jatuh ke kelas dikecualikan/positif.

## Kriteria lolos
- Test hijau.
- Jarak Levenshtein > 2 tidak dipetakan (mis. 'gelatinasi' ≠ gelatin dipetakan).

## Catatan
- Rujukan: SPECS.md (FR-05). Skenario negatif level pengguna.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/US-05-N/` bila dijalankan di VPS.
