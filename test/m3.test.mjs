// Tes integrasi M3: sweep pengejaran + hooks (server palsu), dossier, review, mock SiHalal/SEHATI, portfolio, events.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import Database from "better-sqlite3";

const root = new URL("../", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const dataDir = mkdtempSync(join(tmpdir(), "halalpilot-m3-"));
const TOKEN = "t"; const TG = { pend: "710000001", umk1: "710000017", umk2: "710000042", umk3: "710000088" };

// ---------- server hooks palsu ----------
const hooks = { mode: "ok", requests: [] };
const fake = createServer((req, res) => {
  let body = ""; req.on("data", (c) => (body += c)); req.on("end", () => {
    hooks.requests.push({ headers: req.headers, body: JSON.parse(body || "{}") });
    if (hooks.mode === "fail") { res.writeHead(500); return res.end("boom"); }
    res.writeHead(200, { "Content-Type": "application/json" }); res.end(JSON.stringify({ ok: true, runId: `run-${hooks.requests.length}` }));
  });
});
await new Promise((r) => fake.listen(0, "127.0.0.1", r));
Object.assign(process.env, { DATA_DIR: dataDir, PDF_DIR: join(dataDir, "pdf"), RULES_DIR: join(root, "rules"), HALALPILOT_API_TOKEN: TOKEN, OPENCLAW_HOOKS_URL: `http://127.0.0.1:${fake.address().port}/hooks/agent`, HOOKS_TOKEN: "h", HOOKS_RETRY_BASE_MS: "1", TZ: "Asia/Jakarta", TG_PENDAMPING: TG.pend, TG_UMK_1: TG.umk1, TG_UMK_2: TG.umk2, TG_UMK_3: TG.umk3, OPENROUTER_API_KEY: "" });
execFileSync(process.execPath, [join(root, "db/migrate.mjs")], { env: process.env, stdio: "ignore" });
execFileSync(process.execPath, [join(root, "seed/demo.mjs")], { env: process.env, stdio: "ignore" });
const sql = new Database(join(dataDir, "halalpilot.db"));

let server, base;
const api = async (method, path, body, { actor, idem } = {}) => {
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN}` };
  if (actor) headers["X-Actor"] = actor; if (idem) headers["Idempotency-Key"] = idem;
  const res = await fetch(base + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text(); let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: res.status, json };
};
// "sekarang" untuk sweep: 10:00 WIB pada tanggal WIB hari ini (di luar jam tenang, tanggal sama dengan sent_at nyata)
const wibToday = () => { const d = new Date(Date.now() + 7 * 3600e3); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 3, 0, 0)); };
const NOW = wibToday().toISOString();
const past = (h = 1) => new Date(wibToday().getTime() - h * 3600e3).toISOString().replace("T", " ").slice(0, 19);
const setDue = (umkId, kode, tahap, when) => sql.prepare("UPDATE chase_task SET due_at = ? WHERE umk_id = ? AND document_kode = ? AND tahap = ?").run(when, umkId, kode, tahap);
const task = (umkId, kode, tahap) => sql.prepare("SELECT * FROM chase_task WHERE umk_id = ? AND document_kode = ? AND tahap = ?").get(umkId, kode, tahap);
const umkId = (kode) => sql.prepare("SELECT id FROM umk WHERE kode = ?").get(kode).id;
// Tunggu sampai ada hook yang pesannya cocok (notifikasi dikirim asinkron); maks 2 s
const waitHook = async (re) => { for (let i = 0; i < 40; i++) { if (hooks.requests.some((h) => re.test(h.body.message))) return true; await new Promise((s) => setTimeout(s, 50)); } return false; };
const prodId = (uid) => sql.prepare("SELECT id FROM product WHERE umk_id = ? ORDER BY id LIMIT 1").get(uid).id;

before(async () => {
  const { createApp } = await import("../src/app.js");
  server = createApp().listen(0, "127.0.0.1"); await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${server.address().port}/api/v1`;
});
after(() => { server?.close(); fake.close(); sql.close(); try { rmSync(dataDir, { recursive: true, force: true }); } catch { /* lock */ } });

