// Perakit video demo HalalPilot dari klip rekaman layar (tanpa suara) → 1080p 16:9, potongan otomatis bagian layar diam,
// judul adegan, caption + narasi suara (edge-tts, id-ID), kartu pembuka/penutup, watermark logo IDwebhost.
//   node docs/video/rakit.mjs            → sintesis narasi yang belum ada (edge-tts di WSL), tulis <out>/render.sh + teks caption
//   wsl bash <out>/render.sh             → merender (ffmpeg di WSL); melanjutkan dari keluaran yang sudah ada
// Masukan: berkas aktivitas per klip (rata-rata luma selisih antar-frame, 2 sampel/detik) dari scratchpad/activity/<klip>.txt.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const SCRATCH = "C:/Users/MUHAMM~1/AppData/Local/Temp/claude/C--Users-MuhammadFauzanRamadh-Claude-Lomba/2a19f223-da3c-4b56-bc2f-ba7fc9681285/scratchpad";
const ACT = join(SCRATCH, "activity");
const OUT_WIN = "C:/Users/MuhammadFauzanRamadh/Videos/HalalPilot-edit";
const OUT = "/mnt/c/Users/MuhammadFauzanRamadh/Videos/HalalPilot-edit";
const SRC = "/mnt/c/Users/MuhammadFauzanRamadh/Videos/Screen Recordings";
const FONT = "/mnt/c/Windows/Fonts/segoeui.ttf", FONTB = "/mnt/c/Windows/Fonts/segoeuib.ttf";
const LOGO = "/mnt/c/Users/MuhammadFauzanRamadh/Claude/Lomba/halalpilot/docs/logo/idwebhost.png"; // badge logo IDwebhost (putih di kotak gelap)
const LOGO_WIN = "C:/Users/MuhammadFauzanRamadh/Claude/Lomba/halalpilot/docs/logo/idwebhost.png";
const THR = 0.8;          // di atas ini = ada perubahan nyata di layar
const HOLD = 0.7;         // durasi keluaran untuk satu jeda diam (dipercepat)
const MAX_IDLE_1X = 2.0;  // jeda ≤ ini dibiarkan 1x
const ACTIVE = 1.2;       // percepatan bagian aktif (rekaman layar nyaman sampai ±1,25×)
const VOICE = "id-ID-ArdiNeural", RATE = "+5%";
const GAP = 0.6;          // jeda antar kalimat narasi
const NO_TTS = process.argv.includes("--tanpa-suara");

