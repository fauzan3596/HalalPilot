---
id: US-23-P
judul: Lebih dari 10 nama produk (E16) → pengajuan harus dibagi
level: pengguna
tipe: positif
terkait: FR-06, E16
prioritas: S
komponen: rules/engine E16
otomasi: otomatis (node:test)
status: belum diuji
---

# US-23-P — Lebih dari 10 nama produk (E16) → pengajuan harus dibagi

## Tujuan
Batas 10 nama produk per pengajuan self-declare (30 menu untuk warung) ditegakkan dan ditandai untuk pendamping.

## Prasyarat
- `npm ci`

## Data uji
- UMK dengan 11 produk (bahan aman)
- UMK jenis_usaha 'warung' dengan 11 produk (kontrol: batas 30)

## Langkah
1. Jalankan test E16.
2. Uji manual (opsional): tambah 11 produk lewat API untuk satu UMK, evaluate.

## Hasil yang diharapkan
- 11 produk non-warung → E16 butuh_dokumen, dokumen PEMBAGIAN_PENGAJUAN.
- Warung dengan 11 produk → E16 lolos.
- PEMBAGIAN_PENGAJUAN tidak dikejar ke UMK (dokumen sistem/pendamping).

## Kriteria lolos
- Test hijau.
- Tidak ada chase_task untuk PEMBAGIAN_PENGAJUAN.

## Catatan
- Rujukan: SPECS.md (FR-06, E16); Kepkaban BPJPH 146/2025 Bab III A.2–3 (`docs/regulasi/kepkaban-146-2025-bab-i-iv.txt`).
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>`.
