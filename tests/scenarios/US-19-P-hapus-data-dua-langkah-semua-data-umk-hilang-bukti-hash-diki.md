---
id: US-19-P
judul: Hapus data dua langkah → semua data UMK hilang, bukti hash dikirim
level: pengguna
tipe: positif
terkait: FR-19, NFR-07
prioritas: M
komponen: skill, routes/umk DELETE
otomasi: manual (Telegram + dashboard)
status: belum diuji
---

# US-19-P — Hapus data dua langkah → semua data UMK hilang, bukti hash dikirim

## Tujuan
Hak hapus subjek data berjalan lengkap dan terbukti.

## Prasyarat
- Orchestrator berjalan (`npm run dev`), DB hasil `npm run migrate && npm run seed:demo`
- OpenClaw gateway aktif, agent `halalpilot`, skill termuat, Telegram allowlist berisi akun uji
- UMK uji 'Tahu Pak Min' dengan produk, bahan, dokumen, dossier, chase_task

## Data uji
- Pesan: 'hapus data saya' → 'ya' → 'HAPUS UMK-120'

## Langkah
1. Kirim tiga pesan berurutan.
2. Query semua tabel untuk umk_id tersebut; cek PDF_DIR.

## Hasil yang diharapkan
- Setelah pesan ke-3: 0 baris di umk, product, ingredient, media, document_req, decision, chase_task, dossier, supplier_cert untuk UMK itu; file PDF dihapus.
- event_log berisi satu baris DATA_DELETED dengan hash (tanpa isi).
- Agent mengirim hash dan konfirmasi; waktu ≤ 1 menit.

## Kriteria lolos
- Cascade lengkap.
- Hash di pesan = hash di event_log.

## Catatan
- Rujukan: SPECS.md (FR-19, NFR-07). Skenario positif level pengguna.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/US-19-P/` bila dijalankan di VPS.
