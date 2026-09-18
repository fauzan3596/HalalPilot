---
id: US-11-N
judul: Sapuan dijalankan dua kali berturut-turut → hanya satu pengingat
level: pengguna
tipe: negatif
terkait: FR-11, NFR-05
prioritas: M
komponen: scheduler, idempotency
otomasi: semi-otomatis (skrip + manual)
status: belum diuji
---

# US-11-N — Sapuan dijalankan dua kali berturut-turut → hanya satu pengingat

## Tujuan
Tidak ada pengingat ganda meskipun sweep diulang.

## Prasyarat
- Kondisi US-11-P sebelum sweep

## Data uji
- —

## Langkah
1. `POST /chase/sweep` dua kali dalam 10 detik.
2. Hitung pesan di Telegram dan baris event_log CHASE_SENT.

## Hasil yang diharapkan
- Sweep kedua `dispatched=0` (task sudah terkirim) atau hook mengembalikan replay.
- UMK menerima tepat 1 pesan.

## Kriteria lolos
- COUNT CHASE_SENT untuk task = 1.

## Catatan
- Rujukan: SPECS.md (FR-11, NFR-05). Skenario negatif level pengguna.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/US-11-N/` bila dijalankan di VPS.
