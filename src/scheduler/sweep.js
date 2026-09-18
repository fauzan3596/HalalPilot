// Sapuan pengejaran (SPECS §7.7): pilih task jatuh tempo → batalkan yang tak relevan → jam tenang → gabung per target → batas harian → kirim via hooks.
import { db, tx } from "../db.js";
import { audit } from "../audit.js";
import { postToAgent } from "./hooks-client.js";
import { hariTersisa as hitungHari } from "../services/umk-service.js";

const q = {
  due: db.prepare(`SELECT ct.*, u.kode AS umk_kode, u.nama_usaha, u.status AS umk_status, a.telegram_id AS target_tg, a.role AS target_role, a.display_name AS target_nama,
      dr.status AS doc_status
    FROM chase_task ct JOIN umk u ON u.id = ct.umk_id JOIN actor a ON a.id = ct.target_actor_id
    LEFT JOIN document_req dr ON dr.umk_id = ct.umk_id AND dr.kode = ct.document_kode
    WHERE ct.status = 'terjadwal' AND ct.due_at <= ? ORDER BY ct.tahap, ct.due_at`),
  cancel: db.prepare("UPDATE chase_task SET status = 'dibatalkan' WHERE id = ?"),
  postpone: db.prepare("UPDATE chase_task SET due_at = ? WHERE id = ?"),
  sent: db.prepare("UPDATE chase_task SET status = 'terkirim', sent_at = datetime('now') WHERE id = ?"),
  // satu "pesan" = satu tahap yang dikirim ke target pada hari WIB yang sama (pengiriman tergabung per tahap)
  sentToday: db.prepare("SELECT COUNT(DISTINCT tahap) n FROM chase_task WHERE umk_id = ? AND status = 'terkirim' AND target_actor_id = ? AND date(sent_at, '+7 hours') = date(?, '+7 hours')"),
  lastDecision: db.prepare("SELECT jalur, skor_kesiapan FROM decision WHERE umk_id = ? ORDER BY id DESC LIMIT 1"),
  produk: db.prepare("SELECT nama FROM product WHERE umk_id = ? ORDER BY id LIMIT 1"),
  target_date: db.prepare("SELECT target_date FROM koperasi WHERE id = 1"),
};

const FINAL = new Set(["siap_unggah", "diajukan_simulasi", "selesai_simulasi", "dihapus", "ditunda"]);

/** Jam WIB (0–23) dan tanggal WIB dari Date. */
export function wib(now) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(now);
  const h = Number(parts.find((p) => p.type === "hour").value) % 24, m = Number(parts.find((p) => p.type === "minute").value);
  return { hour: h, minute: m };
}
const toSqlite = (d) => d.toISOString().replace("T", " ").slice(0, 19);

/** Jika dalam jam tenang, kembalikan Date tunda (07:05 WIB berikutnya); jika tidak, null. */
export function quietHoursPostpone(now, rules) {
  const jt = rules.chase?.jam_tenang;
  if (!jt) return null;
  const [sh] = String(jt.mulai).split(":").map(Number);
  const [eh, em] = String(jt.selesai).split(":").map(Number);
  const { hour } = wib(now);
  const inQuiet = sh > eh ? (hour >= sh || hour < eh) : (hour >= sh && hour < eh);
  if (!inQuiet) return null;
  // Tunda ke selesai+5 menit WIB pada hari yang tepat
  const d = new Date(now);
  const wibNow = new Date(now.getTime() + 7 * 3600e3);
  const target = new Date(Date.UTC(wibNow.getUTCFullYear(), wibNow.getUTCMonth(), wibNow.getUTCDate(), eh, em + 5) - 7 * 3600e3);
  if (target <= d) target.setUTCDate(target.getUTCDate() + 1);
  return target;
}

const render = (tpl, vars) => String(tpl ?? "").replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, k) => k.split(".").reduce((o, kk) => o?.[kk], vars) ?? `{{${k}}}`);

/**
 * @param {{now?: Date, rules: object, send?: Function}} opts  send dapat diganti (tes)
 */
// Kode dokumen → bahasa UMK (dipakai di konteks pengingat; kode mentah tetap dicatat di audit/groups)
const LABEL_DOKUMEN = { NIB: "NIB", PENYELIA: "nama penyelia halal", FOTO_PRODUK: "foto produk/label yang jelas", PROSES: "cerita singkat proses produksi",
  DAFTAR_BAHAN: "konfirmasi daftar bahan", KONFIRMASI_BAHAN: "konfirmasi daftar bahan", PERBAIKAN_OSS: "perbaikan data usaha di OSS (KBLI/alamat agar sesuai)",
  PEMBAGIAN_PENGAJUAN: "pembagian daftar produk (maks 10 per pengajuan)", MANUAL_SJPH: "Manual SJPH", PERMOHONAN: "surat permohonan", PERNYATAAN_HALAL: "pernyataan halal", IKRAR: "ikrar" };
