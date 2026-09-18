---
id: US-19-N2
judul: UMK lain mencoba menghapus UMK-017 → 403
level: pengguna
tipe: negatif
terkait: FR-19
prioritas: M
komponen: routes/umk otorisasi
otomasi: semi-otomatis (skrip + manual)
status: belum diuji
---

# US-19-N2 — UMK lain mencoba menghapus UMK-017 → 403

## Tujuan
Hapus data hanya oleh pemilik (atau pendamping atas permintaan tercatat).

## Prasyarat
- Orchestrator berjalan (`npm run dev`), DB hasil `npm run migrate && npm run seed:demo`
- OpenClaw gateway aktif, agent `halalpilot`, skill termuat, Telegram allowlist berisi akun uji
- UMK-042 'Sambal Mak Ijah' (seed), akun Telegram TG_UMK_2

## Data uji
- Dari UMK-042: 'HAPUS UMK-017'
- curl DELETE /umk/17 dengan X-Actor umk:TG_UMK_2

## Langkah
1. Kirim pesan; curl.

## Hasil yang diharapkan
- 403 forbidden_role; agent menolak dengan sopan.
- UMK-017 utuh; event_log DELETE_DENIED.

## Kriteria lolos
- Data UMK-017 utuh.

## Catatan
- Rujukan: SPECS.md (FR-19). Skenario negatif level pengguna.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/US-19-N2/` bila dijalankan di VPS.
