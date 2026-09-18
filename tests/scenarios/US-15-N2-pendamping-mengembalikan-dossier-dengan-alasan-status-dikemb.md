---
id: US-15-N2
judul: Pendamping mengembalikan dossier dengan alasan → status dikembalikan dan UMK dikejar dengan catatan
level: pengguna
tipe: negatif
terkait: FR-15, FR-11
prioritas: M
komponen: routes/review, scheduler
otomasi: manual (Telegram + dashboard)
status: belum diuji
---

# US-15-N2 — Pendamping mengembalikan dossier dengan alasan → status dikembalikan dan UMK dikejar dengan catatan

## Tujuan
Pengembalian menciptakan loop perbaikan yang otomatis.

## Prasyarat
- Orchestrator berjalan (`npm run dev`), DB hasil `npm run migrate && npm run seed:demo`
- OpenClaw gateway aktif, agent `halalpilot`, skill termuat, Telegram allowlist berisi akun uji
- Pendamping koperasi (seed), akun Telegram TG_PENDAMPING
- Dossier UMK-017 menunggu_review

## Data uji
- Pesan: 'kembalikan UMK-017 foto label buram, ulangi'

## Langkah
1. Kirim dari pendamping.
2. Amati Telegram UMK-017 dan DB.

## Hasil yang diharapkan
- dossier.status=dikembalikan, catatan_pendamping tersimpan; umk.status=dikembalikan.
- document_req FOTO_PRODUK (atau label) diminta ulang; chase_task baru dibuat.
- UMK-017 menerima pesan berisi catatan pendamping dan permintaan foto ulang.

## Kriteria lolos
- Catatan sampai ke UMK verbatim.
- chase_task baru ada.

## Catatan
- Rujukan: SPECS.md (FR-15, FR-11). Skenario negatif level pengguna.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/US-15-N2/` bila dijalankan di VPS.
