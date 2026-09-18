# Runbook Demo Solo — HalalPilot di VPS lomba (rekam sendiri, satu akun Telegram)

Dokumen ini cukup untuk merekam seluruh video tanpa bantuan siapa pun. Setiap adegan berisi: **perintah VPS** yang dijalankan sebelum adegan,
**pesan Telegram** yang diketik persis, **jawaban bot yang diharapkan** (intinya; kalimat boleh berbeda), **yang direkam**, dan **narasi**
untuk sulih suara/teks nanti. Kerjakan berurutan; potong rekaman per adegan, gabung saat edit.

## 0. Persiapan dari nol (10 menit, tidak direkam)

Mulai dari laptop kosong: belum ada terminal terbuka, belum ada tunnel.

### 0.1 Dua tab WSL
Buka **dua** tab WSL Ubuntu (keduanya prompt `fauzan@pti-windows1793:~$`).

**Tab 1 = OPERATOR (perintah hpdemo + footage terminal).** Ketik:
```
ssh hp-vps
```
Prompt berubah menjadi `root@ubuntu24-openclaw-92cdd46c:~#`. Cek:
```
hostname; hpdemo status
```
Harus tampil: `ubuntu24-openclaw-92cdd46c`, `active active`, publik hanya `0.0.0.0:4422 [::]:4422`, RAM ±1000 MB, health `"ok":true`, akun `"role":"umk" "kode":"UMK-017"`.

**Tab 2 = TUNNEL (dibiarkan hidup, tidak diketik apa pun lagi).** Ketik:
```
ssh -L 3001:127.0.0.1:3000 hp-vps
```
Tidak boleh ada baris `Address already in use`. Prompt berubah ke `root@…`; biarkan begitu saja. (Port lokal 3001 dipakai karena 3000 di laptop sering masih dipegang tunnel lama atau `npm run dev`.)

Jika Tab 2 menampilkan `Address already in use` untuk 3001 juga: ganti angka ke 3002 dan pakai angka itu di alamat dashboard.

### 0.2 Dashboard HalalPilot (aplikasi kita)
Browser Windows (Chrome/Edge biasa, bukan panel Claude) →
```
http://127.0.0.1:3001/dashboard
```
Pop-up "Token API" muncul → tempel nilai `HALALPILOT_API_TOKEN` dari file `.env.vps` (hanya 48 karakter heksa, tanpa `HALALPILOT_API_TOKEN=`) → Masuk. Papan 120 UMK tampil: 0 siap unggah, 21 menunggu dokumen, 99 belum mulai, 38 hari. Token tersimpan di tab ini; jangan tutup tabnya.
Inilah **dashboard aplikasi**; biarkan terbuka di kanan layar selama adegan Telegram (memuat ulang sendiri tiap 10 detik).

### 0.3 "Dashboard VPS" (syarat panitia)
Instance lomba dibuat di akun panitia, jadi tidak tampil di panel cloudbaik.com Anda. Bukti VPS diambil dari **tiga tab browser + Tab 1**, direkam di adegan 2:
1. Tab browser `https://cloudbaik.com/app/dashboard` (sudah login) — 3 detik, lalu halaman produk Cloud VPS / AI Hosting di idwebhost.com.
2. Email akses panitia (Gmail/Outlook) — **tutup baris Password** (highlight hitam / gulir keluar layar). Yang terbaca: nama instance `<nama-instance>`, IP `<disensor>`, port 4422.
3. Tab 1: perintah spesifikasi (lihat adegan 2).

### 0.4 Telegram
Telegram Desktop (disarankan) atau web.telegram.org di browser Windows → chat **@halalpilot_koperasi_bot** → gulir ke bawah. Nanti `/new` diketik di awal setiap adegan berperan (3, 8, 9).
Digest pukul 07.00 yang sudah masuk = bukti automation berjalan pada jadwal; dipakai di adegan 10.

### 0.5 Foto label
Buka `docs/demo-labels.html` di browser → tangkap layar label **Nastar Dapur Bu Ratih** → simpan PNG. Siapkan di ponsel atau Telegram Desktop untuk dikirim di adegan 3 dan 9.

