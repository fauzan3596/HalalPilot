// Klien POST /hooks/agent OpenClaw: idempoten (Idempotency-Key), retry 3x backoff, mencatat galat terakhir untuk /health.
import { config } from "../config.js";

export const hooksState = { last_ok_at: null, last_error: null, last_error_at: null, sent: 0, failed: 0 };
const BASE_MS = Number(process.env.HOOKS_RETRY_BASE_MS ?? 2000);   // tes: 1
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * @param {object} p
 * @param {string} p.message   teks yang dikirim ke agent (mis. "[CHASE] ...")
 * @param {string} p.to        id penerima di channel (telegram chat/user id)
 * @param {string} [p.channel="telegram"]
 * @param {string} p.idempotencyKey
 * @param {"isolated"|"persistent"} [p.sessionMode="isolated"]
 * @returns {Promise<{ok:boolean, status?:number, runId?:string, error?:string, attempts:number}>}
 */
// Ditempel ke setiap pesan hook (10 Sep 2026): model pernah membalas hook lewat tool `message` dengan voiceText/voiceProvider
// (voice note; setelah tts dimatikan → "message required" → run habis waktu 120 s). Dengan deliver:true, OpenClaw sendiri
// mengantar teks akhir agent ke `to`, jadi agent cukup menulis jawaban akhir sebagai teks.
export const HOOK_REPLY_RULE = "\n\nCARA MEMBALAS (wajib): tulis pesan untuk penerima sebagai JAWABAN AKHIR berupa teks biasa — pengantaran ke Telegram sudah otomatis. JANGAN memanggil tool message, JANGAN memakai voiceText/voiceProvider/voiceId, JANGAN pesan suara. Maksimal 6 baris, tanpa JSON, tanpa menyebut nama tool.";

export async function postToAgent({ message, to, channel = "telegram", idempotencyKey, sessionMode = "isolated", timeoutSeconds = 120 }) {
  const body = { agentId: config.hooks.agentId, sessionMode, deliver: true, channel, to: String(to), message: message + HOOK_REPLY_RULE, timeoutSeconds };
  let lastErr = "unknown";
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(config.hooks.url, {
        method: "POST",
        headers: { Authorization: `Bearer ${config.hooks.token}`, "Content-Type": "application/json", ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}) },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      });
      const text = await res.text();
      let json = {}; try { json = JSON.parse(text); } catch { json = { raw: text }; }
      if (res.ok) { hooksState.last_ok_at = new Date().toISOString(); hooksState.sent++; return { ok: true, status: res.status, runId: json.runId, attempts: attempt }; }
      lastErr = `HTTP ${res.status} ${text.slice(0, 200)}`;
      if (res.status >= 400 && res.status < 500 && res.status !== 429) break;   // galat klien: jangan retry
    } catch (e) {
      lastErr = e.name === "TimeoutError" ? "timeout" : e.message;
    }
    if (attempt < 3) await sleep(BASE_MS * 2 ** (attempt - 1));
  }
  hooksState.failed++; hooksState.last_error = lastErr; hooksState.last_error_at = new Date().toISOString();
  return { ok: false, error: lastErr, attempts: 3 };
}
