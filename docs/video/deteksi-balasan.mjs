// Deteksi otomatis kemunculan BALASAN AGEN (gelembung abu di kiri chat Telegram) pada video segmen keluaran tiap adegan,
// untuk pemicu zoom di komposisi Remotion (docs/video/remotion/src/zoom.ts).
//   node docs/video/deteksi-balasan.mjs        → salin segmen dari <edit>/seg ke remotion/public/seg, ekstrak frame kecil (ffmpeg di WSL),
//                                                 deteksi, tulis remotion/public/replies.json  { "03": [{ t, settle, rect }, …], … }
// Cara kerja: area chat (x 0..960, y 190..1030) dicuplik 5 fps dan diperkecil 4× (240×210). Lonjakan selisih luma antar-frame = peristiwa.
// Gelembung terbawah dikenali dari kolom bantalan kirinya (x = 56 px, warna #1f1f1f) → kotaknya; ungu di kanan = pesan pengguna, dilewati.
// Gelembung yang sama muncul lagi (gulir, dialog foto menutup) dikenali lewat sidik jari baris terbawahnya dan dilewati.
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const ROOT = "C:/Users/MuhammadFauzanRamadh/Claude/Lomba/halalpilot/docs/video/remotion";
const EDIT_WIN = "C:/Users/MuhammadFauzanRamadh/Videos/HalalPilot-edit";
const EDIT = "/mnt/c/Users/MuhammadFauzanRamadh/Videos/HalalPilot-edit";
const RAW_WIN = join(EDIT_WIN, "raw"); const RAW = `${EDIT}/raw`;
const TELEGRAM = ["03", "04", "06", "07", "08", "09", "10"];   // adegan yang memuat chat Telegram di paruh kiri
const W = 240, H = 210, FB = W * H * 3, FPS = 5, THR = 0.7, Y0 = 190, SC = 4;
const wsl = (cmd) => execFileSync("wsl", ["-e", "bash", "-lc", cmd], { encoding: "utf8" }).trim();

const tl = JSON.parse(readFileSync(join(ROOT, "public/timeline.json"), "utf8"));
mkdirSync(join(ROOT, "public/seg"), { recursive: true }); mkdirSync(RAW_WIN, { recursive: true });
for (const s of tl.scenes) { const dst = join(ROOT, "public/seg", s.cat); if (!existsSync(dst)) copyFileSync(join(EDIT_WIN, "seg", s.cat), dst); }

const isGrey = (r, g, b) => r >= 24 && r <= 40 && g >= 24 && g <= 40 && b >= 24 && b <= 40 && Math.abs(r - g) < 7 && Math.abs(g - b) < 7;
const isPurple = (r, g, b) => b > r + 40 && b > g + 60 && r >= 70 && r <= 160;
const isDark = (r, g, b) => r < 22 && g < 22 && b < 24;

