---
id: SYS-10-P
judul: Model primary tidak tersedia → fallback dipakai, percakapan berlanjut
level: sistem
tipe: positif
terkait: NFR-04
prioritas: M
komponen: OpenClaw models fallbacks
otomasi: manual (Telegram + dashboard)
status: belum diuji
---

# SYS-10-P — Model primary tidak tersedia → fallback dipakai, percakapan berlanjut

## Tujuan
Ketahanan terhadap kuota/gangguan model default.

## Prasyarat
- VPS Batch 2 aktif; semua unit hidup (openclaw, halalpilot-api)
- fallbacks terkonfigurasi

## Data uji
- Set API key primary ke nilai salah sementara

## Langkah
1. Kirim 'status saya'.
2. Cek log model yang dipakai.

## Hasil yang diharapkan
- Balasan tetap datang; log menunjukkan fallback DeepSeek/GLM.
- Tidak ada perubahan state yang salah.

## Kriteria lolos
- Balasan ≤ 30 s.

## Catatan
- Rujukan: SPECS.md (NFR-04). Skenario positif level sistem.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/SYS-10-P/` bila dijalankan di VPS.