// ---------------- adegan ----------------
// captions: kalimat narasi; dibakar ke layar sebagai teks DAN disintesis menjadi suara. Waktu tampil mengikuti durasi suara.
const SCENES = [
  { id: "01", clip: "142912", end: 42, judul: "1 · Masalah: 120 UMK, 38 hari, berkas tidak lengkap", padAfter: 1.2, captions: [
    "Menurut INDEF yang mengutip Bappenas, baru sekitar 4 persen pelaku usaha yang produknya bersertifikat halal.",
    "Per 17 Oktober 2026, makanan dan minuman UMK wajib bersertifikat halal. Kementerian Agama menegaskan tidak ada penundaan.",
    "Kuota gratis 1,35 juta dan 111 ribu pendamping sudah ada. Masalahnya: satu pendamping memegang ratusan UMK, dan berkasnya jarang lengkap.",
    "Yang kurang bukan aplikasi untuk mengunggah dokumen, tetapi seseorang yang mengerjakan dan mengejar dokumennya. Itu yang HalalPilot lakukan." ] },
  { id: "02", clip: "143118", start: 8, thr: 0.5, judul: "2 · Lingkungan: VPS AI Hosting IDwebhost · OpenClaw 2026.8.2", padAfter: 1.6, captions: [
    "Semua berjalan di satu VPS AI Hosting IDwebhost: 4 vCPU, 4 gigabyte RAM, Ubuntu 24.04.",
    "OpenClaw menjadi agen dan kanal Telegram. Layanan kecil Node dan SQLite memegang aturan. Model membaca dan berbicara; kode memutuskan hukum.",
    "Tiga automations OpenClaw: digest pukul tujuh pagi, sapuan pengejaran pukul sembilan dan tiga sore, cek kuota tiap enam jam. Semua berjalan sesuai jadwal." ] },
  { id: "03", clip: "161523", judul: "3 · Intake: foto label → daftar bahan → keputusan beralasan", padAfter: 2.2, captions: [
    "UMK cukup memotret label. Agen membaca komposisi, lalu meminta konfirmasi daftar bahan.",
    "Tiap bahan dipetakan ke KMA 1360 tahun 2021: telur dikecualikan, tepung positif, margarin kritis.",
    "Yang menentukan jalur bukan modelnya, melainkan mesin aturan: margarin bahan kritis, jadi sertifikat pemasoknya wajib.",
    "Skor kesiapan 60 dari 100. Yang diminta hanya dokumen yang harus dari UMK; surat dan Manual SJPH disusun sistem." ] },
  { id: "04", clip: "161840", judul: "4 · Cerita proses & sertifikat pemasok → dossier otomatis", padAfter: 2.2, captions: [
    "Cerita proses disimpan apa adanya. Skor naik ke 80. Tinggal sertifikat pemasok margarin.",
    "Nomor sertifikat dicek ke registry, di sini simulasi. Skor 100: agen langsung menyusun berkas self-declare untuk ditinjau pendamping." ] },
  { id: "05", clip: "161958", end: 42, judul: "5 · Dossier PDF v1 dari server", padAfter: 2.5, captions: [
    "Berkas tersusun: permohonan, pernyataan, ikrar, daftar bahan dengan kelasnya, ringkasan proses, foto label, dan draf Manual SJPH.",
    "Setiap versi punya sidik jari SHA-256 dan versi aturan yang dipakai." ] },
  { id: "06", clip: "162420", judul: "6 · Pengejaran otomatis UMK-042 (waktu dimajukan)", padAfter: 2.2, captions: [
    "Sambal Mak Ijah: bahannya aman, tetapi KBLI di NIB tidak cocok dan foto label belum ada. Skor 70.",
    "Penjadwal mengirim pengingat hari ke-1, ke-3, dan ke-7 dengan nada meningkat, menghormati jam tenang dan batas dua pesan per hari.",
    "Di rekaman ini waktu dimajukan dengan perintah sweep. Kalimatnya ditulis model; jadwalnya diputuskan kode." ] },
  { id: "07", clip: "162541", judul: "7 · Eskalasi ke pendamping setelah 10 hari diam", padAfter: 2.2, captions: [
    "Setelah tiga pengingat tanpa respons, agen berhenti mengejar UMK dan melapor ke pendamping.",
    "Pendamping tahu persis siapa yang perlu ditelepon, dan kenapa." ] },
  { id: "07b", clip: "162629", judul: "7 · Eskalasi ke pendamping setelah 10 hari diam", padAfter: 2.2, captions: [
    "Pesan eskalasi berisi nama UMK, dokumen yang kurang, skor, dan saran tindakan." ] },
  { id: "08", clip: "163241", judul: "8 · Review pendamping: ringkasan & kembalikan berkas", padAfter: 2.2, captions: [
    "Pendamping bertanya status: total 120 UMK, siap unggah, menunggu review, eskalasi terbuka. Semua dari data, bukan karangan model.",
    "Pendamping tetap pemegang keputusan. Satu kalimat 'kembalikan' cukup: alasannya diteruskan ke UMK, keputusan baru dicatat, pengejaran dimulai lagi.",
    "Di dashboard, UMK-017 turun ke status dikembalikan dengan skor 80, lengkap dengan jejak keputusannya." ] },
  { id: "09", clip: "170107", end: 432, judul: "9 · Foto ulang → berkas v2 → setuju → ajukan (simulasi)", padAfter: 2.2, captions: [
    "UMK mengirim foto ulang. Permintaan dokumen tertutup otomatis, skor kembali 100, dan berkas versi dua tersusun.",
    "Pendamping menyetujui lewat Telegram. Status berubah menjadi siap unggah.",
    "Perintah 'ajukan' mengirim ke SiHalal simulasi dan mendapat nomor SIM. Ini bukan pengajuan resmi ke BPJPH.",
    "HalalPilot menyiapkan berkas; keputusan halal tetap di BPJPH dan pendamping." ] },
  { id: "10", clip: "170250", judul: "10 · Digest pagi & dashboard portofolio", padAfter: 2.2, captions: [
    "Setiap pagi pukul tujuh, pendamping menerima ringkasan seperti ini dari automations OpenClaw, tanpa membuka aplikasi apa pun.",
    "Dashboard baca-saja: 19 dari 120 UMK siap unggah, laju tujuh hari terakhir, dan papan yang diurutkan dari yang paling mendesak." ] },
  { id: "11", clip: "170535", fixed: [[0, 14, 1]], judul: "11 · Yang berjalan di server: dua unit systemd, 1,4 GB RAM", padAfter: 2.5, captions: [
    "Hanya port SSH yang terbuka. Gateway dan API di loopback. RAM terpakai 1.397 megabyte dari 3.915 saat semuanya hidup.",
    "Empat batas yang kami pegang: menyiapkan bukan menerbitkan; portal pemerintah di sini simulasi; tanpa data pribadi; dan semuanya muat di satu VPS kecil." ] },
];