const out = {};
for (const sc of tl.scenes) {
  if (!TELEGRAM.includes(sc.id)) continue;
  const raw = join(RAW_WIN, sc.cat.replace(".mp4", ".rgb"));
  if (!existsSync(raw) || statSync(raw).size === 0) {
    process.stderr.write(`ekstrak ${sc.id}\n`);
    wsl(`ffmpeg -v error -y -i "${EDIT}/seg/${sc.cat}" -vf "fps=${FPS},crop=960:840:0:${Y0},scale=${W}:${H}:flags=area" -f rawvideo -pix_fmt rgb24 "${RAW}/${sc.cat.replace(".mp4", ".rgb")}"`);
  }
  const buf = readFileSync(raw); const N = Math.floor(buf.length / FB);
  const px = (i, x, y) => { const o = i * FB + (y * W + x) * 3; return [buf[o], buf[o + 1], buf[o + 2]]; };
  const luma = new Float32Array(N * W * H);
  for (let i = 0; i < N; i++) for (let p = 0; p < W * H; p++) { const o = i * FB + p * 3; luma[i * W * H + p] = 0.299 * buf[o] + 0.587 * buf[o + 1] + 0.114 * buf[o + 2]; }
  const diff = new Float32Array(N);
  for (let i = 1; i < N; i++) { let s = 0; for (let p = 0; p < W * H; p++) s += Math.abs(luma[i * W * H + p] - luma[(i - 1) * W * H + p]); diff[i] = s / (W * H); }

  // gelembung terbawah pada frame i
  const bottom = (i) => {
    const botRow = (y) => isGrey(...px(i, 14, y));
    const usrRow = (y) => [216, 218, 220, 222, 224, 226].some((x) => isPurple(...px(i, x, y)));
    let y = H - 1; while (y >= 0 && !botRow(y) && !usrRow(y)) y--;
    if (y < 0) return { kind: "none" };
    const kind = botRow(y) ? "bot" : "user"; const test = kind === "bot" ? botRow : usrRow;
    const yb = y; let yt = y; while (yt - 1 >= 0 && test(yt - 1)) yt--;
    let xmax = 0;
    if (kind === "bot") for (let yy = yt; yy <= yb; yy++) { let dark = 0; for (let x = 14; x < W; x++) { const c = px(i, x, yy); if (isGrey(...c)) { xmax = Math.max(xmax, x); dark = 0; } else if (isDark(...c)) { if (++dark >= 4) break; } else dark = 0; } }
    return { kind, yt, yb, xmax };
  };
  // sidik jari 12 baris terbawah gelembung (lebar tetap) → mengenali gelembung yang sama setelah gulir/dialog
  const tail = (i, b) => { const a = []; for (let y = Math.max(b.yt, b.yb - 11); y <= b.yb; y++) for (let x = 14; x <= 150; x++) a.push(luma[i * W * H + y * W + x]); return a; };
  const same = (a, b) => a.length === b.length && a.reduce((s, v, k) => s + Math.abs(v - b[k]), 0) / a.length < 8;

  // "gulir saja": isi 80 baris terbawah frame sesudah = frame sebelum yang digeser d baris (kotak input membesar, gulir), bukan pesan baru
  const shiftOnly = (b, a) => { let best = 1e9; for (let d = -20; d <= 20; d++) { let sum = 0, n = 0; for (let y = 120; y < 200; y++) { const yb = y + d; if (yb < 0 || yb >= H) continue; for (let x = 0; x < W; x += 2) { sum += Math.abs(luma[a * W * H + y * W + x] - luma[b * W * H + yb * W + x]); n++; } } if (n && sum / n < best) best = sum / n; } return best < 5; };
  const ev = []; let cur = null;
  for (let i = 1; i < N; i++) if (diff[i] > THR) { if (cur && i - cur.end <= FPS) cur.end = i; else { cur = { start: i, end: i }; ev.push(cur); } }
  const seen = []; const res = []; const log = [];
  for (const e of ev) {
    const before = Math.max(0, e.start - 2);
    // kotak diambil dari frame yang sudah tenang; pilih yang gelembungnya paling tinggi (animasi gulir bisa belum selesai)
    const cands = [3, 6, 9].map((d) => Math.min(N - 1, e.end + d)).map((i) => ({ i, b: bottom(i) })).filter((c) => c.b.kind === "bot");
    const A = cands.sort((p, q) => (q.b.yb - q.b.yt) - (p.b.yb - p.b.yt))[0];
    const B = bottom(before);
    let kind = bottom(Math.min(N - 1, e.end + 3)).kind, note = "";
    if (A) {
      const h = (A.b.yb - A.b.yt + 1) * SC, w = (A.b.xmax - 13) * SC; const tA = tail(A.i, A.b);
      if (B.kind === "bot" && same(tA, tail(before, B))) note = "sama-sebelum";
      else if (seen.some((s) => same(tA, s))) note = "sama-lama";
      else if (h < 60) note = "terlalu-pendek";
      else if (shiftOnly(before, A.i)) note = "gulir-saja";
      else { kind = "bot"; res.push({ t: +(e.start / FPS).toFixed(1), settle: +(A.i / FPS).toFixed(1), rect: { x: 40, y: Y0 + A.b.yt * SC - 10, w: Math.min(920, w + 36), h: h + 20 } }); }
      seen.push(tA);
    }
    if (B.kind === "bot") seen.push(tail(before, B));
    log.push(`${(e.start / FPS).toFixed(1)}s ${kind}${note ? " (" + note + ")" : ""}`);
  }
  out[sc.id] = res;
  console.log(`${sc.id}: ${res.length} balasan → ${res.map((r) => `${r.t}s [${r.rect.y}+${r.rect.h}]`).join(", ")}`);
  console.log(`     peristiwa: ${log.join(" · ")}`);
}
writeFileSync(join(ROOT, "public/replies.json"), JSON.stringify(out, null, 1));
console.log("ditulis: remotion/public/replies.json");
