// Perakit video demo HalalPilot dari klip rekaman layar (tanpa suara) → 1080p 16:9, potongan otomatis bagian layar diam,
// judul adegan, caption + narasi suara (edge-tts, id-ID) yang TERKUNCI ke peristiwa di layar, kartu pembuka/penutup, watermark logo IDwebhost.
//   node docs/video/rakit.mjs            → sintesis narasi yang belum ada (edge-tts di WSL), tulis <out>/render.sh + teks caption
//   wsl bash <out>/render.sh             → merender (ffmpeg di WSL); melanjutkan dari keluaran yang sudah ada
// Masukan: berkas aktivitas per klip (rata-rata luma selisih antar-frame, 2 sampel/detik) dari scratchpad/activity/<klip>.txt.
//
// Sinkronisasi: tiap caption punya `at` = detik SUMBER saat peristiwa yang dinarasikan muncul di layar (pesan bot tiba, perintah
// dijalankan). Narasi mulai tepat saat peristiwa itu tampil. Bila narasi sebelumnya belum selesai, video DITAHAN (frame beku)
// sesaat sebelum peristiwa berikutnya, sehingga suara tidak pernah mendahului atau tertinggal dari gambar.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const SCRATCH = "C:/Users/MUHAMM~1/AppData/Local/Temp/claude/C--Users-MuhammadFauzanRamadh-Claude-Lomba/2a19f223-da3c-4b56-bc2f-ba7fc9681285/scratchpad";
const ACT = join(SCRATCH, "activity");
const OUT_WIN = "C:/Users/MuhammadFauzanRamadh/Videos/HalalPilot-edit";
const OUT = "/mnt/c/Users/MuhammadFauzanRamadh/Videos/HalalPilot-edit";
const SRC = "/mnt/c/Users/MuhammadFauzanRamadh/Videos/Screen Recordings";
const FONT = "/mnt/c/Windows/Fonts/segoeui.ttf", FONTB = "/mnt/c/Windows/Fonts/segoeuib.ttf";
const LOGO = "/mnt/c/Users/MuhammadFauzanRamadh/Claude/Lomba/halalpilot/docs/logo/idwebhost.png";
const LOGO_WIN = "C:/Users/MuhammadFauzanRamadh/Claude/Lomba/halalpilot/docs/logo/idwebhost.png";
const THR = 0.8;          // di atas ini = ada perubahan nyata di layar
const HOLD = 0.6;         // durasi keluaran untuk satu jeda diam (dipercepat)
const MAX_IDLE_1X = 2.0;  // jeda ≤ ini dibiarkan 1x
const ACTIVE = 1.25;      // percepatan bagian aktif
const VOICE = "id-ID-ArdiNeural", RATE = "+5%";
const GAP = 0.5;          // jeda antar kalimat narasi
const NO_TTS = process.argv.includes("--tanpa-suara");
const FINAL = "HalalPilot-demo-v3.mp4";

