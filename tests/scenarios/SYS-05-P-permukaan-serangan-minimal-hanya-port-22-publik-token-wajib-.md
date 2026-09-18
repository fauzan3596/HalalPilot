---
id: SYS-05-P
judul: Permukaan serangan minimal: hanya port 22 publik, token wajib, audit bersih
level: sistem
tipe: positif
terkait: NFR-06
prioritas: M
komponen: gateway, ufw, API
otomasi: semi-otomatis (skrip + manual)
status: belum diuji
---

# SYS-05-P — Permukaan serangan minimal: hanya port 22 publik, token wajib, audit bersih

## Tujuan
Tidak mengulang kesalahan gateway OpenClaw yang terekspos.

## Prasyarat
- VPS Batch 2 aktif; semua unit hidup (openclaw, halalpilot-api)

## Data uji
- IP publik VPS

## Langkah
1. `nmap -Pn -p- <ip>` dari laptop.
2. `curl http://<ip>:18789` dan `:3000` dari laptop.
3. `curl -H 'Authorization: Bearer salah' localhost:3000/api/v1/whoami?telegram_id=1` di VPS.
4. `openclaw security audit --deep`.

## Hasil yang diharapkan
- Hanya 22 terbuka.
- 18789 dan 3000 tidak dapat dijangkau dari luar.
- 401 unauthorized untuk token salah.
- Audit 0 temuan kritis; output disimpan.

## Kriteria lolos
- 4/4.

## Catatan
- Rujukan: SPECS.md (NFR-06). Skenario positif level sistem.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/SYS-05-P/` bila dijalankan di VPS.
