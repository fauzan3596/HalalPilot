/**
 * Mesin keputusan jalur (SPECS.md §7.4). Fungsi murni: evaluate(ctx, rules) → Decision.
 * Predikat ditulis di sini dengan nama = rule.id; YAML membawa efek, bobot, pesan, dokumen.
 * DILARANG: eval, panggilan jaringan, panggilan model.
 *
 * ctx = { umk, products:[{...product, ingredients:[{...ingredient, supplier_cert}]}], documents:[{kode,status}], oss:{mismatch:[]} }
 */
const EFEK_RANK = { BLOCK_TIDAK_LAYAK: 3, BLOCK_REGULER: 2, NEED_DOC: 1 };
const OUTCOME_BY_EFEK = { BLOCK_TIDAK_LAYAK: "TIDAK_LAYAK", BLOCK_REGULER: "REGULER", NEED_DOC: "SELF_DECLARE_KURANG_DOKUMEN" };
const DAGING = new Set(["daging_sapi", "daging_ayam", "daging_kambing", "jeroan", "tulang", "kulit"]);

const allIng = (ctx) => ctx.products.flatMap((p) => p.ingredients ?? []);
const hasDoc = (ctx, kode) => ctx.documents.some((d) => d.kode === kode && ["diterima", "dihasilkan"].includes(d.status));

// Setiap predikat mengembalikan false (lolos) atau true/objek (gagal). Objek boleh membawa {dokumen:[...], vars:{...}}.
export const predicates = {
  E01_NIB_UMK: ({ umk }) => !umk.nib || !["mikro", "kecil"].includes(umk.skala),
  E02_OMZET: ({ umk }) => Number(umk.omzet_tahunan ?? 0) > 15_000_000_000,
  E03_SATU_FASILITAS: ({ umk }) => (umk.jumlah_fasilitas_produksi ?? 1) > 1 || (umk.jumlah_outlet ?? 1) > 1,
  E04_PERALATAN_SEDERHANA: ({ umk }) => umk.peralatan === "otomatis_pabrik",
  E05_FASILITAS_TERPISAH: ({ umk }) => umk.fasilitas_terpisah_nonhalal === 0,
  E06_BAHAN_BERBAHAYA: (ctx) => ctx.products.some((p) => p.bahan_berbahaya === 1),
  E07_PRODUK_BARANG: (ctx) => ctx.products.some((p) => p.jenis === "jasa"),
  E08_PENGAWETAN_MAKS_SATU: (ctx) => ctx.products.some((p) => (p.teknik_pengawetan_count ?? 0) > 1),
  E09_SEMBELIHAN_DARI_RPH_HALAL: (ctx) => {
    const perlu = ctx.products.some((p) => p.mengandung_hewan_sembelihan === 1);
    if (!perlu) return false;
    const adaRph = allIng(ctx).some((i) => DAGING.has(i.nama_normal) && i.supplier_cert?.status === "valid");
    return adaRph ? false : { dokumen: ["SERT_PEMASOK:RPH"] };
  },
  E10_DAGING_GILING: (ctx) => ctx.products.some((p) => p.daging_giling === 1 && !p.giling_sendiri) && !hasDoc(ctx, "SERT_PEMASOK:GILING")
    ? { dokumen: ["SERT_PEMASOK:GILING"] } : false,
  E11_BAHAN_KRITIS_TERDOKUMENTASI: (ctx) => {
    const kurang = allIng(ctx).filter((i) => i.kelas === "kritis" && i.supplier_cert?.status !== "valid");
    return kurang.length ? { dokumen: kurang.map((i) => `SERT_PEMASOK:${i.nama_normal ?? i.nama_asli}`), vars: { daftar_bahan_kritis_tanpa_sertifikat: kurang.map((i) => i.nama_asli).join(", ") } } : false;
  },
  E12_BAHAN_TIDAK_DIKENAL: (ctx) => {
    const x = allIng(ctx).filter((i) => i.kelas === "tidak_dikenal");
    return x.length ? { dokumen: ["KONFIRMASI_BAHAN"], vars: { daftar_tidak_dikenal: x.map((i) => i.nama_asli).join(", ") } } : false;
  },
  E13_DOKUMEN_WAJIB: (ctx, rule) => {
    const kurang = rule.dokumen_wajib.filter((k) => !hasDoc(ctx, k));
    if (!kurang.length) return false;
    const label = { NIB: "NIB", PENYELIA: "nama penyelia halal", FOTO_PRODUK: "foto produk/label", PROSES: "cerita singkat proses produksi", DAFTAR_BAHAN: "konfirmasi daftar bahan" };
    const dariUmk = kurang.filter((k) => label[k]).map((k) => label[k]);
    return { dokumen: kurang, vars: { daftar_dokumen_umk: dariUmk.join(", ") || "tidak ada (menunggu penyusunan otomatis)" } };
  },
  E14_KONFIRMASI_EKSTRAKSI: (ctx) => allIng(ctx).some((i) => !i.dikonfirmasi_umk) ? { dokumen: ["KONFIRMASI_BAHAN"] } : false,
  E16_MAKS_PRODUK: (ctx) => ctx.products.length > (ctx.umk.jenis_usaha === "warung" ? 30 : 10),
  E17_NAMA_PRODUK_SESUAI: (ctx, rule) => {
    const bad = new Set(rule.kata_terlarang ?? []);
    const hits = [];
    for (const p of ctx.products) for (const t of String(`${p.nama ?? ""} ${p.jenis ?? ""}`).toLowerCase().split(/[^a-z]+/)) if (t && bad.has(t)) hits.push(t);
    return hits.length ? { vars: { kata: [...new Set(hits)].join(", ") } } : false;
  },
  E18_DAFTAR_BAHAN_WAJAR: (ctx) => {
    const ing = allIng(ctx);
    if (!ing.length) return false;
    const trivial = new Set(["air", "garam", "es_batu", "kemasan"]);
    return ing.length < 2 || ing.every((i) => trivial.has(i.nama_normal)) ? { dokumen: ["KONFIRMASI_BAHAN"] } : false;
  },
  E15_OSS_KONSISTEN: (ctx) => ctx.oss?.mismatch?.length ? { dokumen: ["PERBAIKAN_OSS"], vars: { "oss.mismatch": ctx.oss.mismatch.join("; ") } } : false,
};

