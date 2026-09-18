---
id: US-17-P
judul: Digest 07:00 WIB terkirim otomatis dengan semua field
level: pengguna
tipe: positif
terkait: FR-17, NFR-04
prioritas: M
komponen: automations, portfolio
otomasi: manual (Telegram + dashboard)
status: belum diuji
---

# US-17-P — Digest 07:00 WIB terkirim otomatis dengan semua field

## Tujuan
Automation OpenClaw memicu ringkasan tanpa intervensi.

## Prasyarat
- `automations.sh` dijalankan; TZ Asia/Jakarta
- Untuk uji cepat: `openclaw automations run 'HalalPilot digest pagi'`

## Data uji
- Portofolio seed: 120 UMK

## Langkah
1. Tunggu 07:00 atau jalankan manual.
2. Baca pesan pendamping.

## Hasil yang diharapkan
- Pesan ≤ 12 baris memuat: total, siap unggah, menunggu dokumen, belum mulai, hari tersisa, 5 UMK mendesak, eskalasi terbuka.
- Angka sama dengan `GET /portfolio/1/summary`.
- `openclaw automations list` menunjukkan last run sukses.

## Kriteria lolos
- 7/7 field.
- Angka konsisten.

## Catatan
- Rujukan: SPECS.md (FR-17, NFR-04). Skenario positif level pengguna.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/US-17-P/` bila dijalankan di VPS.
