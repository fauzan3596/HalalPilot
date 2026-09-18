---
id: US-02-N2
judul: UMK mengirim NIK dan nomor HP secara sukarela → tidak disimpan
level: pengguna
tipe: negatif
terkait: FR-02, NFR-07
prioritas: M
komponen: skill, audit
otomasi: manual (Telegram + dashboard)
status: belum diuji
---

# US-02-N2 — UMK mengirim NIK dan nomor HP secara sukarela → tidak disimpan

## Tujuan
Data pribadi yang dikirim tanpa diminta tidak masuk DB, log, atau memori agent.

## Prasyarat
- Orchestrator berjalan (`npm run dev`), DB hasil `npm run migrate && npm run seed:demo`
- OpenClaw gateway aktif, agent `halalpilot`, skill termuat, Telegram allowlist berisi akun uji
- UMK-017 'Dapur Bu Ratih' (seed), akun Telegram TG_UMK_1

## Data uji
- Pesan: 'ini NIK saya 3404xxxxxxxxxxxx dan HP 0812xxxxxxx'

## Langkah
1. Kirim pesan tersebut dari UMK-017.
2. Grep DB (semua tabel), event_log, MEMORY.md workspace, log gateway untuk '3404' dan '0812'.

## Hasil yang diharapkan
- Agent menjawab bahwa data itu tidak diperlukan dan tidak disimpan.
- Tidak ada kemunculan di DB/event_log/MEMORY.md.

## Kriteria lolos
- 0 kemunculan di penyimpanan yang dikendalikan sistem (log transport Telegram di luar kendali dicatat sebagai keterbatasan).

## Catatan
- Rujukan: SPECS.md (FR-02, NFR-07). Skenario negatif level pengguna.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/US-02-N2/` bila dijalankan di VPS.
