---
id: US-11-N3
judul: Tiga dokumen kurang → satu pesan gabungan, maksimal 2 pesan per UMK per hari
level: pengguna
tipe: negatif
terkait: FR-11
prioritas: S
komponen: scheduler batas harian
otomasi: otomatis (node:test)
status: belum diuji
---

# US-11-N3 — Tiga dokumen kurang → satu pesan gabungan, maksimal 2 pesan per UMK per hari

## Tujuan
UMK tidak dibanjiri pesan.

## Prasyarat
- UMK uji dengan 3 document_req kurang, 3 task tahap 1 jatuh tempo

## Data uji
- Dokumen: SERT_PEMASOK:gelatin, SERT_PEMASOK:perisa, FOTO_PRODUK

## Langkah
1. Sweep sekali.
2. Mundurkan task tahap 2 ketiganya ke masa lalu; sweep lagi.
3. Mundurkan tahap 3; sweep lagi (hari yang sama).

## Hasil yang diharapkan
- Sweep 1: 1 hook dengan konteks 3 dokumen.
- Sweep 2: 1 hook.
- Sweep 3: skipped_daily_cap=1, tidak ada hook.

## Kriteria lolos
- Total hook hari itu = 2.

## Catatan
- Rujukan: SPECS.md (FR-11). Skenario negatif level pengguna.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/US-11-N3/` bila dijalankan di VPS.
