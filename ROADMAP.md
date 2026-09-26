# ROADMAP — HalalPilot

Status per 4 September 2026. Centang saat skenario terkait lolos. Kode skenario merujuk `tests/scenarios/`.

## Milestone dan tenggat

| M | Nama | Tenggat | Gerbang keluar |
|---|---|---|---|
| M0 | Fondasi repo | 2 Sep | `npm run migrate`, `npm run seed:demo`, `/health` OK, uji kontrak hijau |
| M1 | Mesin aturan | 3 Sep | 10 fixture `test/rules` hijau; SYS-08-P, SYS-08-N |
| M2 | Intake end-to-end lokal | **4 Sep 18:00 (D1)** | US-01-P, US-02-P, US-03-P, US-04-P, US-05-P, US-06-P, US-07-P via Telegram lokal |
| M3 | Pengejaran, dossier, review | 5 Sep | US-10-P, US-11-P, US-12-P, US-14-P, US-15-P, US-17-P (lokal), SYS-04-P |
| M4 | VPS siap & terverifikasi | 6 Sep (H1) | SYS-12-P, SYS-01-P, SYS-05-P, SYS-11-P/N, V1–V7 tercatat di `docs/h1-evidence/` |
| M5 | Acceptance demo di VPS | 8 Sep (H3) | Semua US-*-P prioritas M lolos di VPS; SYS-03-P berjalan 48 jam; gladi rekaman 1× |
| M6 | Rekaman & arsip | 10 Sep (H5) | Video mentah 2–3 take; backup (SYS-13-P); repo publik tanpa rahasia |
| M7 | Submisi | 29 Sep | Video terunggah (unlisted/publik, watermark, 5–10 menit), artikel ≥800 kata + 2 backlink, form submit |

## M0 — Fondasi repo (2 Sep)
- [x] Struktur folder, `CLAUDE.md`, `SPECS.md`, `ROADMAP.md`, skenario uji
- [x] `db/schema.sql`, `rules/*.yaml`, `openclaw/*`, `docs/openapi.yaml`
- [x] `npm install` (better-sqlite3 ^12 untuk Node 24); `npm run migrate` menerapkan 15 tabel/view
- [x] `npm run seed:demo` menghasilkan 120 UMK (3 skenario + 117 acak deterministik), 45 produk, OSS mock 120 record, registry 10 sertifikat pemasok, kuota SEHATI 4 provinsi; `--keep-actors` mempertahankan pemetaan Telegram; `npm run seed:switch` untuk ganti peran 1 akun
- [x] `src/server.js` dengan auth Bearer, idempotency, `/health` berjalan; SYS-09-N lolos (env hilang → exit 2 dengan nama variabel)
- [x] Uji kontrak `test/contract.test.mjs` hijau (20 perintah `api.mjs` ↔ openapi)
- [x] Mesin aturan awal (`engine.js`, `normalizer.js`, `classifier.js`) + 12 fixture hijau — M1 sebagian selesai lebih awal
- [ ] Email ke info@cloudbaik.com: model default, versi OpenClaw prainstal, panel VPS

