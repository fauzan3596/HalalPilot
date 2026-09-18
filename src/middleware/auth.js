import { config } from "../config.js";

/** Bearer sederhana; API hanya bind loopback, token dibagi dengan skill OpenClaw. */
export function auth(req, res, next) {
  const h = req.get("authorization") ?? "";
  if (h !== `Bearer ${config.apiToken}`) return res.status(401).json({ error: "unauthorized", detail: "Bearer tidak valid" });
  req.actor = req.get("x-actor") || "agent";
  next();
}
