---
id: US-06-N3
judul: Nama produk berunsur haram (E17) → TIDAK_LAYAK dengan pesan ubah nama
level: pengguna
tipe: negatif
terkait: FR-06, E17
prioritas: M
komponen: rules/engine E17
otomasi: otomatis (node:test)
status: belum diuji
---

# US-06-N3 — Nama produk berunsur haram (E17) → TIDAK_LAYAK dengan pesan ubah nama

## Tujuan
Produk yang nama/jenisnya memakai kata terlarang (babi, anjing, bacon, rum, wine, dsb.) ditolak sebelum berkas disusun, sesuai kriteria nama/simbol/kemasan produk.

## Prasyarat
- `npm ci`; rules/eligibility.yaml v2026-09-10.1

## Data uji
- Produk 'Keripik Rasa Bacon' (bahan aman)
- Produk 'Keripik Rumahan' (kontrol: 'rum' di dalam kata tidak boleh terpicu)

## Langkah
1. Jalankan test E17 di test/rules/engine.test.mjs.
2. Uji manual: UMK menambah produk bernama 'Sambal Rasa Bacon' lewat Telegram lalu evaluasi.

## Hasil yang diharapkan
- 'Keripik Rasa Bacon' → jalur TIDAK_LAYAK, alasan E17 menyebut kata 'bacon'.
- 'Keripik Rumahan' → tidak terpicu.
- Agent menyampaikan agar nama produk diubah, merujuk Kepkaban 146/2025 Bab III D.

## Kriteria lolos
- Test hijau.
- Pencocokan per kata utuh (token), bukan substring.

## Catatan
- Rujukan: SPECS.md (FR-06, E17); Kepkaban BPJPH 146/2025 Bab III D.1–7 (`docs/regulasi/kepkaban-146-2025-bab-i-iv.txt`).
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>`.