const U17 = umkId("UMK-017"), U42 = umkId("UMK-042"), U88 = umkId("UMK-088");

test("Persiapan: evaluasi UMK-017 menghasilkan 4 task pengejaran untuk sertifikat margarin", async () => {
  await api("PUT", `/products/${prodId(U17)}/ingredients`, { bahan: ["tepung terigu", "margarin", "telur", "gula pasir", "selai nanas", "vanili"], sumber: "umk_koreksi", dikonfirmasi_umk: true });
  const e = await api("POST", `/umk/${U17}/evaluate`);
  assert.equal(e.json.jalur, "SELF_DECLARE_KURANG_DOKUMEN");
  const tasks = sql.prepare("SELECT tahap, status, idempotency_key FROM chase_task WHERE umk_id = ? AND document_kode = 'SERT_PEMASOK:margarin' ORDER BY tahap").all(U17);
  assert.deepEqual(tasks.map((t) => t.tahap), [1, 2, 3, 4]);
  assert.match(tasks[0].idempotency_key, /^chase:\d+:SERT_PEMASOK:margarin:1:\d+$/);   // kunci unik per siklus permintaan (nomor urut siklus)
  assert.equal(sql.prepare("SELECT status FROM document_req WHERE umk_id = ? AND kode = 'SERT_PEMASOK:margarin'").get(U17).status, "diminta");
});

test("US-11-P: sweep mengirim tahap 1 lewat hooks dengan Idempotency-Key, task → terkirim", async () => {
  setDue(U17, "SERT_PEMASOK:margarin", 1, past());
  const r = await api("POST", "/chase/sweep", { now: NOW });
  assert.equal(r.json.dispatched, 1, JSON.stringify(r.json));
  const h = hooks.requests.at(-1);
  assert.equal(h.headers.authorization, "Bearer h");
  assert.match(h.headers["idempotency-key"], /^chase:\d+:1:[\d+]+$/);   // chase:<umk>:<tahap>:<task ids>
  assert.equal(h.body.to, TG.umk1); assert.equal(h.body.channel, "telegram"); assert.equal(h.body.agentId, "halalpilot");
  assert.match(h.body.message, /\[CHASE\]/); assert.match(h.body.message, /margarin/);
  assert.equal(task(U17, "SERT_PEMASOK:margarin", 1).status, "terkirim");
});

test("US-11-N: sweep dua kali → tidak ada pengingat ganda", async () => {
  const n = hooks.requests.length;
  const r = await api("POST", "/chase/sweep", { now: NOW });
  assert.equal(r.json.dispatched, 0); assert.equal(hooks.requests.length, n);
});

test("US-11-N2: jam tenang (22:00 WIB) → ditunda ke 07:05 WIB, tidak ada hook", async () => {
  setDue(U17, "SERT_PEMASOK:margarin", 2, past());
  const n = hooks.requests.length;
  const quiet = new Date(wibToday()); quiet.setUTCHours(15, 0, 0, 0);           // 22:00 WIB
  const r = await api("POST", "/chase/sweep", { now: quiet.toISOString() });
  assert.ok(r.json.skipped_quiet_hours >= 1); assert.equal(r.json.dispatched, 0); assert.equal(hooks.requests.length, n);
  const due = task(U17, "SERT_PEMASOK:margarin", 2).due_at;                    // UTC string; 07:05 WIB = 00:05 UTC
  assert.match(due, / 00:05:00$/);
});

test("US-11-N3: batas 2 pesan/UMK/hari → tahap 3 ditahan (skipped_daily_cap)", async () => {
  setDue(U17, "SERT_PEMASOK:margarin", 2, past());
  const r2 = await api("POST", "/chase/sweep", { now: NOW });
  assert.equal(r2.json.dispatched, 1);
  setDue(U17, "SERT_PEMASOK:margarin", 3, past());
  const r3 = await api("POST", "/chase/sweep", { now: NOW });
  assert.equal(r3.json.dispatched, 0); assert.ok(r3.json.skipped_daily_cap >= 1);
  assert.equal(task(U17, "SERT_PEMASOK:margarin", 3).status, "terjadwal");
});

