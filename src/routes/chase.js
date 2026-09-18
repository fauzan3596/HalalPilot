import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { audit } from "../audit.js";
import { parse, wrap, notFound, parseActor, authorizeUmk, badRequest, normKode } from "../http.js";
import { getUmkOr404 } from "../services/umk-service.js";
import { createChaseTasks } from "../scheduler/chase.js";
import { runSweep } from "../scheduler/sweep.js";

const r = Router();
const q = {
  kurang: db.prepare("SELECT kode FROM document_req WHERE umk_id = ? AND status IN ('kurang','ditolak')"),
  task: db.prepare("SELECT * FROM chase_task WHERE id = ?"),
  confirm: db.prepare("UPDATE chase_task SET status = 'terkirim', sent_at = COALESCE(sent_at, datetime('now')) WHERE id = ? AND status IN ('terjadwal','terkirim')"),
  due: db.prepare(`SELECT ct.id, ct.umk_id, u.kode, ct.document_kode, ct.tahap, ct.due_at, a.role AS target_role FROM chase_task ct JOIN umk u ON u.id = ct.umk_id JOIN actor a ON a.id = ct.target_actor_id
    WHERE ct.status = 'terjadwal' AND ct.due_at <= datetime('now') ORDER BY ct.due_at`),
  tasks: db.prepare("SELECT id, document_kode, tahap, due_at, status, sent_at FROM chase_task WHERE umk_id = ? ORDER BY document_kode, tahap"),
};

// POST /umk/:id/chase/request
r.post("/umk/:id/chase/request", wrap((req, res) => {
  const u = getUmkOr404(req.params.id);
  authorizeUmk(parseActor(req.actor), u);
  const b = parse(z.object({ dokumen: z.array(z.string().min(1)).max(30).optional() }), req.body ?? {});
  const kode = b.dokumen?.length ? b.dokumen.map(normKode) : q.kurang.all(u.id).map((x) => x.kode);
  if (!kode.length) return res.status(201).json({ tasks_created: 0, pesan: "tidak ada dokumen kurang" });
  const n = createChaseTasks(u.id, kode, req.app.locals.rules);
  audit({ umkId: u.id, actor: req.actor, aksi: "CHASE_REQUEST", detail: { dokumen: kode, tasks_created: n } });
  res.status(201).json({ tasks_created: n, dokumen: kode, tasks: q.tasks.all(u.id) });
}));

// POST /chase/:task_id/sent  (agent mengonfirmasi pengingat terkirim)
r.post("/chase/:task_id/sent", wrap((req, res) => {
  const t = q.task.get(Number(req.params.task_id));
  if (!t) throw notFound("chase_task");
  if (t.status === "dibatalkan") throw badRequest("task sudah dibatalkan");
  q.confirm.run(t.id);
  audit({ umkId: t.umk_id, actor: req.actor, aksi: "CHASE_CONFIRMED", detail: { task_id: t.id, tahap: t.tahap, dokumen: t.document_kode } });
  res.json({ id: t.id, status: "terkirim" });
}));

// GET /chase/due
r.get("/chase/due", wrap((req, res) => res.json({ due: q.due.all(), now: new Date().toISOString() })));

// POST /chase/sweep  (dipicu automation OpenClaw / cron / manual)
r.post("/chase/sweep", wrap(async (req, res) => {
  const now = req.body?.now ? new Date(req.body.now) : new Date();      // `now` hanya untuk uji/simulasi waktu
  if (Number.isNaN(now.getTime())) throw badRequest("now tidak valid");
  const result = await runSweep({ now, rules: req.app.locals.rules });
  res.json(result);
}));

export default r;
