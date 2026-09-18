// Menyimpan daftar bahan (hasil vision / koreksi UMK): klasifikasi, flag produk, tautan ulang sertifikat pemasok.
import { db, tx } from "../db.js";
import { classify, productFlags } from "../rules/classifier.js";

const q = {
  del: db.prepare("DELETE FROM ingredient WHERE product_id = ?"),
  ins: db.prepare("INSERT INTO ingredient (product_id, nama_asli, nama_normal, kelas, rule_id, butuh_sertifikat_pemasok, supplier_cert_id, dikonfirmasi_umk) VALUES (?,?,?,?,?,?,?,?)"),
  flags: db.prepare("UPDATE product SET mengandung_hewan_sembelihan = ?, bahan_berbahaya = ? WHERE id = ?"),
  certsForUmk: db.prepare("SELECT sc.id, sc.status, sr.bahan_json FROM supplier_cert sc LEFT JOIN supplier_registry sr ON sr.nomor_sertifikat = sc.nomor_sertifikat WHERE sc.umk_id = ?"),
  certUntukBahan: db.prepare("SELECT supplier_cert_id, bahan FROM supplier_cert_bahan WHERE umk_id = ?"),
};

/** Cari sertifikat pemasok milik UMK yang mencakup nama_normal bahan (dipilih yang 'valid' lebih dulu). */
export function findCertForBahan(umkId, namaNormal) {
  const rows = q.certUntukBahan.all(umkId).filter((r) => r.bahan === namaNormal);
  if (!rows.length) return null;
  const status = db.prepare("SELECT id, status FROM supplier_cert WHERE id = ?");
  const certs = rows.map((r) => status.get(r.supplier_cert_id)).filter(Boolean);
  return certs.find((c) => c.status === "valid") ?? certs[0] ?? null;
}

/**
 * Ganti seluruh daftar bahan produk. Mengembalikan {ingredients, ringkasan, perlu_konfirmasi}.
 */
export function setIngredients({ product, umkId, bahan, dikonfirmasi }, rules) {
  const items = bahan.map((b) => classify(b, rules));
  const flags = productFlags(items);
  const saved = tx(() => {
    q.del.run(product.id);
    const out = [];
    for (const i of items) {
      const cert = i.nama_normal ? findCertForBahan(umkId, i.nama_normal) : null;
      const r = q.ins.run(product.id, i.nama_asli, i.nama_normal, i.kelas, i.rule_id, i.butuh_sertifikat_pemasok ? 1 : 0, cert?.id ?? null, dikonfirmasi ? 1 : 0);
      out.push({ id: r.lastInsertRowid, nama_asli: i.nama_asli, nama_normal: i.nama_normal, kelas: i.kelas, rule_id: i.rule_id, butuh_sertifikat_pemasok: i.butuh_sertifikat_pemasok, dikonfirmasi_umk: !!dikonfirmasi, supplier_cert: cert });
    }
    q.flags.run(flags.mengandung_hewan_sembelihan, flags.bahan_berbahaya, product.id);
    return out;
  });
  const count = {};
  for (const i of saved) count[i.kelas] = (count[i.kelas] ?? 0) + 1;
  const label = { dikecualikan_A: "dikecualikan (alam)", dikecualikan_B: "dikecualikan (olahan tidak berisiko)", dikecualikan_C: "dikecualikan (kimia/tambang)", positif: "positif", kritis: "kritis (butuh sertifikat pemasok)", tidak_dikenal: "tidak dikenal (perlu konfirmasi)" };
  const ringkasan = `${saved.length} bahan: ` + Object.entries(count).map(([k, n]) => `${n} ${label[k] ?? k}`).join(", ");
  return { ingredients: saved, ringkasan, perlu_konfirmasi: !dikonfirmasi, flags };
}
