// Membuat musik latar (pad ambient lembut) dan efek suara secara prosedural → public/sfx/*.wav
// Bebas lisensi: seluruh audio disintesis dari sinus dan derau, bukan sampel pihak ketiga.
//   node scripts/synth.mjs
import { mkdirSync, writeFileSync } from "node:fs";

const SR = 48000;
const out = new URL("../public/sfx/", import.meta.url);
mkdirSync(out, { recursive: true });

function wav(samples, name, peak = 0.9) {
  let max = 0; for (const s of samples) max = Math.max(max, Math.abs(s));
  const g = max > 0 ? peak / max : 1;
  const buf = Buffer.alloc(44 + samples.length * 2);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + samples.length * 2, 4); buf.write("WAVE", 8);
  buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write("data", 36); buf.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++) buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(samples[i] * g * 32767))), 44 + i * 2);
  writeFileSync(new URL(name, out), buf);
  console.log(name, (samples.length / SR).toFixed(1), "s");
}

const note = (n) => 440 * Math.pow(2, (n - 69) / 12); // MIDI → Hz

// ---- musik: 96 s, empat akor × 8 s × 3 putaran, pad sinus berlapis + bass lembut. Dibuat agar mulus saat di-loop.
{
  const chords = [
    [48, 55, 60, 64, 71], // Cmaj7 (C3 G3 C4 E4 B4)
    [45, 52, 57, 60, 67], // Am7
    [41, 48, 53, 57, 64], // Fmaj7
    [43, 50, 55, 59, 62], // G add9
  ];
  const chordLen = 8, loops = 3, len = chords.length * chordLen * loops;
  const N = SR * len; const s = new Float32Array(N);
  for (let c = 0; c < chords.length * loops; c++) {
    const ch = chords[c % chords.length]; const t0 = c * chordLen;
    const a0 = Math.floor((t0 - 1.5) * SR), a1 = Math.floor((t0 + chordLen + 1.5) * SR); // tumpang tindih 1,5 s antar akor
    for (let i = Math.max(0, a0); i < Math.min(N, a1); i++) {
      const t = i / SR - t0; // relatif ke awal akor (bisa negatif saat fade-in)
      const env = Math.min(1, Math.max(0, (t + 1.5) / 2.5)) * Math.min(1, Math.max(0, (chordLen + 1.5 - t) / 2.5));
      let v = 0;
      ch.forEach((m, k) => {
        const f = note(m); const det = 1 + (k % 2 ? 0.0012 : -0.0009);
        const tt = i / SR;
        v += (Math.sin(2 * Math.PI * f * tt) + 0.6 * Math.sin(2 * Math.PI * f * det * tt) + 0.18 * Math.sin(2 * Math.PI * f * 2 * tt)) * (k === 0 ? 0.9 : 0.55);
      });
      const lfo = 0.85 + 0.15 * Math.sin(2 * Math.PI * 0.07 * (i / SR));
      s[i] += v * env * lfo * 0.08;
    }
  }
  // bass sinus sangat pelan mengikuti nada dasar
  for (let c = 0; c < chords.length * loops; c++) {
    const f = note(chords[c % chords.length][0] - 12); const t0 = c * chordLen;
    for (let i = Math.floor(t0 * SR); i < Math.min(N, Math.floor((t0 + chordLen) * SR)); i++) {
      const t = i / SR - t0; const env = Math.min(1, t / 1.5) * Math.min(1, (chordLen - t) / 1.5);
      s[i] += Math.sin(2 * Math.PI * f * (i / SR)) * env * 0.05;
    }
  }
  // ekor loop: fade tepi 0,5 s supaya sambungan loop tidak berdetak
  for (let i = 0; i < SR * 0.5; i++) { const g = i / (SR * 0.5); s[i] *= g; s[N - 1 - i] *= g; }
  wav(s, "musik.wav", 0.6);
}

// ---- whoosh 0,45 s: derau dengan tapis lolos-rendah yang menyapu naik lalu turun
{
  const len = 0.45, N = Math.floor(SR * len); const s = new Float32Array(N); let lp = 0, seed = 7;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff * 2 - 1; };
  for (let i = 0; i < N; i++) {
    const t = i / N; const cutoff = 200 + 2600 * Math.sin(Math.PI * t); const a = 1 - Math.exp(-2 * Math.PI * cutoff / SR);
    lp += a * (rnd() - lp);
    const env = Math.pow(Math.sin(Math.PI * t), 1.6);
    s[i] = lp * env;
  }
  wav(s, "whoosh.wav", 0.5);
}

// ---- ding 0,9 s: dua sinus (E5 + B5) dengan peluruhan eksponensial
{
  const len = 0.9, N = Math.floor(SR * len); const s = new Float32Array(N);
  for (let i = 0; i < N; i++) { const t = i / SR; s[i] = (Math.sin(2 * Math.PI * 659.25 * t) + 0.5 * Math.sin(2 * Math.PI * 987.77 * t) + 0.2 * Math.sin(2 * Math.PI * 1318.5 * t)) * Math.exp(-4.5 * t) * Math.min(1, t / 0.005); }
  wav(s, "ding.wav", 0.55);
}

// ---- pop 0,09 s: sinus meluncur 700 → 220 Hz
{
  const len = 0.09, N = Math.floor(SR * len); const s = new Float32Array(N); let ph = 0;
  for (let i = 0; i < N; i++) { const t = i / N; const f = 700 - 480 * t; ph += 2 * Math.PI * f / SR; s[i] = Math.sin(ph) * Math.exp(-6 * t) * Math.min(1, i / 40); }
  wav(s, "pop.wav", 0.5);
}
