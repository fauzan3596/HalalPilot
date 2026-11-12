// Video pesan & kesan pemenang (≤ 60 detik, landscape, avatar foto 2.5D).
//   node docs/video/pesan-kesan.mjs   → suara per kalimat + waktu tiap kata + amplop amplitudo → remotion/public/pesan/pesan.json
// Suara: bila ada Videos/HalalPilot-edit/rekam/pesan-NN.(m4a|wav|mp3) dipakai rekaman sendiri (dibersihkan + loudnorm),
// selain itu TTS edge-tts (id-ID-ArdiNeural) sebagai draf. Waktu kata: WordBoundary edge-tts (TTS) atau dibagi rata (rekaman).
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const EDIT_WIN = "C:/Users/MuhammadFauzanRamadh/Videos/HalalPilot-edit";
const EDIT = "/mnt/c/Users/MuhammadFauzanRamadh/Videos/HalalPilot-edit";
const KATA_PY = "/mnt/c/Users/MuhammadFauzanRamadh/Claude/Lomba/halalpilot/docs/video/pesan-kata.py";
const PUB = "C:/Users/MuhammadFauzanRamadh/Claude/Lomba/halalpilot/docs/video/remotion/public/pesan";
const FPS = 30, GAP = 0.35, INTRO = 2.4, OUTRO = 4.6;
const wsl = (cmd) => execFileSync("wsl", ["-e", "bash", "-lc", cmd], { encoding: "utf8", maxBuffer: 64 << 20 }).trim();

export const KALIMAT = [
  "Halo, saya Fauzan, pembuat HalalPilot.",
  "Terima kasih IDwebhost, CloudBaik, dan PANDI untuk AI HackFest 2026.",
  "Jujur, saya senang sekaligus kaget HalalPilot bisa meraih posisi kedua Best Innovation.",
  "Kesan saya: sepuluh hari yang berat tapi seru. VPS-nya kecil, waktunya mepet, dan bug paling mahal justru satu perintah npm install di hari pertama.",
  "Dari situ saya pegang satu prinsip: model memutuskan bahasa, kode memutuskan hukum.",
  "Pesan saya buat teman-teman: mulai dari masalah yang orangnya nyata.",
  "Cloud VPS CloudBaik dari hadiah ini akan saya pakai, supaya HalalPilot bisa dicoba koperasi sungguhan.",
  "Sampai jumpa di HackFest berikutnya!",
];
const CLEAN = "highpass=f=80,afftdn=nf=-32:nr=10,silenceremove=start_periods=1:start_threshold=-42dB:start_silence=0.15,areverse,silenceremove=start_periods=1:start_threshold=-42dB:start_silence=0.25,areverse,acompressor=threshold=-20dB:ratio=2.5:attack=6:release=90:makeup=2,loudnorm=I=-16:TP=-1.5:LRA=9,alimiter=limit=0.7:level=false";

mkdirSync(join(EDIT_WIN, "pesan"), { recursive: true });
mkdirSync(PUB, { recursive: true });

// 1) teks + rekaman sendiri bila ada
let sendiri = 0;
KALIMAT.forEach((teks, i) => {
  const nn = String(i + 1).padStart(2, "0");
  writeFileSync(join(EDIT_WIN, `pesan/${nn}.txt`), teks, "utf8");
  const rek = ["m4a", "wav", "mp3"].map((e) => `rekam/pesan-${nn}.${e}`).find((p) => existsSync(join(EDIT_WIN, p)));
  if (rek) {
    wsl(`cd "${EDIT}" && ffmpeg -v error -y -i "${rek}" -ac 1 -af "${CLEAN},aresample=48000" -c:a libmp3lame -b:a 192k "pesan/${nn}.mp3" && touch "pesan/${nn}.rekam"`);
    sendiri++;
  } else wsl(`rm -f "${EDIT}/pesan/${nn}.rekam"`);
});
// 2) TTS (untuk kalimat tanpa rekaman) + waktu tiap kata
wsl(`cd /tmp && python3 -P "${KATA_PY}" "${EDIT}/pesan"`);

// 3) durasi, amplop amplitudo per frame, susun garis waktu
const clips = []; let t = INTRO;
KALIMAT.forEach((teks, i) => {
  const nn = String(i + 1).padStart(2, "0");
  const out = `pesan/${nn}.mp3`;
  const d = parseFloat(wsl(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${EDIT}/${out}"`));
  wsl(`cd "${EDIT}" && ffmpeg -v error -y -i "${out}" -ac 1 -ar 8000 -f s16le "pesan/${nn}.pcm"`);
  const pcm = readFileSync(join(EDIT_WIN, `pesan/${nn}.pcm`));
  const per = 8000 / FPS, n = Math.floor(pcm.length / 2), env = [];
  for (let s = 0; s < n; s += per) {
    let sum = 0, c = 0;
    for (let k = Math.floor(s); k < Math.min(n, Math.floor(s + per)); k++) { const v = pcm.readInt16LE(k * 2) / 32768; sum += v * v; c++; }
    env.push(c ? Math.sqrt(sum / c) : 0);
  }
  copyFileSync(join(EDIT_WIN, out), join(PUB, `${nn}.mp3`));
  const words = JSON.parse(readFileSync(join(EDIT_WIN, `pesan/${nn}.words.json`), "utf8"));
  clips.push({ nn, teks, t0: +t.toFixed(3), d: +d.toFixed(3), env, words, sendiri: existsSync(join(EDIT_WIN, `pesan/${nn}.rekam`)) });
  t += d + GAP;
});
const peak = Math.max(...clips.flatMap((c) => c.env));
clips.forEach((c) => { c.env = c.env.map((v) => +Math.min(1, v / (peak * 0.8)).toFixed(3)); });
const bicara = t - GAP;
const json = { fps: FPS, intro: INTRO, bicara: +bicara.toFixed(3), total: +(bicara + OUTRO).toFixed(3), clips };
writeFileSync(join(PUB, "pesan.json"), JSON.stringify(json));
console.log(JSON.stringify({ kalimat: clips.length, rekaman_sendiri: sendiri, bicara_s: json.bicara, total_s: json.total, kata: clips.map((c) => c.words.length) }));
