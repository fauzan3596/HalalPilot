---
id: SYS-03-P
judul: Automations berjalan 72 jam tanpa intervensi, 0 run terlewat
level: sistem
tipe: positif
terkait: NFR-04
prioritas: M
komponen: OpenClaw automations
otomasi: semi-otomatis (skrip + manual)
status: belum diuji
---

# SYS-03-P — Automations berjalan 72 jam tanpa intervensi, 0 run terlewat

## Tujuan
Bukti otonomi untuk video dan artikel.

## Prasyarat
- VPS Batch 2 aktif; semua unit hidup (openclaw, halalpilot-api)
- automations.sh dijalankan H1

## Data uji
- —

## Langkah
1. H1–H4: tiap hari `openclaw automations list` dan event_log SWEEP/DIGEST.
2. Bandingkan jumlah run yang diharapkan (digest 1/hari, sweep 2/hari, kuota 4/hari).

## Hasil yang diharapkan
- Semua run tercatat; tidak ada gap.
- Bukti disimpan docs/h1-evidence/automations-<hari>.txt.

## Kriteria lolos
- 0 run terlewat.

## Catatan
- Rujukan: SPECS.md (NFR-04). Skenario positif level sistem.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/SYS-03-P/` bila dijalankan di VPS.
