---
id: US-06-P
judul: Evaluasi Nastar menghasilkan jalur, skor, alasan, dokumen dengan rules_version
level: pengguna
tipe: positif
terkait: FR-06, NFR-09
prioritas: M
komponen: rules/engine, routes/evaluate
otomasi: otomatis (node:test)
status: belum diuji
---

# US-06-P — Evaluasi Nastar menghasilkan jalur, skor, alasan, dokumen dengan rules_version

## Tujuan
Keputusan lengkap dan tersimpan append-only.

## Prasyarat
- Orchestrator berjalan (`npm run dev`), DB hasil `npm run migrate && npm run seed:demo`
- OpenClaw gateway aktif, agent `halalpilot`, skill termuat, Telegram allowlist berisi akun uji
- UMK-017 'Dapur Bu Ratih' (seed), akun Telegram TG_UMK_1
- Bahan dikonfirmasi, tanpa sertifikat margarin

## Data uji
- Profil UMK-017 valid, OSS cocok

## Langkah
1. `POST /umk/{id}/evaluate` dua kali dengan Idempotency-Key berbeda.
2. Baca tabel decision.

## Hasil yang diharapkan
- jalur=SELF_DECLARE_KURANG_DOKUMEN, skor 80, alasan memuat E11 butuh_dokumen dan rule lain lolos, dokumen_diminta memuat SERT_PEMASOK:margarin.
- Dua baris decision (append-only) dengan rules_version sama.
- document_req berisi 'SERT_PEMASOK:margarin' status kurang→diminta.

## Kriteria lolos
- Field lengkap (jalur, skor, alasan[], dokumen_diminta[], rules_version).
- COUNT decision bertambah 2.

## Catatan
- Rujukan: SPECS.md (FR-06, NFR-09). Skenario positif level pengguna.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/US-06-P/` bila dijalankan di VPS.