## M1 — Mesin aturan (3 Sep)
- [x] `loader.js` + `rules_version` (SYS-08-N)
- [x] `normalizer.js` (sinonim, fuzzy ≤ 2) — US-05-N
- [x] `classifier.js` (prioritas kelas, flag sembelihan/berbahaya/haram) — US-05-P
- [x] `engine.js` 15 predikat E01–E15, efek, skor — US-06-P, US-06-N, US-06-N2, US-09-P, US-09-N
- [x] `oss-check.js` (nama fuzzy, alamat token-overlap, KBLI himpunan, KBLI pangan, skala, status NIB) + `src/mocks/oss.js` — US-08-P, US-08-N, US-08-N2
- [x] `src/mocks/registry.js` (sertifikat pemasok; kedaluwarsa dihitung dari tanggal) dan `src/mocks/sehati.js` (kuota) — US-10-P/N, US-22-P/N
- [x] Fixture 12 kasus engine + 6 kasus oss-check hijau
- [x] `rules/ingredients.yaml` v2026-09-05.1 dari lampiran KMA 1360/2021 asli (hal. 5–15 dibaca dari PDF scan): a.1 tumbuhan 34 entri, a.2 hewan non-sembelihan, a.3 fermentasi, a.4 air, b, c.1 tambang, c.2 sintesis pangan. Koreksi: gula pasir bukan bahan dikecualikan (→ positif); serbuk cokelat, tempe, tape, oncom, agar, minyak atsiri dikecualikan
- [x] `rules/ingredients.yaml` v2026-09-10.2 — SELURUH lampiran c.2 (hal. 12–182, no. 1–4038) dibaca 10 Sep; kelas dikecualikan_C menjadi 66 entri (pengawet, pengasam, fosfat, pemanis sintetis, pewarna sintetis, antioksidan, anti kempal, mineral fortifikan, gas), 461 sinonim; soda kue dipindah positif → dikecualikan_C; kalium bromat → berbahaya; dicatat yang TIDAK ada di lampiran (asam sitrat, MSG, lesitin, gliserol, pektin, xanthan, pemanis intens modern) — tetap positif/kritis
- [x] Kepkaban BPJPH 146/2025 teks asli diunduh & dibaca (10 Sep): 15 aturan terkonfirmasi, kolom `butir` ditambah, E16 (maks 10 produk), E17 (nama/kemasan produk), E18 (kewajaran daftar bahan), dokumen PERMOHONAN; kutipan di `docs/regulasi/`; angka resmi di `docs/angka-resmi.md`. Suite 85 hijau
- [ ] Validasi kelas `positif`/`kritis` oleh P3H sungguhan — di luar kendali tim; diakui terbuka di SPECS §17.3 dan artikel (batas, bukan cacat)
- [ ] (opsional) Lampiran II Kepkaban 146/2025 (jenis produk, 165 hal.) — hanya untuk validasi kolom `jenis`; tidak diperlukan untuk demo

## M2 — Intake end-to-end lokal (4 Sep, D1)
- [x] OpenClaw lokal (WSL) 2026.8.2 terpasang, gateway `run` hidup, Telegram connected (4 Sep). Temuan V3: `gateway.mode: "local"` wajib; `tools.exec.allow` & `agents.entries.*.sandbox` ditolak; plugin `llama-cpp`/`perplexity` harus dinonaktifkan; plugin `telegram` harus di-enable; config dibaca dari `~/.openclaw/openclaw.json`
- [x] Routes M2 (5 Sep): whoami, umk POST/GET/PATCH/DELETE, products, media, ingredients, extract (fallback vision), evaluate, documents, supplier-certs (evaluasi ulang otomatis) — `src/app.js` factory, `src/http.js` (galat bertipe, aktor `X-Actor`, otorisasi UMK/pendamping), `src/services/*`, `src/scheduler/chase.js` (pembuatan/pembatalan task)
- [x] Tes integrasi HTTP `test/api.test.mjs` (18 tes): US-01-P/N, US-02-P/N, US-03-N, US-04 (media/extract 503), US-06-P/N, US-08-N/N2, US-09-P/N, US-10-P/N, US-19-P/N2, SYS-04-P, SYS-05 (401). Total suite 57 hijau
- [x] Skill `api.mjs` mengirim `X-Actor` dari field `actor`; SKILL.md mewajibkan agent menyertakannya
- [ ] Uji lewat Telegram nyata: US-01-P, US-02-P, US-04-P (foto → imageModel, SYS-11-P), US-06-P, US-07-P — **belum**, laptop mati 4 Sep
- [ ] US-02-N2, US-04-N/N2, US-05 (otomatis lolos), US-07-N, US-19-N, US-20-P/N (audit ada; verifikasi manual)
- [ ] **D1 tertunda ke 5 Sep**: gerbang tetap US-04-P & US-06-P via Telegram; API-nya sudah siap