// ---------------- adegan ----------------
// captions: { at: detik sumber peristiwa, t: kalimat narasi (dibakar sebagai teks dan disintesis) }
const SCENES = [
  { id: "01", clip: "142912", end: 42, judul: "1 · Masalah: 120 UMK, 38 hari, berkas tidak lengkap", padAfter: 1.2, captions: [
    { at: 0.5, t: "Coba tebak: berapa pelaku usaha yang produknya sudah bersertifikat halal? Empat persen.", src: "INDEF mengutip Bappenas 2026 · Republika, 21 Agustus 2026" },
    { at: 10, t: "Padahal 17 Oktober nanti, makanan dan minuman UMK wajib halal. Saya sempat berharap ditunda. Kemenag bilang: tidak.", src: "PP 42/2024 pasal 160 · Kemenag, rakor Kemenko PMK 12 Agustus 2026 (Republika, 1 September 2026)" },
    { at: 20, src: "BPJPH, 2 Januari 2026", t: "Kuota gratisnya ada, 1,35 juta. Pendampingnya ada, 111 ribu. Tapi satu pendamping pegang ratusan UMK, dan berkasnya jarang lengkap." },
    { at: 30, t: "Yang kurang bukan aplikasi upload. Yang kurang itu seseorang yang mengerjakan berkasnya, dan menagihnya tiap hari. Itu yang saya buat." } ] },
  { id: "02", clip: "143118", start: 8, thr: 0.5, judul: "2 · Lingkungan: VPS AI Hosting IDwebhost · OpenClaw 2026.8.2", padAfter: 1.6, captions: [
    { at: 8.5, t: "Semua berjalan di satu VPS AI Hosting IDwebhost: 4 vCPU, 4 gigabyte RAM, Ubuntu 24.04." },
    { at: 36, t: "OpenClaw menjadi agen dan kanal Telegram. Layanan kecil Node dan SQLite memegang aturan. Model membaca dan berbicara; kode memutuskan hukum." },
    { at: 50, t: "Tiga automations OpenClaw: digest pukul tujuh pagi, sapuan pengejaran pukul sembilan dan tiga sore, cek kuota tiap enam jam. Kolom Last menunjukkan semuanya berjalan sesuai jadwal." } ] },
  { id: "03", clip: "161523", judul: "3 · Intake: foto label → daftar bahan → keputusan beralasan", padAfter: 1.8, captions: [
    { at: 15, t: "Akun demo berperan sebagai UMK Dapur Bu Ratih. Sesi percakapan baru dimulai; dashboard koperasi ada di kanan." },
    { at: 54.0, t: "UMK menyapa. Agen mengenali perannya lewat whoami, lalu menyebut berkas yang masih kurang tanpa ditanya." },
    { at: 78, t: "UMK cukup memotret label. Agen membaca komposisi, lalu meminta konfirmasi daftar bahan." },
    { at: 128.2, t: "Tiap bahan dipetakan ke KMA 1360 tahun 2021: telur dikecualikan, tepung positif, margarin kritis.", src: "KMA 1360/2021 · lampiran 182 halaman, dibaca 10 September 2026" },
    { at: 178.0, t: "Yang menentukan jalur bukan modelnya, melainkan mesin aturan dari Kepkaban BPJPH 146 tahun 2025: margarin bahan kritis, jadi sertifikat pemasoknya wajib. Skor kesiapan 60 dari 100.", src: "Kepkaban BPJPH 146/2025 · aturan E11, Bab II A.2, A.9 & Bab III B" },
    { at: 202, t: "Yang diminta hanya dokumen yang harus dari UMK. Surat permohonan, pernyataan, ikrar, dan Manual SJPH disusun sistem." } ] },
  { id: "04", clip: "161840", judul: "4 · Cerita proses & sertifikat pemasok → dossier otomatis", padAfter: 1.8, captions: [
    { at: 5.5, t: "UMK menceritakan cara membuat nastar dengan bahasanya sendiri." },
    { at: 36.9, t: "Cerita proses tersimpan apa adanya. Skor naik ke 80. Tinggal sertifikat pemasok margarin." },
    { at: 62, t: "UMK menyebut nama pemasok dan nomor sertifikatnya." },
    { at: 88.6, t: "Nomor sertifikat dicek ke registry, di sini simulasi. Skor 100: agen langsung menyusun berkas self-declare untuk ditinjau pendamping." } ] },
  { id: "05", clip: "161958", end: 42, judul: "5 · Dossier PDF v1 dari server", padAfter: 2.0, captions: [
    { at: 1, t: "Berkas PDF versi satu diambil dari server dengan scp untuk dilihat." },
    { at: 13, t: "PDF diunduh ke laptop lalu dibuka di penampil." },
    { at: 29, t: "Isinya: permohonan, pernyataan, ikrar, daftar bahan dengan kelasnya, ringkasan proses, foto label, dan draf Manual SJPH." },
    { at: 37, t: "Setiap versi punya sidik jari SHA-256 dan versi aturan yang dipakai." } ] },
  { id: "06", clip: "162420", judul: "6 · Pengejaran otomatis UMK-042 (waktu dimajukan)", padAfter: 1.8, captions: [
    { at: 16, t: "Sambal Mak Ijah: bahannya aman, tetapi KBLI di NIB tidak cocok dan foto label belum ada. Skor 70." },
    { at: 36.3, t: "Pengingat pertama tiba dengan nada ramah. Penjadwal mengatur hari ke-1, ke-3, dan ke-7, menghormati jam tenang dan batas dua pesan per hari.", src: "rules/chase-policy.yaml v2026-09-02.1" },
    { at: 76.6, t: "Pengingat kedua lebih tegas dan menyebut sisa hari. Di rekaman ini waktu dimajukan dengan perintah sweep. Kalimatnya ditulis model; jadwalnya diputuskan kode." } ] },
  { id: "07", clip: "162541", judul: "7 · Eskalasi ke pendamping setelah 10 hari diam", padAfter: 1.8, captions: [
    { at: 5, t: "Operator memajukan waktu dengan perintah sweep sampai hari ke-10, mengalihkan akun demo ke peran pendamping, lalu memastikan tugas eskalasi tahap empat tercatat di server." },
    { at: 34.3, t: "Pesan ketiga di chat bukan pengingat lagi, melainkan laporan eskalasi: Sambal Mak Ijah belum mengirim dokumen setelah tiga pengingat, skor 70, dengan saran tindakan untuk pendamping.", src: "rules/chase-policy.yaml tahap 4 · setelah 240 jam" },
    { at: 40.5, t: "Pendamping tahu persis siapa yang perlu ditelepon, dan kenapa." } ] },
  { id: "07b", clip: "162629", judul: "7 · Eskalasi ke pendamping setelah 10 hari diam", padAfter: 1.8, captions: [
    { at: 1, t: "Dashboard koperasi mencatat eskalasi terbuka untuk Sambal Mak Ijah." } ] },
  { id: "08", clip: "163241", maxOut: 59, judul: "8 · Review pendamping: ringkasan & kembalikan berkas", padAfter: 1.8, captions: [
    { at: 7, t: "Dashboard koperasi: 18 dari 120 UMK siap unggah, laju di bawah kebutuhan, papan diurutkan dari yang paling mendesak." },
    { at: 96.6, t: "Pendamping bertanya status dan menerima ringkasan: total UMK, siap unggah, menunggu review, eskalasi terbuka. Semua dari data, bukan karangan model." },
    { at: 303.8, t: "Pendamping tetap pemegang keputusan. Satu kalimat 'kembalikan' cukup: alasannya diteruskan ke UMK, keputusan baru dicatat, pengejaran dimulai lagi." },
    { at: 312, t: "Di dashboard, UMK-017 turun ke status dikembalikan dengan skor 80, lengkap dengan jejak keputusannya." } ] },
  { id: "09", clip: "170107", end: 432, judul: "9 · Foto ulang → berkas v2 → setuju → ajukan (simulasi)", padAfter: 1.8, captions: [
    { at: 26, t: "Kembali ke terminal VPS. Akun demo dialihkan lagi ke peran UMK Dapur Bu Ratih, dan tugas pengejarannya ikut berpindah." },
    { at: 55.5, t: "UMK mengirim foto label yang lebih jelas." },
    { at: 129.7, t: "Foto produk diterima, permintaan dokumen tertutup otomatis, dan daftar bahan dikonfirmasi ulang." },
    { at: 179.5, t: "Daftar bahan dikonfirmasi. Skor kembali 100 dan semua dokumen wajib lengkap." },
    { at: 236.6, t: "Berkas versi dua tersimpan sebagai PDF dan dikirim ke pendamping untuk diperiksa." },
    { at: 269.5, t: "Akun demo kini berganti peran menjadi pendamping." },
    { at: 335.1, t: "Pendamping menyetujui lewat Telegram. Status berubah menjadi siap unggah." },
    { at: 381.8, t: "Perintah 'ajukan' mengirim ke SiHalal simulasi dan mendapat nomor SIM. Ini bukan pengajuan resmi ke BPJPH." },
    { at: 420, t: "HalalPilot menyiapkan berkas; keputusan halal tetap di BPJPH dan pendamping." } ] },
  { id: "10", clip: "170250", maxOut: 33, judul: "10 · Digest pagi & dashboard portofolio", padAfter: 1.8, captions: [
    { at: 9, t: "Di dashboard, UMK-017 kini selesai. Papan menunjukkan 19 dari 120 UMK siap unggah." },
    { at: 40.0, t: "Setiap pagi pukul tujuh, pendamping menerima ringkasan seperti ini dari automations OpenClaw, tanpa membuka aplikasi apa pun." } ] },
  { id: "11", clip: "170535", fixed: [[0, 14, 1]], judul: "11 · Yang berjalan di server: dua unit systemd, 1,4 GB RAM", padAfter: 2.0, captions: [
    { at: 0.5, t: "Hanya port SSH yang terbuka. Gateway dan API di loopback. RAM terpakai 1.397 megabyte dari 3.915 saat semuanya hidup.", src: "hpdemo status di VPS lomba, 10 September 2026 16:54 WIB" },
    { at: 8, t: "Empat batas yang kami pegang: menyiapkan bukan menerbitkan; portal pemerintah di sini simulasi; tanpa data pribadi; dan semuanya muat di satu VPS kecil." } ] },
];

