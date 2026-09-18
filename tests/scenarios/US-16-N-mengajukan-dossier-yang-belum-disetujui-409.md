---
id: US-16-N
judul: Mengajukan dossier yang belum disetujui → 409
level: pengguna
tipe: negatif
terkait: FR-16
prioritas: S
komponen: mocks/sihalal
otomasi: semi-otomatis (skrip + manual)
status: belum diuji
---

# US-16-N — Mengajukan dossier yang belum disetujui → 409

## Tujuan
Simulasi pengajuan tidak melompati review.

## Prasyarat
- Orchestrator berjalan (`npm run dev`), DB hasil `npm run migrate && npm run seed:demo`
- OpenClaw gateway aktif, agent `halalpilot`, skill termuat, Telegram allowlist berisi akun uji
- Dossier UMK-042 menunggu_review

## Data uji
- 'ajukan UMK-042'

## Langkah
1. Kirim dari pendamping / curl.

## Hasil yang diharapkan
- 409 conflict_state; agent menjelaskan harus disetujui dulu.

## Kriteria lolos
- Tidak ada submission_mock baru.

## Catatan
- Rujukan: SPECS.md (FR-16). Skenario negatif level pengguna.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/US-16-N/` bila dijalankan di VPS.
