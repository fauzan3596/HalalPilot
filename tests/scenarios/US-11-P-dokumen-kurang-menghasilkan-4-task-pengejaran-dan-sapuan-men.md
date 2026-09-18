---
id: US-11-P
judul: Dokumen kurang menghasilkan 4 task pengejaran dan sapuan mengirim tahap 1 lewat hooks
level: pengguna
tipe: positif
terkait: FR-11
prioritas: M
komponen: scheduler/chase, hooks-client
otomasi: semi-otomatis (skrip + manual)
status: belum diuji
---

# US-11-P — Dokumen kurang menghasilkan 4 task pengejaran dan sapuan mengirim tahap 1 lewat hooks

## Tujuan
Pengejaran otomatis berjalan dengan idempotency key dan agent mengirim pesan ke UMK.

## Prasyarat
- Orchestrator berjalan (`npm run dev`), DB hasil `npm run migrate && npm run seed:demo`
- OpenClaw gateway aktif, agent `halalpilot`, skill termuat, Telegram allowlist berisi akun uji
- UMK-017 'Dapur Bu Ratih' (seed), akun Telegram TG_UMK_1
- Keputusan KURANG_DOKUMEN E11
- Waktu uji di luar jam tenang (07:00–21:00 WIB)

## Data uji
- chase_task tahap 1 due_at dimundurkan ke masa lalu untuk uji (`UPDATE chase_task SET due_at=datetime('now','-1 minute')`)

## Langkah
1. Periksa 4 baris chase_task untuk SERT_PEMASOK:margarin (tahap 1–4, idempotency_key unik).
2. `POST /chase/sweep`.
3. Amati Telegram UMK-017 dan DB.

## Hasil yang diharapkan
- Respons sweep `dispatched=1`.
- Hook dipanggil dengan Idempotency-Key = chase:<umk>:SERT_PEMASOK:margarin:1.
- UMK-017 menerima pengingat ramah menyebut margarin.
- Task tahap 1 → terkirim, sent_at terisi; event_log CHASE_SENT.

## Kriteria lolos
- Tepat 1 pesan.
- Isi sesuai template nada 'ramah' (tanpa janji).

## Catatan
- Rujukan: SPECS.md (FR-11). Skenario positif level pengguna.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/US-11-P/` bila dijalankan di VPS.
