import { normalize } from "./normalizer.js";

const PRIORITAS = ["haram_eksplisit", "berbahaya", "kritis", "positif", "dikecualikan_C", "dikecualikan_B", "dikecualikan_A"];

/**
 * Klasifikasi satu bahan → { nama_asli, nama_normal, kelas, rule_id, butuh_sertifikat_pemasok, flags }
 * Prioritas jika cocok beberapa daftar: haram > berbahaya > kritis > positif > dikecualikan.
 */
export function classify(raw, rules) {
  const ing = rules.ingredients;
  const nama_normal = normalize(raw, rules);
  const inList = (list) => Array.isArray(list) && list.includes(nama_normal);
  const kelasMap = ing.kelas ?? {};
  let kelas = "tidak_dikenal", rule_id = null;
  for (const k of PRIORITAS) {
    if (k === "haram_eksplisit" && inList(ing.haram_eksplisit)) { kelas = "kritis"; rule_id = "HARAM_EKSPLISIT"; break; }
    if (k === "berbahaya" && inList(ing.berbahaya)) { kelas = "kritis"; rule_id = "BERBAHAYA"; break; }
    if (kelasMap[k] && inList(kelasMap[k].bahan)) { kelas = k; rule_id = kelasMap[k].rule_id; break; }
  }
  return {
    nama_asli: String(raw).trim(),
    nama_normal,
    kelas,
    rule_id,
    butuh_sertifikat_pemasok: kelas === "kritis",
    flags: {
      haram: inList(ing.haram_eksplisit),
      berbahaya: inList(ing.berbahaya),
      sembelihan: inList(ing.sembelihan),
    },
  };
}

/** Turunkan flag produk dari daftar bahan terklasifikasi. */
export function productFlags(items) {
  return {
    mengandung_hewan_sembelihan: items.some((i) => i.flags.sembelihan) ? 1 : 0,
    bahan_berbahaya: items.some((i) => i.flags.berbahaya) ? 1 : 0,
  };
}
