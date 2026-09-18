# Bukti e2e lokal (WSL) — 10 Sep 2026

Keputusan Fauzan: fokus e2e lokal dulu, VPS menyusul (Batch 2 sudah lewat). Semua di WSL Ubuntu 24.04, OpenClaw 2026.8.2, satu akun Telegram (id disensor) berganti peran via `npm run seed:switch`.

## Lolos
| Alur | Bukti |
|---|---|
| UMK: whoami → foto label → bahan → konfirmasi → evaluate (E11) → set_proses → sertifikat pemasok → SIAP 100 → dossier v1 | transkrip Telegram 9–10 Sep; PDF `data/pdf/UMK-017/` |
| Pendamping: `status saya` → portofolio 120 UMK, 1 siap review | transkrip 02:12 |
| Pendamping: `kembalikan UMK-017 <alasan>` → dossier 2 dikembalikan, FOTO_PRODUK ditolak, 4 chase | transkrip 02:21; API `POST /dossier/2/review` |
| UMK: notifikasi pengembalian dengan catatan utuh | hook `[NOTIFY]` 02:33 |
| Sweep manual `POST /chase/sweep {now}`: tahap 1 → dispatched 1; ulang → 0; tahap 2 dan 3 pada now berikutnya | keluaran curl 02:4x–02:56 |
| Pengingat tahap 3 tiba sebagai TEKS dengan nada "pengingat terakhir sebelum dilaporkan ke pendamping" | Telegram 02:56 |

## Bug yang ditemukan dan diperbaiki malam ini (semua ada di repo Windows, disalin ke WSL)
1. `seed/switch-role.mjs` menghapus baris actor → FK gagal (chase_task merujuk). Kini ubah di tempat + pindahkan tugas ke akun pengganti `900000NNN` / ke pengambil alih.
2. Pengembalian (pendamping & SiHalal simulasi) tidak mencatat keputusan baru → agen membaca "SIAP 100" padahal FOTO_PRODUK ditolak. Kini `runEvaluate(..., {updateStatus:false})` dipanggil setelah pengembalian.
3. Siklus pengejaran baru tidak membatalkan sisa tugas siklus lama → pengingat ganda. Kini `createChaseTasks` membatalkan `terjadwal` lama saat dokumen `ditolak`.
4. `syncGeneratedDocs` hanya UPDATE → UMK lama tanpa baris PERMOHONAN sempat turun ke KURANG_DOKUMEN. Kini INSERT OR IGNORE dulu.
5. Salinan WSL tertinggal 7 berkas dari repo Windows (E16–E18 belum ada). Selalu bandingkan dengan `cmp` sebelum uji.

## Temuan OpenClaw 2026.8.2 (masuk ke `openclaw/openclaw.json5` & `automations.sh`)
- Plugin **talk-voice** aktif otomatis → pengingat terkirim sebagai voice note. Dimatikan via `plugins.entries."talk-voice".enabled=false` (15 → 14 plugin). `tts` juga masuk deny per-agent; AGENTS.md aturan 0b "selalu teks".
- **TTS inti** tetap aktif setelah talk-voice mati: log `telegram/send operation=sendVoice deliveryKind=voice` saat agen menjawab hook eskalasi. Dimatikan `tts: { enabled: false, auto: "off" }` (skema: tts.auto ∈ off|always|inbound|tagged; bawaan tagged → model bisa memicu suara sendiri).
- **Heartbeat** default mengirim ke "target terakhir" (bisa akun pengganti yang tidak ada → `chat not found`). Dimatikan `heartbeat.every: "0m"` (log: `[heartbeat] disabled`).
- **Hooks ke chat_id yang tidak ada** (akun pengganti 900000017) → `OutboundDeliveryError chat not found`; tidak fatal. Pesan tampak sampai ke chat terakhir yang aktif — perilaku ini perlu dicek ulang bila memakai 2 akun.
- **automations create**: bentuk cron menerima pesan posisi; bentuk `--every` menuntut `--message`; tanpa `--agent` job jatuh ke agent default; job `--command` tanpa `--no-deliver` melempar keluaran ke chat terakhir; `--exact` mematikan penggeseran acak jadwal. Hapus dengan `automations rm <id>`.
- **Pemberitahuan sekali-pakai "First heartbeat alert"** ditempel OpenClaw pada pengiriman pertama hasil proses latar (hook/cron) ke pengguna, dengan saran heartbeat.target="none" — JANGAN diikuti (akan mematikan notifikasi hook). Pancing satu hook sebelum rekaman di instalasi baru.
- Hook ke chat_id yang gagal dijatuhkan ke chat terakhir yang aktif, dengan jeda (eskalasi tahap 4 tiba ±10 menit kemudian).
- Skrip ganti peran kini menjaga tugas eskalasi (tahap target pendamping, dibaca dari chase-policy.yaml) tetap pada pendamping koperasi.
- Sesi agen tidak tersimpan sebagai `.jsonl` di `~`; log gateway di `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- Menu perintah Telegram bawaan OpenClaw 47–48 perintah (peringatan "menu text exceeded") — kosmetik.

| Foto label ulang → FOTO_PRODUK diterima → evaluate SIAP 100 → `buat berkas` → dossier v3 menunggu_review | Telegram 03:24–04:02; curl PUT/evaluate 03:5x |
| Pendamping `setuju UMK-017` → disetujui, siap_unggah; `ajukan UMK-017` → SIM-20260909-0001 diterima (simulasi), selesai_simulasi | Telegram 04:12–04:14 |
| Hook pengejaran UMK-042 tahap 1 tiba sebagai TEKS ("Halo Sambal Mak Ijah, ... FOTO_PRODUK, PERBAIKAN_OSS ..."), 3 menit, tanpa timeout — setelah tts inti mati + HOOK_REPLY_RULE | Telegram 04:17 |
| Automations: digest `run` manual → ringkasan portofolio 12 baris tiba 03:12 | Telegram 03:12 |
| Dashboard: papan + detail UMK-017 + jejak agent | tangkapan layar 03:06–03:10 |

## Bug tambahan yang diperbaiki (lanjutan)
6. Agent lupa memanggil `receive_document` setelah `save_media` → FOTO_PRODUK tetap 'diminta'. Kini `POST /products/:pid/media` kind=label/proses langsung menandai dokumen diterima + membatalkan pengejaran.
7. Agent memakai angka 17 sebagai id numerik (dapat UMK-014). Kini `getUmkOr404` menerima kode `UMK-017`; openapi param id bertipe string.
8. Review/mock_submit butuh dossier_id yang tidak ada di detail UMK → `umkDetail.dossiers` (terbaru dulu); AGENTS/SKILL menunjuk `dossiers[0].id`.
9. Dashboard `.gate{display:grid}` mengalahkan atribut `hidden` → pop-up token tidak pernah hilang. `.gate[hidden]{display:none}`.
10. Skrip ganti peran memindahkan tugas eskalasi (target pendamping) ke akun pengganti → eskalasi tak sampai. Kini tahap target pendamping (dari chase-policy.yaml) tetap pada pendamping koperasi.

## Kosmetik dicatat
- Sisa markdown `.###` di balasan agent (Telegram tidak merender heading) — pertimbangkan instruksi 'tanpa heading markdown' di AGENTS.md.
- Run hook bisa >60 s (peringatan typing TTL) bila agent memanggil beberapa perintah skill; prompt CHASE kini tanpa langkah mark_chase_sent.

