import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

export const C = {
  bg: "#141d18",
  bg2: "#1c2721",
  ink: "#f3f6f3",
  muted: "#9fb0a5",
  accent: "#3f8a5f",
  accentSoft: "#2f6b4a",
  amber: "#e0a84a",
  red: "#d86a6a",
  box: "rgba(10, 16, 12, 0.72)",
};

export const FONT = "SegoeDemo";

await Promise.all([
  loadFont({ family: FONT, url: staticFile("segoeui.ttf"), weight: "400" }),
  loadFont({ family: FONT, url: staticFile("segoeuib.ttf"), weight: "700" }),
  loadFont({ family: FONT, url: staticFile("segoeuil.ttf"), weight: "300" }),
]);

// Kalimat mana yang mendapat zoom ke area pesan (adegan → indeks caption). "Sedang": 10 peristiwa kunci.
export const ZOOM: Record<string, number[]> = {
  "03": [3, 4],   // daftar bahan tiba, hasil evaluasi
  "04": [3],      // sertifikat valid → skor 100 + dossier
  "06": [1],      // pengingat pertama tiba
  "07": [0],      // pesan eskalasi di chat
  "08": [2],      // kembalikan
  "09": [4, 6],   // berkas v2 tersimpan, ajukan → SIM
  "10": [1],      // digest tiba
  "11": [0],      // hpdemo status (terminal penuh) → zoom ringan ke kiri bawah
};

// Titik fokus zoom per adegan (fraksi lebar/tinggi). Pesan Telegram terbaru selalu muncul di kiri BAWAH, jadi zoom berlabuh di sana.
export const ZOOM_POINT: Record<string, { x: number; y: number }> = {
  default: { x: 0.04, y: 0.97 },
  "11": { x: 0.04, y: 0.97 },
};

// Area yang disorot saat zoom (px pada bingkai 1920×1080, sebelum diskalakan): sekitarnya diredupkan, tepinya diberi bingkai.
export const HIGHLIGHT: Record<string, { x: number; y: number; w: number; h: number }> = {
  default: { x: 0, y: 590, w: 1062, h: 490 },    // paruh kiri bawah = pesan Telegram terbaru
  "11": { x: 0, y: 660, w: 1160, h: 420 },        // keluaran hpdemo status di terminal
};

// ---- v7: lencana peran (siapa yang sedang mengetik/menerima). `cap` = berlaku sejak caption ke-n; tanpa cap = sejak awal adegan.
export type RoleSpan = { cap?: number; text: string; kind: "umk" | "pendamping" | "operator" };
export const ROLE: Record<string, RoleSpan[]> = {
  "02": [{ text: "Operator · terminal VPS", kind: "operator" }],
  "03": [{ text: "UMK · Dapur Bu Ratih", kind: "umk" }],
  "04": [{ text: "UMK · Dapur Bu Ratih", kind: "umk" }],
  "05": [{ text: "Operator · laptop + VPS", kind: "operator" }],
  "06": [{ text: "UMK · Sambal Mak Ijah (menerima pengingat)", kind: "umk" }],
  "07": [{ text: "Operator · terminal VPS", kind: "operator" }, { cap: 1, text: "Pendamping koperasi", kind: "pendamping" }],
  "07b": [{ text: "Pendamping koperasi", kind: "pendamping" }],
  "08": [{ text: "Pendamping koperasi", kind: "pendamping" }],
  "09": [{ text: "UMK · Dapur Bu Ratih", kind: "umk" }, { cap: 4, text: "Pendamping koperasi", kind: "pendamping" }],
  "10": [{ text: "Pendamping koperasi", kind: "pendamping" }],
  "11": [{ text: "Operator · terminal VPS", kind: "operator" }],
};

// ---- v7: lencana skor kesiapan yang berjalan naik saat caption ke-n mulai.
export type ScoreEvent = { cap: number; from: number; to: number };
export const SCORE: Record<string, ScoreEvent[]> = {
  "03": [{ cap: 4, from: 0, to: 60 }],   // c4 = hasil evaluasi (skor 60)
  "04": [{ cap: 1, from: 60, to: 80 }, { cap: 3, from: 80, to: 100 }],
  "06": [{ cap: 0, from: 0, to: 70 }],
  "09": [{ cap: 3, from: 80, to: 100 }],  // c3 = skor kembali 100
};

// ---- v7: garis waktu pengejaran (H+1, H+3, H+7, eskalasi H+10). `lit` awal + langkah yang menyala saat caption ke-n mulai.
export const CHASE: Record<string, { lit: number; steps: { cap: number; lit: number }[] }> = {
  "06": { lit: 0, steps: [{ cap: 1, lit: 1 }, { cap: 2, lit: 2 }] },
  "07": { lit: 2, steps: [{ cap: 0, lit: 4 }] },   // pesan eskalasi sudah tampil: H+7 dan H+10 menyala
  "07b": { lit: 4, steps: [] },
};

// ---- v7: sisipan diagram arsitektur (adegan 2): mulai di caption ke-n, langkah menyala berurutan.
export const ARCH: Record<string, { fromCap: number; autoCap: number }> = {
  "02": { fromCap: 1, autoCap: 2 },
};

// ---- v7: kartu bab sebelum adegan tertentu (2 detik).
export const CHAPTERS: Record<string, { title: string; sub: string }> = {
  "03": { title: "Alur UMK", sub: "Dari foto label sampai berkas siap ditinjau" },
  "07": { title: "Dari pengejaran ke pendamping", sub: "Eskalasi, review, persetujuan, pengajuan" },
  "11": { title: "Batas & yang berjalan di server", sub: "Menyiapkan, bukan menerbitkan" },
};

// ---- v7: audio
export const MUSIC = { base: 0.2, duck: 0.07, fade: 0.5 };   // volume musik normal / saat narasi, waktu peralihan (detik)
export const SFX = { whoosh: 0.35, ding: 0.5, pop: 0.35 };
