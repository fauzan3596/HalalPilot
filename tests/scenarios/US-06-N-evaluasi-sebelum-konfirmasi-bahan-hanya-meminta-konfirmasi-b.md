---
id: US-06-N
judul: Evaluasi sebelum konfirmasi bahan hanya meminta KONFIRMASI_BAHAN, tidak memutuskan siap
level: pengguna
tipe: negatif
terkait: FR-06, FR-04
prioritas: M
komponen: rules/engine E14
otomasi: otomatis (node:test)
status: belum diuji
---

# US-06-N — Evaluasi sebelum konfirmasi bahan hanya meminta KONFIRMASI_BAHAN, tidak memutuskan siap

## Tujuan
E14 mencegah keputusan atas daftar bahan yang belum dibenarkan UMK.

## Prasyarat
- Orchestrator berjalan (`npm run dev`), DB hasil `npm run migrate && npm run seed:demo`
- OpenClaw gateway aktif, agent `halalpilot`, skill termuat, Telegram allowlist berisi akun uji
- UMK dengan bahan dikonfirmasi_umk=0

## Data uji
- Bahan: cabai, garam (semua aman) tetapi belum dikonfirmasi

## Langkah
1. `POST /umk/{id}/evaluate`.

## Hasil yang diharapkan
- jalur=SELF_DECLARE_KURANG_DOKUMEN; alasan memuat E14; dokumen_diminta memuat KONFIRMASI_BAHAN.
- Tidak pernah SELF_DECLARE_SIAP selama ada bahan belum dikonfirmasi.

## Kriteria lolos
- Test hijau.

## Catatan
- Rujukan: SPECS.md (FR-06, FR-04). Skenario negatif level pengguna.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/US-06-N/` bila dijalankan di VPS.
