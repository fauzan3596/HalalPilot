---
id: US-15-N
judul: UMK mencoba menyetujui dossier sendiri → ditolak 403
level: pengguna
tipe: negatif
terkait: FR-15
prioritas: M
komponen: routes/review otorisasi
otomasi: semi-otomatis (skrip + manual)
status: belum diuji
---

# US-15-N — UMK mencoba menyetujui dossier sendiri → ditolak 403

## Tujuan
Hanya pendamping koperasi yang dapat menyetujui.

## Prasyarat
- Orchestrator berjalan (`npm run dev`), DB hasil `npm run migrate && npm run seed:demo`
- OpenClaw gateway aktif, agent `halalpilot`, skill termuat, Telegram allowlist berisi akun uji
- UMK-017 'Dapur Bu Ratih' (seed), akun Telegram TG_UMK_1
- Dossier UMK-017 menunggu_review

## Data uji
- Pesan dari UMK-017: 'setuju UMK-017'
- curl review dengan pendamping_telegram_id = TG_UMK_1

## Langkah
1. Kirim pesan dari UMK-017.
2. curl langsung.

## Hasil yang diharapkan
- API 403 `forbidden_role`.
- Agent menjelaskan hanya pendamping yang bisa menyetujui.
- Status tidak berubah; event_log `REVIEW_DENIED`.

## Kriteria lolos
- dossier.status tetap menunggu_review.

## Catatan
- Rujukan: SPECS.md (FR-15). Skenario negatif level pengguna.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/US-15-N/` bila dijalankan di VPS.
