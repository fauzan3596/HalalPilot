---
id: US-04-P
judul: Foto label menjadi daftar bahan yang dikonfirmasi UMK sebelum evaluasi
level: pengguna
tipe: positif
terkait: FR-04, NFR-03
prioritas: M
komponen: imageModel, skill, routes/ingredients
otomasi: manual (Telegram + dashboard)
status: belum diuji
---

# US-04-P — Foto label menjadi daftar bahan yang dikonfirmasi UMK sebelum evaluasi

## Tujuan
Alur vision → daftar → konfirmasi berjalan dan evaluasi menunggu konfirmasi (E14).

## Prasyarat
- Orchestrator berjalan (`npm run dev`), DB hasil `npm run migrate && npm run seed:demo`
- OpenClaw gateway aktif, agent `halalpilot`, skill termuat, Telegram allowlist berisi akun uji
- UMK-017 'Dapur Bu Ratih' (seed), akun Telegram TG_UMK_1
- Produk 'Nastar' sudah dibuat
- imageModel terkonfigurasi (V1 lolos) atau fallback extract aktif

## Data uji
- Foto label komposisi Nastar: tepung terigu, margarin, telur, gula pasir, selai nanas, vanili

## Langkah
1. Kirim foto dari UMK-017.
2. Baca balasan agent (daftar bahan).
3. Balas 'benar'.
4. Periksa tabel ingredient dan waktu balasan.

## Hasil yang diharapkan
- Agent menulis 6 bahan yang terbaca dan bertanya konfirmasi.
- Sebelum 'benar': ingredient.dikonfirmasi_umk=0, tidak ada decision baru.
- Setelah 'benar': dikonfirmasi_umk=1, sumber=umk_koreksi, lalu evaluasi berjalan.
- Waktu foto → daftar ≤ 30 detik.

## Kriteria lolos
- 6 baris ingredient.
- decision pertama dibuat setelah konfirmasi.

## Catatan
- Rujukan: SPECS.md (FR-04, NFR-03). Skenario positif level pengguna.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/US-04-P/` bila dijalankan di VPS.