### 0.6 Tata letak & alat rekam
Layar: **Telegram di kiri; di kanan DASHBOARD pada adegan Telegram (3, 4, 5, 8, 9) dan TERMINAL Tab 1 pada adegan 2, 6, 7, 11.** Dashboard memuat ulang sendiri tiap 10 detik, jadi perubahan status/skor/jejak agen tampak langsung tanpa klik. Tab CloudBaik/email direkam terpisah. Snipping Tool: Win+Shift+S → ikon video → tarik area → Start. Tanpa mic; narasi direkam belakangan. Uji 10 detik, cek file di `Videos\Screen Recordings`.
Gateway WSL lama harus MATI (tidak ada `openclaw gateway run` di tab mana pun).

### 0.7 Reset keadaan (Tab 1)
```
hpdemo reset-bergerak
```
Keluaran: `"umk":120`, `akun … kini UMK UMK-017`, lalu baris `{"seed":"bergerak","selesai":12,"siap_unggah":6,"review":6,"eskalasi":3,…}` dan `"siap_unggah":18 … "laju":{…}`.
Portofolio "sedang bergerak": 18 UMK siap/selesai, 6 menunggu review, 3 eskalasi, laju 7 hari 1,9 per hari vs 2,7 yang dibutuhkan. **UMK-017, UMK-042, UMK-088 tetap segar** untuk dimainkan di Telegram. (`hpdemo reset` saja = portofolio kosong, bila ingin memperagakan dari nol.)
Muat ulang dashboard (Ctrl+Shift+R) → kalimat situasi "18 dari 120 UMK siap unggah", funnel berwarna, 3 eskalasi merah. Lalu tekan Record dan masuk adegan 1.

Perintah `hpdemo` (di Tab 1):
```
hpdemo reset                 # DB segar 120 UMK (portofolio kosong), hapus PDF, akun → UMK-017
hpdemo reset-bergerak        # reset + portofolio sedang bergerak (adegan pembuka); UMK skenario tetap segar
hpdemo role <UMK-017|UMK-042|UMK-088|pendamping>
hpdemo eval <kode>           # evaluasi → tugas pengejaran
hpdemo sweep <hari>          # sapu pengejaran, waktu maju N hari (2=tahap1, 4=tahap2, 8=tahap3, 11=tahap4)
hpdemo mark-sent <kode>      # tandai tahap 1–3 terkirim (sebelum eskalasi)
hpdemo ensure-eskalasi <kode># pastikan tugas tahap 4 ada & mengarah ke pendamping koperasi
hpdemo digest                # jalankan ringkasan pagi sekarang
hpdemo pdf <kode>            # daftar PDF dossier
hpdemo status
```

---

## Adegan 0 — Reset (tidak direkam)
**Tab 1:** `hpdemo reset-bergerak` (lihat 0.7). Dashboard: muat ulang → 18/120 siap unggah, 6 menunggu review, 3 eskalasi, UMK-017 masih intake.

## Adegan 1 — Masalah (0:00–0:45) — rekam: dashboard + teks
**Rekam:** tab dashboard (portofolio bergerak): kalimat situasi **18 dari 120 UMK siap unggah · 38 hari**, indikator laju merah (1,9 vs 2,7 per hari — di bawah kebutuhan), funnel tersegmentasi, kartu "Butuh tindakan pendamping 9" (3 eskalasi · 6 review), papan dengan 3 ubin merah berbendera di urutan teratas. Klik segmen funnel "menunggu dokumen" → papan terfilter; klik "Semua" kembali.
**Narasi:** "Menurut INDEF yang mengutip data Bappenas, baru sekitar 4 persen pelaku usaha di Indonesia yang produknya bersertifikat halal. Padahal mulai 18 Oktober 2026, makanan dan minuman UMK tanpa sertifikat halal melanggar aturan. Pemerintah sudah menyiapkan 1,35 juta kuota gratis dan lebih dari 111 ribu pendamping. Masalahnya bukan kuota. Satu pendamping memegang ratusan UMK, dan berkasnya hampir tidak pernah lengkap sejak awal. Yang kurang bukan aplikasi untuk mengunggah dokumen. Yang kurang adalah seseorang yang mengerjakan dan mengejar dokumennya. Itu yang HalalPilot lakukan."
**Teks layar kecil:** `4%: INDEF mengutip Bappenas, Republika 21/8/2026 · 17 Okt 2026: PP 42/2024 · kuota & P3H: BPJPH`.

