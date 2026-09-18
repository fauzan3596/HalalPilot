---
id: US-21-P
judul: API tidak merespons dua heartbeat berturut → agent melapor ke pendamping
level: pengguna
tipe: positif
terkait: FR-21
prioritas: S
komponen: HEARTBEAT.md, automations
otomasi: manual (Telegram + dashboard)
status: belum diuji
---

# US-21-P — API tidak merespons dua heartbeat berturut → agent melapor ke pendamping

## Tujuan
Pemantauan mandiri agent bekerja.

## Prasyarat
- heartbeat.every diset 2m untuk uji
- `systemctl stop halalpilot-api`

## Data uji
- —

## Langkah
1. Tunggu 2 heartbeat (≈ 4–5 menit).
2. Baca pesan pendamping; `systemctl start`.

## Hasil yang diharapkan
- Satu pesan 'Layanan HalalPilot tidak merespons sejak <waktu>'.
- MEMORY.md mencatat kegagalan.

## Kriteria lolos
- Tepat 1 pesan (tidak berulang tiap heartbeat).

## Catatan
- Rujukan: SPECS.md (FR-21). Skenario positif level pengguna.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/US-21-P/` bila dijalankan di VPS.
