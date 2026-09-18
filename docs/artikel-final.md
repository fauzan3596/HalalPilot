# Agen yang Mengejar Dokumen: Menjalankan OpenClaw untuk 120 UMK Menjelang Wajib Halal 17 Oktober

*Naskah final untuk Blogspot. Ditulis 19 September 2026 dari SPECS, ROADMAP, bukti uji 10 September, dan verifikasi ulang sumber. Tanda `[…]` diisi saat tayang. Gambar ada di `docs/artikel/img/`.*

---

**Ringkasan.** HalalPilot adalah agen OpenClaw di Telegram yang membantu koperasi menyiapkan berkas sertifikasi halal jalur self-declare untuk UMK anggotanya, lalu mengejar dokumen yang belum dikirim sampai berkasnya layak ditinjau pendamping. Agen tidak pernah memutuskan jalur halal sendiri; ia memanggil mesin aturan berbasis YAML yang bisa dibaca manusia, dan menjelaskan hasilnya. Seluruh demo berjalan di satu VPS 4 vCPU dengan memori 3,8 GiB, dengan integrasi ke portal pemerintah masih berupa simulasi berlabel.

![Arsitektur HalalPilot: Telegram, Gateway OpenClaw, orchestrator Express dengan mesin aturan, SQLite, dan mock berlabel simulasi](img/01-arsitektur.png)

## 1. Tenggat yang tidak bergeser

Ekonom INDEF A. Hakam Naja, mengutip data Bappenas 2026, menyebut baru sekitar 4 persen pelaku usaha di Indonesia yang produknya bersertifikat halal (Republika, 21 Agustus 2026). Padahal penahapan kewajiban halal untuk produk makanan dan minuman UMK berakhir 17 Oktober 2026 menurut PP 42/2024, dan dalam rapat koordinasi di Kemenko PMK pada 12 Agustus 2026 Kementerian Agama menegaskan tidak ada pergeseran jadwal.

Kapasitasnya bukan masalah di atas kertas. BPJPH membuka 1,35 juta kuota sertifikasi gratis lewat SEHATI 2026 dan mencatat lebih dari 111 ribu Pendamping Proses Produk Halal (P3H). Produk UMK yang sudah bersertifikat mencapai sekitar 13 juta, kumulatif sejak 2019. Dua angka itu tidak boleh disandingkan begitu saja karena satuannya berbeda: 13 juta menghitung produk, 4 persen menghitung pelaku usaha. Tetapi keduanya menunjuk hal yang sama: yang tertinggal adalah usaha kecil yang berkasnya tidak pernah lengkap sejak awal.

Yang saya lihat di lapangan sederhana. Satu pendamping memegang puluhan sampai ratusan UMK. Dokumen datang sepotong-sepotong lewat WhatsApp: foto label yang buram, cerita proses yang belum ditulis, nomor sertifikat pemasok yang belum ditanyakan. Tidak ada yang bertugas mengejar yang kurang.

## 2. Kenapa bukan chatbot halal lagi

BPJPH sudah punya Halalmax sebagai dasbor pendamping dan chatbot untuk pertanyaan umum. Aplikasi pemindai bahan juga sudah banyak. Celahnya bukan pada informasi, melainkan pada pekerjaan: tidak ada yang **mengerjakan** penyiapan berkas dan **mengejar** dokumen yang belum dikirim.

Karena itu HalalPilot dipasang untuk koperasi atau paguyuban produsen, bukan untuk UMK tunggal dan bukan untuk BPJPH. Koperasi punya pendamping yang bertanggung jawab atas banyak anggota sekaligus, dan Halalmax adalah tempat paket akhirnya diunggah, bukan pesaing.

## 3. Apa yang agen lakukan

Tiga UMK fiktif dari video menggambarkan alurnya:

- **Dapur Bu Ratih (nastar).** UMK memfoto label. Agen membaca komposisi, meminta konfirmasi daftar bahan, lalu mesin aturan menemukan margarin sebagai bahan kritis yang butuh sertifikat pemasok. Setelah cerita proses dan nomor sertifikat masuk, skor kesiapan mencapai 100 dan agen menyusun berkas self-declare secara otomatis untuk ditinjau pendamping.
- **Sambal Mak Ijah.** Bahannya aman, tetapi kode KBLI di NIB tidak mencakup produknya. Agen meminta perbaikan data OSS dan foto label. Ketika UMK diam, pengingat datang pada hari ke-1, ke-3, dan ke-7 dengan nada meningkat. Pada hari ke-10 agen berhenti mengejar dan melapor ke pendamping.
- **Bakso Pak Darto.** Daging digiling di pasar tanpa bukti dari rumah potong bersertifikat. Agen tidak menolak, tetapi meminta dokumen yang tepat dan menjelaskan aturannya.