## Adegan 2 — Lingkungan (0:45–1:30) — rekam: browser + Tab 1
**Rekam berurutan:** (a) 3 detik `cloudbaik.com` yang sudah login → halaman produk Cloud VPS / AI Hosting IDwebhost; (b) email akses panitia dengan sandi disensor; (c) Tab 1, ketik satu per satu:
```
hostnamectl | head -3; nproc; free -h | head -2; df -h / | tail -1
hpclaw gateway status 2>/dev/null | grep -E "Config|Connectivity"; hpclaw channels status 2>/dev/null | grep -i telegram
hpclaw automations list 2>/dev/null | grep -E "^ID|HalalPilot"
systemctl status halalpilot-api halalpilot-gateway --no-pager | grep -E "●|Active"
```
**Yang tampak:** host `ubuntu24-openclaw-…`, 4 CPU, 3,8 GiB, disk 19 GB; Telegram connected/polling; 3 automations HalalPilot (kolom Last digest pagi: `2h ago ok` = jadwal 07.00 berjalan sendiri); dua unit `active (running)`.
**Narasi:** "Semuanya berjalan di satu VPS AI Hosting IDwebhost berkapasitas 4 vCPU dan 4 GB: OpenClaw sebagai agen dan kanal Telegram, plus layanan kecil Node dan SQLite yang memegang aturan. Model membaca dan berbicara. Kode memutuskan hukum."
**Teks layar:** `VPS lomba: 4 vCPU · 4 GB · 20 GB — AI Hosting IDwebhost (CloudBaik)`.

## Adegan 3 — Intake UMK-017 (1:30–3:00) — layar: Telegram kiri, dashboard kanan
**Peran:** Anda = UMK "Dapur Bu Ratih" (sudah dari reset). Bot = agen HalalPilot.
| Langkah | Ketik | Jawaban bot (teramati 10 Sep) | Jeda |
|---|---|---|---|
| 1 | `/new` | ✅ New session started. | 1 s |
| 2 | `halo` | "Halo, Dapur Bu Ratih (UMK-017). Status saat ini: Produk Nastar; jalur belum ditentukan; dokumen kurang: daftar bahan, foto produk, cerita proses (+ permohonan, pernyataan, ikrar, manual SJPH disusun sistem); 38 hari. Langkah berikutnya: kirim foto label…" | 30–60 s |
| 3 | **foto label Nastar** + `ini label produk saya` | "Dari label, saya ekstrak daftar bahan: tepung terigu (positif), margarin (kritis, butuh sertifikat pemasok), telur (dikecualikan), gula pasir (positif), selai nanas (positif), vanili (positif). Apakah daftar ini benar? Balas benar atau koreksinya." | 60–90 s (vision) |
| 4 | `benar` | "Daftar bahan sudah diverifikasi. Jalur: SELF_DECLARE_KURANG_DOKUMEN (skor 60%). Masih diperlukan: sertifikat halal pemasok margarin, cerita singkat proses produksi. Dokumen lain disusun otomatis." | 40–60 s |
**Dashboard:** setelah langkah 4 kartu 017 kelabu → kuning "menunggu dokumen", angka 60; klik 017 → keputusan terakhir E11 sertifikat margarin, jejak EXTRACT → BAHAN_KOREKSI → EVALUATE.
**Narasi:** "UMK cukup memotret label. Agen membaca komposisi, memetakan tiap bahan ke aturan KMA 1360 tentang bahan yang dikecualikan, lalu meminta konfirmasi. Yang menentukan jalur bukan modelnya, melainkan mesin aturan: margarin adalah bahan kritis, jadi sertifikat pemasoknya wajib."

## Adegan 4 — Proses, sertifikat, dossier otomatis (3:00–3:50) — layar: Telegram kiri, dashboard kanan
| Langkah | Ketik | Jawaban bot | Jeda |
|---|---|---|---|
| 1 | `Proses produksi: tepung, margarin, telur, gula dicampur jadi adonan, diisi selai nanas, dipanggang 20 menit, didinginkan, dikemas toples.` | "Cerita proses tersimpan. Jalur KURANG_DOKUMEN (skor 80%). Masih diperlukan: sertifikat halal pemasok margarin." | 60–90 s |
| 2 | `sertifikat margarin dari PT Palmindo Lestari nomor ID00110000123450226` | "Sertifikat margarin PT Palmindo Lestari tercatat. Jalur SELF_DECLARE_SIAP (skor 100%). Status siap_review. **Dossier sudah disusun otomatis** dan dikirim ke pendamping untuk ditinjau." | 60 s |
Catatan: karena skor 100 langsung memicu penyusunan berkas, **tidak perlu** mengetik `buat berkas`. Jika bot hanya menawarkan, barulah ketik `buat berkas`.
**Dashboard:** 017 → "siap review", angka 100; jejak SERT_PEMASOK → EVALUATE → DOSSIER_BUILT; tautan "PDF v1".
**Narasi:** "Nomor sertifikat pemasok dicek ke registry, di sini simulasi. Begitu semua syarat terpenuhi, skor mencapai 100 dan agen langsung menyusun berkas self-declare untuk ditinjau pendamping."

