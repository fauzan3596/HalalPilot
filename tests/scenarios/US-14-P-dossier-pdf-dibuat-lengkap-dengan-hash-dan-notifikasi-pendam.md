---
id: US-14-P
judul: Dossier PDF dibuat lengkap dengan hash dan notifikasi pendamping
level: pengguna
tipe: positif
terkait: FR-14
prioritas: M
komponen: dossier/builder
otomasi: semi-otomatis (skrip + manual)
status: belum diuji
---

# US-14-P — Dossier PDF dibuat lengkap dengan hash dan notifikasi pendamping

## Tujuan
PDF berisi 10 bagian sesuai SPECS §7.8 dan tercatat.

## Prasyarat
- Orchestrator berjalan (`npm run dev`), DB hasil `npm run migrate && npm run seed:demo`
- OpenClaw gateway aktif, agent `halalpilot`, skill termuat, Telegram allowlist berisi akun uji
- UMK-017 'Dapur Bu Ratih' (seed), akun Telegram TG_UMK_1
- Keputusan SELF_DECLARE_SIAP

## Data uji
- —

## Langkah
1. `POST /umk/{id}/dossier`.
2. Buka PDF; hitung sha256 file; bandingkan dengan DB.
3. Cek Telegram pendamping.

## Hasil yang diharapkan
- PDF ada di PDF_DIR; sampul memuat koperasi, UMK, versi 1, tanggal, hash.
- Bagian: pernyataan, ikrar, penyelia, daftar bahan+kelas+rule_id+status sertifikat, alur proses, foto, draf Manual SJPH 5 kriteria, ringkasan alasan + rules_version, catatan 'bukan sertifikat'.
- sha256 file = dossier.sha256; dossier.status=menunggu_review; umk.status=siap_review.
- Pendamping menerima notifikasi dengan skor dan tautan dashboard.

## Kriteria lolos
- 10/10 bagian.
- Hash cocok.

## Catatan
- Rujukan: SPECS.md (FR-14). Skenario positif level pengguna.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/US-14-P/` bila dijalankan di VPS.
