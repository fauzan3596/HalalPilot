# HalalPilot — Spesifikasi Bangun (v0.1, 2 Sep 2026)

Agent pendamping portofolio halal untuk komunitas UMK (koperasi / paguyuban pasar / cabang komunitas usaha).
Kategori lomba: **Business Automation** · Subkategori: **Productivity & Automation** · Framework: **OpenClaw** · Kanal: **Telegram**.

Isi folder ini:

| File | Isi |
|---|---|
| `TSD-HalalPilot.md` | **Dokumen induk**: requirement FR/NFR bernomor, desain komponen, alur urutan, keamanan/PDP, deployment, uji, risiko |
| `00-README.md` | Ruang lingkup, persona, batas, arsitektur, anggaran RAM, daftar verifikasi H1 |
| `01-schema.sql` | Skema SQLite (Express) |
| `02-openapi.yaml` | Kontrak REST Express ⇄ skill OpenClaw |
| `rules/eligibility.yaml` | Mesin keputusan self-declare vs reguler (Kepkaban BPJPH 146/2025) |
| `rules/ingredients.yaml` | Klasifikasi bahan (KMA 1360/2021 + bahan kritis) |
| `rules/chase-policy.yaml` | Kebijakan pengejaran dokumen & eskalasi |
| `rules/oss-check.yaml` | Pengecekan konsistensi NIB/OSS |
| `openclaw/openclaw.json5` | Konfigurasi gateway, agent, channel, hooks |
| `openclaw/skills/halalpilot/SKILL.md` | Skill kustom yang memanggil REST lokal |
| `openclaw/workspace/AGENTS.md`, `HEARTBEAT.md` | Perilaku agent & heartbeat |
| `openclaw/automations.sh` | Perintah cron OpenClaw (digest harian, pengejaran) |
| `03-demo-script.md` | Naskah video per menit |
| `04-article-outline.md` | Kerangka artikel ≥800 kata + 2 backlink |
| `05-build-plan.md` | Rencana 2–10 Sep, urutan potong, checklist H1 |

## 1. Pernyataan masalah (satu kalimat)

Mulai 18 Oktober 2026 produk makanan-minuman UMK tanpa sertifikat halal melanggar hukum, tetapi satu pendamping (P3H) mengurus ratusan UMK yang berkasnya tidak pernah lengkap dan tidak ada yang mengejarnya.

## 2. Persona

| Persona | Kanal | Yang ia lakukan |
|---|---|---|
| **UMK** (pemilik usaha mikro/kecil, fiktif) | Telegram DM ke bot | Kirim NIB, daftar produk, foto label bahan, foto proses; konfirmasi hasil ekstraksi; unggah sertifikat pemasok |
| **Pendamping** (P3H / pengurus koperasi, fiktif) | Telegram DM + dashboard web | Menerima eskalasi, menyetujui/mengembalikan dossier, membaca digest harian, mengunggah paket ke SiHalal (di luar sistem) |
| **Agent HalalPilot** | OpenClaw | Memutuskan jalur, mengejar dokumen, menyusun dossier, melapor |

Entitas fiktif untuk demo: **Koperasi Produsen Pangan "Berkah Nusantara"**, 120 UMK anggota, 3 UMK yang dimainkan di video (lihat `03-demo-script.md`). Semua data sintetis; tidak ada KTP, tidak ada nomor telepon asli.

## 3. Batas yang tidak boleh dilanggar (ucapkan di video & artikel)

1. Agent **menyiapkan** berkas; tidak menerbitkan, tidak menjanjikan sertifikat.
2. Agent **tidak menyentuh** SiHalal, OSS, atau SEHATI asli. Ketiganya ada sebagai **mock** berlabel jelas ("Simulasi SiHalal"). Paket "siap unggah" diunggah manusia (pendamping) — ini sesuai aturan self-declare yang mewajibkan verifikasi P3H.
3. Keputusan halal tetap milik BPJPH dan P3H. Agent memberi **rekomendasi jalur** dengan rujukan aturan.
4. Data UMK diproses atas persetujuan (consent dicatat), minimal (tanpa KTP), dan bisa dihapus (`DELETE /umk/{id}`) — patuh UU PDP / PP 33/2026.
5. Tidak ada skill ClawHub pihak ketiga. Semua skill ditulis sendiri.

## 4. Arsitektur

