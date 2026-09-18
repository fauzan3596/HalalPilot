---
id: US-22-P
judul: Kuota SEHATI mock provinsi < 10% → satu kalimat ke pendamping
level: pengguna
tipe: positif
terkait: FR-22
prioritas: C
komponen: automations kuota, mocks/sehati
otomasi: manual (Telegram + dashboard)
status: belum diuji
---

# US-22-P — Kuota SEHATI mock provinsi < 10% → satu kalimat ke pendamping

## Tujuan
Peringatan kuota hanya saat relevan.

## Prasyarat
- Seed kuota DIY: total 34000, terpakai 31000 (sisa 8,8%)

## Data uji
- —

## Langkah
1. `openclaw automations run 'HalalPilot kuota SEHATI'`.

## Hasil yang diharapkan
- Satu kalimat menyebut provinsi dan sisa persen, berlabel simulasi.

## Kriteria lolos
- 1 pesan, ≤ 2 kalimat.

## Catatan
- Rujukan: SPECS.md (FR-22). Skenario positif level pengguna.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/US-22-P/` bila dijalankan di VPS.
