---
id: US-17-N
judul: API mati saat digest → agent melaporkan gangguan, tidak mengarang angka
level: pengguna
tipe: negatif
terkait: FR-17, FR-21
prioritas: M
komponen: skill, automations
otomasi: manual (Telegram + dashboard)
status: belum diuji
---

# US-17-N — API mati saat digest → agent melaporkan gangguan, tidak mengarang angka

## Tujuan
Agent tidak berhalusinasi saat sumber data tidak tersedia.

## Prasyarat
- `systemctl stop halalpilot-api`

## Data uji
- —

## Langkah
1. `openclaw automations run 'HalalPilot digest pagi'`.
2. Baca pesan pendamping.
3. `systemctl start halalpilot-api`.

## Hasil yang diharapkan
- Pesan menyatakan layanan HalalPilot tidak merespons (waktu), tanpa angka portofolio.
- Tidak ada angka yang dikarang.

## Kriteria lolos
- 0 angka portofolio dalam pesan.

## Catatan
- Rujukan: SPECS.md (FR-17, FR-21). Skenario negatif level pengguna.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/US-17-N/` bila dijalankan di VPS.
