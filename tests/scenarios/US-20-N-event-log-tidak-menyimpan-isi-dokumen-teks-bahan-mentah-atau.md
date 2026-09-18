---
id: US-20-N
judul: event_log tidak menyimpan isi dokumen, teks bahan mentah, atau data pribadi
level: pengguna
tipe: negatif
terkait: FR-20, NFR-07
prioritas: M
komponen: audit
otomasi: semi-otomatis (skrip + manual)
status: belum diuji
---

# US-20-N — event_log tidak menyimpan isi dokumen, teks bahan mentah, atau data pribadi

## Tujuan
Log aman untuk ditampilkan di dashboard dan video.

## Prasyarat
- event_log terisi dari alur lengkap

## Data uji
- Pola grep: NIK 16 digit, nomor HP 08xx, 'base64', nama pemasok pribadi

## Langkah
1. `SELECT detail_json FROM event_log` → grep pola.

## Hasil yang diharapkan
- 0 kecocokan.
- detail_json hanya berisi kode dokumen, id, hash, status, rule_id.

## Kriteria lolos
- 0 kecocokan pola.

## Catatan
- Rujukan: SPECS.md (FR-20, NFR-07). Skenario negatif level pengguna.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/US-20-N/` bila dijalankan di VPS.
