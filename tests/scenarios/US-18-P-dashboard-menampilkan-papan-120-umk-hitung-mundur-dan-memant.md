---
id: US-18-P
judul: Dashboard menampilkan papan 120 UMK, hitung mundur, dan memantulkan perubahan status ≤ 10 detik
level: pengguna
tipe: positif
terkait: FR-18
prioritas: S
komponen: dashboard
otomasi: manual (Telegram + dashboard)
status: belum diuji
---

# US-18-P — Dashboard menampilkan papan 120 UMK, hitung mundur, dan memantulkan perubahan status ≤ 10 detik

## Tujuan
Visual portofolio benar dan hampir waktu nyata.

## Prasyarat
- Dashboard build; SSH tunnel `-L 3000:127.0.0.1:3000`

## Data uji
- Seed 120 UMK; UMK-017 berubah ke siap_unggah saat uji

## Langkah
1. Buka /dashboard.
2. Jalankan US-15-P.
3. Ukur waktu sampai warna UMK-017 berubah.

## Hasil yang diharapkan
- 120 kartu; warna sesuai status; hitung mundur ke 17 Okt benar.
- Detail UMK menampilkan alasan keputusan dengan rule_id dan tautan PDF.
- Perubahan ≤ 10 s.

## Kriteria lolos
- Jumlah kartu = COUNT umk status≠dihapus.

## Catatan
- Rujukan: SPECS.md (FR-18). Skenario positif level pengguna.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/US-18-P/` bila dijalankan di VPS.
