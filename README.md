# HalalPilot

Agent pendamping portofolio sertifikasi halal (self-declare) untuk UMK anggota koperasi. Menyiapkan berkas, mengejar dokumen yang kurang, menyerahkan paket siap unggah ke pendamping (P3H). Dibangun dengan **OpenClaw** di **AI Hosting IDwebhost** untuk AI HackFest 2026 (Business Automation).

> HalalPilot **menyiapkan** berkas, tidak menerbitkan sertifikat, tidak menyentuh SiHalal/OSS/SEHATI asli. Keputusan halal tetap milik BPJPH dan pendamping. Seluruh data demo sintetis; entitas fiktif.

- Mulai dari `CLAUDE.md` (aturan kerja), `SPECS.md` (spesifikasi), `ROADMAP.md` (tenggat).
- Skenario penerimaan: `tests/scenarios/` (satu file per skenario).
- Kontrak: `docs/openapi.yaml`, `db/schema.sql`, `rules/*.yaml`, `openclaw/`.

```bash
cp .env.example .env && npm ci && npm run migrate && npm run seed:demo && npm run dev
npm test && npm run check:scenarios
```

## Artikel, video, lisensi

- Artikel lomba: naskah `docs/artikel-final.md` → `node docs/artikel/build.mjs` menghasilkan `docs/artikel/blogspot.html` (tempel ke HTML view Blogger) dan `docs/artikel/pratinjau.html`; gambar di `docs/artikel/img/`. Angka dan sumber: `docs/angka-resmi.md`.
- Video demo (9:53, publik): https://www.youtube.com/watch?v=BD1u7aonZNI — teks unggah dan bab di `docs/video/youtube.md`, sumber edit Remotion di `docs/video/remotion/`.
- Runbook rekaman: `docs/demo-runbook-solo.md`. Bukti uji: `docs/h1-evidence/`.
- Lisensi: MIT (`LICENSE`). Data demo sintetis; tidak ada rahasia di repo (`.env*` diabaikan git; salin dari `.env.example` / `.env.vps.example`).
