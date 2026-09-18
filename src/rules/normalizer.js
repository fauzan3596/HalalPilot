/**
 * Bahan mentah (teks hasil vision / ketikan UMK) → nama_normal. Fuzzy Levenshtein ≤ 2 terhadap kunci sinonim.
 */
export function normalize(raw, rules) {
  const syn = rules.ingredients.normalisasi ?? {};
  const s = String(raw).toLowerCase().replace(/\(.*?\)/g, "").replace(/[\d.,%]+/g, "").replace(/[^a-z\s_-]/g, " ").replace(/\s+/g, " ").trim();
  if (!s) return null;
  if (syn[s]) return syn[s];
  const keys = Object.keys(syn);
  let best = null, bestD = 3;
  for (const k of keys) { const d = lev(s, k); if (d < bestD) { bestD = d; best = k; } }
  return best ? syn[best] : s.replace(/\s/g, "_");
}

export function lev(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}