![Percakapan Telegram: setelah UMK membalas "benar", agen menyampaikan jalur, skor 60 dari 100, alasan per aturan (E11, E13), dan dokumen yang masih diperlukan](img/04-telegram-intake.png)

Setiap jawaban mengikuti pola yang sama: jalur, alasan dengan kode aturan, dokumen yang diminta, langkah berikutnya. Pendamping meninjau lewat perintah `setuju` atau `kembalikan` dengan satu kalimat alasan. Di video, berkas Dapur Bu Ratih dikembalikan karena foto label kurang jelas; agen meneruskan alasannya ke UMK, mencatat keputusan baru dengan skor yang turun, dan mulai mengejar lagi. Foto ulang yang masuk menutup permintaan itu secara otomatis, berkas versi dua tersusun, lalu disetujui dan diajukan ke SiHalal simulasi. Setiap pagi pukul tujuh pendamping menerima ringkasan portofolio tanpa membuka aplikasi apa pun.

Kalimat kuncinya: **agen tidak pernah menaikkan atau menurunkan jalur sendiri. Ia memanggil mesin aturan dan menjelaskan hasilnya.**

## 4. Yang diputuskan model, yang diputuskan kode

| Diputuskan model (OpenClaw + model cloud) | Diputuskan kode (Express + SQLite + YAML) |
|---|---|
| Membaca foto label dan kemasan | Kelayakan self-declare: 18 aturan E01 sampai E18 dari Kepkaban BPJPH 146/2025 |
| Memahami bahasa UMK yang tidak baku | Kelas bahan menurut KMA 1360/2021 dan dokumen yang wajib menyusul |
| Menulis pengingat dengan nada yang pas | Jadwal pengejaran, jam tenang 21.00 sampai 07.00, batas dua pesan per UMK per hari |
| Merangkum portofolio untuk pendamping | Idempotensi, log audit, hash SHA-256 setiap dossier |

Alasannya: model yang kualitasnya tidak saya kendalikan tidak boleh memegang keputusan yang berdampak hukum. Aturan hidup di berkas YAML yang bisa dibaca pendamping, diberi nomor versi, dan diubah tanpa menyentuh kode. Setiap keputusan yang tersimpan membawa versi aturan yang dipakai, sehingga tetap tertelusur kalau aturan berubah. Kamus bahan saat ini memuat 509 sinonim, 124 bahan dikecualikan yang disalin dari lampiran KMA 1360/2021 setebal 182 halaman, 24 bahan positif, 33 bahan kritis, serta daftar bahan sembelihan, haram eksplisit, dan berbahaya.

Kebijakan pengejaran, misalnya, cukup dibaca sekali oleh orang non-teknis:

```yaml
tahapan:
  - { tahap: 1, setelah_jam: 24,  target: umk,        nada: ramah }
  - { tahap: 2, setelah_jam: 72,  target: umk,        nada: tegas_sopan }
  - { tahap: 3, setelah_jam: 168, target: umk,        nada: mendesak }
  - { tahap: 4, setelah_jam: 240, target: pendamping, nada: laporan }
batas: { maks_pesan_per_umk_per_hari: 2, gabungkan_dokumen: true }
```

Penjadwal di Express yang menghitung jatuh tempo dan memanggil hooks OpenClaw. Model hanya menulis kalimat pengingatnya.

## 5. Pelajaran dari OpenClaw 2026.8.2

Bagian ini yang paling banyak memakan malam. Lima temuan dari uji ujung ke ujung pada 10 September:

1. **Pengingat terkirim sebagai pesan suara.** Plugin `talk-voice` aktif otomatis, dan setelah dimatikan, TTS inti masih mengirim `sendVoice` ketika model menyisipkan penanda suara (nilai bawaan `tts.auto` adalah `tagged`). Untuk demo yang harus terbaca di layar, keduanya dimatikan, dan tool `tts` masuk daftar tolak agen.
2. **Heartbeat mengirim ke "target terakhir".** Saat satu akun demo berganti peran, heartbeat bisa jatuh ke akun pengganti yang tidak ada. Heartbeat dimatikan; digest, sapuan, dan cek kuota dijalankan lewat automations cron.
3. **Narasi rencana model bocor ke Telegram.** Kalimat seperti "saya akan menjalankan…" dan penanda "Exec" tampil sebelum jawaban akhir. Solusinya `blockStreamingDefault: "off"` ditambah streaming Telegram dimatikan, sehingga hanya jawaban akhir yang dikirim.
4. **Daftar `allow` pada tools hanya mempersempit profil.** Profil minimal dengan `allow: [exec, message]` menghasilkan "No callable tools remain". Yang bekerja: profil `coding`, tambah `message`, lalu tolak grup fs, web, ui, media, automation, dan tts.
5. **Automations punya aturan bentuk sendiri.** Bentuk cron menerima pesan sebagai argumen posisi, bentuk `--every` menuntut `--message`, job tanpa `--agent` jatuh ke agen default, job `--command` tanpa `--no-deliver` melempar keluarannya ke chat terakhir, dan `--exact` mematikan penggeseran acak jadwal.

