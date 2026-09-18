---
id: SYS-06-P
judul: Skema, log, PDF, dan prompt bebas data pribadi; hapus data ≤ 1 menit
level: sistem
tipe: positif
terkait: NFR-07
prioritas: M
komponen: seluruh sistem
otomasi: semi-otomatis (skrip + manual)
status: belum diuji
---

# SYS-06-P — Skema, log, PDF, dan prompt bebas data pribadi; hapus data ≤ 1 menit

## Tujuan
Kepatuhan minimalisasi dan hak hapus dapat dibuktikan.

## Prasyarat
- Alur lengkap dijalankan; ≥ 1 dossier ada

## Data uji
- Pola: /\b\d{16}\b/ (NIK), /\b08\d{8,11}\b/ (HP), /rekening|norek/i

## Langkah
1. grep db/schema.sql untuk kolom nik/ktp/hp/telepon/rekening.
2. sqlite dump → grep pola.
3. pdftotext dossier → grep pola.
4. grep SKILL.md/AGENTS.md untuk permintaan data pribadi.
5. Ukur waktu US-19-P.

## Hasil yang diharapkan
- 0 kolom; 0 kecocokan di dump/PDF/prompt.
- Hapus ≤ 60 s.

## Kriteria lolos
- Semua nol; waktu terpenuhi.

## Catatan
- Rujukan: SPECS.md (NFR-07). Skenario positif level sistem.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/SYS-06-P/` bila dijalankan di VPS.