const OPENER = { id: "00-pembuka", min: 7, narasi: "Halo, saya Fauzan. Ini HalalPilot: agen AI yang menyiapkan berkas halal UMK, lalu mengejarnya sampai lengkap. Semuanya jalan di VPS AI Hosting IDwebhost.", items: [
  ["4%", 190, FONTB, 0.12],
  ["pelaku usaha yang produknya bersertifikat halal", 46, FONT, 0.44],
  ["INDEF mengutip Bappenas 2026 · Republika, 21 Agustus 2026", 30, FONT, 0.53],
  ["17 Oktober 2026: makanan-minuman UMK wajib halal (PP 42/2024)", 40, FONTB, 0.66],
  ["HalalPilot · agen OpenClaw yang menyiapkan dan mengejar berkas self-declare untuk koperasi UMK", 32, FONT, 0.80],
  ["Berjalan di VPS AI Hosting IDwebhost · demo AI HackFest 2026", 28, FONT, 0.88],
] };
const HASIL = { id: "98-hasil", min: 7, narasi: "Hasil demo: satu UMK sampai berkas siap, empat pengingat dan eskalasi otomatis, 18 aturan, 498 sinonim bahan, 86 uji otomatis, satu VPS 4 gigabyte.", items: [
  ["Hasil demo dalam angka", 64, FONTB, 0.12],
] };
const CLOSER = { id: "99-penutup", min: 9, narasi: "Di HalalPilot, AI-nya membaca label dan menulis pesan. Yang memutuskan jalur, skor, dan jadwal itu kode. Kami menyiapkan berkas; yang memutuskan halal tetap BPJPH dan pendamping. Kodenya terbuka, silakan dicoba. Terima kasih.", items: [
  ["HalalPilot", 84, FONTB, 0.10],
  ["Menyiapkan berkas, bukan menerbitkan sertifikat.", 40, FONT, 0.30],
  ["OSS, SEHATI, SiHalal dalam demo ini simulasi berlabel.", 40, FONT, 0.39],
  ["Tanpa KTP, nomor HP, rekening. Data bisa dihapus.", 40, FONT, 0.48],
  ["Muat di satu VPS AI Hosting IDwebhost 4 vCPU / 4 GB.", 40, FONT, 0.57],
  ["Model memutuskan bahasa. Kode memutuskan hukum.", 44, FONTB, 0.72],
  ["Kode, aturan YAML, konfigurasi OpenClaw: terbuka (MIT) · tautan di deskripsi video", 28, FONT, 0.86],
] };

