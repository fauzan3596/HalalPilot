// Pembuat dossier PDF (pdf-lib, tanpa Chromium). 10 bagian sesuai SPECS §7.8. Hash SHA-256 dicetak di sampul & disimpan.
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { db, tx } from "../db.js";
import { config } from "../config.js";
import { audit } from "../audit.js";
import { productsWithIngredients, documents, lastDecision } from "../services/umk-service.js";

const here = dirname(fileURLToPath(import.meta.url));
const TEMPLATE = readFileSync(join(here, "templates/manual-sjph.md"), "utf8");
const q = {
  nextVersi: db.prepare("SELECT COALESCE(MAX(versi), 0) + 1 v FROM dossier WHERE umk_id = ?"),
  ins: db.prepare("INSERT INTO dossier (umk_id, versi, pdf_path, sha256, manual_sjph_path, status) VALUES (?,?,?,?,?,'menunggu_review')"),
  setUmk: db.prepare("UPDATE umk SET status = 'siap_review', updated_at = datetime('now') WHERE id = ?"),
  docGen: db.prepare("UPDATE document_req SET status = 'dihasilkan', updated_at = datetime('now') WHERE umk_id = ? AND kode = ? AND status <> 'diterima'"),
  koperasi: db.prepare("SELECT nama FROM koperasi WHERE id = ?"),
};

// Hanya karakter WinAnsi (Helvetica standar). Ganti yang tidak didukung.
const clean = (s) => String(s ?? "").replace(/[→≥≤]/g, (c) => ({ "→": "->", "≥": ">=", "≤": "<=" })[c]).replace(/[^\x20-\x7E\xA0-\xFF\n]/g, "?");
const render = (tpl, vars) => tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] ?? "-");

/** Tata letak teks sederhana dengan pembungkus baris dan halaman otomatis. */
class Writer {
  constructor(doc, fonts) { this.doc = doc; this.f = fonts; this.page = null; this.y = 0; this.margin = 50; this.width = 595.28; this.height = 841.89; this.newPage(); }
  newPage() { this.page = this.doc.addPage([this.width, this.height]); this.y = this.height - this.margin; }
  ensure(h) { if (this.y - h < this.margin) this.newPage(); }
  text(str, { size = 10, bold = false, color = rgb(0.1, 0.13, 0.1), gap = 4, indent = 0 } = {}) {
    const font = bold ? this.f.bold : this.f.regular;
    const maxW = this.width - 2 * this.margin - indent;
    for (const para of clean(str).split("\n")) {
      const words = para.split(" "); let line = "";
      const flush = () => { this.ensure(size + gap); this.page.drawText(line, { x: this.margin + indent, y: this.y - size, size, font, color }); this.y -= size + gap; line = ""; };
      for (const w of words) {
        const cand = line ? `${line} ${w}` : w;
        if (font.widthOfTextAtSize(cand, size) > maxW && line) flush(); else { line = cand; continue; }
        line = w;
      }
      if (line || !para) flush();
    }
  }
  heading(str) { this.y -= 6; this.text(str, { size: 13, bold: true, gap: 6, color: rgb(0.12, 0.42, 0.32) }); }
  rule() { this.ensure(8); this.page.drawLine({ start: { x: this.margin, y: this.y }, end: { x: this.width - this.margin, y: this.y }, thickness: 0.5, color: rgb(0.7, 0.75, 0.7) }); this.y -= 8; }
  table(rows, widths) {
    const size = 9, lh = size + 3, pad = 4;
    const wrapCell = (text, w) => {
      const font = this.f.regular, maxW = w - pad * 2, out = [];
      for (const para of clean(text).split("\n")) {
        let line = "";
        for (const word of para.split(" ")) {
          const cand = line ? `${line} ${word}` : word;
          if (font.widthOfTextAtSize(cand, size) <= maxW) { line = cand; continue; }
          if (line) out.push(line);
          // kata terlalu panjang: pecah paksa
          let w2 = word; while (font.widthOfTextAtSize(w2, size) > maxW && w2.length > 1) { let cut = w2.length - 1; while (cut > 1 && font.widthOfTextAtSize(w2.slice(0, cut), size) > maxW) cut--; out.push(w2.slice(0, cut)); w2 = w2.slice(cut); }
          line = w2;
        }
        out.push(line);
      }
      return out.length ? out : [""];
    };
    for (const [i, row] of rows.entries()) {
      const cells = row.map((c, j) => wrapCell(c, widths[j]));
      const h = Math.max(...cells.map((c) => c.length)) * lh + pad;
      this.ensure(h);
      let x = this.margin;
      cells.forEach((lines, j) => {
        lines.forEach((ln, k) => this.page.drawText(ln, { x: x + pad, y: this.y - size - k * lh, size, font: i === 0 ? this.f.bold : this.f.regular }));
        x += widths[j];
      });
      this.y -= h;
      this.page.drawLine({ start: { x: this.margin, y: this.y + 2 }, end: { x: this.width - this.margin, y: this.y + 2 }, thickness: 0.3, color: rgb(0.85, 0.87, 0.85) });
    }
  }
}

