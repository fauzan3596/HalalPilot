# Teks unggah YouTube — HalalPilot-demo-v11.mp4

Berkas: `Videos/HalalPilot-edit/HalalPilot-demo-v15.mp4` (9:53, 1920×1080, 30 fps, 108 MB). Visibilitas: **Publik** (syarat lomba). Kategori: Science & Technology. Bahasa: Indonesia.

## Judul (≤ 100 karakter)

HalalPilot: Agen OpenClaw Penyiap Berkas Halal UMK di VPS AI Hosting IDwebhost — Demo AI HackFest 2026

## Deskripsi

HalalPilot adalah agen OpenClaw di Telegram yang menyiapkan dan mengejar berkas sertifikasi halal self-declare untuk UMK anggota koperasi, menjelang wajib halal makanan-minuman UMK 17 Oktober 2026 (PP 42/2024).

Yang ditunjukkan di video: intake dari foto label → daftar bahan dipetakan ke KMA 1360/2021 → mesin aturan deterministik (Kepkaban BPJPH 146/2025) menentukan jalur, skor, dan dokumen yang masih kurang → berkas PDF disusun otomatis → pengingat bertahap dan eskalasi ke pendamping → review, kembalikan, setuju, dan pengajuan simulasi. Model memutuskan bahasa; kode memutuskan hukum.

Semua berjalan di satu VPS AI Hosting IDwebhost (4 vCPU / 4 GB RAM, Ubuntu 24.04) dengan OpenClaw 2026.8.2, layanan Node + SQLite, tanpa Docker dan tanpa browser headless.

Kode, aturan YAML, konfigurasi OpenClaw, skenario uji (MIT): https://github.com/fauzan3596/HalalPilot
Artikel: [URL Blogspot — isi setelah tayang]
Video ini: https://www.youtube.com/watch?v=BD1u7aonZNI
AI Hosting IDwebhost: https://idwebhost.com/ai-hosting

Catatan: OSS, SEHATI, dan SiHalal dalam demo ini simulasi berlabel. HalalPilot menyiapkan berkas, tidak menerbitkan sertifikat; keputusan halal tetap di BPJPH dan pendamping. Tidak ada data pribadi (KTP, nomor HP, rekening) yang disimpan. Semua UMK dalam demo fiktif.

Sumber angka: INDEF mengutip Bappenas (Republika, 21 Agustus 2026); PP 42/2024 pasal 160; Kemenag di rakor Kemenko PMK 12 Agustus 2026 (Republika, 1 September 2026); BPJPH 2 Januari 2026 (kuota 1,35 juta, 111 ribu pendamping).

Bab:
0:00 Pembuka
0:12 Masalah 120 UMK
0:49 Lingkungan: VPS AI Hosting, OpenClaw
1:27 Intake: foto label → keputusan beralasan
2:49 Cerita proses & sertifikat pemasok → dossier
3:38 Dossier PDF v1
4:14 Pengejaran otomatis
4:56 Eskalasi ke pendamping
5:37 Review pendamping
6:35 Foto ulang → berkas v2 → setuju → ajukan (simulasi)
8:25 Digest pagi & dashboard
9:00 Yang berjalan di server
9:21 Hasil dalam angka & penutup

#AIHackFest2026 #IDwebhost #AIHosting #OpenClaw #HalalUMK #SelfDeclare

## Tag

HalalPilot, OpenClaw, AI HackFest 2026, IDwebhost, AI Hosting, sertifikasi halal, self-declare, UMK, koperasi, BPJPH, SEHATI, agen AI, Telegram bot, VPS

## Setelah tayang

1. Salin URL video → ganti `[URL video]` di `docs/artikel-final.md`, jalankan `node docs/artikel/build.mjs`, commit.
2. Tempel `docs/artikel/blogspot.html` ke Blogger (HTML view), unggah 4 gambar `docs/artikel/img/`, pastikan dua backlink utuh.
3. Ganti URL artikel di deskripsi YouTube.
4. Isi form submit IDwebhost (≤ 30 Sep): URL video, URL artikel, URL repo, kategori Business Automation.

## Thumbnail

Pakai `docs/video/thumbnail/thumbnail-e.png` (1280×720, "Agen AI yang ngurus berkas halal UMK", ponsel dengan skor 100/100). Cadangan: `thumbnail-f.png` (pengejaran → eskalasi) dan `thumbnail-g.png` (dari foto label jadi berkas siap; cocok untuk gambar utama artikel). Sumber HTML di folder yang sama, dirender dengan Edge headless:

```powershell
& "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless=new --disable-gpu --hide-scrollbars --window-size=1280,720 --user-data-dir=$env:TEMP\edge-thumb --screenshot=thumbnail-e.png file:///<path>/thumbnail-e.html
```
