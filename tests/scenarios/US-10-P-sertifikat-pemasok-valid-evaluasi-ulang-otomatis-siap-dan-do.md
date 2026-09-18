---
id: US-10-P
judul: Sertifikat pemasok valid → evaluasi ulang otomatis → SIAP dan dossier dibuat
level: pengguna
tipe: positif
terkait: FR-10, FR-14
prioritas: M
komponen: routes/supplier-certs, evaluate, dossier
otomasi: manual (Telegram + dashboard)
status: belum diuji
---

# US-10-P — Sertifikat pemasok valid → evaluasi ulang otomatis → SIAP dan dossier dibuat

## Tujuan
Rantai sertifikat → evaluasi → dossier berjalan tanpa perintah tambahan dari UMK.

## Prasyarat
- Orchestrator berjalan (`npm run dev`), DB hasil `npm run migrate && npm run seed:demo`
- OpenClaw gateway aktif, agent `halalpilot`, skill termuat, Telegram allowlist berisi akun uji
- UMK-017 'Dapur Bu Ratih' (seed), akun Telegram TG_UMK_1
- Keputusan KURANG_DOKUMEN E11 (margarin); semua dokumen wajib lain diterima/dihasilkan

## Data uji
- Foto sertifikat 'PT Palmindo Lestari' ID00110000123450226 berlaku s.d. 2027-08-31

## Langkah
1. Kirim foto sertifikat dari UMK-017 dengan keterangan 'sertifikat margarin'.
2. Amati balasan dan DB.

## Hasil yang diharapkan
- supplier_cert status=valid; document_req SERT_PEMASOK:margarin=diterima; chase_task terkait dibatalkan.
- decision baru SELF_DECLARE_SIAP skor 100.
- dossier v1 dibuat (PDF ada, sha256 terisi), umk.status=siap_review.
- Pendamping menerima notifikasi via hooks.

## Kriteria lolos
- Semua dalam ≤ 60 detik sejak foto dikirim.
- Tidak ada perintah tambahan dari UMK.

## Catatan
- Rujukan: SPECS.md (FR-10, FR-14). Skenario positif level pengguna.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/US-10-P/` bila dijalankan di VPS.
