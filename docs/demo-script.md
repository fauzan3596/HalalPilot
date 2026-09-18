# Naskah Video Demo HalalPilot (target 8:30, batas 5–10 menit)

Format: 1080p 16:9, direkam dari laptop dengan OBS. Layar dibagi tiga: **kiri** Telegram Desktop (akun UMK/pendamping bergantian), **kanan atas** browser dashboard HalalPilot via SSH tunnel, **kanan bawah** terminal SSH ke VPS (`tail -f` log gateway OpenClaw + Express). Watermark logo IDwebhost di pojok kanan bawah sepanjang video. Tanpa musik. Narasi suara sendiri.

Kalimat wajib (aturan lomba): sebut **"AI Hosting IDwebhost"** verbal minimal sekali (menit 1 dan menit 8), tampilkan **dashboard/panel VPS dan terminal** (menit 1).

Semua data sintetis. Entitas fiktif: Koperasi Produsen Pangan "Berkah Nusantara" (120 UMK). Tiga UMK yang dimainkan:

| Kode | Usaha | Produk | Hasil yang direncanakan |
|---|---|---|---|
| UMK-017 | Dapur Bu Ratih | Nastar (tepung terigu, margarin, telur, gula, selai nanas, vanili) | Kurang dokumen → sertifikat pemasok margarin → **siap unggah** |
| UMK-042 | Sambal Mak Ijah | Sambal bawang (cabai, bawang, garam, gula, minyak, terasi) | Bahan semua dikecualikan/positif → **siap unggah cepat**, tapi KBLI tidak cocok di NIB (E15) |
| UMK-088 | Bakso Pak Darto | Bakso sapi (daging sapi giling, tapioka, bawang, garam, penyedap) | Daging tanpa sertifikat RPH + digiling di pasar → **kurang dokumen**, pengejaran ke pemasok |

---

## 0:00–0:45 — Masalah
Layar: hitung mundur "17 Oktober 2026" dan papan portofolio 120 UMK yang hampir seluruhnya merah.
Narasi: "Menurut INDEF yang mengutip data Bappenas 2026, baru sekitar empat persen pelaku usaha di Indonesia yang produknya bersertifikat halal. Padahal mulai 18 Oktober 2026, makanan dan minuman UMK tanpa sertifikat halal melanggar aturan. Pemerintah sudah menyiapkan satu koma tiga lima juta kuota gratis dan lebih dari seratus sebelas ribu pendamping. Masalahnya bukan kuota. Satu pendamping memegang ratusan UMK, dan berkasnya hampir tidak pernah lengkap sejak awal. Yang kurang bukan aplikasi untuk mengunggah dokumen. Yang kurang adalah seseorang yang mengerjakan dan mengejar dokumennya. Itu yang HalalPilot lakukan."
Teks layar (kecil, kiri bawah): "4%: INDEF mengutip Bappenas, Republika 21/8/2026 · 17 Okt 2026: PP 42/2024 · kuota & P3H: BPJPH". Angka 4% menghitung pelaku usaha (semua sektor), bukan produk — jangan disandingkan dengan 13 juta produk sebagai angka setara.

## 0:45–1:30 — Lingkungan
Layar (instance lomba tidak tampil di panel akun peserta, jadi bukti VPS lewat terminal): (1) 3 detik halaman cloudbaik.com yang sudah login, lalu halaman produk Cloud VPS / AI Hosting IDwebhost; (2) email akses panitia dengan sandi disensor (nama instance + IP); (3) terminal `ssh hp-vps` → satu perintah tampil: `hostnamectl | head -3; nproc; free -h | head -2; df -h / | tail -1; curl -s ifconfig.me` (host ubuntu24-openclaw-…, 4 vCPU, 3,8 GiB, 19 GB, IP <ip-vps>); (4) `hpclaw gateway status`, `hpclaw channels status`, `hpclaw automations list` (tiga automations HalalPilot), `systemctl status halalpilot-api halalpilot-gateway --no-pager | grep Active`, `free -m` (pakai < 2,5 GB).
Teks layar kecil: "VPS lomba: 4 vCPU · 4 GB · 20 GB — AI Hosting IDwebhost (CloudBaik)".
Narasi: "Semuanya berjalan di satu VPS AI Hosting IDwebhost: OpenClaw sebagai agent dan kanal Telegram, plus layanan kecil Node dan SQLite yang memegang aturan. Model membaca dan berbicara. Kode memutuskan hukum."

## 1:30–3:00 — UMK-017: intake dan keputusan pertama
Layar kiri: akun "Dapur Bu Ratih" mengirim "halo" → agent menawarkan pendaftaran, meminta persetujuan data (tanpa KTP). UMK kirim NIB, nama produk "Nastar", **foto label komposisi**.
Agent membalas daftar bahan yang terbaca dan bertanya apakah benar. UMK: "benar".
Agent: hasil evaluasi → "Layak self-declare, dokumen belum lengkap. Margarin (E11) dan vanili perlu keterangan pemasok. Yang lain aman (KMA 1360). Tersisa 40 hari."
Terminal: log `EXTRACT → set_ingredients → evaluate (rules 2026-09-02.1) → request_chase`.
Narasi menegaskan: keputusan datang dari mesin aturan dengan rujukan pasal, bukan dari tebakan model.

