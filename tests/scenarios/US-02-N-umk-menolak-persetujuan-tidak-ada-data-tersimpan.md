---
id: US-02-N
judul: UMK menolak persetujuan → tidak ada data tersimpan
level: pengguna
tipe: negatif
terkait: FR-02, NFR-07
prioritas: M
komponen: skill, routes/umk
otomasi: manual (Telegram + dashboard)
status: belum diuji
---

# US-02-N — UMK menolak persetujuan → tidak ada data tersimpan

## Tujuan
Tanpa persetujuan, sistem tidak membuat baris apa pun.

## Prasyarat
- Orchestrator berjalan (`npm run dev`), DB hasil `npm run migrate && npm run seed:demo`
- OpenClaw gateway aktif, agent `halalpilot`, skill termuat, Telegram allowlist berisi akun uji
- Akun TG_BARU2 belum terdaftar

## Data uji
- Nama usaha 'Tahu Pak Min'

## Langkah
1. Kirim 'halo', lalu nama usaha.
2. Saat diminta persetujuan, balas 'tidak'.
3. Periksa DB.

## Hasil yang diharapkan
- Agent menjelaskan tidak bisa melanjutkan tanpa persetujuan dan tidak menyimpan apa pun.
- Tidak ada baris umk/actor untuk TG_BARU2.
- `POST /umk` tidak dipanggil, atau dipanggil dengan consent=false dan ditolak 400.

## Kriteria lolos
- COUNT umk dengan nama 'Tahu Pak Min' = 0.

## Catatan
- Rujukan: SPECS.md (FR-02, NFR-07). Skenario negatif level pengguna.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/US-02-N/` bila dijalankan di VPS.
