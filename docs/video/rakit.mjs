// Perakit video demo HalalPilot dari klip rekaman layar (tanpa suara) → 1080p 16:9, potongan otomatis bagian layar diam,
// judul adegan, teks narasi (caption), kartu pembuka/penutup, watermark IDwebhost.
//   node docs/video/rakit.mjs            → menulis <out>/render.sh + berkas teks caption
//   wsl bash <out>/render.sh             → merender (ffmpeg di WSL)
// Masukan: berkas aktivitas per klip (rata-rata luma selisih antar-frame, 2 sampel/detik) dari scratchpad/activity/<klip>.txt.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const SCRATCH = "C:/Users/MUHAMM~1/AppData/Local/Temp/claude/C--Users-MuhammadFauzanRamadh-Claude-Lomba/2a19f223-da3c-4b56-bc2f-ba7fc9681285/scratchpad";
const ACT = join(SCRATCH, "activity");
const OUT_WIN = "C:/Users/MuhammadFauzanRamadh/Videos/HalalPilot-edit";
const OUT = "/mnt/c/Users/MuhammadFauzanRamadh/Videos/HalalPilot-edit";
const SRC = "/mnt/c/Users/MuhammadFauzanRamadh/Videos/Screen Recordings";
const FONT = "/mnt/c/Windows/Fonts/segoeui.ttf", FONTB = "/mnt/c/Windows/Fonts/segoeuib.ttf", MONO = "/mnt/c/Windows/Fonts/consola.ttf";
const LOGO = "/mnt/c/Users/MuhammadFauzanRamadh/Claude/Lomba/halalpilot/docs/logo/idwebhost.png"; // opsional; jika tidak ada → watermark teks
const LOGO_WIN = "C:/Users/MuhammadFauzanRamadh/Claude/Lomba/halalpilot/docs/logo/idwebhost.png";
const THR = 0.8;          // di atas ini = ada perubahan nyata di layar
const HOLD = 0.7;         // durasi keluaran untuk satu jeda diam (dipercepat)
const MAX_IDLE_1X = 2.0;  // jeda ≤ ini dibiarkan 1x
const ACTIVE = 1.2;       // percepatan bagian aktif (rekaman layar nyaman sampai ±1,25×)