```
Telegram (UMK, Pendamping)
        │  grammY long-polling (OpenClaw channel)
        ▼
┌──────────────────────────────────────────────┐
│ OpenClaw Gateway (127.0.0.1:18789, token)     │
│  agent "halalpilot"                           │
│   ├─ skill halalpilot (SKILL.md + scripts/)   │──exec──▶ scripts/api.mjs ──HTTP──▶ Express
│   ├─ imageModel: gemini-2.5-flash-lite        │
│   ├─ memory: local embedding (opsional)       │
│   └─ automations: digest 07:00, sweep 09/15   │
│  POST /hooks/agent  ◀────────────────────────────────────── Express (event → agent → Telegram)
└──────────────────────────────────────────────┘
        ▲
        │ REST (Bearer HALALPILOT_API_TOKEN), 127.0.0.1:3000
┌──────────────────────────────────────────────┐
│ Express + SQLite ("policy & orchestration")    │
│  ├─ rules/*.yaml → engine keputusan           │
│  ├─ scheduler (node-cron) → due reminders     │
│  ├─ pdf-lib → dossier & Manual SJPH           │
│  ├─ mock: OSS lookup, SEHATI quota, SiHalal   │
│  └─ /dashboard (React build statis)           │
└──────────────────────────────────────────────┘
```

Pembagian tanggung jawab (prinsip): **model memutuskan bahasa dan alur percakapan; kode memutuskan hukum dan uang.** Agent tidak pernah menetapkan status kelayakan sendiri; ia memanggil `POST /products/{id}/evaluate` dan menyampaikan hasilnya beserta alasan.

## 5. Anggaran RAM (target ≤ 2,5 GB dari 4 GB)

| Komponen | Estimasi |
|---|---|
| Ubuntu 24.04 + sshd | 0,3–0,4 GB |
| OpenClaw Gateway (Telegram, 1 agent) | 0,4–0,8 GB |
| Node/Express + SQLite + scheduler | 0,15–0,25 GB |
| Embedding lokal untuk memori (opsional) | 0,2–0,4 GB |
| Chromium/Playwright | **tidak dipakai** |
| Ollama | **tidak dipakai** |
| Swapfile | 2 GB (pengaman) |

## 6. Model

- `primary`: model default panitia (isi setelah balasan info@cloudbaik.com).
- `fallbacks`: `openrouter/deepseek/deepseek-v3.2` (bayar, murah) lalu `openrouter/z-ai/glm-5.2:free`.
- `imageModel`: `openrouter/google/gemini-2.5-flash-lite` untuk foto label & proses.
- Top-up OpenRouter $10 pada H1 (kuota 1.000 req/hari).

## 7. Daftar verifikasi H1 (sebelum menulis fitur apa pun di VPS)

| # | Uji | Jika gagal |
|---|---|---|
| V1 | Foto dari Telegram sampai ke `imageModel` (issue OpenClaw #7564) | Skill `extract` membaca file media inbound dari disk dan memanggil OpenRouter vision langsung |
| V2 | Nama & kuota model default; tool calling-nya andal (uji 10 panggilan skill) | Jadikan DeepSeek V3.2 `primary` |
| V3 | Sintaks `tools` per-agent di `openclaw.json5` (lihat docs.openclaw.ai/gateway/config-agents & config-tools) | Pakai `tools.profile` global |
| V4 | `openclaw automations create ... --announce --channel telegram --to <id>` berjalan | Pindahkan digest ke node-cron Express → `/hooks/agent` |
| V5 | Agent bisa mengirim file PDF ke Telegram (cek `openclaw message send --force-document` atau tool `message` dari skill) | Kirim tautan dashboard (SSH tunnel saat rekaman) |
| V6 | `memory.search.provider: "local"` tidak menaikkan RAM > 0,4 GB | Nonaktifkan; sebut di artikel sebagai opsi |
| V7 | `docker stats`/`free -m` setelah semua hidup ≤ 2,5 GB | Matikan embedding lokal, kecilkan `contextWindow` |

## 8. Rujukan aturan yang dipakai mesin keputusan (verifikasi isi dokumen asli sebelum H1)

- Keputusan Kepala BPJPH **No. 146/2025** — Juknis sertifikasi halal UMK berdasarkan pernyataan pelaku usaha (self-declare). Kriteria dipakai di `rules/eligibility.yaml`. Sumber ringkasan: bpjph.halal.go.id (Jan 2026).
- **KMA 1360/2021** — bahan yang dikecualikan dari kewajiban bersertifikat halal. Kategori dipakai di `rules/ingredients.yaml`; lampiran sudah dibaca lengkap (182 hal.) dan dimuat di v2026-09-10.2; lihat blok `kma_lampiran_dibaca` di file itu untuk jejak audit.
- **PP 42/2024** — penahapan kewajiban halal; UMK mamin berakhir 17 Okt 2026; sanksi peringatan → denda → penarikan produk.
- **UU 27/2022 + PP 33/2026** — dasar consent & penghapusan data UMK.
