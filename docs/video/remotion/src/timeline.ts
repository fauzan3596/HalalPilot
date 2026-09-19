import raw from "../public/timeline.json";

export type Caption = { t0: number; t1: number; text: string; mp3: string | null; d: number };
export type Scene = { id: string; judul: string; cat: string; vlen: number; len: number; captions: Caption[] };
export type Card = { id: string; seconds: number; narasi: string; mp3: string | null; d: number; items: { t: string; size: number; y: number }[] };
export type Timeline = { fps: number; opener: Card; closer: Card; scenes: Scene[] };

export const timeline = raw as Timeline;
export const FPS = 30;
export const f = (sec: number) => Math.round(sec * FPS);

// Durasi transisi antar adegan (frame). Silang halus.
export const TRANSITION = 12;

export const totalFrames = () => {
  const parts = [timeline.opener.seconds, ...timeline.scenes.map((s) => s.len), timeline.closer.seconds];
  const sum = parts.reduce((a, b) => a + f(b), 0);
  return sum - TRANSITION * (parts.length - 1);
};