test("US-12-N: dokumen diterima → task tersisa dibatalkan, sweep 0", async () => {
  const d = await api("PUT", `/umk/${U17}/documents/SERT_PEMASOK:margarin`, { status: "diterima" });
  assert.ok(d.json.chase_dibatalkan >= 1);
  assert.equal(task(U17, "SERT_PEMASOK:margarin", 4).status, "dibatalkan");
  const r = await api("POST", "/chase/sweep", { now: NOW });
  assert.equal(r.json.dispatched, 0);
});

test("US-12-P: tahap 4 → eskalasi ke pendamping, muncul di eskalasi_terbuka portofolio", async () => {
  await api("PUT", `/products/${prodId(U88)}/ingredients`, { bahan: ["daging sapi", "tapioka", "bawang putih", "garam", "penyedap rasa"], sumber: "umk_koreksi", dikonfirmasi_umk: true });
  await api("POST", `/umk/${U88}/evaluate`);
  // tahap 1–3 anggap sudah terkirim kemarin
  sql.prepare("UPDATE chase_task SET status='terkirim', sent_at=datetime('now','-2 days') WHERE umk_id=? AND document_kode='SERT_PEMASOK:RPH' AND tahap<4").run(U88);
  setDue(U88, "SERT_PEMASOK:RPH", 4, past());
  const r = await api("POST", "/chase/sweep", { now: NOW });
  assert.ok(r.json.dispatched >= 1);
  const h = hooks.requests.filter((x) => x.body.to === TG.pend).at(-1);
  assert.ok(h, "harus ada hook ke pendamping"); assert.match(h.body.message, /tahap 4/);
  const p = await api("GET", "/portfolio/1/summary");
  assert.ok(p.json.eskalasi_terbuka.some((e) => e.kode === "UMK-088"), JSON.stringify(p.json.eskalasi_terbuka));
});

test("SYS-14-P: hooks gagal → retry, task tetap terjadwal, /health mencatat; pulih → terkirim", async () => {
  await api("PUT", `/products/${prodId(U42)}/ingredients`, { bahan: ["cabai", "bawang merah", "garam", "gula pasir", "minyak goreng", "terasi"], sumber: "umk_koreksi", dikonfirmasi_umk: true });
  await api("POST", `/umk/${U42}/evaluate`);
  setDue(U42, "PERBAIKAN_OSS", 1, past());
  hooks.mode = "fail"; const n = hooks.requests.length;
  const r = await api("POST", "/chase/sweep", { now: NOW });
  assert.ok(r.json.failed >= 1); assert.equal(r.json.dispatched, 0);
  assert.equal(hooks.requests.length - n, 3, "3 percobaan");
  assert.equal(task(U42, "PERBAIKAN_OSS", 1).status, "terjadwal");
  const h = await fetch(base + "/health").then((x) => x.json());
  assert.ok(h.hooks_last_error);
  hooks.mode = "ok";
  const r2 = await api("POST", "/chase/sweep", { now: NOW });
  assert.equal(r2.json.dispatched, 1); assert.equal(task(U42, "PERBAIKAN_OSS", 1).status, "terkirim");
});

test("US-14-N: dossier saat KURANG_DOKUMEN → 409 dengan daftar dokumen kurang", async () => {
  const r = await api("POST", `/umk/${U88}/dossier`);
  assert.equal(r.status, 409); assert.match(r.json.detail, /SERT_PEMASOK/);
});