// ---------------- adegan ----------------
// captions: kalimat narasi yang dibakar ke layar, ditampilkan berurutan sepanjang adegan.
const SCENES = [
  { id: "01", clip: "142912", end: 42, judul: "1 · Masalah: 120 UMK, 38 hari, berkas tidak lengkap", padAfter: 1.2, captions: [
    "Menurut INDEF yang mengutip Bappenas, baru sekitar 4% pelaku usaha yang produknya bersertifikat halal (Republika, 21/8/2026).",
    "Per 17 Oktober 2026 (PP 42/2024) makanan-minuman UMK wajib bersertifikat halal. Kemenag: tidak ada penundaan.",
    "Kuota gratis 1,35 juta dan 111 ribu pendamping sudah ada. Masalahnya: satu pendamping memegang ratusan UMK dan berkasnya jarang lengkap.",
    "Yang kurang bukan aplikasi unggah dokumen, tetapi seseorang yang mengerjakan dan mengejar dokumennya. Itu yang HalalPilot lakukan." ] },
  { id: "02", clip: "143118", start: 8, thr: 0.5, judul: "2 · Lingkungan: VPS AI Hosting IDwebhost · OpenClaw 2026.8.2", padAfter: 1.6, captions: [
    "Semua berjalan di satu VPS AI Hosting IDwebhost (CloudBaik): 4 vCPU, 4 GB RAM, Ubuntu 24.04.",
    "OpenClaw menjadi agen dan kanal Telegram. Layanan kecil Node + SQLite memegang aturan. Model membaca dan berbicara; kode memutuskan hukum.",
    "Tiga automations OpenClaw: digest 07.00, sapuan pengejaran 09.00 & 15.00, cek kuota tiap 6 jam. Semua berjalan sesuai jadwal." ] },
  { id: "03", clip: "161523", judul: "3 · Intake: foto label → daftar bahan → keputusan beralasan", padAfter: 2.2, captions: [
    "UMK cukup memotret label. Agen membaca komposisi lalu meminta konfirmasi daftar bahan.",
    "Tiap bahan dipetakan ke KMA 1360/2021: telur dikecualikan, tepung positif, margarin kritis.",
    "Yang menentukan jalur bukan modelnya, melainkan mesin aturan: margarin bahan kritis, jadi sertifikat pemasoknya wajib (E11).",
    "Skor kesiapan 60/100. Dokumen yang diminta hanya yang harus dari UMK; surat dan Manual SJPH disusun sistem." ] },
  { id: "04", clip: "161840", judul: "4 · Cerita proses & sertifikat pemasok → dossier otomatis", padAfter: 2.2, captions: [
    "Cerita proses disimpan apa adanya. Skor naik ke 80. Tinggal sertifikat pemasok margarin.",
    "Nomor sertifikat dicek ke registry (di sini simulasi). Skor 100: agen langsung menyusun berkas self-declare untuk ditinjau pendamping." ] },
  { id: "05", clip: "161958", end: 42, judul: "5 · Dossier PDF v1 dari server", padAfter: 2.5, captions: [
    "Berkas tersusun: permohonan, pernyataan, ikrar, daftar bahan dengan kelasnya, ringkasan proses, foto label, draf Manual SJPH.",
    "Setiap versi punya sidik jari SHA-256 dan versi aturan yang dipakai." ] },
  { id: "06", clip: "162420", judul: "6 · Pengejaran otomatis UMK-042 (waktu dimajukan)", padAfter: 2.2, captions: [
    "Sambal Mak Ijah: bahan aman, tetapi KBLI di NIB tidak cocok dan foto label belum ada. Skor 70.",
    "Penjadwal mengirim pengingat H+1, H+3, H+7 dengan nada meningkat, menghormati jam tenang dan batas dua pesan per hari.",
    "Di rekaman ini waktu dimajukan dengan perintah sweep. Kalimatnya ditulis model; jadwalnya diputuskan kode." ] },
  { id: "07", clip: "162541", judul: "7 · Eskalasi ke pendamping setelah 10 hari diam", padAfter: 2.2, captions: [
    "Setelah tiga pengingat tanpa respons, agen berhenti mengejar UMK dan melapor ke pendamping.",
    "Pendamping tahu persis siapa yang perlu ditelepon, dan kenapa." ] },
  { id: "07b", clip: "162629", judul: "7 · Eskalasi ke pendamping setelah 10 hari diam", padAfter: 2.2, captions: [
    "Pesan eskalasi: nama UMK, dokumen yang kurang, skor, dan saran tindakan." ] },
  { id: "08", clip: "163241", judul: "8 · Review pendamping: ringkasan & kembalikan berkas", padAfter: 2.2, captions: [
    "Pendamping bertanya status: total 120 UMK, siap unggah, menunggu review, eskalasi terbuka. Semua dari data, bukan karangan model.",
    "Pendamping tetap pemegang keputusan. Satu kalimat 'kembalikan' cukup: alasannya diteruskan ke UMK, keputusan baru dicatat, pengejaran dimulai lagi.",
    "Di dashboard, UMK-017 turun ke 'dikembalikan' dengan skor 80 dan jejak keputusannya." ] },
  { id: "09", clip: "170107", end: 432, padBefore: 0.5, judul: "9 · Foto ulang → berkas v2 → setuju → ajukan (simulasi)", padAfter: 2.2, captions: [
    "UMK mengirim foto ulang. Permintaan dokumen tertutup otomatis, skor kembali 100, berkas versi dua tersusun.",
    "Pendamping menyetujui lewat Telegram: status siap unggah.",
    "Perintah 'ajukan' mengirim ke SiHalal simulasi dan mendapat nomor SIM-… Bukan pengajuan resmi ke BPJPH.",
    "HalalPilot menyiapkan berkas; keputusan halal tetap di BPJPH dan pendamping." ] },
  { id: "10", clip: "170250", judul: "10 · Digest pagi & dashboard portofolio", padAfter: 2.2, captions: [
    "Setiap pagi pukul 07.00 pendamping menerima ringkasan seperti ini dari automations OpenClaw, tanpa membuka aplikasi.",
    "Dashboard baca-saja: 19 dari 120 siap unggah, laju 7 hari, papan diurutkan dari yang paling mendesak." ] },
  { id: "11", clip: "170535", fixed: [[0, 14, 1]], judul: "11 · Yang berjalan di server: dua unit systemd, 1,4 GB RAM", padAfter: 2.5, captions: [
    "Hanya port SSH yang terbuka. Gateway dan API di loopback. RAM terpakai 1.397 MB dari 3.915 MB saat semuanya hidup.",
    "Empat batas: menyiapkan bukan menerbitkan · portal pemerintah di sini simulasi · tanpa data pribadi · muat di satu VPS kecil." ] },
];

