---
id: SYS-07-P
judul: Biaya model per UMK (intake → dossier) ≤ Rp500 dan tercatat
level: sistem
tipe: positif
terkait: NFR-08
prioritas: S
komponen: penghitung token, dashboard Audit
otomasi: semi-otomatis (skrip + manual)
status: belum diuji
---

# SYS-07-P — Biaya model per UMK (intake → dossier) ≤ Rp500 dan tercatat

## Tujuan
Klaim biaya di artikel berdasar data.

## Prasyarat
- VPS Batch 2 aktif; semua unit hidup (openclaw, halalpilot-api)
- Penghitung token aktif (usage dari model/OpenRouter)

## Data uji
- Alur penuh UMK-017

## Langkah
1. Catat total token input/output dan tarif model.
2. Hitung rupiah (kurs tetap yang dicatat).

## Hasil yang diharapkan
- ≤ Rp500; angka dan metode tersimpan docs/h1-evidence/cost.md.

## Kriteria lolos
- Angka ada dan ≤ ambang.

## Catatan
- Rujukan: SPECS.md (NFR-08). Skenario positif level sistem.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/SYS-07-P/` bila dijalankan di VPS.
