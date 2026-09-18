---
id: US-12-P
judul: Tahap 4 mengeskalasi ke pendamping dan muncul di eskalasi terbuka
level: pengguna
tipe: positif
terkait: FR-12
prioritas: M
komponen: scheduler, portfolio
otomasi: semi-otomatis (skrip + manual)
status: belum diuji
---

# US-12-P — Tahap 4 mengeskalasi ke pendamping dan muncul di eskalasi terbuka

## Tujuan
Setelah 3 pengingat tanpa hasil, pendamping diberi tahu dan eskalasi terlihat di ringkasan.

## Prasyarat
- Orchestrator berjalan (`npm run dev`), DB hasil `npm run migrate && npm run seed:demo`
- OpenClaw gateway aktif, agent `halalpilot`, skill termuat, Telegram allowlist berisi akun uji
- UMK-088 'Bakso Pak Darto' (seed), akun Telegram TG_UMK_3
- Pendamping koperasi (seed), akun Telegram TG_PENDAMPING
- Task tahap 1–3 sudah terkirim

## Data uji
- Task tahap 4 due_at dimundurkan

## Langkah
1. Sweep.
2. Baca Telegram pendamping dan `GET /portfolio/1/summary`.

## Hasil yang diharapkan
- Pendamping menerima pesan eskalasi menyebut UMK-088, dokumen, skor, saran tindakan.
- summary.eskalasi_terbuka memuat UMK-088.
- Dashboard menampilkan badge eskalasi.

## Kriteria lolos
- 1 pesan ke pendamping, 0 ke UMK pada tahap 4.

## Catatan
- Rujukan: SPECS.md (FR-12). Skenario positif level pengguna.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/US-12-P/` bila dijalankan di VPS.
