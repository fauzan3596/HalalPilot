# Checklist H1 — VPS Batch 2, Sabtu 6 September 2026

Target hari ini: sistem hidup dan terverifikasi (V1–V7), bukti tersimpan, rekaman B-roll lingkungan. **Belum** menambah fitur.
Estimasi: 3–4 jam jika balasan panitia soal model sudah ada; +1 jam jika belum.

> **VPS lomba (10 Sep):** OpenClaw prainstal panitia (2026.7.1-2, port 18789, dihidupkan ulang oleh sistem mereka) DIBIARKAN. Semua perintah `openclaw ...` di bawah ini di VPS dijalankan sebagai **`hpclaw ...`** (OpenClaw 2026.8.2 kita, state /root/.openclaw-halalpilot, port 18790, unit `halalpilot-gateway`). Log gateway kita: `journalctl -u halalpilot-gateway -f`.

## A. Sebelum menyentuh VPS (laptop, 08:00)
- [ ] Email panitia terjawab? Catat: nama model default, endpoint/API key, kuota. Jika belum: `DEFAULT_MODEL=openrouter/deepseek/deepseek-v3.2`.
- [ ] Bot Telegram **kedua** untuk VPS dibuat di @BotFather (token bot lokal tidak boleh dipakai bersamaan karena polling). Jika terpaksa memakai bot yang sama: **matikan gateway WSL dulu** (Ctrl+C di T2, lalu `pkill -9 -f "openclaw gateway"`) sebelum gateway VPS hidup, dan jangan hidupkan lagi selama VPS berjalan.
- [ ] Bandingkan repo Windows vs WSL/VPS sebelum rsync (`cmp`), lihat pelajaran 10 Sep: 7 berkas pernah tertinggal.
- [ ] Buat `.env` VPS dari `.env.vps.example` (di laptop, jangan commit): token bot VPS, `GATEWAY_TOKEN`, `HOOKS_TOKEN`, `HALALPILOT_API_TOKEN` (`openssl rand -hex 24` ×3), `OPENROUTER_API_KEY`, ID Telegram.
- [ ] Saldo OpenRouter ≥ $8. Cek dashboard OpenRouter.
- [ ] `npm test` hijau di laptop (86), `npm run lint`, `npm run check:scenarios`; `git init` + commit pertama tanpa `.env`/`data/` (repo belum ber-git per 10 Sep).
- [ ] Rekam: layar panel VPS IDwebhost/CloudBaik menampilkan spesifikasi 4 vCPU / 4 GB / 20 GB (wajib di video).

## B. Akses & sistem (09:00)
- [ ] `ssh root@IP` berhasil dengan key; `passwd -l root` untuk login password bila key sudah jalan (opsional).
- [ ] Cek prainstal: `openclaw --version`, `node --version`, `ls ~/.openclaw`, `systemctl list-units | grep -i claw`. Catat di `docs/h1-evidence/prainstal.txt`. Jika ada config prainstal → akan dibackup otomatis oleh skrip fase `config`.
- [ ] Dari laptop: `bash deploy/deploy.sh root@IP sistem` → lalu `node` → lalu `openclaw` (fase per fase supaya galat mudah dilacak).
      Hasil: swap 2 GB aktif, UFW hanya 22, TZ Asia/Jakarta, Node 22, OpenClaw **2026.8.2**.

## C. Orchestrator (10:00)
- [ ] `bash deploy/deploy.sh root@IP api` → migrasi, seed 120 UMK, unit systemd aktif, `/health` ok.
- [ ] `ss -tlnp` → 3000 hanya di 127.0.0.1.
- [ ] `sudo -u halalpilot` tidak bisa menulis di luar `/var/lib/halalpilot` (ProtectSystem=strict) — cek `journalctl -u halalpilot-api` tanpa EACCES.

