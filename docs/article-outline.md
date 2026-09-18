# Kerangka Artikel (≥ 800 kata, target 1.100–1.300)

Platform: blog pribadi (domain sendiri, terindeks) atau LinkedIn Articles; jangan Medium jika ada paywall. Tulis **baru** setelah video selesai; aturan lomba melarang teks yang pernah dipublikasikan. Bahasa Indonesia.

**Judul (pilih satu):**
1. "Halalmax Menunggu Dokumen, HalalPilot Mengejarnya: Agent OpenClaw untuk 120 UMK Menjelang 17 Oktober"
2. "Membangun Agent Pendamping Halal di VPS 4 GB: Yang Diputuskan Model, Yang Diputuskan Kode"
3. "40 Hari Sebelum Wajib Halal: Bagaimana Satu Agent Menyiapkan Berkas Ratusan UMK"

**Backlink wajib (letakkan natural, sekali masing-masing, di bagian 5):**
- anchor **AI Hosting** → https://idwebhost.com/ai-hosting
- anchor **Cloud VPS** → https://cloudbaik.com

---

## 1. Pembuka: tenggat yang tidak bergeser (±150 kata)
- 18 Oktober 2026 kewajiban halal UMK makanan-minuman berlaku penuh (PP 42/2024); Kemenag menegaskan tidak ada penundaan (rakor 12 Agustus 2026).
- Satu angka resmi BPJPH (pilih: kuota SEHATI 1,35 juta 2026, atau 13 juta produk bersertifikat kumulatif). **Jangan** pakai angka 4% atau 24% yang belum terverifikasi.
- Pembuka: baru ±4% pelaku usaha yang produknya bersertifikat halal (INDEF mengutip Bappenas 2026, Republika 21/8/2026) vs kewajiban mamin UMK 17 Okt 2026 (PP 42/2024). Lalu angka BPJPH: 1,35 juta kuota SEHATI, >111 ribu P3H, 13 juta produk (satuan produk, bukan pelaku usaha).
- Satu kalimat masalah: pendamping (P3H) memegang ratusan UMK, berkas tidak lengkap, tidak ada yang mengejar.

## 2. Kenapa bukan chatbot halal lagi (±150 kata)
- BPJPH sudah punya Halalmax (dashboard P3H) dan chatbot Lapor BABE; aplikasi pemindai bahan sudah banyak.
- Celah: tidak ada yang **mengerjakan** penyiapan dan **mengejar** yang kurang. Halalmax adalah tempat paket berakhir, bukan pesaing.
- Pilihan persona: koperasi/paguyuban, bukan UMK tunggal, bukan BPJPH.

## 3. Apa yang agent lakukan, dalam bahasa pendamping (±250 kata)
- Tiga UMK dari video sebagai contoh konkret: Nastar (kurang sertifikat margarin), Bakso (daging tanpa sertifikat RPH, digiling di pasar), Sambal (bahan aman tapi KBLI di NIB salah).
- Alur: intake foto → daftar bahan dikonfirmasi UMK → klasifikasi (KMA 1360/2021) → keputusan jalur (Kepkaban BPJPH 146/2025) dengan rujukan aturan → pengejaran D+1/D+3/D+7/eskalasi → dossier PDF + Manual SJPH → review pendamping → simulasi pengajuan.
- Kalimat kunci: "Agent tidak pernah menaikkan atau menurunkan jalur sendiri. Ia memanggil mesin aturan dan menjelaskan hasilnya."

## 4. Yang diputuskan model, yang diputuskan kode (±200 kata)
- Model (OpenClaw + model cloud): membaca foto, memahami bahasa UMK, menulis pengingat sesuai nada, merangkum portofolio.
- Kode (Express + SQLite + YAML): kelayakan, dokumen wajib, jadwal kejar, idempotency, audit log, hash dossier.
- Kenapa: model default yang kualitasnya tidak kita kendalikan tidak boleh memegang keputusan hukum; aturan YAML bisa diperiksa pendamping dan diperbarui tanpa menyentuh kode.
- Sebut fitur OpenClaw yang dipakai: Gateway 24 jam, channel Telegram, skill kustom (SKILL.md + skrip), `/hooks/agent` untuk event dari scheduler, automations cron untuk digest, `imageModel` terpisah.

## 5. Menjalankannya di VPS 4 GB (±200 kata) ← backlink di sini
- Anggaran RAM nyata dari `free -m`: OS, Gateway, Node, tanpa Chromium, tanpa Ollama; kenapa model lokal 3–4B tidak muat berdampingan dan apa alternatifnya (embedding lokal untuk memori).
- Kalimat backlink 1: "Seluruh demo berjalan di satu paket [AI Hosting](https://idwebhost.com/ai-hosting) IDwebhost yang sudah menyertakan OpenClaw, sehingga hari pertama habis untuk hardening, bukan instalasi."
- Kalimat backlink 2: "Untuk replikasi di koperasi lain, [Cloud VPS](https://cloudbaik.com) 4 core/4 GB sudah cukup; biaya model per UMK di bawah Rp500 untuk satu siklus intake sampai dossier." (isi angka nyata dari log token).
- Hardening yang dilakukan: bind loopback, token, allowlist Telegram, tanpa skill ClawHub, `openclaw security audit`.

## 6. Batas dan kepatuhan (±120 kata)
- Empat batas: menyiapkan bukan menerbitkan; tidak menyentuh SiHalal/OSS/SEHATI asli (semua mock berlabel); keputusan halal milik BPJPH dan P3H; data UMK minimal, ada consent, bisa dihapus (UU 27/2022, PP 33/2026 berlaku 16 Jan 2027).
- Data demo sintetis, entitas fiktif.

## 7. Yang belum selesai dan langkah berikutnya (±100 kata)
- Butuh integrasi resmi (API Halalmax/SiHalal) yang hanya bisa dibuka BPJPH; sampai saat itu paket diunggah manusia.
- Kamus bahan: bagian dikecualikan diambil dari seluruh lampiran KMA 1360/2021 (182 hal.); kelas positif/kritis disusun dari praktik LPH dan masih perlu divalidasi P3H/LPH — diakui terbuka sebagai batas.
- Uji lapangan dengan satu koperasi nyata setelah 17 Oktober (tenggat berikutnya: produk luar negeri dan penahapan lain).

## 8. Penutup (±60 kata)
- Kembali ke pendamping: dari menyusun berkas satu jam menjadi menyetujui satu menit.
- Tautan repo (kode, YAML, openclaw.json5, seed data), tautan video, hashtag lomba jika ada.

**Checklist sebelum publish:** ≥800 kata (hitung), dua backlink dengan anchor persis, tidak ada kalimat yang menjanjikan sertifikat, tidak ada angka tanpa sumber, gambar: diagram arsitektur + tangkapan layar dashboard + tangkapan `free -m`, tanggal publikasi ≤ 30 September, URL diuji terindeks (site:).