// Bahan haram eksplisit memotong evaluasi: TIDAK_LAYAK.
function haramEksplisit(ctx, rules) {
  const set = new Set(rules.ingredients.haram_eksplisit ?? []);
  const hit = allIng(ctx).filter((i) => set.has(i.nama_normal));
  return hit.length ? hit.map((i) => i.nama_asli) : null;
}

const render = (tpl, vars) => String(tpl ?? "").replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, k) => vars?.[k] ?? `{{${k}}}`);

export function evaluate(ctx, rules) {
  const alasan = [];
  const dokumen = new Set();
  let worst = 0;
  let skor = rules.eligibility.scoring?.base ?? 100;

  const haram = haramEksplisit(ctx, rules);
  if (haram) {
    return { jalur: "TIDAK_LAYAK", skor_kesiapan: 0, alasan: [{ rule_id: "HARAM_EKSPLISIT", hasil: "gagal", pesan_umk: `Bahan tidak dapat disertifikasi: ${haram.join(", ")}.` }], dokumen_diminta: [], rules_version: rules.version };
  }

  for (const rule of rules.eligibility.rules) {
    const pred = predicates[rule.id];
    if (!pred) throw new Error(`Predikat untuk rule ${rule.id} belum terdaftar di engine.js`);
    const r = pred(ctx, rule);
    if (!r) { alasan.push({ rule_id: rule.id, hasil: "lolos" }); continue; }
    const vars = typeof r === "object" ? r.vars : undefined;
    const docs = typeof r === "object" && r.dokumen ? r.dokumen : rule.dokumen ? [rule.dokumen] : [];
    docs.forEach((d) => dokumen.add(d));
    worst = Math.max(worst, EFEK_RANK[rule.efek] ?? 0);
    skor -= rule.bobot_skor ?? 0;
    alasan.push({ rule_id: rule.id, hasil: rule.efek === "NEED_DOC" ? "butuh_dokumen" : "gagal", pesan_umk: render(rule.pesan_umk ?? rule.deskripsi, vars) });
  }

  const jalur = worst === 0 ? "SELF_DECLARE_SIAP" : OUTCOME_BY_EFEK[Object.keys(EFEK_RANK).find((k) => EFEK_RANK[k] === worst)];
  return { jalur, skor_kesiapan: Math.max(rules.eligibility.scoring?.floor ?? 0, skor), alasan, dokumen_diminta: [...dokumen], rules_version: rules.version };
}