const OPENER = [
  ["4%", 190, FONTB, 0.12],
  ["pelaku usaha yang produknya bersertifikat halal", 46, FONT, 0.44],
  ["INDEF mengutip Bappenas 2026 · Republika, 21 Agustus 2026", 30, FONT, 0.53],
  ["17 Oktober 2026: makanan-minuman UMK wajib halal (PP 42/2024)", 40, FONTB, 0.66],
  ["HalalPilot · agen OpenClaw yang menyiapkan dan mengejar berkas self-declare untuk koperasi UMK", 32, FONT, 0.80],
  ["Berjalan di VPS AI Hosting IDwebhost · demo AI HackFest 2026", 28, FONT, 0.88],
];
const CLOSER = [
  ["HalalPilot", 84, FONTB, 0.10],
  ["Menyiapkan berkas, bukan menerbitkan sertifikat.", 40, FONT, 0.30],
  ["OSS, SEHATI, SiHalal dalam demo ini simulasi berlabel.", 40, FONT, 0.39],
  ["Tanpa KTP, nomor HP, rekening. Data bisa dihapus.", 40, FONT, 0.48],
  ["Muat di satu VPS AI Hosting IDwebhost 4 vCPU / 4 GB.", 40, FONT, 0.57],
  ["Model memutuskan bahasa. Kode memutuskan hukum.", 44, FONTB, 0.72],
  ["Kode, aturan YAML, konfigurasi OpenClaw: terbuka (MIT) · tautan di deskripsi video", 28, FONT, 0.86],
];

