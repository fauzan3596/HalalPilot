// Uji kontrak: setiap perintah di openclaw/skills/halalpilot/scripts/api.mjs harus memetakan ke path+method yang ada di docs/openapi.yaml.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import yaml from "js-yaml";

const spec = yaml.load(readFileSync(new URL("../docs/openapi.yaml", import.meta.url), "utf8"));
const src = readFileSync(new URL("../openclaw/skills/halalpilot/scripts/api.mjs", import.meta.url), "utf8");

// Ambil pasangan ["METHOD", `/path`] dari tabel routes di api.mjs
const re = /\["(GET|POST|PUT|PATCH|DELETE)",\s*`([^`]+)`/g;
const calls = [...src.matchAll(re)].map((m) => [m[1], m[2].replace(/\$\{[^}]+\}/g, "{x}").split("?")[0]]);

const templates = Object.keys(spec.paths).map((p) => ({ p, re: new RegExp("^" + p.replace(/\{[^}]+\}/g, "[^/]+") + "$"), methods: Object.keys(spec.paths[p]).map((m) => m.toUpperCase()) }));

test("api.mjs memiliki ≥ 15 perintah", () => assert.ok(calls.length >= 15, `hanya ${calls.length}`));

for (const [method, path] of calls) {
  test(`${method} ${path} ada di openapi`, () => {
    const hit = templates.find((t) => t.re.test(path.replace(/\{x\}/g, "1")));
    assert.ok(hit, `path tidak ditemukan: ${path}`);
    assert.ok(hit.methods.includes(method), `method ${method} tidak ada untuk ${hit.p} (ada: ${hit.methods})`);
  });
}
