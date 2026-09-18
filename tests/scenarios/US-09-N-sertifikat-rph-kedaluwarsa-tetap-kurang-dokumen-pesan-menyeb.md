---
id: US-09-N
judul: Sertifikat RPH kedaluwarsa → tetap kurang dokumen, pesan menyebut kedaluwarsa
level: pengguna
tipe: negatif
terkait: FR-09, FR-10
prioritas: M
komponen: mocks/registry, rules/engine
otomasi: otomatis (node:test)
status: belum diuji
---

# US-09-N — Sertifikat RPH kedaluwarsa → tetap kurang dokumen, pesan menyebut kedaluwarsa

## Tujuan
Sertifikat tidak valid tidak memenuhi E09.

## Prasyarat
- Registry: 'RPH Sumber Rejeki' ID00410000998870124 kedaluwarsa 2026-01-31

## Data uji
- UMK-088 mendaftarkan sertifikat tersebut untuk daging_sapi

## Langkah
1. `POST /umk/{id}/supplier-certs` dengan nomor itu.
2. Evaluate.

## Hasil yang diharapkan
- supplier_cert.status=kedaluwarsa.
- E09 masih butuh_dokumen; pesan_umk menyebut 'kedaluwarsa' dan meminta sertifikat berlaku.
- Tidak ada perubahan ke SIAP.

## Kriteria lolos
- status=kedaluwarsa.
- jalur tetap KURANG_DOKUMEN.

## Catatan
- Rujukan: SPECS.md (FR-09, FR-10). Skenario negatif level pengguna.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/US-09-N/` bila dijalankan di VPS.
