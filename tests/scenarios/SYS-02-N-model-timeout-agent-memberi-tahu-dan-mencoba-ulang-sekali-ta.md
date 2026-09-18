---
id: SYS-02-N
judul: Model timeout → agent memberi tahu dan mencoba ulang sekali, tanpa perubahan state
level: sistem
tipe: negatif
terkait: NFR-02, NFR-05
prioritas: S
komponen: skill, OpenClaw fallback
otomasi: manual (Telegram + dashboard)
status: belum diuji
---

# SYS-02-N — Model timeout → agent memberi tahu dan mencoba ulang sekali, tanpa perubahan state

## Tujuan
Timeout tidak menghasilkan aksi ganda atau state setengah jadi.

## Prasyarat
- Set timeoutSeconds model ke 3 s untuk uji

## Data uji
- Permintaan evaluate dari UMK

## Langkah
1. Kirim permintaan; amati.
2. Periksa decision.

## Hasil yang diharapkan
- Agent menyatakan gangguan dan mencoba ulang 1×; jika berhasil, tepat 1 decision baru; jika gagal, 0 decision baru dan saran coba lagi.

## Kriteria lolos
- COUNT decision bertambah ≤ 1.

## Catatan
- Rujukan: SPECS.md (NFR-02, NFR-05). Skenario negatif level sistem.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/SYS-02-N/` bila dijalankan di VPS.
