---
id: SYS-14-P
judul: OpenClaw hooks tidak dapat dihubungi → retry 3× lalu task tetap terjadwal, /health menandai
level: sistem
tipe: positif
terkait: NFR-04
prioritas: M
komponen: hooks-client
otomasi: otomatis (node:test)
status: belum diuji
---

# SYS-14-P — OpenClaw hooks tidak dapat dihubungi → retry 3× lalu task tetap terjadwal, /health menandai

## Tujuan
Kegagalan pengiriman tidak menghilangkan pengejaran.

## Prasyarat
- OPENCLAW_HOOKS_URL diarahkan ke port mati

## Data uji
- Task tahap 1 jatuh tempo

## Langkah
1. Sweep.
2. Cek task, event_log, /health.

## Hasil yang diharapkan
- 3 percobaan (backoff 2/4/8 s) lalu menyerah; task tetap terjadwal (bukan terkirim); event_log HOOK_FAILED; /health memuat `hooks_last_error`.
- Sweep berikutnya (setelah hooks pulih) mengirimnya.

## Kriteria lolos
- Test hijau dengan server hooks palsu yang menolak lalu menerima.

## Catatan
- Rujukan: SPECS.md (NFR-04). Skenario positif level sistem.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/SYS-14-P/` bila dijalankan di VPS.
