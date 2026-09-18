---
id: US-03-N
judul: Jawaban tidak valid (omzet 'banyak', NIB 5 digit) ditolak dan diminta ulang
level: pengguna
tipe: negatif
terkait: FR-03
prioritas: M
komponen: routes/umk validasi zod
otomasi: semi-otomatis (skrip + manual)
status: belum diuji
---

# US-03-N — Jawaban tidak valid (omzet 'banyak', NIB 5 digit) ditolak dan diminta ulang

## Tujuan
Validasi API menolak nilai tak valid dan agent meminta ulang dengan contoh format.

## Prasyarat
- Orchestrator berjalan (`npm run dev`), DB hasil `npm run migrate && npm run seed:demo`
- OpenClaw gateway aktif, agent `halalpilot`, skill termuat, Telegram allowlist berisi akun uji

## Data uji
- omzet: 'banyak'
- nib: '12345'

## Langkah
1. Balas pertanyaan omzet dengan 'banyak'.
2. Balas pertanyaan NIB dengan '12345'.
3. `curl PATCH /umk/{id}` langsung dengan `{omzet_tahunan:'banyak'}`.

## Hasil yang diharapkan
- API mengembalikan 400 `validation` dengan detail field.
- Agent meminta angka (contoh: '240 juta' → 240000000) dan NIB 13 digit.
- DB tidak berubah untuk field yang tidak valid.

## Kriteria lolos
- HTTP 400 pada curl.
- Nilai lama tetap di DB.

## Catatan
- Rujukan: SPECS.md (FR-03). Skenario negatif level pengguna.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/US-03-N/` bila dijalankan di VPS.
