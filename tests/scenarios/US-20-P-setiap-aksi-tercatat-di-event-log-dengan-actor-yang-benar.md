---
id: US-20-P
judul: Setiap aksi tercatat di event_log dengan actor yang benar
level: pengguna
tipe: positif
terkait: FR-20, NFR-09
prioritas: M
komponen: audit
otomasi: semi-otomatis (skrip + manual)
status: belum diuji
---

# US-20-P — Setiap aksi tercatat di event_log dengan actor yang benar

## Tujuan
Audit trail lengkap untuk tab Audit dan video.

## Prasyarat
- Jalankan alur US-04-P, US-06-P, US-11-P, US-14-P, US-15-P

## Data uji
- —

## Langkah
1. `GET /events?since=<awal uji>`.

## Hasil yang diharapkan
- Ada aksi INTAKE/EXTRACT, EVALUATE, CHASE_SENT, DOSSIER_BUILT, APPROVE dengan actor agent / umk:<id> / pendamping:<id> / scheduler.
- Setiap aksi merujuk umk_id dan detail berisi kode/hash/status saja.

## Kriteria lolos
- ≥ 5 jenis aksi.
- Tidak ada actor kosong.

## Catatan
- Rujukan: SPECS.md (FR-20, NFR-09). Skenario positif level pengguna.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/US-20-P/` bila dijalankan di VPS.