Konfigurasi yang akhirnya dipakai, dipangkas ke bagian yang relevan:

```json5
agents: { defaults: {
  blockStreamingDefault: "off", thinkingDefault: "low",
  heartbeat: { every: "0m" } } },
channels: { telegram: { streaming: { mode: "off" }, accounts: { default: { dmPolicy: "allowlist" } } } },
plugins: { entries: { "talk-voice": { enabled: false } } },
tts: { enabled: false, auto: "off" },
```

Satu pelajaran lagi soal latensi: `thinkingDefault: "medium"` membuat satu giliran berlangsung 1 sampai 3 menit karena agen memanggil beberapa perintah skill berurutan. Dengan `low`, sekitar satu menit per giliran. Untuk alur yang setiap langkahnya sudah ditentukan skill, itu cukup.

## 6. Menjalankannya di VPS 4 GB

Servernya satu: Ubuntu 24.04, 4 vCPU, memori 3,8 GiB, disk 19 GB. Yang berjalan di dalamnya hanya Gateway OpenClaw, satu proses Node untuk API dan penjadwal, dan SQLite. Tidak ada Chromium, tidak ada model lokal. Saat semuanya hidup, termasuk satu OpenClaw lain yang sudah terpasang di server itu, pemakaian memori terukur 1,4 GB dari 3,9 GB. Model lokal 3 sampai 4 miliar parameter tidak muat berdampingan di memori sebesar itu, jadi pemahaman bahasa dan gambar diserahkan ke model cloud lewat OpenRouter. Skrip pemasangan menambah swap 2 GB sebagai jaring pengaman; selama demo pemakaiannya tetap nol.

![Terminal VPS: spesifikasi server, status Gateway dan kanal Telegram, tiga automations HalalPilot yang berjalan sesuai jadwal, dan dua unit systemd aktif](img/03-terminal-vps.png)

