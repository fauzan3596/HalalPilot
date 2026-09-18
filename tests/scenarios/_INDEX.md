# Indeks skenario

| ID | Level | Tipe | Terkait | Prio | Otomasi | Judul |
|---|---|---|---|---|---|---|
| US-01-P | pengguna | positif | FR-01 | M | manual | Pengirim terdaftar dikenali perannya sebelum aksi apa pun |
| US-01-N | pengguna | negatif | FR-01 | M | manual | Pengirim tidak terdaftar hanya dapat mendaftar, tidak dapat melihat data |
| US-02-P | pengguna | positif | FR-02, NFR-07 | M | manual | Pendaftaran UMK mencatat persetujuan dan tidak meminta data pribadi |
| US-02-N | pengguna | negatif | FR-02, NFR-07 | M | manual | UMK menolak persetujuan → tidak ada data tersimpan |
| US-02-N2 | pengguna | negatif | FR-02, NFR-07 | M | manual | UMK mengirim NIK dan nomor HP secara sukarela → tidak disimpan |
| US-03-P | pengguna | positif | FR-03 | M | manual | Profil usaha dikumpulkan bertahap dan tersimpan lengkap |
| US-03-N | pengguna | negatif | FR-03 | M | semi-otomatis | Jawaban tidak valid (omzet 'banyak', NIB 5 digit) ditolak dan diminta ulang |
| US-04-P | pengguna | positif | FR-04, NFR-03 | M | manual | Foto label menjadi daftar bahan yang dikonfirmasi UMK sebelum evaluasi |
| US-04-N | pengguna | negatif | FR-04 | M | manual | Foto buram / confidence rendah → minta foto ulang, tidak ada evaluasi |
| US-04-N2 | pengguna | negatif | FR-04, FR-05 | M | manual | UMK mengoreksi daftar bahan (menambah 'gelatin') → daftar diperbarui, bukan ditimpa diam-diam |
| US-05-P | pengguna | positif | FR-05 | M | otomatis | Klasifikasi bahan Nastar sesuai kamus |
| US-05-N | pengguna | negatif | FR-05 | M | otomatis | Typo OCR dan bahan tak dikenal ditangani tanpa salah kelas |
| US-06-P | pengguna | positif | FR-06, NFR-09 | M | otomatis | Evaluasi Nastar menghasilkan jalur, skor, alasan, dokumen dengan rules_version |
| US-06-N | pengguna | negatif | FR-06, FR-04 | M | otomatis | Evaluasi sebelum konfirmasi bahan hanya meminta KONFIRMASI_BAHAN, tidak memutuskan siap |
| US-06-N2 | pengguna | negatif | FR-06 | M | otomatis | Bahan haram eksplisit (angciu) → TIDAK_LAYAK tanpa evaluasi lanjut |
| US-07-P | pengguna | positif | FR-07 | M | manual | Agent menyampaikan keputusan dengan urutan jalur → alasan (rule_id) → dokumen → langkah berikutnya |
| US-07-N | pengguna | negatif | FR-07 | M | manual | UMK memprotes keputusan → agent tidak mengubah jalur, menawarkan eskalasi |
| US-08-P | pengguna | positif | FR-08 | M | otomatis | Data usaha konsisten dengan record NIB → tidak ada PERBAIKAN_OSS |
| US-08-N | pengguna | negatif | FR-08 | M | otomatis | KBLI di NIB tidak mencakup produk (UMK-042) → E15 dan instruksi perbaikan |
| US-08-N2 | pengguna | negatif | FR-08 | S | otomatis | NIB tidak ditemukan / tidak aktif di OSS mock → diminta cek NIB, tidak dievaluasi sebagai cocok |
| US-09-P | pengguna | positif | FR-09 | M | otomatis | Produk berdaging tanpa sertifikat RPH dan digiling di pasar → E09 dan E10 |
| US-09-N | pengguna | negatif | FR-09, FR-10 | M | otomatis | Sertifikat RPH kedaluwarsa → tetap kurang dokumen, pesan menyebut kedaluwarsa |
| US-10-P | pengguna | positif | FR-10, FR-14 | M | manual | Sertifikat pemasok valid → evaluasi ulang otomatis → SIAP dan dossier dibuat |
| US-10-N | pengguna | negatif | FR-10 | M | semi-otomatis | Nomor sertifikat tidak ditemukan di registry → tidak_ditemukan, dokumen tetap kurang |
| US-11-P | pengguna | positif | FR-11 | M | semi-otomatis | Dokumen kurang menghasilkan 4 task pengejaran dan sapuan mengirim tahap 1 lewat hooks |
| US-11-N | pengguna | negatif | FR-11, NFR-05 | M | semi-otomatis | Sapuan dijalankan dua kali berturut-turut → hanya satu pengingat |
| US-11-N2 | pengguna | negatif | FR-11 | M | otomatis | Sapuan pada jam tenang (22:00 WIB) tidak mengirim, menunda ke 07:05 |
| US-11-N3 | pengguna | negatif | FR-11 | S | otomatis | Tiga dokumen kurang → satu pesan gabungan, maksimal 2 pesan per UMK per hari |
| US-12-P | pengguna | positif | FR-12 | M | semi-otomatis | Tahap 4 mengeskalasi ke pendamping dan muncul di eskalasi terbuka |
| US-12-N | pengguna | negatif | FR-12 | M | otomatis | Dokumen diterima setelah tahap 2 → tahap 3 dan 4 dibatalkan, pendamping tidak dieskalasi |
| US-13-P | pengguna | positif | FR-13 | C | manual | Dengan izin eksplisit, agent menghubungi pemasok untuk meminta sertifikat |
| US-13-N | pengguna | negatif | FR-13 | M | manual | Tanpa izin eksplisit, agent tidak menghubungi pemasok |
| US-14-P | pengguna | positif | FR-14 | M | semi-otomatis | Dossier PDF dibuat lengkap dengan hash dan notifikasi pendamping |
| US-14-N | pengguna | negatif | FR-14 | M | semi-otomatis | Membuat dossier saat jalur masih KURANG_DOKUMEN → 409 dan agent menjelaskan |
| US-15-P | pengguna | positif | FR-15 | M | manual | Pendamping menyetujui dossier lewat teks → status siap unggah |
| US-15-N | pengguna | negatif | FR-15 | M | semi-otomatis | UMK mencoba menyetujui dossier sendiri → ditolak 403 |
| US-15-N2 | pengguna | negatif | FR-15, FR-11 | M | manual | Pendamping mengembalikan dossier dengan alasan → status dikembalikan dan UMK dikejar dengan catatan |
| US-16-P | pengguna | positif | FR-16 | S | manual | Simulasi pengajuan untuk dossier disetujui → nomor simulasi, agent menyatakan simulasi |
| US-16-N | pengguna | negatif | FR-16 | S | semi-otomatis | Mengajukan dossier yang belum disetujui → 409 |
| US-16-N2 | pengguna | negatif | FR-16 | S | semi-otomatis | Simulasi mengembalikan pengajuan → status ditolak_simulasi dan kembali ke menunggu dokumen dengan alasan |
| US-17-P | pengguna | positif | FR-17, NFR-04 | M | manual | Digest 07:00 WIB terkirim otomatis dengan semua field |
| US-17-N | pengguna | negatif | FR-17, FR-21 | M | manual | API mati saat digest → agent melaporkan gangguan, tidak mengarang angka |
| US-18-P | pengguna | positif | FR-18 | S | manual | Dashboard menampilkan papan 120 UMK, hitung mundur, dan memantulkan perubahan status ≤ 10 detik |
| US-18-N | pengguna | negatif | FR-18, NFR-07 | S | manual | Dashboard tidak menampilkan data pribadi dan memberi label 'Simulasi' pada semua data mock |
| US-19-P | pengguna | positif | FR-19, NFR-07 | M | manual | Hapus data dua langkah → semua data UMK hilang, bukti hash dikirim |
| US-19-N | pengguna | negatif | FR-19 | M | manual | Konfirmasi tidak lengkap ('ya' saja) → tidak ada penghapusan |
| US-19-N2 | pengguna | negatif | FR-19 | M | semi-otomatis | UMK lain mencoba menghapus UMK-017 → 403 |
| US-20-P | pengguna | positif | FR-20, NFR-09 | M | semi-otomatis | Setiap aksi tercatat di event_log dengan actor yang benar |
| US-20-N | pengguna | negatif | FR-20, NFR-07 | M | semi-otomatis | event_log tidak menyimpan isi dokumen, teks bahan mentah, atau data pribadi |
| US-21-P | pengguna | positif | FR-21 | S | manual | API tidak merespons dua heartbeat berturut → agent melapor ke pendamping |
| US-21-N | pengguna | negatif | FR-21 | S | manual | API gagal satu heartbeat lalu pulih → tidak ada laporan palsu |
| US-22-P | pengguna | positif | FR-22 | C | manual | Kuota SEHATI mock provinsi < 10% → satu kalimat ke pendamping |
| US-22-N | pengguna | negatif | FR-22 | C | manual | Kuota normal → tidak ada pesan sama sekali |
| SYS-01-P | sistem | positif | NFR-01 | M | semi-otomatis | Total RAM semua proses ≤ 2,5 GB setelah seluruh sistem hidup |
| SYS-01-N | sistem | negatif | NFR-01, NFR-04 | S | semi-otomatis | Tekanan memori → orchestrator dibatasi MemoryMax dan restart, gateway tetap hidup |
| SYS-02-P | sistem | positif | NFR-02 | S | semi-otomatis | Latensi balasan agent non-vision p50 ≤ 8 s, p95 ≤ 20 s |
| SYS-02-N | sistem | negatif | NFR-02, NFR-05 | S | manual | Model timeout → agent memberi tahu dan mencoba ulang sekali, tanpa perubahan state |
| SYS-03-P | sistem | positif | NFR-04 | M | semi-otomatis | Automations berjalan 72 jam tanpa intervensi, 0 run terlewat |
| SYS-03-N | sistem | negatif | NFR-04 | M | semi-otomatis | Restart gateway → automations tetap terdaftar dan fire berikutnya tepat waktu |
| SYS-04-P | sistem | positif | NFR-05 | M | otomatis | Idempotency-Key sama → respons identik, satu efek (evaluate, chase, dossier) |
| SYS-04-N | sistem | negatif | NFR-05 | M | semi-otomatis | Hook /hooks/agent dipanggil dua kali dengan key sama → satu pesan Telegram |
| SYS-05-P | sistem | positif | NFR-06 | M | semi-otomatis | Permukaan serangan minimal: hanya port 22 publik, token wajib, audit bersih |
| SYS-05-N | sistem | negatif | NFR-06 | M | manual | Prompt injection lewat teks di foto label → diperlakukan sebagai data, tidak mengubah keputusan |
| SYS-05-N2 | sistem | negatif | NFR-06 | M | manual | Pengguna di luar allowlist Telegram tidak mendapat respons apa pun dari gateway |
| SYS-06-P | sistem | positif | NFR-07 | M | semi-otomatis | Skema, log, PDF, dan prompt bebas data pribadi; hapus data ≤ 1 menit |
| SYS-06-N | sistem | negatif | NFR-07 | S | manual | Data pribadi yang dikirim pengguna tidak masuk MEMORY.md maupun memori vektor OpenClaw |
| SYS-07-P | sistem | positif | NFR-08 | S | semi-otomatis | Biaya model per UMK (intake → dossier) ≤ Rp500 dan tercatat |
| SYS-07-N | sistem | negatif | NFR-08 | C | semi-otomatis | Heartbeat salah konfigurasi (30 menit) → alarm biaya > $2/hari terpicu |
| SYS-08-P | sistem | positif | NFR-09 | M | otomatis | Setiap keputusan dapat ditelusuri: alasan_json lengkap dan rules_version terisi; /health informatif |
| SYS-08-N | sistem | negatif | NFR-09, NFR-11 | M | otomatis | Perubahan file aturan mengubah rules_version; keputusan lama tidak berubah |
| SYS-09-P | sistem | positif | NFR-10 | M | semi-otomatis | Replika lokal berdiri < 15 menit dan menjalankan US-06-P |
| SYS-09-N | sistem | negatif | NFR-10 | M | otomatis | Variabel env wajib kosong → server menolak start dengan pesan yang menyebut variabelnya |
| SYS-10-P | sistem | positif | NFR-04 | M | manual | Model primary tidak tersedia → fallback dipakai, percakapan berlanjut |
| SYS-10-N | sistem | negatif | NFR-04 | S | manual | Semua model gagal → agent menyatakan layanan model tidak tersedia, tidak ada perubahan state |
| SYS-11-P | sistem | positif | FR-04, V1 | M | manual | V1: foto Telegram sampai ke imageModel dan menghasilkan daftar bahan |
| SYS-11-N | sistem | negatif | FR-04, V1 | M | semi-otomatis | imageModel tidak menerima foto (issue #7564) → fallback extract via OpenRouter bekerja |
| SYS-12-P | sistem | positif | NFR-06, NFR-10 | M | manual | Prosedur H1 selesai dan versi OpenClaw dipin 2026.8.2 |
| SYS-12-N | sistem | negatif | NFR-10 | M | manual | Versi OpenClaw prainstal berbeda → dipin ulang tanpa merusak konfigurasi |
| SYS-13-P | sistem | positif | NFR-10 | M | semi-otomatis | Backup malam dipulihkan di laptop dan DB konsisten |
| SYS-13-N | sistem | negatif | NFR-10 | S | semi-otomatis | Backup tanpa checkpoint WAL → terdeteksi dan diulang dengan checkpoint |
| SYS-14-P | sistem | positif | NFR-04 | M | otomatis | OpenClaw hooks tidak dapat dihubungi → retry 3× lalu task tetap terjadwal, /health menandai |
| SYS-14-N | sistem | negatif | NFR-05 | M | otomatis | Hooks menerima (200) tetapi agent tidak memanggil mark_chase_sent → sweep berikutnya tidak mengirim ulang |
| US-06-N3 | pengguna | negatif | FR-06, E17 | M | otomatis | Nama produk berunsur haram (E17) → TIDAK_LAYAK dengan pesan ubah nama |
| US-05-N2 | pengguna | negatif | FR-05, FR-06, E18 | M | otomatis | Daftar bahan hanya air/garam/kemasan (E18) → diminta melengkapi |
| US-23-P | pengguna | positif | FR-06, E16 | S | otomatis | Lebih dari 10 nama produk (E16) → pengajuan harus dibagi |
| US-13-P2 | pengguna | positif | FR-06, FR-14, E13 | M | semi-otomatis | Surat permohonan (butir 16a) dihasilkan sistem, tidak diminta dari UMK |
