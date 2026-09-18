# Rencana Bangun 2–10 September 2026

Prinsip: **VPS hanya untuk deploy, hardening, dan rekaman.** Semua fitur selesai di laptop (Docker) sebelum 6 September.

## Fase A — Lokal, 2–5 September

| Hari | Target selesai (bisa didemokan lokal) |
|---|---|
| **Rabu 2 Sep** | Email info@cloudbaik.com (model default, OpenClaw prainstal?, panel). Install OpenClaw di laptop/WSL (`npm i -g openclaw@2026.8.2`), bot Telegram uji, 1 skill "halo" yang memanggil `curl` lokal → bukti rantai Telegram→agent→exec→HTTP jalan. Repo Express+SQLite dari skema `01-schema.sql`, seed 120 UMK sintetis. |
| **Kamis 3 Sep** | Mesin aturan: loader YAML, normalisasi bahan, klasifikasi, `evaluate` dengan alasan per rule, `oss-check` + mock OSS. Unit test 3 kasus demo (Nastar/Bakso/Sambal) harus menghasilkan tepat jalur yang direncanakan. Endpoint intake (`whoami`, `create_umk`, `patch_umk`, `add_product`, `set_ingredients`). |
| **Jumat 4 Sep** | Skill `halalpilot` lengkap (SKILL.md + api.mjs), uji alur UMK-017 end-to-end di Telegram lokal termasuk foto → imageModel (uji V1 di lokal!). Scheduler chase + `/hooks/agent` + `chase/sweep`. **Titik keputusan: jika intake foto + evaluate belum jalan, pindah ke ide cadangan JML.** |
| **Sabtu 5 Sep** | Dossier PDF (pdf-lib) + Manual SJPH template, review pendamping, mock SiHalal, `portfolio_summary`, dashboard React statis (papan 120 UMK, detail UMK, audit). `docker compose` untuk Express. Skrip `deploy.sh` (rsync + systemd unit). Gladi alur demo penuh di lokal, catat durasi tiap langkah. |

## Fase B — VPS Batch 2, 6–10 September

| Hari | Pagi | Siang/Malam | Bukti yang direkam hari itu |
|---|---|---|---|
| **H1 Sabtu 6 Sep** | Akses VPS; cek OpenClaw prainstal & versi (pin 2026.8.2, **jangan update**); swapfile 2 GB; `openclaw.json5` (loopback, token, allowlist); Telegram pairing; model default + fallback; top-up OpenRouter $10 | Deploy Express (systemd), seed, skill, `automations.sh`; jalankan **checklist V1–V7**; `free -m`, `openclaw security audit --deep` | Panel VPS, terminal status gateway/channels/automations, `free -m` |
| **H2 Minggu 7 Sep** | UMK-017 & UMK-042 end-to-end di VPS; perbaiki latensi model; idempotency & retry di skill | UMK-088 (pemasok, E09/E10), chase sweep nyata 09:00/15:00 berjalan sendiri | Log automations yang fire sendiri (bukti otonomi) |
| **H3 Senin 8 Sep** | Dossier + review + simulasi pengajuan; digest 07:00 masuk sendiri | Skenario gagal: API dimatikan → heartbeat melapor; pemasok diam → eskalasi D+10 (percepat jam untuk demo) | Digest pagi asli, eskalasi asli |
| **H4 Selasa 9 Sep** | Polish dashboard & PDF; `delete_umk` (PDP) ; hitung biaya token per UMK dari log | Gladi bersih rekaman 2×; perbaiki teks agent; snapshot repo + config ke GitHub (tanpa token) | B-roll, tangkapan layar artikel |
| **H5 Rabu 10 Sep** | Reset seed; rekam 2–3 take penuh (08:00–12:00) | Backup `~/.openclaw`, DB, PDF, log ke laptop; export `openclaw automations list`, `security audit`; VM mati malam ini | Video mentah final |

## Fase C — 11–30 September
- 11–14 Sep: edit video (watermark IDwebhost, lower-third, tanpa musik), unggah unlisted, cek durasi 5–10 menit & 1080p.
- 15–20 Sep: tulis artikel dari `04-article-outline.md` (baru, ≥800 kata, 2 backlink), publikasikan, uji terindeks.
- 21–28 Sep: revisi dari umpan balik 2–3 orang awam ("mengerti masalahnya dalam 1 menit?"), siapkan deskripsi YouTube dengan tautan repo/artikel.
- ≤ 29 Sep: submit (jangan menunggu 30 Sep).

## Urutan potong jika tertinggal (potong dari atas)
1. Pengejaran pemasok langsung (cukup eskalasi ke pendamping).
2. Kuota SEHATI mock & automation kuota.
3. Embedding lokal untuk memori.
4. Simulasi pengajuan SiHalal (berhenti di "siap unggah" + PDF).
5. Manual SJPH otomatis (dossier tetap, manual jadi template kosong).
6. Dashboard interaktif → halaman statis yang di-refresh.
7. UMK-042 (kasus OSS) → sebut di narasi saja.
**Jangan pernah dipotong:** intake foto → konfirmasi → evaluate dengan alasan; pengejaran otomatis dengan eskalasi; dossier PDF; persetujuan pendamping; digest cron; tampilan VPS.

## Risiko → mitigasi (ringkas)
| Risiko | Mitigasi |
|---|---|
| Model default lemah tool-calling | `primary` → DeepSeek V3.2; skill dirancang 1 perintah per giliran; retry 1× |
| Foto Telegram tidak sampai ke imageModel | Fallback `extract` di Express (OpenRouter vision) |
| OpenClaw 2.0 migrasi rusak | Pin 2026.8.2; backup `~/.openclaw` tiap malam; tidak update |
| Biaya heartbeat/cron | heartbeat 6h; 3 automations saja; `modelPolicy` kunci ke model murah |
| RAM habis | Tanpa Chromium/Ollama/Postgres; swap 2 GB; `MemoryMax` unit systemd |
| Peserta lain bertema halal | Pembeda diucapkan menit pertama; persona koperasi; angka portofolio, bukan satu percakapan |
| Rekaman gagal H5 | Gladi H4 direkam penuh sebagai cadangan; replika Docker lokal untuk retake non-VPS |
