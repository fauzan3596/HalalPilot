---
id: US-21-N
judul: API gagal satu heartbeat lalu pulih → tidak ada laporan palsu
level: pengguna
tipe: negatif
terkait: FR-21
prioritas: S
komponen: HEARTBEAT.md
otomasi: manual (Telegram + dashboard)
status: belum diuji
---

# US-21-N — API gagal satu heartbeat lalu pulih → tidak ada laporan palsu

## Tujuan
Tidak ada alarm untuk gangguan sesaat.

## Prasyarat
- heartbeat 2m
- Stop API 30 detik lalu start

## Data uji
- —

## Langkah
1. Stop/start API di antara dua heartbeat.
2. Amati pendamping selama 10 menit.

## Hasil yang diharapkan
- 0 pesan gangguan.

## Kriteria lolos
- 0 pesan.

## Catatan
- Rujukan: SPECS.md (FR-21). Skenario negatif level pengguna.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/US-21-N/` bila dijalankan di VPS.