// ---------------- util ----------------
function wrap(s, n = 78) { const w = s.split(" "), L = []; let cur = ""; for (const x of w) { if ((cur + " " + x).trim().length > n) { L.push(cur.trim()); cur = x; } else cur += " " + x; } if (cur.trim()) L.push(cur.trim()); return L.join("\n"); }
function esc(s) { return s.replace(/\\/g, "\\\\").replace(/'/g, "\u2019").replace(/:/g, "\\:"); }
function readAct(clip) { return readFileSync(join(ACT, clip + ".txt"), "utf8").trim().split("\n").map((l) => l.split(" ")).map(([t, v]) => [parseFloat(t), parseFloat(v)]); }
function wsl(cmd) { return execFileSync("wsl", ["-e", "bash", "-lc", cmd], { encoding: "utf8" }).trim(); }
const hash = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h.toString(16); };

// Narasi: sintesis sekali (cache berdasarkan isi teks), kembalikan durasi detik. Teks dikirim ke layanan TTS Microsoft (edge-tts).
function narasi(name, text) {
  const rek = `rekam/${name}.mp3`;
  if (existsSync(join(OUT_WIN, rek))) {   // suara sendiri (hibrida): pembuka, adegan 1, penutup
    const d = parseFloat(wsl(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${OUT}/${rek}"`));
    return { mp3: rek, d };
  }
  const key = `${name}-${hash(text)}`; const mp3 = `tts/${key}.mp3`; const txt = `tts/${key}.txt`;
  writeFileSync(join(OUT_WIN, txt), text, "utf8");
  if (NO_TTS) return { mp3: null, d: Math.max(3, text.split(" ").length * 0.42) };
  if (!existsSync(join(OUT_WIN, mp3))) {
    process.stderr.write(`tts ${key}\n`);
    wsl(`cd "${OUT}" && ~/.local/bin/edge-tts --voice ${VOICE} --rate=${RATE} -f "${txt}" --write-media "${mp3}" >/dev/null 2>&1`);
  }
  const d = parseFloat(wsl(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${OUT}/${mp3}"`));
  return { mp3, d };
}

// Segmen: [a, b, speed] potongan berjalan; { hold: s, d: D } frame beku di detik sumber s selama D detik keluaran
function segments(sc) {
  if (sc.fixed) return sc.fixed.map((x) => [...x]);
  const act = readAct(sc.clip); const thr = sc.thr ?? THR; const start = sc.start ?? 0; const end = sc.end ?? act[act.length - 1][0];
  const padB = 0.8, padA = sc.padAfter;
  let iv = [];
  for (const [t, v] of act) { if (t <= start || t > end) continue; if (v > thr) iv.push([Math.max(start, t - 0.5 - padB), Math.min(end, t + padA)]); }
  iv.sort((a, b) => a[0] - b[0]); const m = [];
  for (const x of iv) { if (m.length && x[0] <= m[m.length - 1][1] + 0.01) m[m.length - 1][1] = Math.max(m[m.length - 1][1], x[1]); else m.push([...x]); }
  const segs = []; let cur = start;
  for (const [a, b] of m) { if (a > cur) { const g = a - cur; segs.push(g <= MAX_IDLE_1X ? [cur, a, ACTIVE] : [cur, a, Math.min(g / HOLD, 80)]); } segs.push([a, b, ACTIVE]); cur = b; }
  if (end > cur) { const g = end - cur; segs.push(g <= MAX_IDLE_1X ? [cur, end, ACTIVE] : [cur, end, Math.min(g / HOLD, 80)]); }
  return segs;
}
const segLen = (s) => (Array.isArray(s) ? (s[1] - s[0]) / s[2] : s.d);
const outLen = (segs) => segs.reduce((t, s) => t + segLen(s), 0);
// waktu keluaran saat detik sumber s tampil (frame beku di s dihitung SEBELUM s tampil)
function srcToOut(segs, s) {
  let t = 0;
  for (const g of segs) {
    if (Array.isArray(g)) { if (s < g[1] - 1e-6) return t + Math.max(0, s - g[0]) / g[2]; t += segLen(g); }
    else { if (s >= g.hold - 1e-6) t += g.d; else return t; }
  }
  return t;
}
// sisipkan frame beku berdurasi D tepat sebelum detik sumber s
function insertHold(segs, s, D) {
  for (let i = 0; i < segs.length; i++) {
    const g = segs[i]; if (!Array.isArray(g)) continue;
    if (s > g[0] && s <= g[1]) { segs.splice(i, 1, [g[0], s, g[2]], { hold: s, d: D }, [s, g[1], g[2]]); return; }
    if (Math.abs(s - g[0]) < 1e-6) { segs.splice(i, 0, { hold: s, d: D }); return; }
  }
  segs.push({ hold: s, d: D });
}

// ---------------- render ----------------
for (const d of ["", "txt", "seg", "tts"]) mkdirSync(join(OUT_WIN, d), { recursive: true });
const hasLogo = existsSync(LOGO_WIN);
const VID = "-c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -r 30 -c:a aac -b:a 128k -movflags +faststart";
const WM_TXT = `drawtext=expansion=none:fontfile=${FONT}:text='IDwebhost  ·  AI Hosting':fontsize=26:fontcolor=white@0.95:box=1:boxcolor=black@0.7:boxborderw=12:x=w-tw-40:y=h-th-40`;
const GEO = `fps=30,scale=1920:-2,crop=1920:1080`;
const lines = ["#!/bin/bash", "set -euo pipefail", `cd "${OUT}"`, `SRC="${SRC}"`, ""];
let total = 0; const list = [];

function audioGraph(narr, firstIdx) {
  const ins = narr.map((n) => `-i "${n.mp3}"`).join(" ") + ` -f lavfi -i anullsrc=r=48000:cl=stereo`;
  const parts = narr.map((n, i) => `[${firstIdx + i}:a]aresample=48000,adelay=${Math.round(n.t * 1000)}|${Math.round(n.t * 1000)}[n${i}]`).join(";");
  // anullsrc (tak berhingga) HARUS jadi input pertama: duration=first mengikuti input pertama; bila narasi pertama yang di depan, audio berhenti setelah kalimat pertama
  const mix = `[${firstIdx + narr.length}:a]` + narr.map((_, i) => `[n${i}]`).join("") + `amix=inputs=${narr.length + 1}:normalize=0:duration=first[aout]`;
  return { ins, filter: (parts ? parts + ";" : "") + mix };
}

function card(c) {
  const n = narasi(c.id, c.narasi);
  const seconds = Math.max(c.min, n.d + 1.6);
  const dt = c.items.map(([t, size, font, y]) => `drawtext=expansion=none:fontfile=${font}:text='${esc(t)}':fontsize=${size}:fontcolor=white:x=(w-tw)/2:y=${Math.round(y * 1080)}`).join(",");
  const logoIn = hasLogo ? `-i "${LOGO}"` : ""; const aFirst = hasLogo ? 2 : 1;
  const ag = audioGraph(n.mp3 ? [{ mp3: n.mp3, t: 0.8 }] : [], aFirst);
  const vchain = `[0:v]${dt},fade=t=in:st=0:d=0.6,fade=t=out:st=${(seconds - 0.6).toFixed(2)}:d=0.6[b];` + (hasLogo ? `[1:v]scale=-1:56[l];[b][l]overlay=W-w-40:H-h-40[vout]` : `[b]${WM_TXT}[vout]`);
  const out = `${c.id}-${hash(c.narasi + seconds + ag.filter)}.mp4`;
  lines.push(`echo "== ${c.id} (${seconds.toFixed(1)} s)"; [ -s "${out}" ] || ffmpeg -v error -y -f lavfi -i color=c=0x141d18:s=1920x1080:d=${seconds.toFixed(2)}:r=30 ${logoIn} ${ag.ins} -filter_complex "${vchain};${ag.filter}" -map "[vout]" -map "[aout]" -t ${seconds.toFixed(2)} ${VID} "${out}"`);
  total += seconds; list.push(out);
  TL[{ "00-pembuka": "opener", "98-hasil": "hasil", "99-penutup": "closer" }[c.id]] = { id: c.id, seconds, narasi: c.narasi, mp3: n.mp3 ? n.mp3.replace("tts/", "") : null, d: n.d, items: c.items.map(([t, size, , y]) => ({ t, size, y })) };
}

const laporan = []; const TL = { fps: 30, opener: null, hasil: null, closer: null, scenes: [] };
card(OPENER);
card(HASIL);
for (const sc of SCENES) {
  const segs = segments(sc);
  // 1) narasi + jadwal: mulai saat peristiwa tampil; bila narasi sebelumnya belum selesai, bekukan video sebelum peristiwa
  const capFiles = []; const narr = []; let prevEnd = 0;
  sc.captions.forEach((c, i) => {
    const n = narasi(`${sc.id}-c${i}`, c.t);
    let t0 = srcToOut(segs, c.at);
    const need = prevEnd + (i ? GAP : 0);
    if (t0 < need - 0.05) { insertHold(segs, c.at, need - t0); t0 = srcToOut(segs, c.at); }
    if (i === 0 && t0 < 0.6) t0 = 0.6;
    capFiles.push({ f: `txt/${sc.id}-c${i}.txt`, t0, t1: t0 + n.d + 0.25 });
    writeFileSync(join(OUT_WIN, `txt/${sc.id}-c${i}.txt`), wrap(c.t), "utf8");
    if (n.mp3) narr.push({ mp3: n.mp3, t: t0 });
    prevEnd = t0 + n.d;
  });
  // maxOut: potong segmen paling belakang (setelah narasi terakhir selesai) agar keluaran ≤ maxOut detik
  if (sc.maxOut) { const lim = Math.max(sc.maxOut, prevEnd + 0.6); let t = 0; for (let i = 0; i < segs.length; i++) { const L = segLen(segs[i]); if (t + L > lim) { const g = segs[i]; if (Array.isArray(g)) { const keep = Math.max(0, lim - t); segs.splice(i, segs.length - i, ...(keep > 0.05 ? [[g[0], g[0] + keep * g[2], g[2]]] : [])); } else segs.splice(i); break; } t += L; } }
  let vlen = outLen(segs); const need = prevEnd + 0.6; const len = Math.max(vlen, need);
  // 2) segmen → berkas kecil (nama berisi parameter → cache aman saat berubah), gabung tanpa re-encode
  const segFiles = segs.map((g, i) => {
    if (Array.isArray(g)) {
      const [a, b, sp] = g; const f = `seg/${sc.id}-${a.toFixed(2)}-${b.toFixed(2)}-${sp.toFixed(3)}.mp4`;
      lines.push(`[ -s "${f}" ] || ffmpeg -v error -y -ss ${a.toFixed(2)} -t ${(b - a).toFixed(2)} -i "$SRC/Screen Recording 2026-09-10 ${sc.clip}.mp4" -an -vf "setpts=(PTS-STARTPTS)/${sp.toFixed(3)},${GEO}" -c:v libx264 -preset veryfast -crf 17 -pix_fmt yuv420p "${f}"`);
      return f;
    }
    const f = `seg/${sc.id}-hold-${g.hold.toFixed(2)}-${g.d.toFixed(2)}.mp4`;
    lines.push(`[ -s "${f}" ] || ffmpeg -v error -y -ss ${g.hold.toFixed(2)} -t 0.1 -i "$SRC/Screen Recording 2026-09-10 ${sc.clip}.mp4" -an -vf "${GEO},tpad=stop_mode=clone:stop_duration=${(g.d + 0.5).toFixed(2)}" -t ${g.d.toFixed(2)} -c:v libx264 -preset veryfast -crf 17 -pix_fmt yuv420p "${f}"`);
    return f;
  });
  const catName = `seg/${sc.id}-cat-${hash(segFiles.join("|"))}.mp4`;
  writeFileSync(join(OUT_WIN, `seg/${sc.id}.txt`), segFiles.map((f) => `file '${f.replace("seg/", "")}'`).join("\n") + "\n");
  lines.push(`[ -s "${catName}" ] || ffmpeg -v error -y -f concat -safe 0 -i seg/${sc.id}.txt -c copy "${catName}"`);
  // 3) teks: judul adegan 5,5 s + caption sesuai jadwal narasi; tahan frame terakhir bila narasi lebih panjang dari video
  const judulFile = `txt/${sc.id}-judul.txt`; writeFileSync(join(OUT_WIN, judulFile), sc.judul, "utf8");
  const pad = len > vlen + 0.05 ? `tpad=stop_mode=clone:stop_duration=${(len - vlen).toFixed(2)},` : "";
  let chain = `[0:v]${pad}drawtext=expansion=none:fontfile=${FONTB}:textfile=${judulFile}:fontsize=34:fontcolor=white:box=1:boxcolor=0x2f6b4a@0.92:boxborderw=14:x=40:y=36:enable='lt(t,5.5)'`;
  for (const c of capFiles) chain += `,drawtext=expansion=none:fontfile=${FONT}:textfile=${c.f}:fontsize=36:fontcolor=white:line_spacing=8:box=1:boxcolor=black@0.62:boxborderw=18:x=(w-tw)/2:y=h-th-64:enable='between(t,${c.t0.toFixed(2)},${c.t1.toFixed(2)})'`;
  const logoIn = hasLogo ? `-i "${LOGO}"` : ""; const aFirst = hasLogo ? 2 : 1;
  const ag = audioGraph(narr, aFirst);
  const vout = hasLogo ? `[base];[1:v]scale=-1:56[logo];[base][logo]overlay=W-w-40:H-h-40[vout]` : `[base];[base]${WM_TXT}[vout]`;
  const out = `${sc.id}-${hash(catName + chain + ag.filter)}.mp4`;
  lines.push(`echo "== adegan ${sc.id} (${sc.clip}) → video ${vlen.toFixed(1)} s, narasi ${need.toFixed(1)} s, keluar ${len.toFixed(1)} s"`);
  lines.push(`[ -s "${out}" ] || ffmpeg -v error -y -i "${catName}" ${logoIn} ${ag.ins} -filter_complex "${chain}${vout};${ag.filter}" -map "[vout]" -map "[aout]" -t ${len.toFixed(2)} ${VID} "${out}"`);
  total += len; list.push(out);
  TL.scenes.push({ id: sc.id, judul: sc.judul, cat: catName.replace("seg/", ""), vlen, len, captions: capFiles.map((c, i) => ({ t0: c.t0, t1: c.t1, text: sc.captions[i].t, src: sc.captions[i].src ?? null, mp3: narr[i] ? narr[i].mp3.replace("tts/", "") : null, d: c.t1 - c.t0 - 0.25 })) });
  laporan.push({ id: sc.id, video_s: Math.round(vlen), narasi_s: Math.round(need), keluar_s: Math.round(len), beku: segs.filter((g) => !Array.isArray(g)).map((g) => `${g.hold}s+${g.d.toFixed(1)}`) });
}

card(CLOSER);

mkdirSync("C:/Users/MuhammadFauzanRamadh/Claude/Lomba/halalpilot/docs/video/remotion/public", { recursive: true });
writeFileSync("C:/Users/MuhammadFauzanRamadh/Claude/Lomba/halalpilot/docs/video/remotion/public/timeline.json", JSON.stringify(TL, null, 1));
// timeline untuk komposisi Remotion (docs/video/remotion): sumber video = seg/<cat>, narasi = tts/<mp3>
const REM_PUB = "C:/Users/MuhammadFauzanRamadh/Claude/Lomba/halalpilot/docs/video/remotion/public";
mkdirSync(REM_PUB, { recursive: true });
writeFileSync(join(REM_PUB, "timeline.json"), JSON.stringify(TL, null, 1));
writeFileSync(join(OUT_WIN, "daftar.txt"), list.map((f) => `file '${f}'`).join("\n") + "\n");
lines.push(`echo "== gabung"; ffmpeg -v error -y -f concat -safe 0 -i daftar.txt -c copy "${FINAL}"`);
lines.push(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${FINAL}"`);
writeFileSync(join(OUT_WIN, "render.sh"), lines.join("\n") + "\n", { encoding: "utf8" });
console.log(JSON.stringify({ total_detik: Math.round(total), menit: (total / 60).toFixed(1), adegan: laporan, logo: hasLogo, suara: !NO_TTS, keluaran: FINAL }, null, 1));
