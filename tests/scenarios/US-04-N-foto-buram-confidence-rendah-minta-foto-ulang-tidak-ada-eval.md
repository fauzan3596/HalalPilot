---
id: US-04-N
judul: Foto buram / confidence rendah → minta foto ulang, tidak ada evaluasi
level: pengguna
tipe: negatif
terkait: FR-04
prioritas: M
komponen: imageModel/extract, skill
otomasi: manual (Telegram + dashboard)
status: belum diuji
---

# US-04-N — Foto buram / confidence rendah → minta foto ulang, tidak ada evaluasi

## Tujuan
Sistem tidak menebak bahan dari foto yang tidak terbaca.

## Prasyarat
- Orchestrator berjalan (`npm run dev`), DB hasil `npm run migrate && npm run seed:demo`
- OpenClaw gateway aktif, agent `halalpilot`, skill termuat, Telegram allowlist berisi akun uji
- UMK-017 'Dapur Bu Ratih' (seed), akun Telegram TG_UMK_1
- Produk 'Nastar' ada

## Data uji
- Foto label sengaja buram/gelap

## Langkah
1. Kirim foto buram.
2. Periksa balasan dan DB.

## Hasil yang diharapkan
- Agent meminta foto ulang yang lebih jelas dengan tips (cahaya, jarak).
- Tidak ada ingredient baru dan tidak ada decision.
- Jika fallback extract dipakai: respons `confidence < 0.6` tercatat di event_log `EXTRACT_LOW_CONFIDENCE`.

## Kriteria lolos
- COUNT ingredient tidak berubah.
- Tidak ada pesan keputusan jalur.

## Catatan
- Rujukan: SPECS.md (FR-04). Skenario negatif level pengguna.
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>` dan simpan bukti (tangkapan layar/log) di `docs/h1-evidence/US-04-N/` bila dijalankan di VPS.