## 3:00–4:00 — UMK-088: keputusan berbeda untuk kasus berbeda
Layar kiri: "Bakso Pak Darto" kirim foto label. Agent: daging sapi terdeteksi → "Produk mengandung daging (E09): saya butuh sertifikat halal RPH pemasok. Dagingnya digiling di mana? (E10)". UMK: "di pasar". Agent: minta nama jasa giling atau sertifikatnya; menawarkan menghubungi pemasok jika diizinkan. UMK: "boleh, ini kontaknya".
Dashboard: UMK-088 berubah "menunggu dokumen", dua dokumen diminta.
Narasi: "Kasus yang sama di mata orang awam, jalan yang berbeda di mata aturan. Agent tidak menyamaratakan."

## 4:00–5:00 — Pengejaran otomatis dan kegagalan yang ditangani
Terminal: jalankan `curl -X POST .../chase/sweep` (mensimulasikan sapuan 09:00) → log `hooks/agent → [CHASE] tahap 1 → UMK-017`.
Layar kiri: Bu Ratih menerima pengingat ramah soal sertifikat margarin. Ia mengirim foto sertifikat → agent mencatat, cek registry (mock) → "valid sampai 2027". Evaluasi ulang → **SELF_DECLARE_SIAP**.
Layar kiri (akun pemasok fiktif): pesan agent ke pemasok daging UMK-088 (izin sudah diberikan) → pemasok tidak membalas → terminal menunjukkan tahap 2 dijadwalkan D+3 dan eskalasi D+10 ke pendamping.
Narasi: "Yang diam tidak dilupakan. Setiap dokumen punya jadwal kejar dan jalur eskalasi."

## 5:00–6:00 — UMK-042: cepat, tetapi terjebak di OSS
Layar kiri: "Sambal Mak Ijah" → semua bahan dikecualikan/positif → tetapi agent: "Data NIB Anda memakai KBLI 47xxx (perdagangan), produk sambal butuh KBLI 10772 (E15). Ini penyebab penolakan paling sering. Tambahkan KBLI di OSS dulu; berikut langkahnya."
Narasi: "Bahan aman bukan berarti berkas aman. Pemeriksaan silang ke data NIB menangkap kesalahan yang biasanya baru ketahuan setelah ditolak."

## 6:00–7:15 — Dossier dan review pendamping
Terminal: `build_dossier UMK-017` → PDF dibuat, hash tercatat.
Layar kanan: buka PDF dossier (formulir pernyataan, daftar bahan dengan status per bahan, alur proses, draf Manual SJPH lima kriteria).
Layar kiri (akun pendamping): notifikasi "Dossier UMK-017 siap review, skor 100". Pendamping membalas "setuju UMK-017" → agent mengonfirmasi, status **siap unggah**. Pendamping: "ajukan UMK-017" → agent: "Ini simulasi SiHalal, bukan portal asli" → nomor simulasi terbit.
Dashboard: UMK-017 hijau. Papan: "1 siap unggah / 2 menunggu dokumen / 117 belum mulai", hari tersisa.
Narasi: "Keputusan akhir tetap di tangan pendamping dan BPJPH. Agent membuat pendamping bisa menyetujui dalam satu menit, bukan menyusun dalam satu jam."

## 7:15–7:50 — Digest pagi dan bukti otonomi
Terminal: `openclaw automations run "HalalPilot digest pagi"` (atau tunjukkan hasil 07:00 yang sudah masuk).
Layar kiri (pendamping): ringkasan 10 baris: angka portofolio, 5 UMK mendesak, 1 eskalasi terbuka (pemasok UMK-088).
Dashboard: tab "Audit" menampilkan event_log hari itu: 3 intake, 3 evaluasi, 4 pengejaran, 1 dossier, 1 approval.

## 7:50–8:30 — Arsitektur, batas, replikasi, penutup
Layar: diagram satu slide (Telegram → OpenClaw Gateway → skill → Express/SQLite → rules YAML; hooks & automations balik ke Telegram).
Narasi: "Empat batas yang kami pegang: menyiapkan bukan menerbitkan, tidak menyentuh SiHalal asli, keputusan halal milik BPJPH dan pendamping, data UMK minimal dan bisa dihapus. Seluruh kode, aturan YAML, dan konfigurasi OpenClaw terbuka, jadi koperasi atau dinas mana pun bisa menjalankannya di Cloud VPS 4 GB seperti AI Hosting IDwebhost ini. Tautan repo dan artikel di deskripsi."
Lower-third terakhir: "AI HackFest 2026 · Business Automation · Dibangun dengan OpenClaw di AI Hosting IDwebhost".

---

## Persiapan rekaman (H5 pagi)
- Reset database ke seed awal (`npm run seed:demo`), pastikan 120 UMK dengan 3 UMK demo status `baru`.
- Tiga akun Telegram fiktif + 1 akun pendamping + 1 akun "pemasok" sudah di `allowFrom`.
- Foto label 3 produk dicetak/ditampilkan di HP untuk difoto ulang (terlihat asli di layar).
- Jalankan `openclaw security audit --deep`, simpan output untuk artikel.
- Rekam 2–3 take penuh; pilih take tanpa jeda model > 8 detik. Jika model lambat, potong tunggu dengan jump-cut, jangan mempercepat rekaman.
- Ambil B-roll: `htop`, `docker stats`/`free -m`, `openclaw automations list`, panel VPS.
