import { Router } from "express";
import { db } from "../db.js";
import { hooksState } from "../scheduler/hooks-client.js";

const r = Router();
r.get("/", (req, res) => {
  const due = db.prepare("SELECT COUNT(*) n FROM chase_task WHERE status='terjadwal' AND due_at <= datetime('now')").get().n;
  const lastSweep = db.prepare("SELECT MAX(created_at) t FROM event_log WHERE aksi='SWEEP'").get().t;
  res.json({ ok: true, rules_version: req.app.locals.rules.version, chase_due: due, last_sweep: lastSweep, hooks_last_ok: hooksState.last_ok_at, hooks_last_error: hooksState.last_error, hooks_last_error_at: hooksState.last_error_at, time: new Date().toISOString() });
});
export default r;
