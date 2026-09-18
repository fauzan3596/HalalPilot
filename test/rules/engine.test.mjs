import { test } from "node:test";
import assert from "node:assert/strict";
import { loadRules } from "../../src/rules/loader.js";
import { evaluate } from "../../src/rules/engine.js";
import { classify, productFlags } from "../../src/rules/classifier.js";

const rules = loadRules(new URL("../../rules/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));

const umkBase = { nib: "1234567890123", skala: "mikro", omzet_tahunan: 300_000_000, jumlah_fasilitas_produksi: 1, jumlah_outlet: 1, fasilitas_terpisah_nonhalal: 1, peralatan: "manual" };
const semuaDok = ["NIB", "PERMOHONAN", "PERNYATAAN_HALAL", "IKRAR", "PENYELIA", "DAFTAR_BAHAN", "PROSES", "FOTO_PRODUK", "MANUAL_SJPH"].map((kode) => ({ kode, status: "diterima" }));

function produk(bahan, extra = {}, certs = {}) {
  const items = bahan.map((b) => ({ ...classify(b, rules), dikonfirmasi_umk: 1, supplier_cert: certs[b] ? { status: certs[b] } : null }));
  return { jenis: "makanan", teknik_pengawetan_count: 0, ...productFlags(items), ...extra, ingredients: items };
}
const ctx = (p, umk = {}, documents = semuaDok, oss = { mismatch: [] }) => ({ umk: { ...umkBase, ...umk }, products: [p], documents, oss });
const ids = (d, hasil) => d.alasan.filter((a) => a.hasil === hasil).map((a) => a.rule_id);

test("Nastar tanpa sertifikat margarin → KURANG_DOKUMEN, E11", () => {
  const d = evaluate(ctx(produk(["tepung terigu", "margarin", "telur", "gula pasir", "selai nanas", "vanili"])), rules);
  assert.equal(d.jalur, "SELF_DECLARE_KURANG_DOKUMEN");
  assert.ok(ids(d, "butuh_dokumen").includes("E11_BAHAN_KRITIS_TERDOKUMENTASI"));
  assert.ok(d.dokumen_diminta.includes("SERT_PEMASOK:margarin"));
});

test("Nastar + sertifikat margarin valid → SIAP, skor 100", () => {
  const p = produk(["tepung terigu", "margarin", "telur", "gula pasir", "vanili"], {}, { margarin: "valid" });
  p.ingredients = p.ingredients.filter((i) => i.kelas !== "tidak_dikenal"); // selai nanas belum di kamus: kasus terpisah
  const d = evaluate(ctx(p), rules);
  assert.equal(d.jalur, "SELF_DECLARE_SIAP");
  assert.equal(d.skor_kesiapan, 100);
});

test("Bakso: daging tanpa RPH + giling di pasar → E09, E10, E11", () => {
  const d = evaluate(ctx(produk(["daging sapi", "tapioka", "bawang putih", "garam", "penyedap rasa"], { daging_giling: 1 })), rules);
  assert.equal(d.jalur, "SELF_DECLARE_KURANG_DOKUMEN");
  const b = ids(d, "butuh_dokumen");
  for (const r of ["E09_SEMBELIHAN_DARI_RPH_HALAL", "E10_DAGING_GILING", "E11_BAHAN_KRITIS_TERDOKUMENTASI"]) assert.ok(b.includes(r), r);
});

test("Sambal: bahan aman tapi KBLI mismatch → hanya E15", () => {
  const d = evaluate(ctx(produk(["cabai", "bawang merah", "bawang putih", "garam", "gula pasir", "minyak goreng", "terasi"]), {}, semuaDok, { mismatch: ["kbli: 47xxx ≠ 10772"] }), rules);
  assert.equal(d.jalur, "SELF_DECLARE_KURANG_DOKUMEN");
  assert.deepEqual(ids(d, "butuh_dokumen"), ["E15_OSS_KONSISTEN"]);
});

test("Peralatan pabrik → REGULER (E04)", () => {
  const d = evaluate(ctx(produk(["cabai", "garam"]), { peralatan: "otomatis_pabrik" }), rules);
  assert.equal(d.jalur, "REGULER");
});

test("Fasilitas campur non-halal → TIDAK_LAYAK (E05)", () => {
  assert.equal(evaluate(ctx(produk(["cabai", "garam"]), { fasilitas_terpisah_nonhalal: 0 }), rules).jalur, "TIDAK_LAYAK");
});

test("Boraks → TIDAK_LAYAK (E06)", () => {
  assert.equal(evaluate(ctx(produk(["tepung terigu", "boraks"])), rules).jalur, "TIDAK_LAYAK");
});

test("Angciu → TIDAK_LAYAK tanpa evaluasi lanjut", () => {
  const d = evaluate(ctx(produk(["daging ayam", "angciu"])), rules);
  assert.equal(d.jalur, "TIDAK_LAYAK");
  assert.equal(d.alasan[0].rule_id, "HARAM_EKSPLISIT");
});

test("Dua outlet → REGULER (E03)", () => {
  assert.equal(evaluate(ctx(produk(["cabai", "garam"]), { jumlah_outlet: 2 }), rules).jalur, "REGULER");
});

test("Bahan tak dikenal → KURANG_DOKUMEN, E12, kelas tidak_dikenal", () => {
  const p = produk(["tepung terigu", "xanthan gum"]);
  assert.equal(p.ingredients[1].kelas, "tidak_dikenal");
  const d = evaluate(ctx(p), rules);
  assert.ok(ids(d, "butuh_dokumen").includes("E12_BAHAN_TIDAK_DIKENAL"));
  assert.ok(d.dokumen_diminta.includes("KONFIRMASI_BAHAN"));
});

test("Normalisasi typo OCR: 'margarine' → margarin (kritis)", () => {
  const c = classify("Margarine", rules);
  assert.equal(c.nama_normal, "margarin");
  assert.equal(c.kelas, "kritis");
});

test("Deterministik: dua evaluasi input sama → hasil identik & rules_version terisi", () => {
  const c = ctx(produk(["cabai", "garam"]));
  assert.deepEqual(evaluate(c, rules), evaluate(c, rules));
  assert.match(rules.version, /^\d{4}-\d{2}-\d{2}\.\d+\+[0-9a-f]{8}$/);
});

test("E17: nama produk 'Keripik Rasa Bacon' -> TIDAK_LAYAK; 'Keripik Rumahan' tidak terpicu oleh 'rum'", () => {
  const p = produk(["singkong", "minyak goreng", "garam"]); p.nama = "Keripik Rasa Bacon"; p.jenis = "keripik";
  assert.equal(evaluate(ctx(p), rules).jalur, "TIDAK_LAYAK");
  const q = produk(["singkong", "minyak goreng", "garam"]); q.nama = "Keripik Rumahan"; q.jenis = "keripik";
  assert.notEqual(evaluate(ctx(q), rules).jalur, "TIDAK_LAYAK");
});
test("E18: daftar bahan hanya 'air' -> KONFIRMASI_BAHAN diminta", () => {
  const d = evaluate(ctx(produk(["air"])), rules);
  assert.ok(ids(d, "butuh_dokumen").includes("E18_DAFTAR_BAHAN_WAJAR"));
});
test("E16: 11 produk -> PEMBAGIAN_PENGAJUAN", () => {
  const c = ctx(produk(["cabai", "garam"])); c.products = Array.from({ length: 11 }, (_, i) => ({ ...c.products[0], nama: `Produk ${i + 1}` }));
  const d = evaluate(c, rules);
  assert.ok(ids(d, "butuh_dokumen").includes("E16_MAKS_PRODUK")); assert.ok(d.dokumen_diminta.includes("PEMBAGIAN_PENGAJUAN"));
});
