// Utilitas HTTP: galat bertipe, pembungkus async, parsing aktor, otorisasi akses UMK.
import { db } from "./db.js";

export class HttpError extends Error {
  constructor(status, error, detail) { super(detail ?? error); this.status = status; this.error = error; this.detail = detail; }
}
export const notFound = (what) => new HttpError(404, "not_found", `${what} tidak ditemukan`);
export const forbidden = (detail) => new HttpError(403, "forbidden_role", detail);
export const conflict = (detail) => new HttpError(409, "conflict_state", detail);
export const badRequest = (detail) => new HttpError(400, "validation", detail);

/** Normalisasi kode dokumen: prefiks huruf besar, sufiks bahan (setelah ':') dibiarkan apa adanya. "sert_pemasok:margarin" → "SERT_PEMASOK:margarin" */
export function normKode(raw) {
  const s = String(raw ?? "").trim();
  const i = s.indexOf(":");
  const head = (i === -1 ? s : s.slice(0, i)).toUpperCase();
  const tail = i === -1 ? "" : s.slice(i + 1);
  if (!/^[A-Z_]+$/.test(head) || (tail && !/^[A-Za-z0-9_]+$/.test(tail))) throw new HttpError(400, "validation", `kode dokumen tidak valid: ${s}`);
  return tail ? `${head}:${head === "SERT_PEMASOK" && /^(RPH|GILING)$/i.test(tail) ? tail.toUpperCase() : tail}` : head;
}

/** Express 4 tidak menangkap promise; bungkus handler async. */
export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/** Parse zod dengan galat 400 seragam. */
export function parse(schema, data) {
  const r = schema.safeParse(data);
  if (!r.success) throw new HttpError(400, "validation", r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
  return r.data;
}

/**
 * Aktor dari header X-Actor: "agent" | "system" | "scheduler" | "umk:<tg>" | "pendamping:<tg>" | "admin:<tg>".
 * Skill mengisi X-Actor dari field `actor` payload. Tanpa header → "agent" (dipercaya, karena API hanya loopback + Bearer).
 */
export function parseActor(raw) {
  const s = String(raw ?? "agent");
  const m = s.match(/^(umk|pendamping|admin):(\d+)$/);
  if (m) return { kind: m[1], telegram_id: m[2], raw: s };
  return { kind: s === "scheduler" || s === "system" ? s : "agent", telegram_id: null, raw: s };
}

const qActor = db.prepare("SELECT id, role, umk_id FROM actor WHERE telegram_id = ?");
const qKop = db.prepare("SELECT pendamping_actor_id FROM koperasi WHERE id = ?");

/** Aktor UMK hanya boleh menyentuh UMK miliknya; pendamping hanya koperasinya; agent/system/scheduler/admin bebas. */
export function authorizeUmk(actor, umk) {
  if (actor.kind === "agent" || actor.kind === "system" || actor.kind === "scheduler" || actor.kind === "admin") return;
  const a = qActor.get(actor.telegram_id);
  if (!a) throw forbidden("akun tidak terdaftar");
  if (actor.kind === "umk" && a.umk_id !== umk.id) throw forbidden("UMK ini bukan milik akun Anda");
  if (actor.kind === "pendamping" && qKop.get(umk.koperasi_id)?.pendamping_actor_id !== a.id) throw forbidden("Anda bukan pendamping koperasi ini");
}

/** Pendamping saja (untuk review/eskalasi). */
export function requirePendamping(actor, koperasiId = 1) {
  if (actor.kind === "agent" || actor.kind === "admin") return;   // agent bertindak atas nama pendamping setelah whoami; API tetap memeriksa telegram_id eksplisit di body
  const a = actor.telegram_id ? qActor.get(actor.telegram_id) : null;
  if (!a || a.role !== "pendamping" || qKop.get(koperasiId)?.pendamping_actor_id !== a.id) throw forbidden("hanya pendamping koperasi yang boleh melakukan ini");
}