let dossier1;
test("US-14-P: UMK-017 lengkap → dossier PDF v1, hash cocok, status siap_review, pendamping dinotifikasi", async () => {
  for (const k of ["FOTO_PRODUK"]) await api("PUT", `/umk/${U17}/documents/${k}`, { status: "diterima" });
  const c = await api("POST", `/umk/${U17}/supplier-certs`, { nama_pemasok: "PT Palmindo Lestari", nomor_sertifikat: "ID00110000123450226", untuk_bahan: ["margarin"] });
  assert.equal(c.json.status, "valid");
  // dokumen yang dihasilkan sistem belum ada → E13 masih aktif; dossier builder-lah yang menandainya 'dihasilkan', jadi tandai dulu (agent memanggil build setelah SIAP)
  for (const k of ["PERNYATAAN_HALAL", "IKRAR", "DAFTAR_BAHAN", "PROSES", "MANUAL_SJPH"]) await api("PUT", `/umk/${U17}/documents/${k}`, { status: "dihasilkan" });
  const e = await api("POST", `/umk/${U17}/evaluate`);
  assert.equal(e.json.jalur, "SELF_DECLARE_SIAP", JSON.stringify(e.json.alasan.filter((a) => a.hasil !== "lolos")));
  const n = hooks.requests.length;
  const r = await api("POST", `/umk/${U17}/dossier`);
  assert.equal(r.status, 201, JSON.stringify(r.json)); dossier1 = r.json;
  assert.ok(existsSync(r.json.pdf_path)); assert.ok(r.json.halaman >= 2);
  assert.equal(createHash("sha256").update(readFileSync(r.json.pdf_path)).digest("hex"), r.json.sha256);
  assert.equal(sql.prepare("SELECT status FROM umk WHERE id = ?").get(U17).status, "siap_review");
  assert.equal(sql.prepare("SELECT status FROM dossier WHERE id = ?").get(r.json.dossier_id).status, "menunggu_review");
  assert.ok(await waitHook(/dossier/i), "pendamping harus menerima notifikasi dossier"); assert.ok(hooks.requests.length > n);
});

test("US-15-N: UMK mencoba menyetujui → 403 REVIEW_DENIED", async () => {
  const r = await api("POST", `/dossier/${dossier1.dossier_id}/review`, { aksi: "setuju", pendamping_telegram_id: TG.umk1 });
  assert.equal(r.status, 403);
  assert.ok(sql.prepare("SELECT 1 FROM event_log WHERE aksi='REVIEW_DENIED' AND umk_id=?").get(U17));
});

test("US-15-N2: kembalikan dengan catatan → dikembalikan, FOTO_PRODUK ditolak, chase baru, UMK dinotifikasi", async () => {
  const r = await api("POST", `/dossier/${dossier1.dossier_id}/review`, { aksi: "kembalikan", catatan: "foto label buram, ulangi", pendamping_telegram_id: TG.pend });
  assert.equal(r.status, 200); assert.equal(r.json.status, "dikembalikan"); assert.ok(r.json.chase_dibuat >= 1);
  // ditolak → langsung diminta ulang (siklus pengejaran baru), catatan pendamping tersimpan
  const foto = sql.prepare("SELECT status, catatan FROM document_req WHERE umk_id=? AND kode='FOTO_PRODUK'").get(U17);
  assert.equal(foto.status, "diminta"); assert.match(foto.catatan, /dikembalikan pendamping: foto label buram/);
  assert.equal(sql.prepare("SELECT status FROM umk WHERE id=?").get(U17).status, "dikembalikan");
  // keputusan terbaru harus mengikuti dokumen yang ditolak (bukan SIAP/100 yang lama), tanpa menggandakan pengejaran
  const dec = sql.prepare("SELECT jalur, skor_kesiapan FROM decision WHERE umk_id=? ORDER BY id DESC LIMIT 1").get(U17);
  assert.equal(dec.jalur, "SELF_DECLARE_KURANG_DOKUMEN"); assert.ok(dec.skor_kesiapan < 100);
  assert.equal(sql.prepare("SELECT COUNT(*) n FROM chase_task WHERE umk_id=? AND document_kode='FOTO_PRODUK' AND status='terjadwal'").get(U17).n, r.json.chase_dibuat);
  // pengembalian kedua untuk dokumen yang sama: siklus lama dibatalkan, hanya satu siklus yang terjadwal
  const r2 = await api("POST", `/dossier/${dossier1.dossier_id}/review`, { aksi: "kembalikan", catatan: "masih buram", pendamping_telegram_id: TG.pend });
  assert.equal(r2.status, 200);
  assert.equal(sql.prepare("SELECT COUNT(*) n FROM chase_task WHERE umk_id=? AND document_kode='FOTO_PRODUK' AND status='terjadwal'").get(U17).n, r2.json.chase_dibuat);
  assert.ok(await waitHook(/foto label buram/), "UMK harus menerima catatan pengembalian");
});

