---
id: US-14-N
judul: Membuat dossier saat jalur masih KURANG_DOKUMEN → 409 dan agent menjelaskan
level: pengguna
tipe: negatif
terkait: FR-14
prioritas: M
komponen: routes/dossier
otomasi: semi-otomatis (skrip + manual)
status: belum diuji
---

# US-14-N — Membuat dossier saat jalur masih KURANG_DOKUMEN → 409 dan agent menjelaskan

## Tujuan
Dossier tidak dapat dibuat untuk berkas yang belum siap.

## Prasyarat
- Orchestrator berjalan (`npm run dev`), DB hasil `npm run migrate && npm run seed:demo`
- OpenClaw gateway aktif, agent `halalpilot`, skill termuat, Telegram allowlist berisi akun uji
- UMK-088 'Bakso Pak Darto' (seed), akun Telegram TG_UMK_3

## Data uji
- UMK-088 KURANG_DOKUMEN

## Langkah
1. `POST /umk/{id}/dossier` via curl.
2. Uji manual: UMK-088 minta 'buatkan berkasnya sekarang'.

## Hasil yang diharapkan
- HTTP 409 `conflict_state` dengan daftar dokumen yang masih kurang.
- Agent menjelaskan dokumen apa yang harus dilengkapi dulu; tidak ada PDF baru.

## Kriteria lolos
- COUNT dossier UMK-088 = 0.

## Catatan
- Rujukan: SPECS.md (FR-14). Skenario negatif level pengguna.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/US-14-N/` bila dijalankan di VPS.