## M3 — Pengejaran, dossier, review (5 Sep)
- [x] `scheduler/sweep.js` (jatuh tempo → batalkan tak relevan → jam tenang 21:00–07:00 WIB → gabung per target → batas 2 pesan/UMK/hari → hooks) + `hooks-client.js` (retry 3×, backoff, `hooks_last_error` di /health) + routes `chase/request`, `chase/:id/sent`, `chase/due`, `chase/sweep` — US-11-P/N/N2/N3, US-12-P/N, SYS-14-P (tes dengan server hooks palsu)
- [x] supplier-certs + registry mock — US-10-P/N (M2)
- [x] `dossier/builder.js` pdf-lib: 10 bagian, sematkan foto label/proses, draf Manual SJPH 5 kriteria dari template, SHA-256 file + hash data, versi bertambah; notifikasi pendamping via hooks — US-14-P/N
- [x] review pendamping `POST /dossier/:id/review` (setuju → siap_unggah; kembalikan → dokumen diminta ulang + chase siklus baru; 403 non-pendamping dicatat REVIEW_DENIED) — US-15-P/N/N2
- [x] mock `GET /mock/oss/:nib`, `GET /mock/sehati/quota`, `POST /mock/sihalal/submit` (hanya dossier disetujui; ~20% dikembalikan deterministik atau `force_result`; kuota terpakai; UMK dinotifikasi) — US-16-P/N/N2, US-22
- [x] `GET /portfolio/:id/summary` (angka, per status, 5 UMK mendesak, eskalasi terbuka, aktivitas hari ini, status hooks) + `GET /events` — US-17 (data), US-20-P
- [x] Cron internal cadangan `scheduler/cron.js` (sweep */30m, digest 07:00) aktif jika `ENABLE_INTERNAL_CRON=1` — fallback V4
- [x] Tes integrasi `test/m3.test.mjs` 19 tes; total suite **76 hijau**
- [x] Dashboard baca-saja `dashboard/dist/` (ES module murni tanpa build, disajikan Express di `/dashboard`): papan 120 UMK berwarna per status + ⚑ eskalasi, hitung mundur, 5 UMK mendesak, eskalasi terbuka, aktivitas agent hari ini, detail UMK (keputusan, bahan, dokumen, jejak agent, PDF dossier), tab Audit, tab Kuota (label SIMULASI); token disimpan sessionStorage; polling 10 s. Endpoint pendukung baru: `GET /umk`, `GET /dossier/:id/pdf` (ditambahkan ke openapi) — US-18-P/N (verifikasi visual papan menunggu Anda memasukkan token)
- [x] `docker compose up` replika — SYS-09-P lolos 5 Sep: build ±2 menit, container start → migrasi → seed otomatis (120 UMK) → `/health` ok dalam 14 detik; port hanya 127.0.0.1:3000; `rules/` di-mount baca-saja
- [ ] Gladi alur demo lokal via Telegram, catat durasi per langkah
- [ ] Perbaikan kecil yang ditemukan tes: kunci idempoten chase kini `chase:<umk>:<doc>:<tahap>:<siklus>`; dokumen `ditolak` otomatis masuk siklus pengejaran baru (status `diminta` + catatan)

## M4 — VPS H1 (6 Sep)
- [x] Paket deploy siap (5 Sep): `deploy/vps-setup.sh` (7 fase idempoten: sistem/node/openclaw/api/config/automations/verifikasi), `deploy/deploy.sh` (rsync + jalankan fase dari laptop), `deploy/evidence.sh` (18 berkas bukti ke `docs/h1-evidence/<tanggal>/`), `.env.vps.example`, `deploy/H1-checklist.md` (A–G dengan V1–V7 dan tabel "jika terjebak"), `docs/demo-runbook.md` (perintah operator per adegan, reset seed, percepat waktu, pergantian peran)
- [x] Audit kesiapan kode (5 Sep malam): ESLint bersih (`eslint.config.js` flat), 25/25 operasi openapi terdaftar sebagai route, 20 perintah skill konsisten dengan SKILL.md, 0 TODO. Perbaikan: idempotency hanya menyimpan 2xx (409/400 tidak di-replay), kunci waktu `evaluate`/`build_dossier` dihapus (risiko keputusan basi), `status ditunda` hanya pendamping, perintah `list_umk` untuk pendamping. Suite **80 hijau**
- [ ] Prosedur `deploy/H1-checklist.md` selesai; bukti di `docs/h1-evidence/`
- [ ] SYS-12-P (versi OpenClaw pin), SYS-01-P (RAM ≤ 2,5 GB), SYS-05-P (hanya port 22, token, audit), SYS-06-P
- [ ] `openclaw/automations.sh` dijalankan; SYS-03 mulai dihitung
- [ ] Top-up OpenRouter $10; SYS-10-P (fallback model)
- [ ] Rekam: panel VPS, `openclaw gateway status`, `automations list`, `free -m`

