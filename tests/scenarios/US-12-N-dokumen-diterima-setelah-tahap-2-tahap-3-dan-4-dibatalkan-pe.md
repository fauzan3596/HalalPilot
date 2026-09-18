---
id: US-12-N
judul: Dokumen diterima setelah tahap 2 → tahap 3 dan 4 dibatalkan, pendamping tidak dieskalasi
level: pengguna
tipe: negatif
terkait: FR-12
prioritas: M
komponen: routes/documents, scheduler
otomasi: otomatis (node:test)
status: belum diuji
---

# US-12-N — Dokumen diterima setelah tahap 2 → tahap 3 dan 4 dibatalkan, pendamping tidak dieskalasi

## Tujuan
Pembatalan task saat dokumen masuk mencegah pengingat dan eskalasi yang tidak perlu.

## Prasyarat
- UMK uji, task tahap 1–2 terkirim, 3–4 terjadwal

## Data uji
- `PUT /umk/{id}/documents/SERT_PEMASOK:margarin` dengan media_id

## Langkah
1. Terima dokumen.
2. Mundurkan due_at tahap 3–4; sweep.

## Hasil yang diharapkan
- Task 3–4 status dibatalkan sebelum sweep.
- Sweep dispatched=0.
- Pendamping tidak menerima eskalasi.

## Kriteria lolos
- Test hijau.

## Catatan
- Rujukan: SPECS.md (FR-12). Skenario negatif level pengguna.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/US-12-N/` bila dijalankan di VPS.
