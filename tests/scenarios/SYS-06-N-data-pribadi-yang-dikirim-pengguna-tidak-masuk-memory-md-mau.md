---
id: SYS-06-N
judul: Data pribadi yang dikirim pengguna tidak masuk MEMORY.md maupun memori vektor OpenClaw
level: sistem
tipe: negatif
terkait: NFR-07
prioritas: S
komponen: OpenClaw memory
otomasi: manual (Telegram + dashboard)
status: belum diuji
---

# SYS-06-N — Data pribadi yang dikirim pengguna tidak masuk MEMORY.md maupun memori vektor OpenClaw

## Tujuan
Memori agent tidak menjadi tempat bocor.

## Prasyarat
- memory.search aktif (jika V6 lolos)

## Data uji
- UMK mengirim 'HP saya 0812xxxx' (fiktif)

## Langkah
1. Kirim.
2. grep ~/.openclaw/workspace/**/*.md dan query memori (openclaw memory search '0812').

## Hasil yang diharapkan
- 0 kecocokan; AGENTS.md melarang menyimpan data pribadi ke memori.

## Kriteria lolos
- 0 kecocokan.

## Catatan
- Rujukan: SPECS.md (NFR-07). Skenario negatif level sistem.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/SYS-06-N/` bila dijalankan di VPS.
