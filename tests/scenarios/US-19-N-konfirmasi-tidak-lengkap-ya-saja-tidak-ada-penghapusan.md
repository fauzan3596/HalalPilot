---
id: US-19-N
judul: Konfirmasi tidak lengkap ('ya' saja) → tidak ada penghapusan
level: pengguna
tipe: negatif
terkait: FR-19
prioritas: M
komponen: skill
otomasi: manual (Telegram + dashboard)
status: belum diuji
---

# US-19-N — Konfirmasi tidak lengkap ('ya' saja) → tidak ada penghapusan

## Tujuan
Penghapusan tidak terjadi karena salah paham.

## Prasyarat
- Orchestrator berjalan (`npm run dev`), DB hasil `npm run migrate && npm run seed:demo`
- OpenClaw gateway aktif, agent `halalpilot`, skill termuat, Telegram allowlist berisi akun uji
- UMK uji

## Data uji
- 'hapus data saya' → 'ya' → (tidak membalas 'HAPUS <kode>')

## Langkah
1. Kirim dua pesan pertama; tunggu 5 menit.

## Hasil yang diharapkan
- Agent menunggu frasa konfirmasi kedua; tidak memanggil delete_umk.
- Data utuh.

## Kriteria lolos
- COUNT umk tidak berubah.

## Catatan
- Rujukan: SPECS.md (FR-19). Skenario negatif level pengguna.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/US-19-N/` bila dijalankan di VPS.