/**
 * Bangun dossier untuk UMK yang keputusan terakhirnya SELF_DECLARE_SIAP.
 * @returns {{dossier_id, versi, pdf_path, sha256, url_dashboard}}
 */
export async function buildDossier(umk, rules, actor = "agent") {
  const dec = lastDecision(umk.id);
  const products = productsWithIngredients(umk.id);
  const docs = documents(umk.id);
  const kop = q.koperasi.get(umk.koperasi_id)?.nama ?? "Koperasi";
  const versi = q.nextVersi.get(umk.id).v;
  const tanggal = new Date().toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", day: "2-digit", month: "long", year: "numeric" });
  const p0 = products[0] ?? {};
  const allIng = products.flatMap((p) => p.ingredients);
  const sjph = render(TEMPLATE, {
    nama_usaha: umk.nama_usaha, kode: umk.kode, nib: umk.nib ?? "-", skala: umk.skala ?? "-", produk: products.map((p) => p.nama).join(", ") || "-", penyelia: umk.penyelia_halal ?? "-", tanggal,
    jumlah_bahan: allIng.length, jumlah_kritis: allIng.filter((i) => i.kelas === "kritis").length, proses: p0.proses_ringkas ?? "(diisi pendamping)",
    fasilitas: umk.jumlah_fasilitas_produksi ?? 1, outlet: umk.jumlah_outlet ?? 1, peralatan: umk.peralatan ?? "-", terpisah: umk.fasilitas_terpisah_nonhalal ? "terpisah/tidak ada produksi non-halal" : "PERLU DICEK",
    pengawetan: (p0.teknik_pengawetan_count ?? 0) === 0 ? "tidak ada" : `${p0.teknik_pengawetan_count} teknik sederhana`, jenis: p0.jenis ?? "-",
  });

  const doc = await PDFDocument.create();
  doc.setTitle(`Dossier Self-Declare ${umk.kode} v${versi}`); doc.setAuthor("HalalPilot (draf, bukan sertifikat)");
  const fonts = { regular: await doc.embedFont(StandardFonts.Helvetica), bold: await doc.embedFont(StandardFonts.HelveticaBold) };
  const w = new Writer(doc, fonts);

  // 1. Sampul (hash diisi setelah render: pakai placeholder yang dihitung dari konten, lalu diganti — pdf-lib tidak bisa edit; jadi hash dihitung atas PDF final dan dicetak di halaman 1 sebagai "hash konten" dari data)
  const contentHash = createHash("sha256").update(JSON.stringify({ umk: umk.kode, versi, products: products.map((p) => [p.nama, p.ingredients.map((i) => [i.nama_normal, i.kelas, i.supplier_cert?.status])]), dec: dec && [dec.jalur, dec.skor_kesiapan, dec.rules_version], docs: docs.map((d) => [d.kode, d.status]) })).digest("hex");
  w.text("DOSSIER SERTIFIKASI HALAL - PERNYATAAN PELAKU USAHA (SELF-DECLARE)", { size: 15, bold: true, gap: 8 });
  w.heading("1. Identitas Pelaku Usaha dan Ringkasan Dossier");
  w.text(`${kop}`, { size: 11 });
  w.text(`Pelaku usaha: ${umk.nama_usaha} (${umk.kode})    NIB: ${umk.nib ?? "-"}    Skala: ${umk.skala ?? "-"}`);
  w.text(`Versi dossier: ${versi}    Tanggal: ${tanggal}    Rules: ${dec?.rules_version ?? "-"}`);
  w.text(`Hash data (SHA-256): ${contentHash}`, { size: 8 });
  w.text("Dokumen ini disiapkan oleh sistem HalalPilot dan WAJIB diverifikasi Pendamping Proses Produk Halal (P3H) sebelum diunggah ke SiHalal. Ini BUKAN sertifikat halal dan tidak menjamin hasil sertifikasi.", { size: 9, color: rgb(0.65, 0.35, 0.09) });
  w.rule();

  // 2. Pernyataan pelaku usaha
  w.heading("2. Surat Permohonan dan Pernyataan Pelaku Usaha");
  w.text(`Kepada BPJPH: Saya mengajukan permohonan sertifikasi halal skema pernyataan pelaku usaha (self-declare) untuk produk ${products.map((p) => p.nama).join(", ")} atas nama ${umk.nama_usaha} (NIB ${umk.nib ?? "-"}), melalui pendampingan ${kop}.`, { gap: 6 });
  w.text(`Saya, pemilik ${umk.nama_usaha}, menyatakan bahwa seluruh bahan yang digunakan halal, proses produksi dilakukan sesuai kriteria SJPH, fasilitas tidak bersinggungan dengan bahan tidak halal, dan data dalam dossier ini benar. Omzet tahunan (pernyataan mandiri): Rp ${(umk.omzet_tahunan ?? 0).toLocaleString("id-ID")}.`);
  w.text("Tanda tangan pelaku usaha: ____________________    Tanggal: ____________", { gap: 10 });

  // 3. Ikrar
  w.heading("3. Ikrar/Akad Kehalalan Produk");
  w.text(`Dengan ini saya berikrar bahwa produk ${products.map((p) => p.nama).join(", ")} diproduksi dari bahan halal dengan proses yang menjaga kehalalan, dan saya bersedia menerima sanksi apabila pernyataan ini tidak benar (UU 33/2014, PP 42/2024).`);

  // 4. Penyelia halal
  w.heading("4. Penyelia Halal");
  w.text(`Nama: ${umk.penyelia_halal ?? "-"}    Tugas: mengawasi bahan, proses, dan dokumentasi SJPH; menjadi kontak pendamping/BPJPH.`);

  // 5. Daftar bahan
  w.heading("5. Daftar Bahan dan Status");
  const rows = [["Bahan", "Normal", "Kelas", "Rule", "Sertifikat pemasok"]];
  for (const i of allIng) rows.push([i.nama_asli, i.nama_normal ?? "-", i.kelas, i.rule_id ?? "-", i.supplier_cert ? `${i.supplier_cert.status} (${i.supplier_cert.nama_pemasok ?? "-"}${i.supplier_cert.berlaku_sampai ? ", s.d. " + i.supplier_cert.berlaku_sampai : ""})` : (i.kelas === "kritis" ? "BELUM ADA" : "tidak wajib")]);
  w.table(rows, [110, 95, 75, 100, 115]);
  const certs = db.prepare("SELECT nama_pemasok, nomor_sertifikat, berlaku_sampai, status FROM supplier_cert WHERE umk_id = ? ORDER BY id").all(umk.id);
  if (certs.length) { w.text("Sertifikat halal pemasok yang terdaftar (registry simulasi):", { size: 9, bold: true, gap: 3 }); for (const c of certs) w.text(`- ${c.nama_pemasok}: ${c.nomor_sertifikat}, berlaku s.d. ${c.berlaku_sampai ?? "-"}, status ${c.status}`, { size: 9, gap: 2 }); }

  // 6. Alur proses & fasilitas
  w.heading("6. Alur Proses Produksi dan Fasilitas");
  w.text(p0.proses_ringkas ?? "(proses diisi dari keterangan UMK; belum tersedia)");
  w.text(`Lokasi produksi: ${umk.alamat ?? "-"}. Fasilitas: ${umk.jumlah_fasilitas_produksi ?? 1}, outlet: ${umk.jumlah_outlet ?? 1}, peralatan: ${umk.peralatan ?? "-"}.`);

  // 7. Foto produk & label
  w.heading("7. Foto Produk dan Label Komposisi");
  const foto = docs.find((d) => d.kode === "FOTO_PRODUK");
  w.text(foto ? `Foto produk/label: ${foto.status}${foto.catatan ? " - " + foto.catatan : ""}` : "Belum ada dokumen foto.");
  for (const p of products) {
    for (const key of ["foto_label_media_id", "foto_proses_media_id"]) {
      const m = p[key] ? db.prepare("SELECT path FROM media WHERE id = ?").get(p[key]) : null;
      if (m && existsSync(m.path) && /\.(jpe?g|png)$/i.test(m.path)) {
        try {
          const bytes = readFileSync(m.path);
          const img = /\.png$/i.test(m.path) ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
          const scale = Math.min(200 / img.width, 100 / img.height, 1);   // thumbnail; foto asli tersimpan di media/
          w.ensure(img.height * scale + 10);
          w.page.drawImage(img, { x: w.margin, y: w.y - img.height * scale, width: img.width * scale, height: img.height * scale });
          w.y -= img.height * scale + 10;
        } catch { w.text(`(gambar ${key} tidak dapat disematkan)`, { size: 8 }); }
      }
    }
  }

  // 8. Manual SJPH (mengalir setelah foto; pindah halaman hanya jika sisa ruang < 140 pt)
  w.ensure(140);
  w.heading("8. Draf Manual SJPH (5 kriteria)");
  // Gabungkan baris berurutan menjadi satu paragraf; judul (#) dan baris kosong memisahkan paragraf
  const paras = []; let buf = [];
  const flushPara = () => { if (buf.length) { paras.push({ t: buf.join(" ") }); buf = []; } };
  for (const line of sjph.split("\n")) {
    if (line.startsWith("#")) { flushPara(); paras.push({ h: line.startsWith("## ") ? 2 : 1, t: line.replace(/^#+\s*/, "") }); }
    else if (!line.trim()) flushPara();
    else buf.push(line.trim());
  }
  flushPara();
  for (const p of paras) {
    if (p.h === 1) w.text(p.t, { bold: true, size: 12, gap: 6 });
    else if (p.h === 2) { w.y -= 4; w.text(p.t, { bold: true, size: 11, gap: 5 }); }
    else w.text(p.t, { gap: 6 });
  }

  // 9. Ringkasan keputusan
  w.ensure(100);
  w.heading("9. Ringkasan Keputusan Sistem");
  w.text(`Jalur: ${dec?.jalur ?? "-"}    Skor kesiapan: ${dec?.skor_kesiapan ?? "-"}    Versi aturan: ${dec?.rules_version ?? "-"}`);
  w.text((dec?.alasan ?? []).map((a) => `${a.rule_id}: ${a.hasil}${a.pesan_umk ? " - " + a.pesan_umk : ""}`).join("\n"), { size: 8 });

  // 10. Catatan (judul + isi dijaga dalam satu halaman)
  w.ensure(70);
  w.heading("10. Catatan");
  w.text("Disiapkan oleh sistem HalalPilot atas data yang dikonfirmasi pelaku usaha. Diverifikasi oleh pendamping (P3H). Bukan sertifikat halal. Keputusan sertifikasi sepenuhnya kewenangan BPJPH.", { size: 9 });

  const bytes = await doc.save();
  const sha = createHash("sha256").update(bytes).digest("hex");
  const dir = join(config.pdfDir, umk.kode);
  mkdirSync(dir, { recursive: true });
  const pdfPath = join(dir, `dossier-v${versi}.pdf`);
  const sjphPath = join(dir, `manual-sjph-v${versi}.md`);
  writeFileSync(pdfPath, bytes); writeFileSync(sjphPath, sjph, "utf8");

  return tx(() => {
    const r = q.ins.run(umk.id, versi, pdfPath, sha, sjphPath);
    for (const k of ["PERMOHONAN", "DAFTAR_BAHAN", "PROSES", "MANUAL_SJPH", "PERNYATAAN_HALAL", "IKRAR"]) q.docGen.run(umk.id, k);
    q.setUmk.run(umk.id);
    audit({ umkId: umk.id, actor, aksi: "DOSSIER_BUILT", detail: { dossier_id: r.lastInsertRowid, versi, sha256: sha, content_hash: contentHash, halaman: doc.getPageCount() } });
    return { dossier_id: r.lastInsertRowid, versi, pdf_path: pdfPath, sha256: sha, content_hash: contentHash, halaman: doc.getPageCount(), url_dashboard: `/dashboard/#/umk/${umk.id}` };
  });
}