## Adegan 5 — PDF dossier v1 (3:50–4:10) — layar: penampil PDF
Tab WSL baru (prompt `fauzan@…`):
```
scp hp-vps:/var/lib/halalpilot/pdf/UMK-017/dossier-v1.pdf /mnt/c/Users/MuhammadFauzanRamadh/Downloads/ && explorer.exe "C:\Users\MuhammadFauzanRamadh\Downloads"
```
Buka `dossier-v1.pdf`, rekam 10–15 detik: halaman 1 (identitas, surat permohonan & pernyataan), tabel bahan dengan kelas dan sertifikat, foto label, draf Manual SJPH.
**Narasi:** "Berkas tersusun: surat permohonan, pernyataan, ikrar, daftar bahan dengan kelasnya, ringkasan proses, foto label, dan draf Manual SJPH. Setiap versi punya sidik jari SHA-256."

## Adegan 6 — Pengejaran otomatis UMK-042 (4:10–5:00) — layar: Telegram kiri, Tab 1 kanan
**Peran:** Anda = UMK "Sambal Mak Ijah" (penerima pengingat). Pesan datang dari agen lewat scheduler; **tidak mengetik di Telegram**, tidak perlu `/new`.
```
hpdemo role UMK-042          # → akun kini UMK UMK-042 (Sambal Mak Ijah); UMK-017 dipegang akun pengganti
hpdemo eval UMK-042          # → "jalur":"SELF_DECLARE_KURANG_DOKUMEN" "skor_kesiapan":70 dokumen_diminta: DAFTAR_BAHAN, PROSES, FOTO_PRODUK, PERBAIKAN_OSS
hpdemo sweep 2               # → now=+2 hari, "dispatched":1 … "tahap":1, dokumen FOTO_PRODUK, PERBAIKAN_OSS
```
→ Telegram (±60 s): "Halo Sambal Mak Ijah, untuk Sambal Bawang saya masih menunggu foto produk/label yang jelas dan perbaikan data usaha di OSS (KBLI/alamat agar sesuai). Bisa dikirim hari ini? Cukup foto yang jelas."
```
hpdemo sweep 4               # → "tahap":2
```
→ Telegram (±60 s): "Pengingat kedua untuk Sambal Mak Ijah (UMK-042): … belum saya terima. Tenggat wajib halal 17 Oktober, tersisa 34 hari. Jika ada kesulitan, balas 'bantu'…"
**Dashboard (potongan 3 s):** kartu 042 kuning, angka 70; klik → jejak CHASE_SENT tahap 1 dan 2.
**Narasi:** "Dokumen yang kurang tidak dibiarkan menunggu. Scheduler menjadwalkan pengingat H+1, H+3, H+7 dengan nada meningkat, menghormati jam tenang dan batas dua pesan per UMK per hari. Di rekaman ini waktu dimajukan."

## Adegan 7 — Eskalasi ke pendamping (5:00–5:40) — layar: Telegram kiri, Tab 1 kanan
**Peran:** Anda = pendamping koperasi (penerima eskalasi). Tidak mengetik di Telegram.
```
hpdemo mark-sent UMK-042         # → baris 1|terkirim 2|terkirim 3|terkirim (dua dokumen)
hpdemo role pendamping           # → akun kini PENDAMPING koperasi 1; UMK-042 dipegang akun pengganti
hpdemo ensure-eskalasi UMK-042   # → daftar tugas kini memuat 4|terjadwal|FOTO_PRODUK dan 4|terjadwal|PERBAIKAN_OSS
hpdemo sweep 11                  # → "dispatched":1 … "target":"pendamping","tahap":4
```
→ Telegram (±60 s): "Eskalasi: Sambal Mak Ijah (UMK-042) belum mengirim foto produk/label yang jelas dan perbaikan data usaha di OSS setelah 3 pengingat (10 hari). Skor kesiapan 70. Saran: hubungi langsung atau tandai 'ditunda'."
**Dashboard (potongan 3 s):** kartu "Butuh tindakan pendamping" naik 9 → 10; panel "Eskalasi terbuka" 3 → 4 dengan UMK-042 di urutan terbaru; ubin 042 merah berbendera ⚑ naik ke urutan atas.
**Narasi:** "Kalau UMK diam sepuluh hari, agen berhenti mengejar dan melapor ke pendamping. Pendamping tahu persis siapa yang perlu ditelepon."