## M5a — e2e lokal di WSL (10 Sep; keputusan: lokal dulu, VPS menyusul) — bukti `docs/h1-evidence/e2e-lokal-10-sep.md`
- [x] Sisi UMK sampai dossier v1 (foto → bahan → konfirmasi → evaluate → proses → sertifikat → SIAP → PDF)
- [x] Sisi pendamping: portofolio, kembalikan (dossier 2), notifikasi ke UMK
- [x] Sweep manual tahap 1–3 dengan `now` simulasi; idempoten; pengingat tiba sebagai teks (talk-voice dimatikan)
- [x] 9 bug diperbaiki (switch-role FK & tugas eskalasi, keputusan basi setelah kembalikan, siklus chase ganda, baris PERMOHONAN, sinkron WSL, media label → FOTO_PRODUK otomatis, id menerima kode UMK-xxx, dossiers di detail UMK, dashboard gate)
- [x] Automations terpasang (digest 07.00, sweep 09.00/15.00 `--no-deliver`, kuota 6 jam; semua `--agent halalpilot --exact`); digest diuji `automations run` → ringkasan 12 baris tiba
- [x] Dashboard visual (papan 120 UMK, detail UMK-017 dengan dossier v1–v2, dokumen, jejak agent); bug `.gate` menutupi `hidden` diperbaiki
- [x] Siklus penuh: foto ulang → FOTO_PRODUK diterima (otomatis dari media) → SIAP 100 → dossier v3 → setuju (siap_unggah) → ajukan → SIM-20260909-0001 diterima (simulasi)
- [x] Eskalasi tahap 4 ke pendamping (target pendamping via sweep; pesan eskalasi tiba, isi benar)
- [x] Balasan hook sebagai TEKS setelah `tts` inti dimatikan + HOOK_REPLY_RULE — UMK-042 sweep tahap 1 → teks tiba 3 menit, tanpa timeout (04:17)

## M5b — Dashboard tingkat enterprise (10 Sep siang) — dari `halalpilot-rencana-perbaikan-menyeluruh.md`, diterapkan selektif
- [x] Diambil: kartu papan berisi (nama, n/total dokumen, hari diam, label teks), urut "paling mendesak", chip filter berhitung + diam >10 hari, pencarian, kalimat situasi + laju 7 hari, funnel klik-filter, chip Sistem/Aturan, banner simulasi tunggal, banner blocker consent, panel Langkah berikutnya (UMK/Sistem/Pendamping), kosakata status dokumen + "x dari N", draf pesan awam, aktivitas agen di atas, antrean review baca-saja, seed `bergerak`
- [x] Ditolak: bulk action & tombol setujui/tolak di dashboard (dashboard baca-saja; keputusan lewat Telegram; 117 UMK sintetis tanpa akun), palet Tailwind mentah, batal batch 24 jam
- [x] API: GET /umk +dokumen_total/dokumen_diterima/last_activity_at/hari_diam/consent; summary +laju, +antrean_review

## M5 — Acceptance di VPS (7–8 Sep)
- [ ] H2: US-01…US-08 di VPS; latensi SYS-02-P
- [ ] H3: US-09…US-17; SYS-04-P; SYS-14-P; US-21-P/N (matikan API terjadwal)
- [ ] Skenario gagal terekam: pemasok diam → eskalasi (US-12-P), API mati → heartbeat (US-21-P)
- [ ] Gladi rekaman penuh 1× (H3 malam)

## M6 — Rekaman & arsip (9–10 Sep)
- [ ] H4: polish dashboard/PDF, `delete_umk`, hitung biaya token (SYS-07-P), gladi 2×, push repo (tanpa rahasia)
- [ ] H5: reset seed, rekam 2–3 take; backup (SYS-13-P); ekspor `automations list`, `security audit`
- [ ] Opsional jika waktu: FR-13 pemasok langsung, FR-22 kuota, WhatsApp via Kapso, embedding lokal

