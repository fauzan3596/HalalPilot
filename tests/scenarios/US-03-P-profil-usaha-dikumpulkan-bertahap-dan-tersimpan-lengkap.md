---
id: US-03-P
judul: Profil usaha dikumpulkan bertahap dan tersimpan lengkap
level: pengguna
tipe: positif
terkait: FR-03
prioritas: M
komponen: skill, routes/umk PATCH
otomasi: manual (Telegram + dashboard)
status: belum diuji
---

# US-03-P — Profil usaha dikumpulkan bertahap dan tersimpan lengkap

## Tujuan
Agent menanyakan satu–dua hal per giliran dan menyimpan setiap jawaban.

## Prasyarat
- Orchestrator berjalan (`npm run dev`), DB hasil `npm run migrate && npm run seed:demo`
- OpenClaw gateway aktif, agent `halalpilot`, skill termuat, Telegram allowlist berisi akun uji
- UMK baru status intake

## Data uji
- NIB 1309170000999, KBLI 10710, alamat 'Jl. Kenanga 5, Sleman', omzet 240 juta, 1 lokasi, 1 outlet, manual, tidak ada produksi non-halal, penyelia 'Ratih'

## Langkah
1. Jawab setiap pertanyaan agent satu per satu.
2. Setelah agent merangkum, periksa baris umk.

## Hasil yang diharapkan
- Semua kolom profil terisi sesuai jawaban; omzet tersimpan sebagai integer 240000000.
- Agent merangkum kembali profil sebelum meminta produk.
- Tidak lebih dari 2 pertanyaan per pesan agent.

## Kriteria lolos
- 9 kolom terisi.
- ≥ 1 pesan rangkuman.

## Catatan
- Rujukan: SPECS.md (FR-03). Skenario positif level pengguna.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/US-03-P/` bila dijalankan di VPS.
