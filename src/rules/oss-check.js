/**
 * Pengecekan konsistensi data usaha vs record NIB (mock OSS). Fungsi murni: ossCheck(umk, ossRecord, rules) → { mismatch: [...], detail }
 * ossRecord null → NIB tidak ditemukan. Parameter (ambang, KBLI pangan) dari rules/oss-check.yaml.
 */
import { lev } from "./normalizer.js";

// Hanya bentuk badan usaha yang dibuang; kata seperti "Dapur"/"Warung" adalah bagian nama dagang dan tetap dibandingkan.
const BADAN = /\b(pt|cv|ud|pd|koperasi|ksu|kud)\b\.?/g;
export const normNama = (s) => String(s ?? "").toLowerCase().replace(BADAN, " ").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
export const ratio = (a, b) => { const m = Math.max(a.length, b.length); return m === 0 ? 1 : 1 - lev(a, b) / m; };

const tokens = (s) => new Set(String(s ?? "").toLowerCase().replace(/\bno\.?\s*\d+[a-z]?\b/g, " ").replace(/\bjl\.?|jalan\b/g, " ").replace(/[^a-z\s]/g, " ").split(/\s+/).filter((t) => t.length > 2));
export const tokenOverlap = (a, b) => { const A = tokens(a), B = tokens(b); if (!A.size || !B.size) return 0; let hit = 0; for (const t of A) if (B.has(t)) hit++; return hit / Math.min(A.size, B.size); };

export function ossCheck(umk, oss, rules) {
  const cfg = rules.oss ?? {};
  const amb = Object.fromEntries((cfg.pembanding ?? []).map((p) => [p.field, p]));
  const mismatch = [];
  const detail = {};

  if (!oss) {
    mismatch.push("nib_tidak_ditemukan");
    return { mismatch, detail: { nib: umk.nib }, pesan: ["NIB tidak ditemukan di data OSS (simulasi). Periksa kembali nomor NIB Anda."] };
  }
  const pesan = [];
  const fmt = (p, a, b) => String(p?.pesan ?? "{{a}} ≠ {{b}}").replace("{{a}}", a ?? "-").replace("{{b}}", Array.isArray(b) ? b.join(", ") : b ?? "-");

  const rNama = ratio(normNama(umk.nama_usaha), normNama(oss.nama));
  detail.nama = { skor: Number(rNama.toFixed(2)) };
  if (rNama < (amb.nama_usaha?.ambang ?? 0.9)) { mismatch.push("nama_usaha"); pesan.push(fmt(amb.nama_usaha, umk.nama_usaha, oss.nama)); }

  const rAlamat = tokenOverlap(umk.alamat, oss.alamat);
  detail.alamat = { skor: Number(rAlamat.toFixed(2)) };
  if (rAlamat < (amb.alamat?.ambang ?? 0.7)) { mismatch.push("alamat"); pesan.push(fmt(amb.alamat, umk.alamat, oss.alamat)); }

  const kbliOss = Array.isArray(oss.kbli) ? oss.kbli : JSON.parse(oss.kbli_json ?? "[]");
  detail.kbli = { produk: umk.kbli, nib: kbliOss };
  if (umk.kbli && !kbliOss.includes(umk.kbli)) { mismatch.push("kbli"); pesan.push(fmt(amb.kbli, umk.kbli, kbliOss)); }
  if (umk.kbli && Array.isArray(cfg.kbli_pangan_yang_diterima) && !cfg.kbli_pangan_yang_diterima.includes(umk.kbli)) {
    mismatch.push("kbli_bukan_pangan"); pesan.push(`KBLI ${umk.kbli} bukan KBLI pangan yang diterima untuk self-declare (simulasi).`);
  }

  if (umk.skala && oss.skala && umk.skala !== oss.skala) { mismatch.push("skala"); pesan.push(fmt(amb.skala, umk.skala, oss.skala)); }
  if ((oss.status_nib ?? "aktif") !== (amb.status_nib?.nilai_wajib ?? "aktif")) { mismatch.push("status_nib"); pesan.push(fmt(amb.status_nib, oss.status_nib, "aktif")); }

  return { mismatch, detail, pesan };
}
