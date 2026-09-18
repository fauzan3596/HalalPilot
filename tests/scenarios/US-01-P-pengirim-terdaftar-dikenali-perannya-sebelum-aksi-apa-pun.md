---
id: US-01-P
judul: Pengirim terdaftar dikenali perannya sebelum aksi apa pun
level: pengguna
tipe: positif
terkait: FR-01
prioritas: M
komponen: skill, routes/whoami
otomasi: manual (Telegram + dashboard)
status: belum diuji
---

# US-01-P — Pengirim terdaftar dikenali perannya sebelum aksi apa pun

## Tujuan
Memastikan agent memanggil whoami di awal percakapan dan memilih alur sesuai peran.

## Prasyarat
- Orchestrator berjalan (`npm run dev`), DB hasil `npm run migrate && npm run seed:demo`
- OpenClaw gateway aktif, agent `halalpilot`, skill termuat, Telegram allowlist berisi akun uji
- Pendamping koperasi (seed), akun Telegram TG_PENDAMPING
- UMK-017 'Dapur Bu Ratih' (seed), akun Telegram TG_UMK_1

## Data uji
- TG_PENDAMPING terdaftar role=pendamping
- TG_UMK_1 terdaftar role=umk, umk_id=UMK-017

## Langkah
1. Dari akun pendamping kirim 'status'.
2. Dari akun UMK-017 kirim 'status saya'.
3. Periksa event_log dan log gateway.

## Hasil yang diharapkan
- Pendamping menerima ringkasan portofolio (angka koperasi).
- UMK-017 menerima ringkasan UMK-nya sendiri (produk, dokumen kurang, jalur).
- Log menunjukkan panggilan `whoami` mendahului panggilan lain pada kedua sesi.

## Kriteria lolos
- Tidak ada data UMK lain bocor ke UMK-017.
- Urutan panggilan: whoami → aksi.
- Balasan ≤ 20 detik.

## Catatan
- Rujukan: SPECS.md (FR-01). Skenario positif level pengguna.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/US-01-P/` bila dijalankan di VPS.
