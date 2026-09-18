import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { parse, wrap } from "../http.js";
import { umkSummary } from "../services/umk-service.js";

const r = Router();
const q = {
  actor: db.prepare("SELECT a.id, a.telegram_id, a.role, a.display_name, a.umk_id FROM actor a WHERE a.telegram_id = ?"),
  umk: db.prepare("SELECT * FROM umk WHERE id = ? AND status <> 'dihapus'"),
  kop: db.prepare("SELECT id, nama FROM koperasi WHERE pendamping_actor_id = ?"),
};

r.get("/whoami", wrap((req, res) => {
  const { telegram_id } = parse(z.object({ telegram_id: z.string().regex(/^\d{3,20}$/, "ID Telegram numerik") }), req.query);
  const a = q.actor.get(telegram_id);
  if (!a) return res.json({ telegram_id, role: "tidak_terdaftar", display_name: null, umk: null, langkah: "Tawarkan pendaftaran: minta nama usaha dan persetujuan pemrosesan data usaha. Jangan minta KTP/HP." });
  const out = { telegram_id, role: a.role, display_name: a.display_name, umk: null, koperasi: null };
  if (a.role === "umk" && a.umk_id) { const u = q.umk.get(a.umk_id); out.umk = u ? umkSummary(u) : null; }
  if (a.role === "pendamping") out.koperasi = q.kop.get(a.id) ?? { id: 1 };
  // Mode demo satu akun: akun yang sama bergilir peran (seed:switch). Beri penanda agar penonton tahu peran saat ini.
  if (process.env.DEMO_ROLE_BADGE === "1") out.badge_peran = a.role === "umk" ? `[UMK · ${a.display_name}]` : a.role === "pendamping" ? "[Pendamping koperasi]" : `[${a.role}]`;
  res.json(out);
}));

export default r;
