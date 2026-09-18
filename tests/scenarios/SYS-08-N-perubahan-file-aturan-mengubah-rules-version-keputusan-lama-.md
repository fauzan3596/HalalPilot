---
id: SYS-08-N
judul: Perubahan file aturan mengubah rules_version; keputusan lama tidak berubah
level: sistem
tipe: negatif
terkait: NFR-09, NFR-11
prioritas: M
komponen: rules/loader
otomasi: otomatis (node:test)
status: belum diuji
---

# SYS-08-N — Perubahan file aturan mengubah rules_version; keputusan lama tidak berubah

## Tujuan
Determinisme dan versi aturan.

## Prasyarat
- Salinan rules/ untuk uji

## Data uji
- Ubah bobot E11 dari 20 → 25 di salinan

## Langkah
1. loadRules(dir asli) dan loadRules(dir salinan); bandingkan version.
2. Evaluate ctx sama dengan kedua rules; bandingkan skor.
3. Pastikan decision lama di DB tetap rules_version lama.

## Hasil yang diharapkan
- version berbeda (hash berubah).
- Skor 80 vs 75.
- Baris decision lama tidak berubah.

## Kriteria lolos
- Test hijau.

## Catatan
- Rujukan: SPECS.md (NFR-09, NFR-11). Skenario negatif level sistem.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/SYS-08-N/` bila dijalankan di VPS.
