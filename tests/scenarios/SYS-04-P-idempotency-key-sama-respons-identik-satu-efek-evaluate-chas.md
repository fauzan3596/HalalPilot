---
id: SYS-04-P
judul: Idempotency-Key sama → respons identik, satu efek (evaluate, chase, dossier)
level: sistem
tipe: positif
terkait: NFR-05
prioritas: M
komponen: middleware/idempotency
otomasi: otomatis (node:test)
status: belum diuji
---

# SYS-04-P — Idempotency-Key sama → respons identik, satu efek (evaluate, chase, dossier)

## Tujuan
Tidak ada duplikasi akibat retry skill.

## Prasyarat
- Orchestrator lokal

## Data uji
- 3 pasang permintaan identik dengan key sama: evaluate, chase/request, dossier

## Langkah
1. Kirim tiap permintaan 2× dengan key sama.
2. Bandingkan respons dan hitung baris.

## Hasil yang diharapkan
- Respons kedua identik + header X-Idempotent-Replay: true.
- COUNT decision/chase_task/dossier bertambah tepat 1 per jenis.

## Kriteria lolos
- Test hijau.

## Catatan
- Rujukan: SPECS.md (NFR-05). Skenario positif level sistem.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/SYS-04-P/` bila dijalankan di VPS.
