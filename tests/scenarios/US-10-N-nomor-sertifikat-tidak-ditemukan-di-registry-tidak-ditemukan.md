---
id: US-10-N
judul: Nomor sertifikat tidak ditemukan di registry → tidak_ditemukan, dokumen tetap kurang
level: pengguna
tipe: negatif
terkait: FR-10
prioritas: M
komponen: mocks/registry
otomasi: semi-otomatis (skrip + manual)
status: belum diuji
---

# US-10-N — Nomor sertifikat tidak ditemukan di registry → tidak_ditemukan, dokumen tetap kurang

## Tujuan
Nomor yang tidak dikenal tidak dianggap valid.

## Prasyarat
- Orchestrator berjalan (`npm run dev`), DB hasil `npm run migrate && npm run seed:demo`
- OpenClaw gateway aktif, agent `halalpilot`, skill termuat, Telegram allowlist berisi akun uji
- UMK-017 'Dapur Bu Ratih' (seed), akun Telegram TG_UMK_1

## Data uji
- Nomor sertifikat 'ID0000000000000000' (acak)

## Langkah
1. `POST /umk/{id}/supplier-certs` dengan nomor acak.
2. Evaluate.

## Hasil yang diharapkan
- status=tidak_ditemukan.
- E11 tetap butuh_dokumen; agent meminta UMK mengecek nomor dan nama pemasok.
- document_req tetap diminta; chase_task tidak dibatalkan.

## Kriteria lolos
- jalur tidak berubah.
- chase_task status tetap terjadwal.

## Catatan
- Rujukan: SPECS.md (FR-10). Skenario negatif level pengguna.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/US-10-N/` bila dijalankan di VPS.