## Adegan 8 — Review pendamping (5:40–6:30) — layar: Telegram kiri, dashboard kanan
**Peran:** Anda = pendamping (sudah dari adegan 7).
| Langkah | Ketik | Jawaban bot | Jeda |
|---|---|---|---|
| 1 | `/new` | New session started. | 1 s |
| 2 | `status saya` | "Halo, Pendamping Koperasi. Ringkasan portofolio: Total 120; siap unggah 18; menunggu review 7 (6 seed + UMK-017); menunggu dokumen ±24; belum mulai ±70; 38 hari. UMK mendesak: UMK-042 skor 70…; Eskalasi terbuka: 4 (3 UMK seed + Sambal Mak Ijah UMK-042); Aktivitas hari ini… Semua data OSS, SEHATI, SiHalal dalam simulasi." (angka boleh sedikit berbeda) | 60–90 s |
| 3 | `kembalikan UMK-017 foto label kurang jelas, tolong foto ulang` | "✅ Dossier Dapur Bu Ratih (UMK-017) dikembalikan. Dokumen yang perlu diulang: foto produk (kurang jelas). 4 pengingat dibuat. Status UMK siap_review → dikembalikan." | 60–90 s |
**Dashboard:** 017 → "Dikembalikan", angka 80; klik → jejak RETURN → EVALUATE (skor 80) → CHASE_REQUEST.
**Narasi:** "Pendamping tetap pemegang keputusan. Ia bisa mengembalikan berkas dengan satu kalimat; agen meneruskan alasannya ke UMK, mencatat keputusan baru, lalu mulai mengejar lagi."

## Adegan 9 — Foto ulang → v2 → setuju → ajukan (6:30–7:15) — layar: Telegram kiri, dashboard kanan
**Tab 1:** `hpdemo role UMK-017` → "akun kini UMK UMK-017 (Dapur Bu Ratih), N tugas pengejaran dialihkan ke akun ini".
| Langkah | Peran | Ketik | Jawaban bot | Jeda |
|---|---|---|---|---|
| 1 | UMK | `/new` | New session started. | 1 s |
| 2 | UMK | **foto label** + `ini foto ulang yang lebih jelas` | daftar 6 bahan (sama), "Apakah daftar ini benar?" | 60–90 s |
| 3 | UMK | `benar` | "FOTO_PRODUK diterima… Jalur SELF_DECLARE_SIAP (100%). Dossier versi 2 disusun, menunggu review." (jika hanya ditawarkan: `buat berkas`) | 60 s |
| — | Tab 1 | `hpdemo role pendamping` | "akun kini PENDAMPING koperasi 1" | — |
| 4 | Pendamping | `/new` | New session started. | 1 s |
| 5 | Pendamping | `setuju UMK-017` | "Dossier versi 2 telah disetujui. Status UMK kini siap_unggah. Untuk simulasi, kirim ajukan UMK-017." | 30–60 s |
| 6 | Pendamping | `ajukan UMK-017` | "Simulasi pengajuan SiHalal selesai. UMK-017 memperoleh nomor simulasi SIM-2026MMDD-0001, status diterima. Status UMK selesai_simulasi. Catatan: hanya simulasi, bukan pengajuan resmi ke BPJPH." | 30–60 s |
**Dashboard:** setelah langkah 3: 017 "siap review" 100; setelah 5: "siap unggah"; setelah 6: 017 **hijau**, "Siap unggah / selesai" = 1, "1% siap unggah".
**Narasi:** "Foto ulang menutup permintaan secara otomatis. Berkas versi dua disetujui pendamping, lalu diajukan ke SiHalal, di sini simulasi berlabel jelas. HalalPilot menyiapkan berkas; keputusan halal tetap di BPJPH."

