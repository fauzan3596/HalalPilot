import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { parse, wrap, notFound } from "../http.js";
import { hooksState } from "../scheduler/hooks-client.js";
import { hariTersisa } from "../services/umk-service.js";

const r = Router();
const q = {
  view: db.prepare("SELECT * FROM v_portfolio WHERE koperasi_id = ?"),   // hari_tersisa dari view TIDAK dipakai (tengah malam UTC); pakai hariTersisa()
  byStatus: db.prepare("SELECT status, COUNT(*) n FROM umk WHERE koperasi_id = ? AND status <> 'dihapus' GROUP BY status"),
  mendesak: db.prepare(`SELECT u.id, u.kode, u.nama_usaha, u.status, d.skor_kesiapan, d.jalur,
      (SELECT COUNT(*) FROM document_req dr WHERE dr.umk_id = u.id AND dr.status IN ('kurang','diminta','ditolak')) AS dokumen_kurang,
      (SELECT MIN(requested_at) FROM document_req dr WHERE dr.umk_id = u.id AND dr.status = 'diminta') AS menunggu_sejak
    FROM umk u LEFT JOIN decision d ON d.id = (SELECT MAX(id) FROM decision WHERE umk_id = u.id)
    WHERE u.koperasi_id = ? AND u.status IN ('menunggu_dokumen','dikembalikan','intake')
    ORDER BY (d.skor_kesiapan IS NULL), d.skor_kesiapan DESC, menunggu_sejak ASC LIMIT 5`),
  eskalasi: db.prepare(`SELECT ct.umk_id, u.kode, u.nama_usaha, ct.document_kode, ct.sent_at
    FROM chase_task ct JOIN umk u ON u.id = ct.umk_id JOIN document_req dr ON dr.umk_id = ct.umk_id AND dr.kode = ct.document_kode
    WHERE u.koperasi_id = ? AND ct.tahap = 4 AND ct.status = 'terkirim' AND dr.status IN ('kurang','diminta','ditolak') AND u.status <> 'ditunda'
    ORDER BY ct.sent_at`),
  hariIni: db.prepare("SELECT aksi, COUNT(*) n FROM event_log WHERE date(created_at, '+7 hours') = date('now', '+7 hours') GROUP BY aksi"),
  // laju 7 hari: UMK yang mencapai siap_unggah/selesai (APPROVE atau SUBMIT_SIMULASI_DITERIMA) dalam 7 hari terakhir
  laju7: db.prepare("SELECT COUNT(DISTINCT umk_id) n FROM event_log WHERE aksi IN ('APPROVE','SUBMIT_SIMULASI_DITERIMA') AND created_at >= datetime('now','-7 days')"),
  antrean: db.prepare(`SELECT ds.id AS dossier_id, ds.versi, ds.created_at, u.id AS umk_id, u.kode, u.nama_usaha, d.skor_kesiapan, d.rules_version
    FROM dossier ds JOIN umk u ON u.id = ds.umk_id LEFT JOIN decision d ON d.id = (SELECT MAX(id) FROM decision WHERE umk_id = u.id)
    WHERE u.koperasi_id = ? AND ds.status = 'menunggu_review' ORDER BY ds.created_at`),
  events: db.prepare("SELECT id, umk_id, actor, aksi, detail_json, created_at FROM event_log WHERE (? IS NULL OR umk_id = ?) AND (? IS NULL OR created_at >= ?) ORDER BY id DESC LIMIT ?"),
};

r.get("/portfolio/:koperasi_id/summary", wrap((req, res) => {
  const kid = Number(req.params.koperasi_id);
  const v = q.view.get(kid);
  if (!v) throw notFound("koperasi");
  const status = Object.fromEntries(q.byStatus.all(kid).map((x) => [x.status, x.n]));
  res.json({
    koperasi: { id: v.koperasi_id, nama: v.nama },
    total_umk: v.total_umk, siap_unggah: v.siap_unggah, menunggu_dokumen: v.menunggu_dokumen, belum_mulai: v.belum_mulai, hari_tersisa: hariTersisa(),
    per_status: status,
    // laju: berapa UMK/hari harus selesai agar seluruh sisa portofolio siap sebelum tenggat, vs realisasi 7 hari terakhir
    laju: (() => { const sisa = v.total_umk - v.siap_unggah; const hari = Math.max(1, hariTersisa()); const aktual7 = q.laju7.get().n; return { sisa_umk: sisa, dibutuhkan_per_hari: Math.round((sisa / hari) * 10) / 10, aktual_7hari_per_hari: Math.round((aktual7 / 7) * 10) / 10, aktual_7hari: aktual7 }; })(),
    antrean_review: q.antrean.all(kid),
    umk_mendesak: q.mendesak.all(kid),
    eskalasi_terbuka: q.eskalasi.all(kid),
    aktivitas_hari_ini: Object.fromEntries(q.hariIni.all().map((x) => [x.aksi, x.n])),
    hooks: hooksState,
    simulasi: "Data OSS/SEHATI/SiHalal adalah tiruan.",
  });
}));

r.get("/events", wrap((req, res) => {
  const p = parse(z.object({ umk_id: z.coerce.number().int().positive().optional(), since: z.string().optional(), limit: z.coerce.number().int().min(1).max(500).default(100) }), req.query);
  const rows = q.events.all(p.umk_id ?? null, p.umk_id ?? null, p.since ?? null, p.since ?? null, p.limit).map((e) => ({ ...e, detail: e.detail_json ? JSON.parse(e.detail_json) : null, detail_json: undefined }));
  res.json({ events: rows });
}));

export default r;
