---
id: SYS-10-N
judul: Semua model gagal → agent menyatakan layanan model tidak tersedia, tidak ada perubahan state
level: sistem
tipe: negatif
terkait: NFR-04
prioritas: S
komponen: OpenClaw
otomasi: manual (Telegram + dashboard)
status: belum diuji
---

# SYS-10-N — Semua model gagal → agent menyatakan layanan model tidak tersedia, tidak ada perubahan state

## Tujuan
Kegagalan total tidak merusak data.

## Prasyarat
- Semua key model salah sementara

## Data uji
- Permintaan evaluate

## Langkah
1. Kirim; amati; pulihkan key.

## Hasil yang diharapkan
- Pesan galat dari gateway/agent tanpa halusinasi; 0 decision baru.

## Kriteria lolos
- COUNT decision tidak berubah.

## Catatan
- Rujukan: SPECS.md (NFR-04). Skenario negatif level sistem.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/SYS-10-N/` bila dijalankan di VPS.
