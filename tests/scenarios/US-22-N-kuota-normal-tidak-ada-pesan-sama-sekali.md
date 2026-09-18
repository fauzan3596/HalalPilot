---
id: US-22-N
judul: Kuota normal → tidak ada pesan sama sekali
level: pengguna
tipe: negatif
terkait: FR-22
prioritas: C
komponen: automations kuota
otomasi: manual (Telegram + dashboard)
status: belum diuji
---

# US-22-N — Kuota normal → tidak ada pesan sama sekali

## Tujuan
Automation diam saat tidak perlu.

## Prasyarat
- Seed kuota semua provinsi sisa > 10%

## Data uji
- —

## Langkah
1. Jalankan automation kuota.

## Hasil yang diharapkan
- Tidak ada pesan ke pendamping; run tercatat sukses.

## Kriteria lolos
- 0 pesan.

## Catatan
- Rujukan: SPECS.md (FR-22). Skenario negatif level pengguna.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/US-22-N/` bila dijalankan di VPS.
