# CLAUDE.md — HalalPilot

Agent pendamping portofolio sertifikasi halal (self-declare) untuk UMK anggota koperasi. Dibangun untuk AI HackFest 2026 IDwebhost (kategori Business Automation, framework OpenClaw, VPS 4 vCPU / 4 GB / 20 GB, Batch 2: 6–10 Sep 2026).

Baca dulu, dalam urutan ini: `SPECS.md` (apa yang dibangun), `ROADMAP.md` (urutan dan tenggat), `tests/scenarios/` (definisi selesai per fitur). Kontrak mesin ada di `docs/openapi.yaml`, `db/schema.sql`, `rules/*.yaml`, `openclaw/`.

## Prinsip yang tidak boleh dilanggar

1. **Model memutuskan bahasa; kode memutuskan hukum.** Jalur sertifikasi, skor, dokumen wajib, jadwal pengejaran, dan status hanya ditetapkan oleh `src/rules/engine.js` dan orchestrator. Agent OpenClaw tidak pernah menulis status langsung dan tidak boleh "menaikkan" jalur.
2. **Deterministik.** Mesin aturan adalah fungsi murni dari input + `rules_version`. Tidak ada `eval`, tidak ada panggilan model di dalam engine. Predikat rule ditulis sebagai fungsi JS terdaftar dengan nama = `rule.id`; YAML hanya membawa parameter, pesan, bobot, efek.
3. **Idempoten di setiap batas.** Skill → API pakai `Idempotency-Key`; API → OpenClaw hooks pakai `chase_task.idempotency_key`. Mengulang permintaan yang sama tidak boleh menggandakan keputusan, pengingat, atau dossier.
4. **Tanpa data pribadi.** Tidak ada kolom, log, PDF, atau prompt yang menyimpan NIK/KTP, nomor HP, rekening, atau nama pribadi. Jika pengguna mengirimnya, jangan simpan. Consent dicatat di `umk.consent_at`. `DELETE /umk/{id}` harus benar-benar menghapus (cascade) dan meninggalkan satu baris audit berisi hash saja.
5. **Mock berlabel.** OSS, SEHATI, SiHalal adalah tiruan (`src/mocks/`). Setiap respons dan teks agent yang menyentuhnya harus menyebut "simulasi". Jangan pernah menulis kode yang memanggil portal pemerintah asli.
6. **Muat di 4 GB.** Dilarang menambah: Chromium/Playwright, Ollama sebagai model utama, PostgreSQL, sandbox Docker OpenClaw, dependensi native berat. SQLite (better-sqlite3) dan pdf-lib saja.
7. **Tanpa skill ClawHub pihak ketiga.** Satu-satunya skill adalah `openclaw/skills/halalpilot`. Gateway bind loopback, token, allowlist Telegram.
8. **Jangan update OpenClaw** setelah 6 Sep. Versi dipin 2026.8.2. Kunci konfigurasi bertanda `[VERIFIKASI]` di `openclaw/openclaw.json5` dicek ke docs sebelum dipakai; catat hasilnya di `docs/h1-evidence/`.

## Perintah

```bash
npm ci                     # instal dependensi (Node ≥ 22)
npm run migrate            # terapkan db/schema.sql ke $DATA_DIR/halalpilot.db
npm run seed:demo          # 120 UMK sintetis + 3 UMK skenario (UMK-017, UMK-042, UMK-088)
npm run seed:switch -- <telegram_id> <pendamping|pemasok|UMK-017>   # ganti peran 1 akun Telegram (dev dengan 1–2 akun; pindah adegan saat rekaman)
npm run dev                # Express di 127.0.0.1:3000 dengan reload
npm test                   # unit test rules (node:test) + kontrak api.mjs ↔ openapi
npm run check:scenarios    # validasi front-matter semua tests/scenarios/*.md
npm run lint               # eslint
docker compose up          # replika lokal orchestrator (OpenClaw dijalankan terpisah di host/WSL)
```

Env: salin `.env.example` → `.env`. Tidak ada rahasia di repo. `TZ=Asia/Jakarta` wajib.
Jika `ERR_DLOPEN_FAILED` dari better-sqlite3 (versi Node berubah): `npm rebuild better-sqlite3`.

## Peta kode