## Adegan 10 — Digest & dashboard (7:15–7:45) — layar: Telegram kiri, dashboard kanan
Tab 1: `hpdemo digest` → ±60 s ringkasan baru dengan angka portofolio bergerak: "120 UMK • 19 siap unggah • … menunggu dokumen • … belum mulai; 5 UMK paling mendesak; Eskalasi terbuka: 4 …". (Pesan digest pukul 07.00 pagi memakai portofolio kosong — jangan dipakai.)
**Dashboard:** papan akhir: 017 hijau 100 di antara UMK selesai lainnya, 042 merah ⚑ 70 di urutan atas; panel Eskalasi terbuka 4 (3 seed + UMK-042); "Menunggu persetujuan pendamping" berisi 6 dossier dengan perintah Telegram; klik 017 → jejak lengkap sampai submit simulasi dan panel "Langkah berikutnya: Selesai".
**Narasi:** "Setiap pagi pukul tujuh pendamping menerima ringkasan seperti ini, tanpa membuka aplikasi apa pun."

## Adegan 11 — Batas & penutup (7:45–8:30) — layar: Tab 1 + teks
**Tab 1:** `hpdemo status` → `active active`, publik hanya `0.0.0.0:4422 [::]:4422`, RAM ±1000 MB dari 3915, health ok.
**Teks layar (4 baris):** "Menyiapkan, bukan menerbitkan. · OSS/SEHATI/SiHalal di demo ini simulasi. · Tanpa KTP, HP, rekening; data bisa dihapus. · Berjalan di VPS AI Hosting IDwebhost 4 vCPU/4 GB."
**Narasi:** "Empat batas yang kami pegang: HalalPilot menyiapkan bukan menerbitkan; portal pemerintah di sini simulasi; tidak ada data pribadi yang disimpan; dan semuanya muat di satu VPS kecil AI Hosting IDwebhost. Kode sumber, aturan, dan skenario ujinya terbuka."

---

## Pemulihan cepat
| Masalah | Tindakan |
|---|---|
| Bot menjawab dalam peran salah | `hpdemo role <peran>` lalu `/new`, ulangi pesan |
| Dashboard tidak bisa dibuka | Tab 2 masih hidup? Jika mati, buka tab WSL baru: `ssh -L 3001:127.0.0.1:3000 hp-vps`; alamat tetap `127.0.0.1:3001/dashboard` |
| Foto tidak terbaca / bahan Inggris | kirim ulang foto yang lebih tajam; bila tetap, ketik `koreksi: tepung terigu, margarin, telur, gula pasir, selai nanas, vanili` |
| Sweep `dispatched:0` | cek `hpdemo eval <kode>` sudah dijalankan; pakai angka hari lebih besar (tahap 1 butuh ≥ +24 jam) |
| Sweep 11 `dispatched:0` (eskalasi) | `hpdemo ensure-eskalasi UMK-042` (tahap 4 belum terbentuk bila evaluasi berjalan saat koperasi tanpa pendamping), lalu `hpdemo sweep 11` |
| scp membuat berkas bernama "Desktop" | Desktop dialihkan ke OneDrive; pakai tujuan `/mnt/c/Users/MuhammadFauzanRamadh/Downloads/` dengan garis miring |
| Eskalasi tidak sampai | pastikan `hpdemo role pendamping` dijalankan SEBELUM `hpdemo sweep 11` |
| Pesan bot berisi narasi/"Exec" | streaming sudah dimatikan; jika muncul lagi, `systemctl restart halalpilot-gateway` di Tab 1 |
| Ulang total | `hpdemo reset` → adegan 3 |

## Pasca-produksi (syarat lomba)
- Durasi 5–10 menit, 1080p 16:9, tanpa musik berhak cipta; watermark IDwebhost; lower-third "AI Hosting IDwebhost"; sebut "AI Hosting" dan IDwebhost dalam narasi/teks.
- Sensor: sandi di email panitia, token di terminal (jangan tampilkan `.env`), nomor Telegram tidak perlu disensor (ID numerik bukan nomor HP).
- Artikel ≥ 800 kata dari `docs/article-outline.md`; anchor "AI Hosting" → idwebhost.com/ai-hosting, "Cloud VPS" → cloudbaik.com.
- Angka: hanya dari `docs/angka-resmi.md`.
