---
id: SYS-04-N
judul: Hook /hooks/agent dipanggil dua kali dengan key sama → satu pesan Telegram
level: sistem
tipe: negatif
terkait: NFR-05
prioritas: M
komponen: hooks-client, OpenClaw hooks
otomasi: semi-otomatis (skrip + manual)
status: belum diuji
---

# SYS-04-N — Hook /hooks/agent dipanggil dua kali dengan key sama → satu pesan Telegram

## Tujuan
Idempotency di batas OpenClaw juga bekerja.

## Prasyarat
- VPS Batch 2 aktif; semua unit hidup (openclaw, halalpilot-api)

## Data uji
- Payload [CHASE] uji dengan Idempotency-Key 'test-hook-1'

## Langkah
1. curl hooks 2× dalam 5 s.
2. Hitung pesan di Telegram UMK uji.

## Hasil yang diharapkan
- 1 pesan (OpenClaw menolak/menyatukan duplikat) — jika OpenClaw mengirim 2, catat sebagai keterbatasan dan pastikan sweep tidak pernah memanggil 2× (US-11-N).

## Kriteria lolos
- Perilaku terdokumentasi di docs/h1-evidence/hooks-idem.txt.

## Catatan
- Rujukan: SPECS.md (NFR-05). Skenario negatif level sistem.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/SYS-04-N/` bila dijalankan di VPS.