| Path | Tanggung jawab |
|---|---|
| `src/server.js` | bootstrap Express, middleware auth/idempotency/audit, mount routes, `/health` |
| `src/db.js` | better-sqlite3 (WAL), migrasi, helper transaksi |
| `src/routes/*.js` | satu file per resource sesuai `docs/openapi.yaml`; validasi zod; tanpa logika hukum |
| `src/rules/loader.js` | baca YAML, validasi skema, hitung `rules_version` |
| `src/rules/normalizer.js`, `classifier.js` | bahan → `nama_normal` → kelas (+flag sembelihan/berbahaya/haram) |
| `src/rules/engine.js` | `evaluate(ctx)` → jalur, skor, alasan, dokumen |
| `src/rules/oss-check.js` | pembanding data usaha vs mock OSS |
| `src/scheduler/chase.js`, `hooks-client.js` | task pengejaran, sweep, jam tenang, batas harian, POST /hooks/agent |
| `src/dossier/builder.js` | PDF pdf-lib + hash + Manual SJPH dari template |
| `src/mocks/*.js` | OSS, SEHATI, SiHalal, registry sertifikat pemasok (deterministik dari seed) |
| `src/audit.js` | `event_log` |
| `openclaw/` | `openclaw.json5` (template `${VAR}`), skill, workspace, automations |
| `rules/` | sumber kebenaran aturan; ubah di sini, bukan di kode |
| `seed/demo.mjs` | data sintetis; entitas fiktif "Koperasi Berkah Nusantara" |
| `test/` | unit & kontrak; fixture 10 kasus wajib ada di `test/rules/fixtures/` |
| `tests/scenarios/` | skenario penerimaan, satu MD per skenario (US-xx / SYS-xx, P/N) |
| `dashboard/dist/` | Dashboard baca-saja: HTML + CSS + ES module murni (tanpa build, tanpa dependensi) disajikan Express di `/dashboard`; token API dimasukkan sekali (sessionStorage). Ubah langsung file di `dist/` |
| `deploy/` | unit systemd, `deploy.sh`, checklist H1 |

## Cara kerja yang diharapkan dari Claude Code

- Sebelum mengubah perilaku, buka skenario terkait di `tests/scenarios/` dan pastikan perubahan membuatnya lolos, bukan mengubah skenarionya. Jika skenario salah, ubah skenario dalam commit terpisah dengan alasan.
- Tambah rule baru: (1) tambah entri di `rules/eligibility.yaml`, (2) daftarkan predikat di `src/rules/engine.js` dengan id sama, (3) tambah fixture di `test/rules/fixtures/`, (4) tambah/ubah skenario US-06.
- Tambah endpoint: ubah `docs/openapi.yaml` dulu, lalu route, lalu perintah di `openclaw/skills/halalpilot/scripts/api.mjs`, lalu `npm test` (uji kontrak memeriksa ketiganya sinkron).
- Teks yang dibaca pengguna (pesan agent) ada di `SKILL.md`, `AGENTS.md`, dan template `rules/chase-policy.yaml`. Bahasa Indonesia santai-sopan, tanpa janji hasil sertifikasi.
- Jangan membuat file dokumentasi baru di root; tambahkan ke `docs/`.
- Commit kecil, pesan bahasa Indonesia, awali dengan area: `rules:`, `api:`, `skill:`, `scheduler:`, `dossier:`, `docs:`, `test:`.
- Setiap akhir sesi kerja: `npm test` hijau, `npm run check:scenarios` hijau, perbarui kotak centang di `ROADMAP.md`.

## Definisi selesai (per fitur)

Fitur dianggap selesai jika: skenario positif dan negatifnya di `tests/scenarios/` lolos (manual atau otomatis sesuai kolom "Otomasi"), unit test terkait hijau, `event_log` mencatat aksinya, dan tidak ada data pribadi baru di skema/log.

## Tenggat keras

- **4 Sep 18:00** — alur intake foto → konfirmasi → evaluate harus jalan di lokal (skenario US-04-P, US-06-P). Jika tidak, keputusan D1 di `ROADMAP.md`.
- **6 Sep** — VPS aktif; checklist V1–V7 (`docs/spec-index.md` §7) sebelum fitur apa pun.
- **10 Sep** — rekaman final; VM mati malam itu.
- **30 Sep** — submit video + artikel (target 29 Sep).
