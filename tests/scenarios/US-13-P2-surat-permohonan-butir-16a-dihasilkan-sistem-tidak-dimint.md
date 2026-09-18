---
id: US-13-P2
judul: Surat permohonan (butir 16a) dihasilkan sistem, tidak diminta dari UMK
level: pengguna
tipe: positif
terkait: FR-06, FR-14, E13
prioritas: M
komponen: evaluate-service syncGeneratedDocs, dossier
otomasi: semi-otomatis (skrip + manual)
status: belum diuji
---

# US-13-P2 — Surat permohonan (butir 16a) dihasilkan sistem, tidak diminta dari UMK

## Tujuan
Dokumen PERMOHONAN ada di checklist wajib namun selalu ditandai 'dihasilkan' dan tercetak di bagian 2 dossier.

## Prasyarat
- Orchestrator + seed

## Data uji
- UMK-017

## Langkah
1. `POST /umk/{id}/evaluate`.
2. `GET /umk/{id}` → documents.
3. Setelah SIAP, `POST /umk/{id}/dossier` dan buka PDF.

## Hasil yang diharapkan
- document_req PERMOHONAN status 'dihasilkan' dengan catatan 'dihasilkan sistem'.
- Agent tidak pernah meminta surat permohonan dari UMK.
- Bagian 2 PDF berjudul 'Surat Permohonan dan Pernyataan Pelaku Usaha' dan memuat kalimat permohonan kepada BPJPH.

## Kriteria lolos
- Status 'dihasilkan'.
- Teks permohonan ada di PDF.

## Catatan
- Rujukan: SPECS.md (FR-06, FR-14, E13); Kepkaban BPJPH 146/2025 Bab II A.16.a (`docs/regulasi/kepkaban-146-2025-bab-i-iv.txt`).
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>`.
