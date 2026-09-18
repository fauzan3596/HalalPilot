---
id: US-01-N
judul: Pengirim tidak terdaftar hanya dapat mendaftar, tidak dapat melihat data
level: pengguna
tipe: negatif
terkait: FR-01
prioritas: M
komponen: skill, routes/whoami
otomasi: manual (Telegram + dashboard)
status: belum diuji
---

# US-01-N — Pengirim tidak terdaftar hanya dapat mendaftar, tidak dapat melihat data

## Tujuan
Memastikan akun yang ada di allowlist Telegram tetapi belum terdaftar di DB tidak bisa memicu aksi selain pendaftaran.

## Prasyarat
- Orchestrator berjalan (`npm run dev`), DB hasil `npm run migrate && npm run seed:demo`
- OpenClaw gateway aktif, agent `halalpilot`, skill termuat, Telegram allowlist berisi akun uji
- Akun Telegram TG_BARU ada di allowlist gateway, belum ada di tabel actor

## Data uji
- TG_BARU = ID numerik fiktif

## Langkah
1. Dari TG_BARU kirim 'status UMK-017'.
2. Kirim 'setuju UMK-017'.
3. Kirim 'halo'.

## Hasil yang diharapkan
- Tiga pesan pertama dijawab dengan tawaran mendaftar (nama usaha + persetujuan data); tidak ada angka atau status UMK apa pun.
- `whoami` mengembalikan `tidak_terdaftar`; tidak ada panggilan review/portfolio di log.
- event_log tidak bertambah selain `WHOAMI_UNREGISTERED` (opsional).

## Kriteria lolos
- 0 kebocoran data.
- Tidak ada 403 dari API karena agent tidak mencoba aksi.

## Catatan
- Rujukan: SPECS.md (FR-01). Skenario negatif level pengguna.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/US-01-N/` bila dijalankan di VPS.
