// Cron internal cadangan (V4). Utama tetap automations OpenClaw. Aktif jika ENABLE_INTERNAL_CRON=1.
import cron from "node-cron";
import { runSweep } from "./sweep.js";
import { postToAgent } from "./hooks-client.js";
import { db } from "../db.js";

export function startInternalCron(rules) {
  if (process.env.ENABLE_INTERNAL_CRON !== "1") return { started: false };
  const tz = "Asia/Jakarta";
  cron.schedule("*/30 * * * *", () => runSweep({ rules }).catch((e) => console.error("sweep:", e.message)), { timezone: tz });
  const pend = () => db.prepare("SELECT a.telegram_id FROM koperasi k JOIN actor a ON a.id = k.pendamping_actor_id WHERE k.id = 1").get()?.telegram_id;
  cron.schedule("0 7 * * *", () => {
    const to = pend(); if (!to) return;
    postToAgent({ to, idempotencyKey: `digest:${new Date().toISOString().slice(0, 10)}`, message: "[DIGEST] Buat ringkasan portofolio hari ini untuk pendamping: panggil skill halalpilot portfolio_summary koperasi 1, lalu laporkan total UMK, siap unggah, menunggu dokumen, belum mulai, hari tersisa ke 17 Oktober, 5 UMK paling mendesak, dan eskalasi terbuka. Maksimal 12 baris." }).catch(() => {});
  }, { timezone: tz });
  console.log("cron internal aktif: sweep */30m, digest 07:00 WIB");
  return { started: true };
}
