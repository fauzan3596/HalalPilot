---
id: US-16-N2
judul: Simulasi mengembalikan pengajuan → status ditolak_simulasi dan kembali ke menunggu dokumen dengan alasan
level: pengguna
tipe: negatif
terkait: FR-16
prioritas: S
komponen: mocks/sihalal, scheduler
otomasi: semi-otomatis (skrip + manual)
status: belum diuji
---

# US-16-N2 — Simulasi mengembalikan pengajuan → status ditolak_simulasi dan kembali ke menunggu dokumen dengan alasan

## Tujuan
Alur penolakan portal ditangani sebagai loop perbaikan.

## Prasyarat
- Mock dipaksa mengembalikan (seed flag `force_return=true` untuk UMK uji)

## Data uji
- Alasan mock: 'nama penyelia tidak diisi'

## Langkah
1. Ajukan.
2. Amati status dan pesan ke UMK.

## Hasil yang diharapkan
- umk.status=ditolak_simulasi → menunggu_dokumen; document_req PENYELIA diminta; chase dibuat.
- UMK menerima penjelasan alasan dan langkah perbaikan; pendamping diberi tahu.

## Kriteria lolos
- Alasan mock muncul di pesan UMK.

## Catatan
- Rujukan: SPECS.md (FR-16). Skenario negatif level pengguna.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/US-16-N2/` bila dijalankan di VPS.
