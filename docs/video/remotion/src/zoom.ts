import { Easing, interpolate } from "remotion";
import { Rect, REPLIES } from "./replies";
import { HIGHLIGHT, REPLY_LABEL, ZOOM } from "./theme";
import { f, Scene } from "./timeline";

const ease = Easing.bezier(0.16, 1, 0.3, 1);
const RAMP = 0.7;      // detik naik/turun skala
const MIN_HOLD = 3.5;  // zoom minimal (detik) per balasan
const JOIN = 0.7;      // dua balasan berjarak ≤ ini digabung jadi satu jendela zoom
const MAX_SCALE = 1.25;

export type ZoomEvent = { at: number; rect: Rect; label: string };
export type ZoomWindow = { a: number; b: number; events: ZoomEvent[] };

/** Skala agar kotak (setelah diperbesar) masih muat di 1080 px tinggi. */
const scaleFor = (r: Rect) => Math.max(1.12, Math.min(MAX_SCALE, 1000 / r.h));
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
/** Titik asal transformasi supaya kotak berada di tengah bila mungkin; tepi bingkai tetap menempel bila kotak dekat tepi. */
const originFor = (r: Rect, s: number) => ({
  x: clamp01((960 - s * (r.x + r.w / 2)) / (1920 * (1 - s))),
  y: clamp01((540 - s * (r.y + r.h / 2)) / (1080 * (1 - s))),
});

/**
 * Jendela zoom satu adegan: tiap balasan agen (deteksi otomatis) membuka zoom saat gelembungnya muncul dan menahan
 * sampai kalimat narasi yang menjelaskannya selesai (min. 3,5 s). Balasan yang berdekatan digabung; kotaknya berpindah halus.
 * Zoom manual (ZOOM di theme.ts, untuk layar terminal) memakai kotak HIGHLIGHT dan mengikuti rentang caption-nya.
 */
export const buildWindows = (scene: Scene): ZoomWindow[] => {
  const len = f(scene.len);
  const label = REPLY_LABEL[scene.id] ?? REPLY_LABEL.default;
  const evs: { at: number; b: number; rect: Rect; label: string }[] = [];
  for (const r of REPLIES[scene.id] ?? []) {
    const at = f(r.t);
    // kalimat yang menjelaskan balasan ini: mulai di sekitar kemunculan gelembung
    const caps = scene.captions.filter((c) => f(c.t0) >= at - f(1.5) && f(c.t0) <= at + f(2.5));
    const capEnd = caps.length ? Math.max(...caps.map((c) => f(c.t1))) : 0;
    evs.push({ at, b: Math.min(len - 6, Math.max(at + f(MIN_HOLD), capEnd)), rect: r.rect, label });
  }
  for (const i of ZOOM[scene.id] ?? []) {
    const c = scene.captions[i]; if (!c) continue;
    evs.push({ at: f(c.t0), b: f(c.t1), rect: HIGHLIGHT[scene.id] ?? HIGHLIGHT.default, label });
  }
  evs.sort((p, q) => p.at - q.at);
  const wins: ZoomWindow[] = [];
  for (const e of evs) {
    const w = wins[wins.length - 1];
    if (w && e.at <= w.b + f(JOIN)) { w.b = Math.max(w.b, e.b); w.events.push({ at: e.at, rect: e.rect, label: e.label }); }
    else wins.push({ a: e.at, b: e.b, events: [{ at: e.at, rect: e.rect, label: e.label }] });
  }
  return wins;
};

export type ZoomState = { k: number; scale: number; origin: { x: number; y: number }; rect: Rect; label: string };

const lerpRect = (p: Rect, q: Rect, t: number): Rect => ({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t, w: p.w + (q.w - p.w) * t, h: p.h + (q.h - p.h) * t });

/** Keadaan zoom pada frame tertentu (k = 0 tanpa zoom … 1 zoom penuh). */
export const zoomAt = (frame: number, wins: ZoomWindow[]): ZoomState | null => {
  const w = wins.find((x) => frame >= x.a && frame <= x.b);
  if (!w) return null;
  const k = interpolate(frame, [w.a, w.a + f(RAMP), w.b - f(RAMP), w.b], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  let j = 0; for (let i = 0; i < w.events.length; i++) if (frame >= w.events[i].at) j = i;
  let rect = w.events[j].rect;
  if (j > 0) { const t = interpolate(frame, [w.events[j].at, w.events[j].at + f(0.5)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }); rect = lerpRect(w.events[j - 1].rect, rect, t); }
  const s = scaleFor(rect);
  return { k, scale: 1 + k * (s - 1), origin: originFor(rect, s), rect, label: w.events[j].label };
};

/** Bagian durasi caption yang berada di dalam jendela zoom (0…1); caption dipindah ke kanan bila cukup besar. */
export const zoomOverlap = (t0: number, t1: number, wins: ZoomWindow[]) => {
  const a = f(t0), b = f(t1); if (b <= a) return 0;
  let ov = 0; for (const w of wins) ov += Math.max(0, Math.min(b, w.b) - Math.max(a, w.a));
  return ov / (b - a);
};
