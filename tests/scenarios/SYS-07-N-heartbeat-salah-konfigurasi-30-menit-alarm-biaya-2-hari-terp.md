---
id: SYS-07-N
judul: Heartbeat salah konfigurasi (30 menit) → alarm biaya > $2/hari terpicu
level: sistem
tipe: negatif
terkait: NFR-08
prioritas: C
komponen: alarm biaya
otomasi: semi-otomatis (skrip + manual)
status: belum diuji
---

# SYS-07-N — Heartbeat salah konfigurasi (30 menit) → alarm biaya > $2/hari terpicu

## Tujuan
Pengaman biaya bekerja sebelum tagihan membengkak.

## Prasyarat
- Set heartbeat.every 30m dan tarif simulasi tinggi di config uji

## Data uji
- —

## Langkah
1. Jalankan 1 jam; cek alarm.

## Hasil yang diharapkan
- Alarm ke admin via hooks berisi estimasi biaya harian; heartbeat dikembalikan ke 6h.

## Kriteria lolos
- 1 alarm.

## Catatan
- Rujukan: SPECS.md (NFR-08). Skenario negatif level sistem.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/SYS-07-N/` bila dijalankan di VPS.
