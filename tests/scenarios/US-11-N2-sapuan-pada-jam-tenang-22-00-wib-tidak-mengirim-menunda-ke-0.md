---
id: US-11-N2
judul: Sapuan pada jam tenang (22:00 WIB) tidak mengirim, menunda ke 07:05
level: pengguna
tipe: negatif
terkait: FR-11
prioritas: M
komponen: scheduler jam tenang
otomasi: otomatis (node:test)
status: belum diuji
---

# US-11-N2 — Sapuan pada jam tenang (22:00 WIB) tidak mengirim, menunda ke 07:05

## Tujuan
Kebijakan jam tenang dihormati.

## Prasyarat
- Unit test dengan clock injeksi 22:00 Asia/Jakarta

## Data uji
- Task due_at 21:30

## Langkah
1. Panggil fungsi sweep dengan now=22:00.
2. Periksa hasil dan due_at.

## Hasil yang diharapkan
- dispatched=0, skipped_quiet_hours=1.
- due_at task diubah ke 07:05 hari berikutnya.
- Tidak ada panggilan hooks.

## Kriteria lolos
- Test hijau.

## Catatan
- Rujukan: SPECS.md (FR-11). Skenario negatif level pengguna.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/US-11-N2/` bila dijalankan di VPS.