test("GET /umk/UMK-017: kode diterima sebagai id; detail memuat dossiers terbaru dulu (untuk review/mock_submit)", async () => {
  const byKode = await api("GET", "/umk/UMK-017"); const byId = await api("GET", `/umk/${U17}`);
  assert.equal(byKode.status, 200); assert.equal(byKode.json.id, byId.json.id);
  assert.ok(Array.isArray(byKode.json.dossiers) && byKode.json.dossiers.length >= 1);
  assert.equal(byKode.json.dossiers[0].id, dossier1.dossier_id); assert.equal(byKode.json.dossiers[0].status, "dikembalikan");
  assert.equal((await api("GET", "/umk/UMK-999")).status, 404);
});

let dossier2;
test("US-15-P: perbaikan → dossier v2 → 'setuju' oleh pendamping → siap_unggah", async () => {
  await api("PUT", `/umk/${U17}/documents/FOTO_PRODUK`, { status: "diterima" });
  const e = await api("POST", `/umk/${U17}/evaluate`);
  assert.equal(e.json.jalur, "SELF_DECLARE_SIAP");
  const d = await api("POST", `/umk/${U17}/dossier`);
  assert.equal(d.status, 201); assert.equal(d.json.versi, 2); dossier2 = d.json;
  const r = await api("POST", `/dossier/${dossier2.dossier_id}/review`, { aksi: "setuju", pendamping_telegram_id: TG.pend });
  assert.equal(r.json.umk_status, "siap_unggah");
  assert.ok(sql.prepare("SELECT 1 FROM event_log WHERE aksi='APPROVE' AND umk_id=?").get(U17));
});

test("US-16-N: mengajukan dossier yang dikembalikan → 409", async () => {
  const r = await api("POST", "/mock/sihalal/submit", { dossier_id: dossier1.dossier_id });
  assert.equal(r.status, 409);
});

test("US-16-N2: simulasi mengembalikan → ditolak → menunggu_dokumen dengan dokumen diminta & chase", async () => {
  const r = await api("POST", "/mock/sihalal/submit", { dossier_id: dossier2.dossier_id, force_result: "dikembalikan" });
  assert.equal(r.status, 200); assert.equal(r.json.status, "dikembalikan"); assert.ok(r.json.alasan); assert.equal(r.json.simulasi, true);
  assert.equal(sql.prepare("SELECT status FROM umk WHERE id=?").get(U17).status, "menunggu_dokumen");
  const dok = r.json.dokumen_diminta[0];
  const row = sql.prepare("SELECT status, catatan FROM document_req WHERE umk_id=? AND kode=?").get(U17, dok);
  assert.equal(row.status, "diminta"); assert.match(row.catatan, /dikembalikan SiHalal \(simulasi\)/);
  assert.ok(sql.prepare("SELECT 1 FROM chase_task WHERE umk_id=? AND document_kode=? AND status='terjadwal'").get(U17, dok));
});

test("US-16-P: perbaiki → dossier v3 → setuju → ajukan (diterima) → selesai_simulasi, kuota terpakai +1", async () => {
  const kurang = sql.prepare("SELECT kode FROM document_req WHERE umk_id=? AND status IN ('ditolak','kurang','diminta')").all(U17).map((x) => x.kode);
  for (const k of kurang) await api("PUT", `/umk/${U17}/documents/${k}`, { status: k === "PERBAIKAN_OSS" ? "diterima" : "diterima" });
  const e = await api("POST", `/umk/${U17}/evaluate`);
  assert.equal(e.json.jalur, "SELF_DECLARE_SIAP", JSON.stringify(e.json.alasan.filter((a) => a.hasil !== "lolos")));
  const d = await api("POST", `/umk/${U17}/dossier`); assert.equal(d.json.versi, 3);
  await api("POST", `/dossier/${d.json.dossier_id}/review`, { aksi: "setuju", pendamping_telegram_id: TG.pend });
  const before = (await api("GET", "/mock/sehati/quota")).json.provinsi.find((p) => p.provinsi === "DI Yogyakarta").kuota_terpakai;
  const s = await api("POST", "/mock/sihalal/submit", { dossier_id: d.json.dossier_id, force_result: "diterima" });
  assert.equal(s.json.status, "diterima"); assert.match(s.json.nomor_simulasi, /^SIM-\d{8}-\d{4}$/); assert.match(s.json.pesan, /SIMULASI/);
  assert.equal(sql.prepare("SELECT status FROM umk WHERE id=?").get(U17).status, "selesai_simulasi");
  const after = (await api("GET", "/mock/sehati/quota")).json.provinsi.find((p) => p.provinsi === "DI Yogyakarta").kuota_terpakai;
  assert.equal(after, before + 1);
});

