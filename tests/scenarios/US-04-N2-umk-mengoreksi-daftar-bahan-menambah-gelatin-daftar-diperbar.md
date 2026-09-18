---
id: US-04-N2
judul: UMK mengoreksi daftar bahan (menambah 'gelatin') → daftar diperbarui, bukan ditimpa diam-diam
level: pengguna
tipe: negatif
terkait: FR-04, FR-05
prioritas: M
komponen: skill, routes/ingredients
otomasi: manual (Telegram + dashboard)
status: belum diuji
---

# US-04-N2 — UMK mengoreksi daftar bahan (menambah 'gelatin') → daftar diperbarui, bukan ditimpa diam-diam

## Tujuan
Koreksi UMK menjadi sumber kebenaran dan mengubah klasifikasi.

## Prasyarat
- Orchestrator berjalan (`npm run dev`), DB hasil `npm run migrate && npm run seed:demo`
- OpenClaw gateway aktif, agent `halalpilot`, skill termuat, Telegram allowlist berisi akun uji
- UMK-017 'Dapur Bu Ratih' (seed), akun Telegram TG_UMK_1
- Daftar bahan hasil vision sudah ditampilkan, belum dikonfirmasi

## Data uji
- Balasan UMK: 'kurang, ada gelatin juga'

## Langkah
1. Balas koreksi.
2. Baca daftar baru yang ditampilkan agent.
3. Balas 'benar'.

## Hasil yang diharapkan
- Daftar baru berisi 7 bahan termasuk gelatin (kelas kritis).
- sumber=umk_koreksi, dikonfirmasi_umk=1 untuk semua.
- Evaluasi berikutnya meminta SERT_PEMASOK:gelatin.

## Kriteria lolos
- ingredient gelatin kelas=kritis.
- dokumen_diminta memuat gelatin.

## Catatan
- Rujukan: SPECS.md (FR-04, FR-05). Skenario negatif level pengguna.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/US-04-N2/` bila dijalankan di VPS.