export const labelDokumen = (kode) => LABEL_DOKUMEN[kode] ?? (kode.startsWith("SERT_PEMASOK:") ? `sertifikat halal pemasok untuk ${kode.slice(13).replace(/_/g, " ")}` : kode);

export async function runSweep({ now = new Date(), rules, send = postToAgent }) {
  const tahapan = Object.fromEntries((rules.chase?.tahapan ?? []).map((t) => [t.tahap, t]));
  const maksHarian = rules.chase?.batas?.maks_pesan_per_umk_per_hari ?? 2;
  const hariTersisa = hitungHari(q.target_date.get()?.target_date ?? "2026-10-17", now.getTime());
  const result = { dispatched: 0, skipped_quiet_hours: 0, skipped_daily_cap: 0, cancelled: 0, failed: 0, groups: [] };

  const due = q.due.all(toSqlite(now));
  // 1) Batalkan yang tidak relevan lagi
  const aktif = [];
  for (const t of due) {
    if (["diterima", "dihasilkan"].includes(t.doc_status) || FINAL.has(t.umk_status)) { q.cancel.run(t.id); result.cancelled++; continue; }
    aktif.push(t);
  }
  // 2) Jam tenang → tunda semua
  const tunda = quietHoursPostpone(now, rules);
  if (tunda && aktif.length) {
    for (const t of aktif) q.postpone.run(toSqlite(tunda), t.id);
    result.skipped_quiet_hours = aktif.length;
    audit({ actor: "scheduler", aksi: "SWEEP", detail: { ...result, postponed_to: toSqlite(tunda) } });
    return result;
  }
  // 3) Gabung per (umk, target)
  const groups = new Map();
  for (const t of aktif) {
    const key = `${t.umk_id}:${t.target_actor_id}`;
    if (!groups.has(key)) groups.set(key, { umk_id: t.umk_id, target_actor_id: t.target_actor_id, target_tg: t.target_tg, target_role: t.target_role, target_nama: t.target_nama, umk_kode: t.umk_kode, nama_usaha: t.nama_usaha, tasks: [] });
    groups.get(key).tasks.push(t);
  }
  // 4) Kirim
  for (const g of groups.values()) {
    if (q.sentToday.get(g.umk_id, g.target_actor_id, toSqlite(now)).n >= maksHarian) { result.skipped_daily_cap += g.tasks.length; continue; }
    const tahap = Math.max(...g.tasks.map((t) => t.tahap));
    const cfg = tahapan[tahap] ?? tahapan[1];
    const dec = q.lastDecision.get(g.umk_id);
    const vars = { umk: { nama_usaha: g.nama_usaha, kode: g.umk_kode }, produk: q.produk.get(g.umk_id)?.nama ?? "produk Anda", dokumen: g.tasks.map((t) => labelDokumen(t.document_kode)).join(", "), hari_tersisa: hariTersisa, skor: dec?.skor_kesiapan ?? "-" };
    const template = render(cfg?.template, vars);
    const key = `chase:${g.umk_id}:${tahap}:${g.tasks.map((t) => t.id).sort((a, b) => a - b).join("+")}`;   // unik per siklus (id task)
    const message = `[CHASE] Tulis pengingat tahap ${tahap} untuk ${g.target_role} ${g.target_nama} (pengantaran otomatis; status task sudah dicatat sistem).\nKonteks: ${JSON.stringify({ umk: vars.umk, produk: vars.produk, dokumen: g.tasks.map((t) => t.document_kode), hari_tersisa: hariTersisa, skor: vars.skor, nada: cfg?.nada, task_ids: g.tasks.map((t) => t.id) })}\nTemplate (sesuaikan bahasanya, jangan menambah janji apa pun):\n${template}`;
    const r = await send({ message, to: g.target_tg, idempotencyKey: key });
    if (r.ok) {
      tx(() => { for (const t of g.tasks) q.sent.run(t.id); });
      result.dispatched++;
      result.groups.push({ umk: g.umk_kode, target: g.target_role, tahap, dokumen: g.tasks.map((t) => t.document_kode) });
      audit({ umkId: g.umk_id, actor: "scheduler", aksi: tahap >= 4 ? "ESKALASI_SENT" : "CHASE_SENT", detail: { tahap, dokumen: g.tasks.map((t) => t.document_kode), target: g.target_role, idempotency_key: key, run_id: r.runId ?? null } });
    } else {
      result.failed += g.tasks.length;
      audit({ umkId: g.umk_id, actor: "scheduler", aksi: "HOOK_FAILED", detail: { tahap, dokumen: g.tasks.map((t) => t.document_kode), error: r.error, attempts: r.attempts } });
    }
  }
  audit({ actor: "scheduler", aksi: "SWEEP", detail: { dispatched: result.dispatched, skipped_quiet_hours: result.skipped_quiet_hours, skipped_daily_cap: result.skipped_daily_cap, cancelled: result.cancelled, failed: result.failed } });
  return result;
}