test("US-17/US-22: portfolio summary lengkap; kuota DIY < 10%; OSS mock lookup", async () => {
  const p = await api("GET", "/portfolio/1/summary");
  for (const k of ["total_umk", "siap_unggah", "menunggu_dokumen", "belum_mulai", "hari_tersisa", "umk_mendesak", "eskalasi_terbuka", "aktivitas_hari_ini"]) assert.ok(k in p.json, k);
  assert.equal(p.json.total_umk, 120); assert.ok(p.json.umk_mendesak.length <= 5);
  const qta = await api("GET", "/mock/sehati/quota");
  assert.ok(qta.json.provinsi.find((x) => x.provinsi === "DI Yogyakarta").sisa_persen < 10);
  const oss = await api("GET", "/mock/oss/1309170000042");
  assert.deepEqual(oss.json.kbli, ["47241"]); assert.equal(oss.json.simulasi, true);
  assert.equal((await api("GET", "/mock/oss/0000000000000")).status, 404);
});

test("US-20-P: events berisi jejak aksi dengan actor yang benar dan tanpa isi dokumen", async () => {
  const ev = await api("GET", `/events?umk_id=${U17}&limit=200`);
  const aksi = new Set(ev.json.events.map((e) => e.aksi));
  for (const a of ["EVALUATE", "CHASE_SENT", "DOSSIER_BUILT", "APPROVE", "RETURN", "DOKUMEN_DITERIMA", "SERT_PEMASOK"]) assert.ok(aksi.has(a), a);
  assert.ok(ev.json.events.some((e) => e.actor.startsWith("pendamping:")));
  assert.ok(ev.json.events.some((e) => e.actor === "scheduler"));
  const dump = JSON.stringify(ev.json);
  assert.doesNotMatch(dump, /base64|\b08\d{8,11}\b/);
});

test("chase/request & chase/:id/sent & chase/due", async () => {
  const r = await api("POST", `/umk/${U88}/chase/request`, { dokumen: ["SERT_PEMASOK:GILING"] });
  assert.equal(r.status, 201);
  const t = sql.prepare("SELECT id FROM chase_task WHERE umk_id=? AND document_kode='SERT_PEMASOK:GILING' AND tahap=1").get(U88);
  const s = await api("POST", `/chase/${t.id}/sent`);
  assert.equal(s.json.status, "terkirim");
  const due = await api("GET", "/chase/due");
  assert.ok(Array.isArray(due.json.due));
});

test("Dashboard: GET /umk daftar 120 UMK dengan skor/jalur; GET /dossier/:id/pdf mengembalikan PDF; static dashboard tersaji", async () => {
  const l = await api("GET", "/umk?koperasi_id=1");
  assert.equal(l.status, 200); assert.equal(l.json.umk.length, 120);
  const u17 = l.json.umk.find((u) => u.kode === "UMK-017");
  assert.equal(u17.status, "selesai_simulasi"); assert.equal(u17.skor_kesiapan, 100);
  assert.equal((await api("GET", "/umk", null, { actor: `umk:${TG.umk1}` })).status, 400);
  const res = await fetch(`${base}/dossier/${dossier2.dossier_id}/pdf`, { headers: { Authorization: `Bearer ${TOKEN}` } });
  assert.equal(res.status, 200); assert.match(res.headers.get("content-type"), /application\/pdf/);
  assert.equal((await res.arrayBuffer()).byteLength > 1000, true);
  const html = await fetch(base.replace("/api/v1", "") + "/dashboard/").then((r) => r.text());
  assert.match(html, /HalalPilot/); assert.match(html, /simulasi/i);
});
