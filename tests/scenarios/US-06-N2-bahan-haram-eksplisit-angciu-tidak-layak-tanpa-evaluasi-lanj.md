---
id: US-06-N2
judul: Bahan haram eksplisit (angciu) → TIDAK_LAYAK tanpa evaluasi lanjut
level: pengguna
tipe: negatif
terkait: FR-06
prioritas: M
komponen: rules/engine
otomasi: otomatis (node:test)
status: belum diuji
---

# US-06-N2 — Bahan haram eksplisit (angciu) → TIDAK_LAYAK tanpa evaluasi lanjut

## Tujuan
Bahan haram memotong evaluasi dan pesan menyebut bahannya.

## Prasyarat
- `npm ci`

## Data uji
- Bahan: daging ayam, angciu

## Langkah
1. Jalankan test 'Angciu'.

## Hasil yang diharapkan
- jalur=TIDAK_LAYAK, skor 0, alasan tunggal HARAM_EKSPLISIT menyebut 'angciu'.
- dokumen_diminta kosong.

## Kriteria lolos
- Test hijau.
- Agent (uji manual) menyampaikan tanpa menuduh, menyarankan mengganti bahan dan konsultasi pendamping.

## Catatan
- Rujukan: SPECS.md (FR-06). Skenario negatif level pengguna.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/US-06-N2/` bila dijalankan di VPS.
