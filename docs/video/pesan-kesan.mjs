// Video pesan & kesan pemenang (≤ 60 detik, landscape, avatar animasi).
//   node docs/video/pesan-kesan.mjs   → suara per kalimat + amplop amplitudo untuk gerak mulut → remotion/public/pesan/pesan.json
// Suara: bila ada Videos/HalalPilot-edit/rekam/pesan-NN.(m4a|wav|mp3) dipakai rekaman sendiri (dibersihkan + loudnorm),
// selain itu TTS edge-tts (id-ID-ArdiNeural) sebagai draf.
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const EDIT_WIN = "C:/Users/MuhammadFauzanRamadh/Videos/HalalPilot-edit";
const EDIT = "/mnt/c/Users/MuhammadFauzanRamadh/Videos/HalalPilot-edit";
const PUB = "C:/Users/MuhammadFauzanRamadh/Claude/Lomba/halalpilot/docs/video/remotion/public/pesan";
const FPS = 30, GAP = 0.35;
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

mkdirSync(join(EDIT_WIN, "pesan"), { recursive: true });
mkdirSync(PUB, { recursive: true });
const CLEAN = "highpass=f=80,afftdn=nf=-32:nr=10,silenceremove=start_periods=1:start_threshold=-42dB:start_silence=0.15,areverse,silenceremove=start_periods=1:start_threshold=-42dB:start_silence=0.25,areverse,acompressor=threshold=-20dB:ratio=2.5:attack=6:release=90:makeup=2,loudnorm=I=-16:TP=-1.5:LRA=9,alimiter=limit=0.7:level=false";

const clips = []; let t = 0.6; let sendiri = 0;
KALIMAT.forEach((teks, i) => {
  const nn = String(i + 1).padStart(2, "0");
  const out = `pesan/${nn}.mp3`;
  const rek = ["m4a", "wav", "mp3"].map((e) => `rekam/pesan-${nn}.${e}`).find((p) => existsSync(join(EDIT_WIN, p)));
  if (rek) {
    wsl(`cd "${EDIT}" && ffmpeg -v error -y -i "${rek}" -ac 1 -af "${CLEAN},aresample=48000" -c:a libmp3lame -b:a 192k "${out}"`);
    sendiri++;
  } else {
    writeFileSync(join(EDIT_WIN, `pesan/${nn}.txt`), teks, "utf8");
    wsl(`cd "${EDIT}" && ~/.local/bin/edge-tts --voice id-ID-ArdiNeural --rate=+4% -f "pesan/${nn}.txt" --write-media "${out}" >/dev/null 2>&1`);
  }
  const d = parseFloat(wsl(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${EDIT}/${out}"`));
  // amplop amplitudo per frame (RMS, 30 fps) untuk membuka-tutup mulut avatar
  wsl(`cd "${EDIT}" && ffmpeg -v error -y -i "${out}" -ac 1 -ar 8000 -f s16le "pesan/${nn}.pcm"`);
  const pcm = readFileSync(join(EDIT_WIN, `pesan/${nn}.pcm`));
  const per = 8000 / FPS; const env = [];
  for (let s = 0; s + per * 2 <= pcm.length / 2 + per; s += per) {
    let sum = 0, n = 0;
    for (let k = Math.floor(s); k < Math.floor(s + per) && k * 2 + 1 < pcm.length; k++) { const v = pcm.readInt16LE(k * 2) / 32768; sum += v * v; n++; }
    env.push(n ? Math.sqrt(sum / n) : 0);
  }
  copyFileSync(join(EDIT_WIN, out), join(PUB, `${nn}.mp3`));
  clips.push({ nn, teks, t0: +t.toFixed(3), d: +d.toFixed(3), env: env.map((v) => +v.toFixed(4)), sendiri: !!rek });
  t += d + GAP;
});
const peak = Math.max(...clips.flatMap((c) => c.env));
clips.forEach((c) => { c.env = c.env.map((v) => +Math.min(1, v / (peak * 0.8)).toFixed(3)); });
const bicara = t - GAP;
const json = { fps: FPS, intro: 0.6, bicara: +bicara.toFixed(3), total: +(bicara + 4.2).toFixed(3), clips };
writeFileSync(join(PUB, "pesan.json"), JSON.stringify(json));
console.log(JSON.stringify({ kalimat: clips.length, rekaman_sendiri: sendiri, bicara_s: json.bicara, total_s: json.total, durasi: clips.map((c) => `${c.nn}:${c.d}s`) }));
