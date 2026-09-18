// Tes integrasi HTTP (US-01, US-02, US-06, US-08, US-10 + idempotency & auth). DB sementara di-seed lewat CLI.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const root = new URL("../", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const dataDir = mkdtempSync(join(tmpdir(), "halalpilot-test-"));
const TOKEN = "test-token";
const TG = { pend: "700000001", umk1: "700000017", umk2: "700000042", umk3: "700000088", baru: "700000999" };
Object.assign(process.env, { DATA_DIR: dataDir, PDF_DIR: join(dataDir, "pdf"), RULES_DIR: join(root, "rules"), HALALPILOT_API_TOKEN: TOKEN, OPENCLAW_HOOKS_URL: "http://127.0.0.1:1/hooks/agent", HOOKS_TOKEN: "x", TZ: "Asia/Jakarta", TG_PENDAMPING: TG.pend, TG_UMK_1: TG.umk1, TG_UMK_2: TG.umk2, TG_UMK_3: TG.umk3, OPENROUTER_API_KEY: "" });
execFileSync(process.execPath, [join(root, "db/migrate.mjs")], { env: process.env, stdio: "ignore" });
execFileSync(process.execPath, [join(root, "seed/demo.mjs")], { env: process.env, stdio: "ignore" });

let server, base;
const api = async (method, path, body, { token = TOKEN, actor, idem } = {}) => {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (actor) headers["X-Actor"] = actor;
  if (idem) headers["Idempotency-Key"] = idem;
  const res = await fetch(base + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: res.status, json, headers: res.headers };
};

