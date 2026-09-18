// Validasi front-matter & bagian wajib di tests/scenarios/*.md. Dipakai `npm run check:scenarios`.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const dir = new URL("./scenarios/", import.meta.url);
const files = readdirSync(dir).filter((f) => f.endsWith(".md") && !f.startsWith("_"));
const wajib = ["## Tujuan", "## Prasyarat", "## Data uji", "## Langkah", "## Hasil yang diharapkan", "## Kriteria lolos"];
const fm = ["id", "level", "tipe", "terkait", "prioritas", "komponen", "otomasi"];
let bad = 0;
const ids = new Set();
for (const f of files) {
  const t = readFileSync(join(dir.pathname.replace(/^\/([A-Za-z]:)/, "$1"), f), "utf8");
  const m = t.match(/^---\n([\s\S]*?)\n---/);
  const errs = [];
  if (!m) errs.push("tanpa front-matter");
  else for (const k of fm) if (!new RegExp(`^${k}:`, "m").test(m[1])) errs.push(`front-matter tanpa '${k}'`);
  for (const w of wajib) if (!t.includes(w)) errs.push(`tanpa bagian '${w}'`);
  const id = m?.[1].match(/^id:\s*(\S+)/m)?.[1];
  if (id) { if (ids.has(id)) errs.push(`id duplikat ${id}`); ids.add(id); if (!f.startsWith(id)) errs.push(`nama file tidak diawali id ${id}`); }
  if (errs.length) { bad++; console.log(`✗ ${f}: ${errs.join("; ")}`); }
}
console.log(`${files.length} skenario, ${files.length - bad} valid, ${bad} bermasalah`);
process.exit(bad ? 1 : 0);
