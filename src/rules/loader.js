import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import yaml from "js-yaml";

/**
 * Muat rules/*.yaml dan hitung rules_version = "<version di eligibility>+<sha256 8 hex dari seluruh isi>".
 * Perubahan YAML apa pun mengubah versi; decision lama tetap menyimpan versinya (NFR-11).
 */
export function loadRules(dir) {
  const files = ["eligibility.yaml", "ingredients.yaml", "chase-policy.yaml", "oss-check.yaml"];
  const raw = Object.fromEntries(files.map((f) => [f, readFileSync(join(dir, f), "utf8")]));
  const parsed = Object.fromEntries(files.map((f) => [f.replace(".yaml", ""), yaml.load(raw[f])]));
  const hash = createHash("sha256").update(files.map((f) => raw[f]).join("\n")).digest("hex").slice(0, 8);
  return {
    version: `${parsed.eligibility.version}+${hash}`,
    eligibility: parsed.eligibility,
    ingredients: parsed.ingredients,
    chase: parsed["chase-policy"],
    oss: parsed["oss-check"],
  };
}