## Belum diuji
- Automations berjalan pada JADWAL nyata (baru diuji lewat `run` manual).
- Skenario UMK-042 (bakso: RPH, giling) dan UMK-088 dari nol lewat Telegram.

## VPS lomba — temuan awal (10 Sep 2026, 04:30–05:30 WIB)
- Akses: `ssh -p 4422 root@<ip-vps>` (alias `hp-vps`), Ubuntu 24.04.2, 4 vCPU, 3,8 GiB, disk 19 GB (3 GB terpakai), zona waktu UTC, tanpa swap, UFW mati. Instance TIDAK tampil di panel cloudbaik.com akun peserta (dibuat di akun panitia) → footage "dashboard VPS" diganti terminal spesifikasi + halaman CloudBaik + email akses (sandi disensor).
- **OpenClaw prainstal panitia**: 2026.7.1-2 di `/usr/lib/node_modules/openclaw` (symlink `/usr/bin/openclaw`), config `/root/.openclaw/openclaw.json` (bind lan, port 18789, controlUi tanpa auth, provider **9router** `https://9router.jcamp.io/v1` model `oc/mimo-v2.5-free` = "token akses AI" panitia). Gateway berjalan sebagai proses di *transient session scope* dengan induk `sshd: root@notty` — **dihidupkan ulang dari luar** setiap kali dibunuh; ada `opsbridge-agent.service` (agen manajemen CloudBaik/panitia).
- **Keputusan**: TIDAK menyentuh milik panitia. OpenClaw kita 2026.8.2 dipasang terpisah: `npm install -g --prefix /opt/openclaw-halalpilot`, wrapper `/usr/local/bin/hpclaw` (set `OPENCLAW_STATE_DIR=/root/.openclaw-halalpilot`, `OPENCLAW_CONFIG_PATH`), port **18790**, unit systemd `halalpilot-gateway.service`. Hooks API → 18790. Skrip berhenti bila CLI tidak menghormati env tersebut (cek `hpclaw config get gateway.port`).
- `npm prefix -g` root = `/root/.npm-global` → `npm install -g` tanpa `--prefix` memasang ke jalur di luar PATH (kejadian pertama: 2026.8.2 terpasang tapi `openclaw` tetap 2026.7.1-2).
- UFW aktif hanya 22 + 4422 → port 18789 panitia (UI tanpa auth) tertutup dari internet. Disengaja (keamanan); disebut dalam email ke panitia.
- Port SSH 4422: skrip mendeteksi dari `sshd -T` sebelum menyalakan UFW (hardcode 22 = terkunci).
- **Insiden & pemulihan (04:56–05:10)**: fase OpenClaw versi pertama (npm install -g tanpa --prefix) ternyata menimpa paket prainstal panitia di /usr/lib/node_modules/openclaw dan berhenti di tengah (tersisa cangkang: LICENSE/README + .openclaw-lifecycle-pending), tautan /usr/bin/openclaw hilang, gateway mereka mati. Dipulihkan: cangkang dipindah ke /root/openclaw-cangkang-<ts>, `npm install -g --prefix /usr openclaw@2026.7.1-2` → /usr/bin/openclaw 2026.7.1-2 kembali; /root/.openclaw/openclaw.json panitia tidak pernah tersentuh (mtime 6 Sep). Pelajaran: di mesin bersama, SELALU pasang ke prefix sendiri (/opt/...) dan jangan pernah menyentuh /usr.
