---
id: SYS-01-N
judul: Tekanan memori → orchestrator dibatasi MemoryMax dan restart, gateway tetap hidup
level: sistem
tipe: negatif
terkait: NFR-01, NFR-04
prioritas: S
komponen: systemd
otomasi: semi-otomatis (skrip + manual)
status: belum diuji
---

# SYS-01-N — Tekanan memori → orchestrator dibatasi MemoryMax dan restart, gateway tetap hidup

## Tujuan
Kegagalan memori terisolasi ke satu unit.

## Prasyarat
- VPS Batch 2 aktif; semua unit hidup (openclaw, halalpilot-api)

## Data uji
- Skrip uji mengalokasikan 700 MB di proses API (`node -e` via endpoint debug hanya di mode uji)

## Langkah
1. Picu alokasi.
2. `systemctl status halalpilot-api`, `openclaw gateway status`.

## Hasil yang diharapkan
- Unit API OOM-killed lalu restart ≤ 5 s; gateway tidak terpengaruh; Telegram tetap membalas 'halo'.
- /health kembali ok.

## Kriteria lolos
- Gateway uptime tidak reset.

## Catatan
- Rujukan: SPECS.md (NFR-01, NFR-04). Skenario negatif level sistem.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/SYS-01-N/` bila dijalankan di VPS.