## D. OpenClaw (10:30)
- [ ] `bash deploy/deploy.sh root@IP config` → config ditulis, plugin telegram enabled, gateway service `install`+`start`.
- [ ] `openclaw gateway status` → Runtime running, bind loopback. `openclaw channels status` → Telegram connected, polling.
- [ ] Kirim "halo" dari akun pendamping → dibalas. Jika diam: `openclaw logs --follow`; cek `allowFrom`; pairing.
- [ ] **V2** model: `openclaw models list`; kirim "status saya" 10× (jeda 15 s) → ≥ 9 balasan benar, catat latensi (SYS-02). Jika model default panitia gagal tool calling → ganti `DEFAULT_MODEL` ke DeepSeek, ulangi fase `config`.
- [ ] **V3** config: catat kunci yang ditolak/diterima versi ini (sudah diketahui dari WSL: `gateway.mode` wajib; `tools.exec.allow` & `sandbox` ditolak; `bindings`, `heartbeat`, per-agent `tools` diterima) → `docs/h1-evidence/v3.md`.
- [ ] `bash deploy/deploy.sh root@IP automations` → **V4**: `openclaw automations list` menampilkan 3 job. Uji: `openclaw automations run "HalalPilot digest pagi"` → pendamping menerima ringkasan.
- [ ] **V1** vision: `npm run seed:switch -- <TG> UMK-017` (sebagai halalpilot user: `sudo -u halalpilot env $(cat /etc/halalpilot/env | xargs) node seed/switch-role.mjs <TG> UMK-017`), kirim foto label Nastar → agent menulis ≥ 5/6 bahan. Jika gagal: pastikan `OPENROUTER_API_KEY` di `/etc/halalpilot/env`, agent akan memakai `extract`.
- [ ] **V5** PDF: setelah dossier ada, uji `openclaw message send --channel telegram --to <TG> --media /var/lib/halalpilot/pdf/UMK-017/dossier-v1.pdf --force-document` (sintaks cek `openclaw message send --help`). Jika tidak bisa → tautan dashboard via tunnel.
- [ ] **V6** memori lokal: tidak dipakai (plugin llama-cpp dinonaktifkan). Catat keputusan.
- [ ] **V8** suara & heartbeat (pelajaran 10 Sep): `openclaw gateway status`/log start harus menampilkan **14 plugin tanpa talk-voice**, `[heartbeat] disabled`; `grep -n 'tts:\|talk-voice\|heartbeat' /root/.openclaw/openclaw.json` → tts enabled:false auto:off, talk-voice enabled:false, heartbeat every 0m. Picu satu sweep manual (`curl -X POST .../chase/sweep` dengan `now` H+1 untuk UMK-042) → pengingat tiba sebagai TEKS.
- [ ] **V9** pancing pemberitahuan sekali-pakai "First heartbeat alert" SEBELUM rekaman: kirim satu hook (sweep di atas cukup) sampai paragraf itu muncul di Telegram, lalu jangan ikuti sarannya (`heartbeat.target: none` akan mematikan notifikasi hook).
- [ ] **V7** RAM: `free -m` setelah semua hidup + 1 foto diproses → used ≤ 2,5 GB, swap < 200 MB. Simpan.

## E. Keamanan & bukti (13:00)
- [ ] Dari laptop: `nmap -Pn -p 22,3000,18789 IP` → hanya 22 open.
- [ ] `curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer salah" http://127.0.0.1:3000/api/v1/whoami?telegram_id=1` → 401.
- [ ] `openclaw security audit --deep` → 0 kritis.
- [ ] `bash /opt/halalpilot/deploy/evidence.sh` → salin ke laptop: `rsync -avz root@IP:/opt/halalpilot/docs/h1-evidence/ ./docs/h1-evidence/`.
- [ ] Backup pertama: `bash /opt/halalpilot/deploy/backup.sh` + cron 23:00: `echo '0 23 * * * root bash /opt/halalpilot/deploy/backup.sh' > /etc/cron.d/halalpilot-backup`.

## F. Rekaman H1 (14:00) — untuk menit 0:45–1:30 video
- [ ] Panel VPS (spesifikasi, status running).
- [ ] Terminal: `openclaw gateway status`, `openclaw channels status`, `openclaw automations list`, `systemctl status halalpilot-api`, `free -m`, `ss -tlnp`.
- [ ] Dashboard via tunnel: `ssh -L 3000:127.0.0.1:3000 root@IP` → `http://127.0.0.1:3000/dashboard/` (masukkan token) → papan 120 UMK.
- [ ] `journalctl -u halalpilot-api -f` berjalan saat mengirim "status saya" (untuk footage log).
- [ ] Sebelum take: `npm run seed:demo -- --keep-actors` (papan bersih), `seed:switch` ke UMK-017, `/new` di Telegram per adegan; urutan adegan ikuti `docs/demo-script.md` (pembuka 4% INDEF/Bappenas → tenggat 17 Okt → kuota/P3H).

## G. Jika terjebak
| Gejala | Tindakan |
|---|---|
| Gateway menolak config | Baca kunci yang disebut; hapus dari `/root/.openclaw/openclaw.json`; `openclaw gateway restart`; catat V3 |
| Plugin butuh consent | Pastikan blok `plugins.entries` ada; `openclaw plugins list`; jika perplexity masih diminta: `openclaw plugins install perplexity --accept-capabilities` |
| Bot diam | `allowFrom` berisi ID; sudah tekan Start; token bot VPS ≠ bot lokal; `openclaw logs --follow` |
| 401 dari skill | `HALALPILOT_API_TOKEN` di `/root/.openclaw/.env` = `/etc/halalpilot/env`; `systemctl restart halalpilot-api`; `openclaw gateway restart` |
| Hooks gagal (health `hooks_last_error`) | `HOOKS_TOKEN` sama di kedua sisi; `hooks.enabled true`; `allowedAgentIds` memuat `halalpilot` |
| RAM > 2,5 GB | `systemd-cgtop`; matikan heartbeat (`agents.defaults.heartbeat`), kecilkan `contextWindow`; pastikan tidak ada Chromium/Ollama |
| Model lambat/404 | `openclaw models list`; cek saldo OpenRouter; fallback aktif di config |

Selesai H1 = semua kotak B–E tercentang, bukti tersimpan, dan video B-roll ada. H2 dimulai dengan US-01…US-08 lewat Telegram.