const OPENER = { id: "00-pembuka", min: 7, narasi: "HalalPilot: agen OpenClaw yang menyiapkan dan mengejar berkas sertifikasi halal untuk koperasi UMK, berjalan di VPS AI Hosting IDwebhost.", items: [
  ["4%", 190, FONTB, 0.12],
  ["pelaku usaha yang produknya bersertifikat halal", 46, FONT, 0.44],
  ["INDEF mengutip Bappenas 2026 · Republika, 21 Agustus 2026", 30, FONT, 0.53],
  ["17 Oktober 2026: makanan-minuman UMK wajib halal (PP 42/2024)", 40, FONTB, 0.66],
  ["HalalPilot · agen OpenClaw yang menyiapkan dan mengejar berkas self-declare untuk koperasi UMK", 32, FONT, 0.80],
  ["Berjalan di VPS AI Hosting IDwebhost · demo AI HackFest 2026", 28, FONT, 0.88],
] };
const CLOSER = { id: "99-penutup", min: 9, narasi: "Model memutuskan bahasa. Kode memutuskan hukum. HalalPilot menyiapkan berkas; keputusan halal tetap milik BPJPH dan pendamping. Kode dan aturannya terbuka.", items: [
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
function dur(clip) { const a = readAct(clip); return a[a.length - 1][0]; }
function wsl(cmd) { return execFileSync("wsl", ["-e", "bash", "-lc", cmd], { encoding: "utf8" }).trim(); }

// Narasi: sintesis sekali (cache), kembalikan durasi detik. Teks dikirim ke layanan TTS Microsoft (edge-tts).
function narasi(name, text) {
  const mp3 = `tts/${name}.mp3`; const txt = `tts/${name}.txt`;
  writeFileSync(join(OUT_WIN, txt), text, "utf8");
  if (NO_TTS) return { mp3: null, d: Math.max(3, text.split(" ").length * 0.42) };
  if (!existsSync(join(OUT_WIN, mp3))) {
    process.stderr.write(`tts ${name}\n`);
    wsl(`cd "${OUT}" && ~/.local/bin/edge-tts --voice ${VOICE} --rate=${RATE} -f "${txt}" --write-media "${mp3}" >/dev/null 2>&1`);
  }
  const d = parseFloat(wsl(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${OUT}/${mp3}"`));
  return { mp3, d };
}

// Bangun segmen [srcStart, srcEnd, speed] untuk satu adegan
function segments(sc) {
  if (sc.fixed) return sc.fixed;
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
const outLen = (segs) => segs.reduce((s, [a, b, sp]) => s + (b - a) / sp, 0);

// ---------------- render ----------------
for (const d of ["", "txt", "seg", "tts"]) mkdirSync(join(OUT_WIN, d), { recursive: true });
const hasLogo = existsSync(LOGO_WIN);
const VID = "-c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -r 30 -c:a aac -b:a 128k -movflags +faststart";
const WM_TXT = `drawtext=expansion=none:fontfile=${FONT}:text='IDwebhost  ·  AI Hosting':fontsize=26:fontcolor=white@0.95:box=1:boxcolor=black@0.7:boxborderw=12:x=w-tw-40:y=h-th-40`;
const lines = ["#!/bin/bash", "set -euo pipefail", `cd "${OUT}"`, `SRC="${SRC}"`, ""];
let total = 0; const list = [];

// Susun jalur audio: tiap narasi mulai di t_i; keluaran = anullsrc + amix dengan adelay. Mengembalikan {inputs, filter, label}
function audioGraph(narr, firstIdx) {
  // narr: [{mp3, t}] ; input index audio mulai dari firstIdx; anullsrc = input terakhir
  const ins = narr.map((n) => `-i "${n.mp3}"`).join(" ") + ` -f lavfi -i anullsrc=r=48000:cl=stereo`;
  const parts = narr.map((n, i) => `[${firstIdx + i}:a]aresample=48000,adelay=${Math.round(n.t * 1000)}|${Math.round(n.t * 1000)}[n${i}]`).join(";");
  const mix = narr.map((_, i) => `[n${i}]`).join("") + `[${firstIdx + narr.length}:a]amix=inputs=${narr.length + 1}:normalize=0:duration=first[aout]`;
  return { ins, filter: (parts ? parts + ";" : "") + mix, nAudio: narr.length + 1 };
}

function card(c) {
  const n = narasi(c.id, c.narasi);
  const seconds = Math.max(c.min, n.d + 1.6);
  const dt = c.items.map(([t, size, font, y]) => `drawtext=expansion=none:fontfile=${font}:text='${esc(t)}':fontsize=${size}:fontcolor=white:x=(w-tw)/2:y=${Math.round(y * 1080)}`).join(",");
  // input 0: warna; input 1: logo (opsional); lalu audio
  const logoIn = hasLogo ? `-i "${LOGO}"` : ""; const aFirst = hasLogo ? 2 : 1;
  const narr = n.mp3 ? [{ mp3: n.mp3, t: 0.8 }] : [];
  const ag = audioGraph(narr, aFirst);
  const vchain = `[0:v]${dt},fade=t=in:st=0:d=0.6,fade=t=out:st=${(seconds - 0.6).toFixed(2)}:d=0.6[b];` + (hasLogo ? `[1:v]scale=-1:56[l];[b][l]overlay=W-w-40:H-h-40[vout]` : `[b]${WM_TXT}[vout]`);
  lines.push(`echo "== ${c.id} (${seconds.toFixed(1)} s)"; [ -s "${c.id}.mp4" ] || ffmpeg -v error -y -f lavfi -i color=c=0x141d18:s=1920x1080:d=${seconds.toFixed(2)}:r=30 ${logoIn} ${ag.ins} -filter_complex "${vchain};${ag.filter}" -map "[vout]" -map "[aout]" -t ${seconds.toFixed(2)} ${VID} "${c.id}.mp4"`);
  total += seconds; list.push(`${c.id}.mp4`);
}

card(OPENER);

const laporan = [];
for (const sc of SCENES) {
  const segs = segments(sc); const vlen = outLen(segs);
  // segmen → berkas kecil (-ss/-t, hemat memori) → gabung tanpa re-encode
  const segFiles = segs.map(([a, b, sp], i) => {
    const f = `seg/${sc.id}-${String(i).padStart(2, "0")}.mp4`;
    lines.push(`[ -s "${f}" ] || ffmpeg -v error -y -ss ${a.toFixed(2)} -t ${(b - a).toFixed(2)} -i "$SRC/Screen Recording 2026-09-10 ${sc.clip}.mp4" -an -vf "setpts=(PTS-STARTPTS)/${sp.toFixed(3)},fps=30,scale=1920:-2,crop=1920:1080" -c:v libx264 -preset veryfast -crf 17 -pix_fmt yuv420p "${f}"`);
    return f;
  });
  writeFileSync(join(OUT_WIN, `seg/${sc.id}.txt`), segFiles.map((f) => `file '${f.replace("seg/", "")}'`).join("\n") + "\n");
  lines.push(`[ -s "seg/${sc.id}-cat.mp4" ] || ffmpeg -v error -y -f concat -safe 0 -i seg/${sc.id}.txt -c copy "seg/${sc.id}-cat.mp4"`);
  // narasi + caption: waktu tampil mengikuti durasi suara
  let t = 0.8; const narr = [];
  const judulFile = `txt/${sc.id}-judul.txt`; writeFileSync(join(OUT_WIN, judulFile), sc.judul, "utf8");
  let chain = `[0:v]drawtext=expansion=none:fontfile=${FONTB}:textfile=${judulFile}:fontsize=34:fontcolor=white:box=1:boxcolor=0x2f6b4a@0.92:boxborderw=14:x=40:y=36:enable='lt(t,5.5)'`;
  sc.captions.forEach((c, i) => {
    const f = `txt/${sc.id}-c${i}.txt`; writeFileSync(join(OUT_WIN, f), wrap(c), "utf8");
    const n = narasi(`${sc.id}-c${i}`, c);
    if (n.mp3) narr.push({ mp3: n.mp3, t });
    chain += `,drawtext=expansion=none:fontfile=${FONT}:textfile=${f}:fontsize=36:fontcolor=white:line_spacing=8:box=1:boxcolor=black@0.62:boxborderw=18:x=(w-tw)/2:y=h-th-64:enable='between(t,${t.toFixed(2)},${(t + n.d + 0.25).toFixed(2)})'`;
    t += n.d + GAP;
  });
  const need = t + 0.6;                     // narasi selesai + jeda
  const len = Math.max(vlen, need);
  const pad = len > vlen + 0.05 ? `,tpad=stop_mode=clone:stop_duration=${(len - vlen).toFixed(2)}` : "";
  chain = chain.replace("[0:v]", `[0:v]${pad ? pad.slice(1) + "," : ""}`);
  const logoIn = hasLogo ? `-i "${LOGO}"` : ""; const aFirst = hasLogo ? 2 : 1;
  const ag = audioGraph(narr, aFirst);
  const vout = hasLogo ? `[base];[1:v]scale=-1:56[logo];[base][logo]overlay=W-w-40:H-h-40[vout]` : `[base];[base]${WM_TXT}[vout]`;
  lines.push(`echo "== adegan ${sc.id} (${sc.clip}) → video ${vlen.toFixed(1)} s, narasi ${need.toFixed(1)} s, keluar ${len.toFixed(1)} s"`);
  lines.push(`[ -s "${sc.id}.mp4" ] || ffmpeg -v error -y -i "seg/${sc.id}-cat.mp4" ${logoIn} ${ag.ins} -filter_complex "${chain}${vout};${ag.filter}" -map "[vout]" -map "[aout]" -t ${len.toFixed(2)} ${VID} "${sc.id}.mp4"`);
  total += len; list.push(`${sc.id}.mp4`);
  laporan.push({ id: sc.id, video_s: Math.round(vlen), narasi_s: Math.round(need), keluar_s: Math.round(len) });
}

card(CLOSER);

writeFileSync(join(OUT_WIN, "daftar.txt"), list.map((f) => `file '${f}'`).join("\n") + "\n");
lines.push(`echo "== gabung"; ffmpeg -v error -y -f concat -safe 0 -i daftar.txt -c copy "HalalPilot-demo-v2.mp4"`);
lines.push(`ffprobe -v error -show_entries format=duration -of csv=p=0 "HalalPilot-demo-v2.mp4"`);
writeFileSync(join(OUT_WIN, "render.sh"), lines.join("\n") + "\n", { encoding: "utf8" });
console.log(JSON.stringify({ total_detik: Math.round(total), menit: (total / 60).toFixed(1), adegan: laporan, logo: hasLogo, suara: !NO_TTS, render: `${OUT_WIN}/render.sh` }, null, 1));
