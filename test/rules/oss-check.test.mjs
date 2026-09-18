import { test } from "node:test";
import assert from "node:assert/strict";
import { loadRules } from "../../src/rules/loader.js";
import { ossCheck, normNama, tokenOverlap } from "../../src/rules/oss-check.js";

const rules = loadRules(new URL("../../rules/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const umk017 = { nama_usaha: "Dapur Bu Ratih", alamat: "Jl. Kenanga No. 5, Condongcatur, Depok, Sleman", kbli: "10710", skala: "mikro", nib: "1309170000017" };
const oss017 = { nama: "Dapur Bu Ratih", alamat: "Jl. Kenanga No. 5, Condongcatur, Depok, Sleman", kbli: ["10710"], skala: "mikro", status_nib: "aktif" };

test("US-08-P: data identik → tanpa mismatch", () => {
  assert.deepEqual(ossCheck(umk017, oss017, rules).mismatch, []);
});

test("US-08-P: variasi kecil (huruf besar, UD, nomor rumah beda) tetap cocok", () => {
  const r = ossCheck({ ...umk017, nama_usaha: "UD. DAPUR BU RATIH", alamat: "Jalan Kenanga 7, Condongcatur, Depok, Sleman" }, oss017, rules);
  assert.deepEqual(r.mismatch, []);
  assert.equal(normNama("UD. DAPUR BU RATIH"), "dapur bu ratih");
});

test("US-08-N: KBLI NIB perdagangan (47241) vs produk 10772 → mismatch kbli dengan angka yang benar", () => {
  const r = ossCheck({ ...umk017, kbli: "10772" }, { ...oss017, kbli: ["47241"] }, rules);
  assert.deepEqual(r.mismatch, ["kbli"]);
  assert.match(r.pesan[0], /10772/);
  assert.match(r.pesan[0], /47241/);
});

test("US-08-N2: NIB tidak ditemukan → nib_tidak_ditemukan; NIB nonaktif → status_nib", () => {
  assert.deepEqual(ossCheck(umk017, null, rules).mismatch, ["nib_tidak_ditemukan"]);
  assert.ok(ossCheck(umk017, { ...oss017, status_nib: "nonaktif" }, rules).mismatch.includes("status_nib"));
});

test("Nama berbeda jauh → mismatch nama_usaha; alamat kota lain → mismatch alamat", () => {
  const r = ossCheck({ ...umk017, nama_usaha: "Bakso Pak Darto", alamat: "Jl. Anggrek 3, Kotagede, Yogyakarta" }, oss017, rules);
  assert.ok(r.mismatch.includes("nama_usaha"));
  assert.ok(r.mismatch.includes("alamat"));
  assert.ok(tokenOverlap("Jl. Kenanga No. 5, Condongcatur, Depok, Sleman", "Jl. Kenanga No. 7, Condongcatur, Depok, Sleman") >= 0.7);
});

test("KBLI bukan pangan (47241 sebagai KBLI produk) → kbli_bukan_pangan", () => {
  const r = ossCheck({ ...umk017, kbli: "47241" }, { ...oss017, kbli: ["47241"] }, rules);
  assert.ok(r.mismatch.includes("kbli_bukan_pangan"));
});
