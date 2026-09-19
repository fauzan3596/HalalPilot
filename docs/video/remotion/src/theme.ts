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
  "07": [1],      // eskalasi tiba
  "08": [2],      // kembalikan
  "09": [3, 5],   // berkas v2 tersimpan, ajukan → SIM
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
