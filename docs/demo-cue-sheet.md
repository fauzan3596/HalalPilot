# Lembar Isyarat Rekaman — 10 Sep 2026 (VPS lomba, satu akun Telegram)

Pembagian: **Claude** menjalankan semua sisi server dari WSL → `ssh hp-vps` (ganti peran, sweep, eskalasi, cek DB, PDF) dan mengetik pesan
Telegram lewat web.telegram.org di panel browser (akun Fauzan). **Fauzan** merekam layar (Snipping Tool, area: Telegram Desktop kiri, terminal
kanan), mengirim **foto label** dari perangkatnya saat diberi isyarat, dan menjalankan perintah footage terminal yang ditandai 🎥.
Pesan ke bot muncul di Telegram Desktop Fauzan secara otomatis (akun sama). Narasi direkam belakangan (tanpa mic saat take).

Bot: **@halalpilot_koperasi_bot**. VPS: `ubuntu24-openclaw-92cdd46c`. Perintah OpenClaw di VPS = `hpclaw`.
Sweep memakai `now` eksplisit sehingga tidak terkena jam tenang 21–07 WIB.

| # | Waktu video | Adegan | Siapa | Pesan / perintah persis | Server (Claude, sebelum adegan) | Yang harus tampak |
|---|---|---|---|---|---|---|
| 0 | — | Reset take | Claude | — | `seed:demo --keep-actors`, hapus PDF lama, akun → UMK-017, restart API, cek health | papan bersih 120 UMK |
| 1 | 0:00–0:45 | Masalah | Fauzan 🎥 | tab dashboard `http://127.0.0.1:3000/dashboard` (tunnel) + hitung mundur | tunnel `ssh -L 3000:127.0.0.1:3000 hp-vps` dibuka Fauzan | papan hampir seluruhnya kelabu/kuning |
| 2 | 0:45–1:30 | Lingkungan | Fauzan 🎥 | halaman cloudbaik.com (login) → email akses (sandi disensor) → terminal: `hostnamectl \| head -3; nproc; free -h \| head -2; df -h / \| tail -1` lalu `hpclaw gateway status; hpclaw channels status; hpclaw automations list; systemctl status halalpilot-api halalpilot-gateway --no-pager \| grep Active` | — | 4 vCPU, 3,8 GiB, 3 automations, 2 unit aktif |
| 3 | 1:30–3:00 | Intake UMK-017 | Claude ketik, **Fauzan kirim foto** | `/new` → `halo` → (bot tawarkan/menyapa Dapur Bu Ratih) → **foto label nastar** + "ini label produk saya" → `benar` | akun sudah UMK-017 | bahan terbaca, konfirmasi, evaluasi: KURANG_DOKUMEN, minta sertifikat margarin + proses |
| 4 | 3:00–3:40 | Proses & sertifikat | Claude | `Proses produksi: tepung, margarin, telur, gula dicampur jadi adonan, diisi selai nanas, dipanggang 20 menit, didinginkan, dikemas toples.` → `sertifikat margarin dari PT Palmindo Lestari nomor ID00110000123450226` | — | PROSES dihasilkan; sertifikat valid; SIAP 100; tawaran berkas |
| 5 | 3:40–4:10 | Dossier v1 | Claude | `buat berkas` | setelah balasan: Claude tarik PDF → tampilkan 1 halaman (footage) | dossier v1, sha256 |
| 6 | 4:10–5:00 | Pengejaran (UMK-042) | Claude | — (pesan datang dari agen) | akun → UMK-042 → evaluate → sweep `now` H+1 → **pesan pengingat teks** tiba; lalu sweep H+3 (tahap 2) | dua pengingat, nada meningkat |
| 7 | 5:00–5:40 | Eskalasi ke pendamping | Claude | — | akun → pendamping; tandai tahap 1–3 UMK-042 terkirim; sweep H+10 → eskalasi | pesan eskalasi ke pendamping; `[NOTIFY]`/heartbeat-alert sekali-pakai sudah dipancing sebelum take |
| 8 | 5:40–6:30 | Review pendamping | Claude | `/new` → `status saya` → `kembalikan UMK-017 foto label kurang jelas, tolong foto ulang` | — | portofolio; dossier dikembalikan; notifikasi ke UMK |
| 9 | 6:30–7:15 | Foto ulang → v2 → setuju → ajukan | Claude + **Fauzan foto** | akun → UMK-017: `/new` → **foto label** + "ini foto ulang yang lebih jelas" → `benar` → `buat berkas` → akun → pendamping: `/new` → `setuju UMK-017` → `ajukan UMK-017` | ganti peran 2× | SIAP 100, dossier v2, disetujui, SIM-…-0001 **simulasi** |
| 10 | 7:15–7:45 | Digest & dashboard | Claude + Fauzan 🎥 | — | `hpclaw automations run <id digest>` | ringkasan 12 baris; dashboard UMK-017 hijau |
| 11 | 7:45–8:30 | Batas & penutup | Fauzan 🎥 | terminal: `ss -tlnp \| grep -v 127.0.0` (hanya SSH publik), `free -m` | — | teks layar: menyiapkan bukan menerbitkan; simulasi; tanpa data pribadi; AI Hosting IDwebhost |

Catatan take:
- Setiap peralihan akun, Claude memberi tanda "siap" di chat ini sebelum Fauzan menekan Record lagi (boleh potong per adegan; digabung saat edit).
- Jika balasan bot menyimpang, ulangi adegan itu saja setelah Claude mengembalikan keadaan.
- Jangan ikuti saran "heartbeat.target: none" bila pemberitahuan sekali-pakai muncul; pancing sebelum take.