## M7 — Submisi (11–29 Sep)
- [x] Edit video v1 (19 Sep): `docs/video/rakit.mjs` → `Videos/HalalPilot-edit/HalalPilot-demo-v1.mp4` 9:21, 1080p30 16:9, potongan otomatis layar diam, caption narasi, kartu pembuka/penutup, watermark teks IDwebhost (logo PNG belum ada), tanpa suara
- [x] v3 (19 Sep): `HalalPilot-demo-v3.mp4` 9:36 — narasi edge-tts id-ID terkunci ke peristiwa di layar (anchor detik sumber + frame beku), caption mengikuti suara, watermark logo IDwebhost asli, bagian email berisi sandi VPS dibuang; IP VPS & id Telegram sengaja dibiarkan (bukti VPS)
- [x] v4 (19 Sep): Remotion (`docs/video/remotion`) — pembuka animasi 4%, judul adegan meluncur + progres, caption beranimasi dengan sorot angka, zoom 10 peristiwa kunci, transisi silang, penutup bertahap; `HalalPilot-demo-v4.mp4`; v5: zoom berlabuh kiri bawah + sorotan area pesan + caption ke kanan saat zoom → v5; v6: kapital awal baris pembuka (sambung 11 s pembuka baru + sisa v5 via ffmpeg) → v6; v7 (19 Sep): musik latar & SFX sintetis bebas lisensi dengan ducking, lencana skor berjalan, sisipan diagram arsitektur (adegan 2), garis waktu pengejaran (adegan 6–7), lencana peran, 3 kartu bab → v7; v8: baris sumber di caption (7 angka), sebutan Kepkaban 146/2025, sisipan aturan YAML E11 + chase-policy (adegan 3), kartu "Hasil demo dalam angka", indeks caption adegan 3&9 dibetulkan → v8; v9: narasi adegan 7 mengikuti pesan eskalasi yang tampil (bukan "tiga pengingat"), kartu bab "Dari pengejaran ke pendamping", render parsial + sambung ffmpeg → v9; v10: kartu artikel sumber (tangkapan Republika 4%, Republika Kemenag, BPJPH kuota) di pembuka & adegan 1 → v10 9:56; v11 (19 Sep malam): zoom otomatis ke tiap balasan agen Telegram (16 balasan, deteksi `docs/video/deteksi-balasan.mjs` → `replies.json`, sorotan mengikuti kotak gelembung + label), narasi ditambatkan 0,4 s sebelum balasan muncul (adegan 7 diurut ulang: sweep → eskalasi tampil → pendamping; adegan 9 caption berkas v2 dipisah), angka kartu hasil = artikel (498/86/86) → v11 9:57; v12 (26 Sep): narasi hibrida, suara sendiri di pembuka, adegan 1, penutup (naskah bercerita `docs/video/naskah-rekaman.md`, pemrosesan `rekam-proses.sh`), ekor adegan 8 & 10 dipotong → `Videos/HalalPilot-edit/HalalPilot-demo-v12.mp4` 9:51, 139 MB
- [ ] Unggah YouTube publik (judul, deskripsi dengan tautan repo/artikel), isi URL video di artikel, submit form
- [x] Naskah artikel final `docs/artikel-final.md` (19 Sep; blog dengan struktur bernomor; 4 gambar dari rekaman VPS di `docs/artikel/img/`); anchor "AI Hosting" → idwebhost.com/ai-hosting, "Cloud VPS" → cloudbaik.com
- [x] Revisi artikel mengikuti struktur paper ParaTech (19 Sep malam): abstrak + kata kunci, daftar kontribusi, rumusan masalah, tabel posisi vs chatbot, arsitektur, metode (alur + titik kendali manusia, mesin aturan, kamus, kebijakan kejar, dua lapis pengaman), penerapan VPS + tabel kontrol keamanan, evaluasi (metode, hasil, pelajaran), ancaman validitas, arah lanjutan, kesimpulan, referensi bernomor [1]–[9]. Angka dijalankan ulang: 86 uji, 86 skenario (bukan 85/87), kamus 498 sinonim (bukan 509). `build.mjs` menerima "Abstrak." sebagai blockquote pembuka
- [ ] Tayang di Blogspot ≤ 30 Sep, isi URL repo/video, uji terindeks
- [ ] Umpan balik 3 orang awam; revisi
- [ ] Submit ≤ 29 Sep

## Urutan potong jika tertinggal
1. FR-13 pemasok langsung → 2. FR-22 kuota → 3. embedding lokal → 4. FR-16 simulasi pengajuan → 5. Manual SJPH otomatis → 6. dashboard interaktif → 7. kasus UMK-042.
**Tidak dipotong**: intake foto → konfirmasi → evaluate dengan alasan; pengejaran + eskalasi; dossier PDF; persetujuan pendamping; digest cron; tampilan VPS.

## Keputusan terbuka
| ID | Keputusan | Batas | Default jika tidak ada info |
|---|---|---|---|
| D1 | Lanjut HalalPilot atau pindah JML | 4 Sep 18:00 | Lanjut jika US-04-P & US-06-P lolos |
| V2 | Model primary | 6 Sep | DeepSeek V3.2 via OpenRouter |
| V3 | Bentuk `tools` per agent | 6 Sep | `tools.profile` global |
| V5 | Kirim PDF dari agent | 8 Sep | Tautan dashboard |
