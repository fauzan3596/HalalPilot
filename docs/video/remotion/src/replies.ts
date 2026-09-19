import raw from "../public/replies.json";

export type Rect = { x: number; y: number; w: number; h: number };
/** Satu balasan agen di Telegram: `t` detik keluaran saat gelembung mulai muncul, `rect` kotak gelembung (px 1920×1080). */
export type Reply = { t: number; settle: number; rect: Rect };
/** Hasil docs/video/deteksi-balasan.mjs: adegan → daftar balasan. */
export const REPLIES = raw as Record<string, Reply[]>;
