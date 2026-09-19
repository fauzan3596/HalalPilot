import raw from "../public/timeline.json";
import { REPLIES } from "./replies";
import { CHAPTERS, SCORE } from "./theme";

export type Caption = { t0: number; t1: number; text: string; src?: string | null; mp3: string | null; d: number };
export type Scene = { id: string; judul: string; cat: string; vlen: number; len: number; captions: Caption[] };
export type Card = { id: string; seconds: number; narasi: string; mp3: string | null; d: number; items: { t: string; size: number; y: number }[] };
export type Timeline = { fps: number; opener: Card; hasil: Card; closer: Card; scenes: Scene[] };

export const timeline = raw as Timeline;
export const FPS = 30;
export const f = (sec: number) => Math.round(sec * FPS);

export const TRANSITION = 12;      // frame transisi silang antar blok
export const CHAPTER_FRAMES = 66;  // kartu bab 2,2 s

export type Item =
  | { kind: "opener"; dur: number; start: number }
  | { kind: "closer"; dur: number; start: number }
  | { kind: "stats"; dur: number; start: number }
  | { kind: "chapter"; id: string; dur: number; start: number }
  | { kind: "scene"; scene: Scene; dur: number; start: number };

/** Susunan blok beserta frame mulai absolutnya (memperhitungkan transisi yang saling tumpang tindih). */
export const layout = (): { items: Item[]; total: number } => {
  const items: Item[] = [{ kind: "opener", dur: f(timeline.opener.seconds), start: 0 }];
  for (const s of timeline.scenes) {
    if (CHAPTERS[s.id]) items.push({ kind: "chapter", id: s.id, dur: CHAPTER_FRAMES, start: 0 });
    items.push({ kind: "scene", scene: s, dur: f(s.len), start: 0 });
  }
  items.push({ kind: "stats", dur: f(timeline.hasil.seconds), start: 0 });
  items.push({ kind: "closer", dur: f(timeline.closer.seconds), start: 0 });
  let t = 0;
  items.forEach((it, i) => { it.start = t; t += it.dur - (i < items.length - 1 ? TRANSITION : 0); });
  return { items, total: t };
};

export const totalFrames = () => layout().total;

/** Rentang frame absolut saat narasi berbunyi (untuk ducking musik). */
export const narrationSpans = (): [number, number][] => {
  const out: [number, number][] = [];
  for (const it of layout().items) {
    if (it.kind === "opener") out.push([it.start + f(0.8), it.start + f(0.8 + timeline.opener.d)]);
    if (it.kind === "closer") out.push([it.start + f(0.8), it.start + f(0.8 + timeline.closer.d)]);
    if (it.kind === "stats") out.push([it.start + f(0.8), it.start + f(0.8 + timeline.hasil.d)]);
    if (it.kind === "scene") for (const c of it.scene.captions) out.push([it.start + f(c.t0), it.start + f(c.t0 + c.d)]);
  }
  return out;
};

/** Frame absolut untuk efek suara: whoosh di awal tiap adegan/kartu bab, pop di kartu bab, ding saat skor mencapai 100, pop lembut saat balasan agen muncul. */
export const sfxCues = (): { whoosh: number[]; pop: number[]; ding: number[]; reply: number[] } => {
  const whoosh: number[] = [], pop: number[] = [], ding: number[] = [], reply: number[] = [];
  for (const it of layout().items) {
    if (it.kind === "scene") {
      whoosh.push(it.start + 2);
      for (const r of REPLIES[it.scene.id] ?? []) reply.push(it.start + f(r.t));
      for (const ev of SCORE[it.scene.id] ?? []) if (ev.to === 100) ding.push(it.start + f(it.scene.captions[ev.cap].t0) + f(1.2));
    }
    if (it.kind === "chapter" || it.kind === "stats") pop.push(it.start + 4);
    if (it.kind === "closer") whoosh.push(it.start + 2);
  }
  return { whoosh, pop, ding, reply };
};
