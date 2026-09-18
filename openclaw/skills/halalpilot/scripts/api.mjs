#!/usr/bin/env node
// Pembungkus REST HalalPilot untuk skill OpenClaw. Dipanggil: node api.mjs <perintah> '<json>'
// Cetak JSON ke stdout; exit code 1 jika error. Tidak ada logika bisnis di sini.
import { createHash } from "node:crypto";
import { existsSync, copyFileSync, chmodSync } from "node:fs";
import { basename, join } from "node:path";

const BASE = process.env.HALALPILOT_API_URL ?? "http://127.0.0.1:3000/api/v1";
const TOKEN = process.env.HALALPILOT_API_TOKEN;
const [, , cmd, rawJson = "{}"] = process.argv;
let p;
try { p = JSON.parse(rawJson); } catch { fail("payload bukan JSON"); }

const routes = {
  whoami:            () => ["GET",   `/whoami?telegram_id=${enc(p.telegram_id)}`],
  create_umk:        () => ["POST",  `/umk`, p, `umk:${p.telegram_id}`],
  patch_umk:         () => ["PATCH", `/umk/${p.id}`, omit(p, "id")],
  get_umk:           () => ["GET",   `/umk/${p.id}`],
  delete_umk:        () => ["DELETE",`/umk/${p.id}`],
  add_product:       () => ["POST",  `/umk/${p.umk_id}/products`, omit(p, "umk_id")],
  save_media:        () => ["POST",  `/products/${p.pid}/media`, omit(p, "pid")],
  set_proses:        () => ["PATCH", `/products/${p.pid}`, omit(p, "pid")],       // {pid, proses_ringkas, teknik_pengawetan_count?, giling_sendiri?}
  set_ingredients:   () => ["PUT",   `/products/${p.pid}/ingredients`, omit(p, "pid")],
  extract:           () => ["POST",  `/products/${p.pid}/extract`, omit(p, "pid")],
  list_umk:          () => ["GET",   `/umk?koperasi_id=${enc(p.koperasi_id ?? 1)}`],
  evaluate:          () => ["POST",  `/umk/${p.umk_id}/evaluate`, {}],   // tanpa Idempotency-Key: keputusan append-only & murah; kunci berbasis waktu berisiko mengembalikan hasil basi
  receive_document:  () => ["PUT",   `/umk/${p.umk_id}/documents/${enc(p.kode)}`, omit(p, "umk_id", "kode")],
  add_supplier_cert: () => ["POST",  `/umk/${p.umk_id}/supplier-certs`, omit(p, "umk_id")],
  request_chase:     () => ["POST",  `/umk/${p.umk_id}/chase/request`, omit(p, "umk_id"), `chase-req:${p.umk_id}:${hash(p.dokumen)}`],
  mark_chase_sent:   () => ["POST",  `/chase/${p.task_id}/sent`, {}],
  build_dossier:     () => ["POST",  `/umk/${p.umk_id}/dossier`, {}],   // route menolak duplikat lewat status UMK; tanpa kunci waktu
  review:            () => ["POST",  `/dossier/${p.dossier_id}/review`, omit(p, "dossier_id")],
  mock_submit:       () => ["POST",  `/mock/sihalal/submit`, p],
  portfolio_summary: () => ["GET",   `/portfolio/${p.koperasi_id ?? 1}/summary`],
  quota:             () => ["GET",   `/mock/sehati/quota`],
  events:            () => ["GET",   `/events?umk_id=${p.umk_id ?? ""}&since=${enc(p.since ?? "")}`],
};

if (!routes[cmd]) fail(`perintah tidak dikenal: ${cmd}. Tersedia: ${Object.keys(routes).join(", ")}`);
const [method, path, body, idem] = routes[cmd]();

const headers = { "Authorization": `Bearer ${TOKEN}`, "Content-Type": "application/json" };
if (idem) headers["Idempotency-Key"] = idem;
// Aktor untuk audit & otorisasi: sertakan "actor":"umk:<telegram_id>" / "pendamping:<telegram_id>" di payload; tidak ikut dikirim di body.
if (p.actor) { headers["X-Actor"] = String(p.actor); if (body && typeof body === "object") delete body.actor; }

// VPS: gateway (root) menyimpan media inbound di bawah /root, sedangkan API berjalan sebagai user `halalpilot` dengan ProtectHome
// → API tidak bisa membaca file itu. Salin dulu ke folder bersama HALALPILOT_INBOUND_DIR (default /var/lib/halalpilot/inbound) bila folder itu ada.
if (cmd === "save_media" && body?.source_path) {
  const shared = process.env.HALALPILOT_INBOUND_DIR ?? "/var/lib/halalpilot/inbound";
  try {
    if (existsSync(body.source_path) && existsSync(shared)) {
      const dest = join(shared, `${Date.now()}-${basename(body.source_path)}`);
      copyFileSync(body.source_path, dest); chmodSync(dest, 0o644);
      body.source_path = dest;
    }
  } catch { /* biarkan path asli; API akan menjawab 400 bila tidak terbaca */ }
}

try {
  const res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15000) });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok) fail(`HTTP ${res.status}`, data);
  console.log(JSON.stringify(data));
} catch (e) { fail(e.message); }

function enc(v) { return encodeURIComponent(String(v ?? "")); }
function omit(o, ...keys) { const c = { ...o }; for (const k of keys) delete c[k]; return c; }
function hash(v) { return createHash("sha256").update(JSON.stringify(v ?? null)).digest("hex").slice(0, 12); }
function fail(msg, detail) { console.log(JSON.stringify({ error: msg, detail })); process.exit(1); }