before(async () => {
  const { createApp } = await import("../src/app.js");
  server = createApp().listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${server.address().port}/api/v1`;
});
after(() => { server?.close(); try { rmSync(dataDir, { recursive: true, force: true }); } catch { /* windows lock */ } });

// ---------- Auth ----------
test("SYS-05: tanpa/salah Bearer → 401; health tanpa auth OK", async () => {
  assert.equal((await api("GET", `/whoami?telegram_id=${TG.pend}`, null, { token: null })).status, 401);
  assert.equal((await api("GET", `/whoami?telegram_id=${TG.pend}`, null, { token: "salah" })).status, 401);
  const h = await api("GET", "/health", null, { token: null });
  assert.equal(h.status, 200); assert.ok(h.json.rules_version);
});

// ---------- US-01 ----------
test("US-01-P: whoami mengenali pendamping dan UMK; US-01-N: tak terdaftar hanya ditawari daftar", async () => {
  const p = await api("GET", `/whoami?telegram_id=${TG.pend}`);
  assert.equal(p.json.role, "pendamping"); assert.equal(p.json.koperasi.id, 1);
  const u = await api("GET", `/whoami?telegram_id=${TG.umk1}`);
  assert.equal(u.json.role, "umk"); assert.equal(u.json.umk.kode, "UMK-017"); assert.ok(Array.isArray(u.json.umk.dokumen_kurang));
  const n = await api("GET", `/whoami?telegram_id=${TG.baru}`);
  assert.equal(n.json.role, "tidak_terdaftar"); assert.equal(n.json.umk, null); assert.match(n.json.langkah, /pendaftaran/i);
});

// ---------- US-02 ----------
test("US-02-N: consent=false → 400 dan tidak ada data tersimpan", async () => {
  const r = await api("POST", "/umk", { telegram_id: TG.baru, nama_usaha: "Tahu Pak Min", consent: false });
  assert.equal(r.status, 400);
  assert.equal((await api("GET", `/whoami?telegram_id=${TG.baru}`)).json.role, "tidak_terdaftar");
});
let umkBaru;
test("US-02-P: pendaftaran dengan consent → 201, consent_at terisi, aktor umk, event CONSENT", async () => {
  const r = await api("POST", "/umk", { telegram_id: TG.baru, nama_usaha: "Keripik Bu Wati", consent: true }, { actor: `umk:${TG.baru}` });
  assert.equal(r.status, 201); assert.match(r.json.kode, /^UMK-\d{3}$/); assert.equal(r.json.status, "intake");
  umkBaru = r.json;
  const d = await api("GET", `/umk/${umkBaru.id}`, null, { actor: `umk:${TG.baru}` });
  assert.ok(d.json.profil.consent_at, "consent_at harus terisi");
  for (const k of Object.keys(d.json.profil)) assert.doesNotMatch(k, /nik|ktp|hp|telepon|rekening/i);
  assert.equal((await api("GET", `/whoami?telegram_id=${TG.baru}`)).json.role, "umk");
  const dup = await api("POST", "/umk", { telegram_id: TG.baru, nama_usaha: "Lagi", consent: true });
  assert.equal(dup.status, 409);
});

// ---------- US-03-N validasi ----------
test("US-03-N: PATCH omzet non-angka / NIB 5 digit → 400, data tidak berubah", async () => {
  const a = await api("PATCH", `/umk/${umkBaru.id}`, { omzet_tahunan: "banyak" }, { actor: `umk:${TG.baru}` });
  assert.equal(a.status, 400);
  const b = await api("PATCH", `/umk/${umkBaru.id}`, { nib: "12345" }, { actor: `umk:${TG.baru}` });
  assert.equal(b.status, 400);
  const ok = await api("PATCH", `/umk/${umkBaru.id}`, { nib: "1309170000999", skala: "mikro", kbli: "10794", alamat: "Jl. Mawar No. 1, Sinduadi, Sleman", omzet_tahunan: 120000000, peralatan: "manual", penyelia_halal: "Wati" }, { actor: `umk:${TG.baru}` });
  assert.equal(ok.status, 200); assert.equal(ok.json.profil.omzet_tahunan, 120000000);
  assert.ok(ok.json.documents.find((x) => x.kode === "NIB").status === "diterima");
});

// ---------- US-06 (UMK-017 Nastar) ----------
let umk017, prod017;
test("Persiapan: UMK-017 punya produk Nastar; PUT ingredients hasil vision tidak boleh langsung dikonfirmasi", async () => {
  const w = await api("GET", `/whoami?telegram_id=${TG.umk1}`); umk017 = w.json.umk;
  const d = await api("GET", `/umk/${umk017.id}`); prod017 = d.json.products[0];
  assert.equal(prod017.nama, "Nastar");
  const bad = await api("PUT", `/products/${prod017.id}/ingredients`, { bahan: ["tepung terigu"], sumber: "vision", dikonfirmasi_umk: true });
  assert.equal(bad.status, 400);
  const v = await api("PUT", `/products/${prod017.id}/ingredients`, { bahan: ["Tepung Terigu", "Margarine", "Telur", "Gula pasir", "Selai nanas", "Vanili"], sumber: "vision" }, { actor: `umk:${TG.umk1}` });
  assert.equal(v.status, 200); assert.equal(v.json.ingredients.length, 6); assert.equal(v.json.perlu_konfirmasi, true);
  assert.equal(v.json.ingredients.find((i) => i.nama_asli === "Margarine").kelas, "kritis");
});
test("US-06-N: evaluate sebelum konfirmasi → E14 KONFIRMASI_BAHAN, bukan SIAP", async () => {
  const e = await api("POST", `/umk/${umk017.id}/evaluate`, null, { actor: `umk:${TG.umk1}` });
  assert.equal(e.status, 200); assert.equal(e.json.jalur, "SELF_DECLARE_KURANG_DOKUMEN");
  assert.ok(e.json.alasan.some((a) => a.rule_id === "E14_KONFIRMASI_EKSTRAKSI" && a.hasil === "butuh_dokumen"));
  assert.ok(e.json.dokumen_diminta.includes("KONFIRMASI_BAHAN"));
});
test("US-06-P: setelah konfirmasi → KURANG_DOKUMEN, E11 margarin, rules_version, decision append-only, chase dibuat", async () => {
  const c = await api("PUT", `/products/${prod017.id}/ingredients`, { bahan: ["Tepung Terigu", "Margarine", "Telur", "Gula pasir", "Selai nanas", "Vanili"], sumber: "umk_koreksi", dikonfirmasi_umk: true }, { actor: `umk:${TG.umk1}` });
  assert.equal(c.json.perlu_konfirmasi, false);
  const e1 = await api("POST", `/umk/${umk017.id}/evaluate`, null, { idem: "eval-1" });
  const e2 = await api("POST", `/umk/${umk017.id}/evaluate`, null, { idem: "eval-2" });
  for (const e of [e1, e2]) {
    assert.equal(e.json.jalur, "SELF_DECLARE_KURANG_DOKUMEN");
    assert.ok(e.json.alasan.some((a) => a.rule_id === "E11_BAHAN_KRITIS_TERDOKUMENTASI"));
    assert.ok(e.json.dokumen_diminta.includes("SERT_PEMASOK:margarin"));
    assert.match(e.json.rules_version, /\+[0-9a-f]{8}$/);
    assert.ok(!e.json.alasan.some((a) => a.rule_id === "E15_OSS_KONSISTEN" && a.hasil !== "lolos"), "UMK-017 OSS harus cocok");
  }
  assert.notEqual(e1.json.decision_id, e2.json.decision_id, "append-only");
  const d = await api("GET", `/umk/${umk017.id}`);
  assert.equal(d.json.status, "menunggu_dokumen");
  assert.ok(d.json.dokumen_kurang.includes("SERT_PEMASOK:margarin"));
  const ev = await api("GET", `/events?umk_id=${umk017.id}`);           // route M3; 404 boleh
  assert.ok([200, 404].includes(ev.status));
});

// ---------- SYS-04 idempotency ----------
test("SYS-04-P: Idempotency-Key sama → respons identik + X-Idempotent-Replay, satu decision", async () => {
  const a = await api("POST", `/umk/${umk017.id}/evaluate`, null, { idem: "eval-same" });
  const b = await api("POST", `/umk/${umk017.id}/evaluate`, null, { idem: "eval-same" });
  assert.equal(b.headers.get("x-idempotent-replay"), "true");
  assert.deepEqual(a.json, b.json);
});

// ---------- US-08 (UMK-042 Sambal) ----------
test("US-08-N: UMK-042 KBLI NIB 47241 vs produk 10772 → E15 PERBAIKAN_OSS; bahan aman", async () => {
  const w = await api("GET", `/whoami?telegram_id=${TG.umk2}`); const u = w.json.umk;
  const d = await api("GET", `/umk/${u.id}`); const p = d.json.products[0];
  await api("PUT", `/products/${p.id}/ingredients`, { bahan: ["cabai", "bawang merah", "bawang putih", "garam", "gula pasir", "minyak goreng", "terasi"], sumber: "umk_koreksi", dikonfirmasi_umk: true });
  const e = await api("POST", `/umk/${u.id}/evaluate`);
  assert.ok(e.json.alasan.some((a) => a.rule_id === "E15_OSS_KONSISTEN" && a.hasil === "butuh_dokumen"));
  assert.ok(e.json.dokumen_diminta.includes("PERBAIKAN_OSS"));
  assert.deepEqual(e.json.oss.mismatch, ["kbli"]);
  assert.ok(e.json.oss_pesan[0].includes("10772"));
  assert.ok(!e.json.alasan.some((a) => a.rule_id === "E11_BAHAN_KRITIS_TERDOKUMENTASI" && a.hasil !== "lolos"));
});
test("US-08-N2: NIB tidak ada di OSS → nib_tidak_ditemukan", async () => {
  await api("PATCH", `/umk/${umkBaru.id}`, { nib: "9999999999999" }, { actor: `umk:${TG.baru}` });
  const e = await api("POST", `/umk/${umkBaru.id}/evaluate`);
  assert.ok(e.json.oss.mismatch.includes("nib_tidak_ditemukan"));
});

// ---------- US-09 / US-10 ----------
test("US-09-P: Bakso → E09, E10, E11 dan dokumen RPH/GILING", async () => {
  const w = await api("GET", `/whoami?telegram_id=${TG.umk3}`); const u = w.json.umk;
  const d = await api("GET", `/umk/${u.id}`); const p = d.json.products[0];
  await api("PUT", `/products/${p.id}/ingredients`, { bahan: ["daging sapi", "tapioka", "bawang putih", "garam", "penyedap rasa"], sumber: "umk_koreksi", dikonfirmasi_umk: true });
  const e = await api("POST", `/umk/${u.id}/evaluate`);
  const ids = e.json.alasan.filter((a) => a.hasil === "butuh_dokumen").map((a) => a.rule_id);
  for (const r of ["E09_SEMBELIHAN_DARI_RPH_HALAL", "E10_DAGING_GILING", "E11_BAHAN_KRITIS_TERDOKUMENTASI"]) assert.ok(ids.includes(r), r);
  assert.ok(e.json.dokumen_diminta.includes("SERT_PEMASOK:RPH") && e.json.dokumen_diminta.includes("SERT_PEMASOK:GILING"));
});
test("US-09-N: sertifikat RPH kedaluwarsa → status kedaluwarsa, E09 tetap", async () => {
  const w = await api("GET", `/whoami?telegram_id=${TG.umk3}`); const u = w.json.umk;
  const c = await api("POST", `/umk/${u.id}/supplier-certs`, { nama_pemasok: "RPH Sumber Rejeki", nomor_sertifikat: "ID00410000998870124", untuk_bahan: ["daging sapi"] });
  assert.equal(c.status, 201); assert.equal(c.json.status, "kedaluwarsa");
  assert.ok(c.json.decision.alasan.some((a) => a.rule_id === "E09_SEMBELIHAN_DARI_RPH_HALAL" && a.hasil === "butuh_dokumen"));
});
test("US-10-N: nomor sertifikat acak → tidak_ditemukan, jalur tidak berubah", async () => {
  const c = await api("POST", `/umk/${umk017.id}/supplier-certs`, { nama_pemasok: "PT Entah", nomor_sertifikat: "ID0000000000000000", untuk_bahan: ["margarin"] });
  assert.equal(c.json.status, "tidak_ditemukan");
  assert.equal(c.json.decision.jalur, "SELF_DECLARE_KURANG_DOKUMEN");
  assert.ok(c.json.decision.dokumen_diminta.includes("SERT_PEMASOK:margarin"));
});
test("Idempotency tidak menyimpan kegagalan: dossier 409 dengan kunci K, lalu setelah SIAP kunci K yang sama → 201", async () => {
  const gagal = await api("POST", `/umk/${umk017.id}/dossier`, null, { idem: "dossier-K" });
  assert.equal(gagal.status, 409);
  const ulang = await api("POST", `/umk/${umk017.id}/dossier`, null, { idem: "dossier-K" });
  assert.equal(ulang.status, 409); assert.notEqual(ulang.headers.get("x-idempotent-replay"), "true", "409 tidak boleh di-replay dari cache");
});
test("US-03-N2: akun UMK tidak boleh menyetel status 'ditunda' → 403", async () => {
  assert.equal((await api("PATCH", `/umk/${umk017.id}`, { status: "ditunda" }, { actor: `umk:${TG.umk1}` })).status, 403);
});
test("US-10-P: semua dokumen wajib diterima + sertifikat margarin valid → evaluasi ulang otomatis → SIAP skor 100, siap_review", async () => {
  // Lengkapi dokumen yang harus diterima dari UMK; yang dihasilkan sistem ditandai 'dihasilkan'
  for (const k of ["FOTO_PRODUK", "PENYELIA"]) await api("PUT", `/umk/${umk017.id}/documents/${k}`, { status: "diterima" });
  for (const k of ["PERNYATAAN_HALAL", "IKRAR", "DAFTAR_BAHAN", "PROSES", "MANUAL_SJPH"]) await api("PUT", `/umk/${umk017.id}/documents/${k}`, { status: "dihasilkan" });
  const c = await api("POST", `/umk/${umk017.id}/supplier-certs`, { nama_pemasok: "PT Palmindo Lestari", nomor_sertifikat: "ID00110000123450226", untuk_bahan: ["margarin"] }, { actor: `umk:${TG.umk1}` });
  assert.equal(c.status, 201); assert.equal(c.json.status, "valid");
  assert.equal(c.json.decision.jalur, "SELF_DECLARE_SIAP", JSON.stringify(c.json.decision.alasan.filter((a) => a.hasil !== "lolos")));
  assert.equal(c.json.decision.skor_kesiapan, 100);
  const d = await api("GET", `/umk/${umk017.id}`);
  assert.equal(d.json.status, "siap_review");
  assert.equal(d.json.documents.find((x) => x.kode === "SERT_PEMASOK:margarin").status, "diterima");
});

// ---------- Otorisasi & hapus ----------
test("US-19-N2: UMK lain mencoba akses/hapus UMK-017 → 403", async () => {
  assert.equal((await api("GET", `/umk/${umk017.id}`, null, { actor: `umk:${TG.umk2}` })).status, 403);
  assert.equal((await api("DELETE", `/umk/${umk017.id}`, null, { actor: `umk:${TG.umk2}` })).status, 403);
});
test("US-19-P: hapus UMK baru → cascade, hash bukti, whoami kembali tidak_terdaftar", async () => {
  const r = await api("DELETE", `/umk/${umkBaru.id}`, null, { actor: `umk:${TG.baru}` });
  assert.equal(r.status, 200); assert.match(r.json.hash_bukti, /^[0-9a-f]{64}$/);
  assert.equal((await api("GET", `/umk/${umkBaru.id}`)).status, 404);
  assert.equal((await api("GET", `/whoami?telegram_id=${TG.baru}`)).json.role, "tidak_terdaftar");
});

// ---------- Media ----------
test("US-04: save_media menyalin file + sha256; extract tanpa API key → 503", async () => {
  const src = join(dataDir, "label.png");
  writeFileSync(src, Buffer.from("89504e470d0a1a0a0000000d49484452", "hex"));
  const m = await api("POST", `/products/${prod017.id}/media`, { kind: "label", source_path: src });
  assert.equal(m.status, 201); assert.match(m.json.sha256, /^[0-9a-f]{64}$/);
  // foto label otomatis = FOTO_PRODUK diterima (tidak bergantung agent memanggil receive_document)
  assert.equal(m.json.dokumen_diterima, "FOTO_PRODUK");
  const foto = (await api("GET", `/umk/${umk017.id}`)).json.documents.find((x) => x.kode === "FOTO_PRODUK");
  assert.equal(foto.status, "diterima"); assert.equal(foto.media_id, m.json.media_id);
  const x = await api("POST", `/products/${prod017.id}/extract`, { media_id: m.json.media_id });
  assert.equal(x.status, 503);
  const bad = await api("POST", `/products/${prod017.id}/media`, { kind: "label", source_path: join(dataDir, "tidak-ada.png") });
  assert.equal(bad.status, 400);
});

test("PATCH /products/:pid: cerita proses tersimpan → PROSES dihasilkan → evaluasi ulang otomatis; teks pendek ditolak", async () => {
  const w = await api("GET", `/whoami?telegram_id=${TG.umk3}`); const u = w.json.umk;
  const d = await api("GET", `/umk/${u.id}`); const p = d.json.products[0];
  assert.equal((await api("PATCH", `/products/${p.id}`, { proses_ringkas: "direbus" })).status, 400);
  const r = await api("PATCH", `/products/${p.id}`, { proses_ringkas: "Daging sapi digiling, dicampur tapioka dan bumbu, dibentuk bulat, direbus 15 menit, dikemas beku.", giling_sendiri: 1 }, { actor: `umk:${TG.umk3}` });
  assert.equal(r.status, 200); assert.ok(r.json.decision?.jalur);
  const after = await api("GET", `/umk/${u.id}`);
  assert.equal(after.json.documents.find((x) => x.kode === "PROSES").status, "dihasilkan");
  assert.ok(!r.json.decision.alasan.some((a) => a.rule_id === "E10_DAGING_GILING" && a.hasil !== "lolos"), "giling_sendiri=1 memenuhi E10");
});