Seluruh demo berjalan di satu paket [AI Hosting](https://idwebhost.com/ai-hosting) IDwebhost yang disediakan panitia AI HackFest 2026 dengan OpenClaw sudah terpasang saat server diserahkan. Saya memasang versi terkunci 2026.8.2 secara terpisah di prefix sendiri, dengan state, port, dan unit systemd sendiri, tanpa menyentuh instalasi bawaan. Pelajaran mahalnya: percobaan pertama `npm install -g` tanpa prefix menimpa paket bawaan dan harus dipulihkan. Di mesin bersama, selalu pasang ke prefix sendiri. Untuk replikasi di koperasi lain, [Cloud VPS](https://cloudbaik.com) 4 core dengan memori 4 GB sudah lebih dari cukup, karena beban terberat ada di sisi model cloud, bukan di server.

Pengamanan yang dipasang: Gateway dan API hanya mendengarkan di loopback, dasbor diakses lewat SSH tunnel, firewall hanya membuka port SSH, kanal Telegram dibatasi ke akun terdaftar, tidak ada skill dari marketplace, versi OpenClaw dikunci, dan agen tidak punya akses berkas atau web selain skrip skill.

## 7. Yang sudah berjalan, yang belum

Yang berjalan ujung ke ujung di VPS dan terekam di video: intake foto sampai dossier PDF, pengejaran terjadwal dengan pengingat sebagai teks, eskalasi ke pendamping, pengembalian berkas dan siklus ulang, persetujuan, pengajuan simulasi, dan digest pagi yang tiba pukul 07.00 dari cron tanpa campur tangan. Di repo ada 85 uji otomatis dan 87 skenario penerimaan tertulis.

![Dashboard koperasi: 19 dari 120 UMK siap unggah, 38 hari menuju tenggat, laju 7 hari di bawah kebutuhan, papan diurutkan dari yang paling mendesak](img/02-dashboard-portofolio.png)

Yang belum, saya tulis dengan angkanya:

- Dari 120 UMK di portofolio, hanya 3 yang benar-benar dijalankan lewat Telegram. 117 sisanya data sintetis deterministik untuk membuat papan terlihat seperti koperasi sungguhan.
- OSS, SEHATI, dan SiHalal seluruhnya tiruan berlabel "simulasi". Integrasi resmi hanya bisa dibuka BPJPH; sampai saat itu paket yang disetujui tetap diunggah manusia.
- Kelas bahan dikecualikan disalin dari lampiran KMA 1360/2021. Kelas positif dan kritis disusun dari praktik lembaga pemeriksa halal dan belum divalidasi P3H atau LPH. Itu batas, bukan cacat tersembunyi, dan dicatat terbuka di spesifikasi.
- Belum ada uji lapangan dengan koperasi nyata. Itu langkah berikutnya setelah 17 Oktober, ketika penahapan untuk produk lain masih berjalan.

## 8. Batas yang dipegang

1. HalalPilot **menyiapkan** berkas, tidak menerbitkan sertifikat dan tidak menjanjikan hasil.
2. Keputusan halal sepenuhnya milik BPJPH dan pendamping; agen menyiapkan dan menjelaskan.
3. Tidak ada data pribadi: tanpa KTP, nomor HP, atau rekening. Ada persetujuan sebelum pemrosesan, dan data bisa dihapus dengan meninggalkan satu baris audit berisi hash, sejalan dengan UU 27/2022.
4. Seluruh entitas demo fiktif.

## 9. Penutup

Ukuran keberhasilannya ada di meja pendamping: dari menyusun berkas satu jam per UMK menjadi menyetujui satu berkas dalam satu menit, dengan setiap keputusan membawa rujukan aturannya. Sisanya, mengejar foto yang belum dikirim pada hari ke-3 dan ke-7, adalah pekerjaan yang paling cocok diserahkan ke agen yang tidak pernah bosan.

Proyek ini dibuat untuk AI HackFest 2026 IDwebhost. Kode, aturan YAML, konfigurasi OpenClaw, skenario uji, dan data seed tersedia dengan lisensi MIT di `[URL repo]`. Video demo: `[URL video]`.

## Referensi

- BPJPH, "BPJPH: 17 Oktober 2026 Produk Makanan-Minuman UMK Harus Sudah Bersertifikat Halal", 21 Oktober 2024. https://bpjph.halal.go.id/detail/bpjph-17-oktober-2026-produk-makanan-minuman-umk-harus-sudah-bersertifikat-halal-bagaimana-dengan-produk-luar-negeri/
- Republika, "Kemenag Pastikan Wajib Halal Tetap Berlaku Oktober 2026", 1 September 2026. https://sharia.republika.co.id/berita/tkobdl423/kemenag-pastikan-wajib-halal-tetap-berlaku-oktober-2026
- BPJPH, "BPJPH Buka Kuota 1,35 Juta Sertifikasi Halal Gratis 2026 bagi UMK", 2 Januari 2026 (juga memuat jumlah P3H). https://bpjph.halal.go.id/detail/kabar-gembira-bpjph-buka-kuota-1-35-juta-sertifikasi-halal-gratis-2026-bagi-umk/
- Harian Jogja, "BPJPH Klaim 13 Juta Produk UMKM Kantongi Sertifikat Halal", 7 Juni 2026. https://ekbis.harianjogja.com/r-1258900/bpjph-klaim-13-juta-produk-umkm-kantongi-sertifikat-halal
- Republika, "Sertifikasi Halal Wajib Oktober 2026, Kesiapan Pelaku Usaha Jadi Tantangan", 21 Agustus 2026. https://sharia.republika.co.id/berita/tk3rz0370/sertifikasi-halal-wajib-oktober-2026-kesiapan-pelaku-usaha-jadi-tantangan
- Keputusan Kepala BPJPH No. 146 Tahun 2025 tentang Petunjuk Teknis Layanan Permohonan Sertifikasi Halal atas Produk yang Tidak Wajib. https://cmsbl.halal.go.id/uploads/146_2025_Kep_Ka_BPJPH_Petunjuk_Teknis_Layanan_Permohonan_Sertifikasi_Halal_atas_Produk_yang_Tidak_Wajib_546bcae1d3.pdf
- Keputusan Menteri Agama No. 1360 Tahun 2021 tentang Bahan yang Dikecualikan dari Kewajiban Bersertifikat Halal. https://halal.kemenperin.go.id/kma-nomor-1360-tentang-bahan-yang-dikecualikan-dari-kewajiban-bersertifikat-halal/
- Peraturan Pemerintah No. 42 Tahun 2024 tentang Penyelenggaraan Bidang Jaminan Produk Halal.
- Undang-Undang No. 27 Tahun 2022 tentang Pelindungan Data Pribadi.

---

*Checklist tayang: badan tulisan ≥ 800 kata (terhitung tanpa referensi dan blok kode); dua backlink dengan anchor persis "AI Hosting" dan "Cloud VPS" di bagian 6; tidak ada kalimat yang menjanjikan sertifikat; setiap angka ada di referensi atau di bukti repo; empat gambar dari `docs/artikel/img/`; isi `[URL repo]` dan `[URL video]`; tayang ≤ 30 September 2026; setelah tayang uji `site:` di Google.*