// ---------------- util ----------------
function wrap(s, n = 78) { const w = s.split(" "), L = []; let cur = ""; for (const x of w) { if ((cur + " " + x).trim().length > n) { L.push(cur.trim()); cur = x; } else cur += " " + x; } if (cur.trim()) L.push(cur.trim()); return L.join("\n"); }
function esc(s) { return s.replace(/\\/g, "\\\\").replace(/'/g, "’").replace(/:/g, "\\:"); }
function readAct(clip) { return readFileSync(join(ACT, clip + ".txt"), "utf8").trim().split("\n").map((l) => l.split(" ")).map(([t, v]) => [parseFloat(t), parseFloat(v)]); }
function dur(clip) { const a = readAct(clip); return a[a.length - 1][0]; }

// Bangun segmen [srcStart, srcEnd, speed] untuk satu adegan
function segments(sc) {
  if (sc.fixed) return sc.fixed;
  const act = readAct(sc.clip); const thr = sc.thr ?? THR; const start = sc.start ?? 0; const end = sc.end ?? act[act.length - 1][0];
  const padB = 0.8, padA = sc.padAfter;
  let iv = [];
  for (const [t, v] of act) { if (t <= start || t > end) continue; if (v > thr) iv.push([Math.max(start, t - 0.5 - padB), Math.min(end, t + padA)]); }
  // gabung
  iv.sort((a, b) => a[0] - b[0]); const m = [];
  for (const x of iv) { if (m.length && x[0] <= m[m.length - 1][1] + 0.01) m[m.length - 1][1] = Math.max(m[m.length - 1][1], x[1]); else m.push([...x]); }
  // isi jeda
  const segs = []; let cur = start;
  for (const [a, b] of m) { if (a > cur) { const g = a - cur; segs.push(g <= MAX_IDLE_1X ? [cur, a, ACTIVE] : [cur, a, Math.min(g / HOLD, 80)]); } segs.push([a, b, ACTIVE]); cur = b; }
  if (end > cur) { const g = end - cur; segs.push(g <= MAX_IDLE_1X ? [cur, end, ACTIVE] : [cur, end, Math.min(g / HOLD, 80)]); }
  return segs;
}
const outLen = (segs) => segs.reduce((s, [a, b, sp]) => s + (b - a) / sp, 0);

// ---------------- render ----------------
mkdirSync(OUT_WIN, { recursive: true }); mkdirSync(join(OUT_WIN, "txt"), { recursive: true });
const hasLogo = existsSync(LOGO_WIN);
const WM = hasLogo
  ? `[base][logo]overlay=W-w-40:H-h-40:format=auto`
  : `[base]drawtext=expansion=none:fontfile=${FONT}:text='IDwebhost  ·  AI Hosting':fontsize=26:fontcolor=white@0.95:box=1:boxcolor=black@0.7:boxborderw=12:x=w-tw-40:y=h-th-40`;
const VID = "-c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -r 30 -c:a aac -b:a 96k -shortest -movflags +faststart";
const lines = ["#!/bin/bash", "set -euo pipefail", `cd "${OUT}"`, `SRC="${SRC}"`, ""];
let total = 0; const list = [];

function card(name, items, seconds) {
  const dt = items.map(([t, size, font, y]) => `drawtext=expansion=none:fontfile=${font}:text='${esc(t)}':fontsize=${size}:fontcolor=white:x=(w-tw)/2:y=${Math.round(y * 1080)}`).join(",");
  const wm = hasLogo ? `;movie=${LOGO},scale=-1:56[logo];[base][logo]overlay=W-w-40:H-h-40` : "";
  const fc = hasLogo ? `color=c=0x141d18:s=1920x1080:d=${seconds},${dt},fade=t=in:st=0:d=0.6,fade=t=out:st=${seconds - 0.6}:d=0.6[base]${wm}` : `color=c=0x141d18:s=1920x1080:d=${seconds},${dt},fade=t=in:st=0:d=0.6,fade=t=out:st=${seconds - 0.6}:d=0.6[base];${WM}`;
  lines.push(`echo "== ${name}"; ffmpeg -v error -y -f lavfi -i "${fc.split("[base]")[0].replace(/,$/, "")}" -f lavfi -i anullsrc=r=48000:cl=stereo -t ${seconds} -vf "${hasLogo ? "" : ""}" ${VID} "${name}.mp4"`);
  total += seconds; list.push(`${name}.mp4`);
}
// kartu: versi sederhana tanpa filter_complex (watermark teks digambar sebagai drawtext tambahan)
lines.length = 5;
function cardSimple(name, items, seconds) {
  const dt = items.map(([t, size, font, y]) => `drawtext=expansion=none:fontfile=${font}:text='${esc(t)}':fontsize=${size}:fontcolor=white:x=(w-tw)/2:y=${Math.round(y * 1080)}`).join(",");
  const wm = hasLogo ? "" : `,drawtext=expansion=none:fontfile=${FONT}:text='IDwebhost  ·  AI Hosting':fontsize=26:fontcolor=white@0.95:box=1:boxcolor=black@0.7:boxborderw=12:x=w-tw-40:y=h-th-40`;
  const logoIn = hasLogo ? `-i "${LOGO}"` : "";
  const fc = hasLogo
    ? `-filter_complex "[0:v]${dt},fade=t=in:st=0:d=0.6,fade=t=out:st=${seconds - 0.6}:d=0.6[b];[2:v]scale=-1:56[l];[b][l]overlay=W-w-40:H-h-40"`
    : `-vf "${dt}${wm},fade=t=in:st=0:d=0.6,fade=t=out:st=${seconds - 0.6}:d=0.6"`;
  lines.push(`echo "== ${name}"; [ -s "${name}.mp4" ] || ffmpeg -v error -y -f lavfi -i color=c=0x141d18:s=1920x1080:d=${seconds}:r=30 -f lavfi -i anullsrc=r=48000:cl=stereo ${logoIn} ${fc} -t ${seconds} ${VID} "${name}.mp4"`);
  total += seconds; list.push(`${name}.mp4`);
}

cardSimple("00-pembuka", OPENER, 7);

mkdirSync(join(OUT_WIN, "seg"), { recursive: true });
for (const sc of SCENES) {
  const segs = segments(sc); const len = outLen(segs);
  // Tiap segmen dirender terpisah dengan -ss/-to (hemat memori; satu filtergraph dengan puluhan trim dari satu sumber
  // menahan semua frame 2880p di antrean dan ffmpeg dibunuh OOM), lalu digabung tanpa re-encode, lalu diberi teks.
  const segFiles = segs.map(([a, b, sp], i) => {
    const f = `seg/${sc.id}-${String(i).padStart(2, "0")}.mp4`;
    lines.push(`[ -s "${f}" ] || ffmpeg -v error -y -ss ${a.toFixed(2)} -t ${(b - a).toFixed(2)} -i "$SRC/Screen Recording 2026-09-10 ${sc.clip}.mp4" -an -vf "setpts=(PTS-STARTPTS)/${sp.toFixed(3)},fps=30,scale=1920:-2,crop=1920:1080" -c:v libx264 -preset veryfast -crf 17 -pix_fmt yuv420p "${f}"`);
    return f;
  });
  writeFileSync(join(OUT_WIN, `seg/${sc.id}.txt`), segFiles.map((f) => `file '${f.replace("seg/", "")}'`).join("\n") + "\n");
  lines.push(`[ -s "seg/${sc.id}-cat.mp4" ] || ffmpeg -v error -y -f concat -safe 0 -i seg/${sc.id}.txt -c copy "seg/${sc.id}-cat.mp4"`);
  // judul adegan (lower-third kiri atas) 5 detik pertama
  const judulFile = `txt/${sc.id}-judul.txt`; writeFileSync(join(OUT_WIN, judulFile), sc.judul, "utf8");
  let chain = `[0:v]drawtext=expansion=none:fontfile=${FONTB}:textfile=${judulFile}:fontsize=34:fontcolor=white:box=1:boxcolor=0x2f6b4a@0.92:boxborderw=14:x=40:y=36:enable='lt(t,5.5)'`;
  // caption narasi berurutan
  const n = sc.captions.length; const each = Math.max(3.5, (len - 1) / n);
  sc.captions.forEach((c, i) => {
    const f = `txt/${sc.id}-c${i}.txt`; writeFileSync(join(OUT_WIN, f), wrap(c), "utf8");
    const t0 = (0.8 + i * each).toFixed(2), t1 = (0.8 + (i + 1) * each - 0.3).toFixed(2);
    chain += `,drawtext=expansion=none:fontfile=${FONT}:textfile=${f}:fontsize=36:fontcolor=white:line_spacing=8:box=1:boxcolor=black@0.62:boxborderw=18:x=(w-tw)/2:y=h-th-64:enable='between(t,${t0},${t1})'`;
  });
  chain += `[base]`;
  const wm = hasLogo ? `;[1:v]scale=-1:56[logo];${WM}[v]` : `;${WM}[v]`;
  const logoIn = hasLogo ? `-i "${LOGO}"` : "";
  const aIdx = hasLogo ? 2 : 1;
  lines.push(`echo "== adegan ${sc.id} (${sc.clip}) → ${len.toFixed(1)} s dari ${(segs[segs.length - 1][1] - segs[0][0]).toFixed(0)} s"`);
  lines.push(`[ -s "${sc.id}.mp4" ] || ffmpeg -v error -y -i "seg/${sc.id}-cat.mp4" ${logoIn} -f lavfi -i anullsrc=r=48000:cl=stereo -filter_complex "${chain}${wm}" -map "[v]" -map ${aIdx}:a -t ${len.toFixed(2)} ${VID} "${sc.id}.mp4"`);
  total += len; list.push(`${sc.id}.mp4`);
}

cardSimple("99-penutup", CLOSER, 9);

writeFileSync(join(OUT_WIN, "daftar.txt"), list.map((f) => `file '${f}'`).join("\n") + "\n");
lines.push(`echo "== gabung"; ffmpeg -v error -y -f concat -safe 0 -i daftar.txt -c copy "HalalPilot-demo-v1.mp4"`);
lines.push(`ffprobe -v error -show_entries format=duration -of csv=p=0 "HalalPilot-demo-v1.mp4"`);
writeFileSync(join(OUT_WIN, "render.sh"), lines.join("\n") + "\n", { encoding: "utf8" });
console.log(JSON.stringify({ total_detik: Math.round(total), menit: (total / 60).toFixed(1), adegan: SCENES.map((s) => ({ id: s.id, clip: s.clip, keluar_s: Math.round(outLen(segments(s))), sumber_s: Math.round((s.end ?? dur(s.clip)) - (s.start ?? 0)) })), logo: hasLogo, render: `${OUT_WIN}/render.sh` }, null, 1));
