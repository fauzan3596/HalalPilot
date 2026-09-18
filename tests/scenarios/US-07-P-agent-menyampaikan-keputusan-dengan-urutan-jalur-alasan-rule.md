---
id: US-07-P
judul: Agent menyampaikan keputusan dengan urutan jalur → alasan (rule_id) → dokumen → langkah berikutnya
level: pengguna
tipe: positif
terkait: FR-07
prioritas: M
komponen: SKILL.md, AGENTS.md
otomasi: manual (Telegram + dashboard)
status: belum diuji
---

# US-07-P — Agent menyampaikan keputusan dengan urutan jalur → alasan (rule_id) → dokumen → langkah berikutnya

## Tujuan
Format penyampaian konsisten dan merujuk aturan.

## Prasyarat
- Orchestrator berjalan (`npm run dev`), DB hasil `npm run migrate && npm run seed:demo`
- OpenClaw gateway aktif, agent `halalpilot`, skill termuat, Telegram allowlist berisi akun uji
- UMK-017 'Dapur Bu Ratih' (seed), akun Telegram TG_UMK_1
- Evaluasi US-06-P selesai

## Data uji
- Hasil evaluasi KURANG_DOKUMEN E11

## Langkah
1. Baca pesan keputusan agent di Telegram UMK-017.

## Hasil yang diharapkan
- Kalimat pertama menyebut jalur dalam bahasa awam ('layak self-declare, dokumen belum lengkap').
- Alasan menyebut '(E11)' dan nama bahan.
- Dokumen yang diminta disebut eksplisit.
- Langkah berikutnya konkret ('kirim foto sertifikat halal pemasok margarin').
- Menyebut hari tersisa ke 17 Oktober.

## Kriteria lolos
- 5/5 unsur hadir.
- Tidak ada janji 'pasti lolos'.

## Catatan
- Rujukan: SPECS.md (FR-07). Skenario positif level pengguna.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/US-07-P/` bila dijalankan di VPS.
