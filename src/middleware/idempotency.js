import { db } from "../db.js";

const get = db.prepare("SELECT response_json, status FROM idempotency WHERE key=? AND created_at > datetime('now','-1 day')");
const put = db.prepare("INSERT OR REPLACE INTO idempotency (key, response_json, status) VALUES (?, ?, ?)");

/**
 * Untuk metode mutatif dengan header Idempotency-Key: kunci yang sama mengembalikan respons tersimpan (SYS-04).
 */
export function idempotency(req, res, next) {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return next();
  const key = req.get("idempotency-key");
  if (!key) return next();
  const hit = get.get(key);
  if (hit) {
    res.set("X-Idempotent-Replay", "true");
    return res.status(hit.status).type("json").send(hit.response_json);
  }
  const send = res.json.bind(res);
  res.json = (body) => {
    // Hanya keberhasilan (2xx) yang disimpan: kegagalan (400/409/…) tidak boleh di-replay saat klien memperbaiki keadaan lalu mencoba ulang dengan kunci sama
    if (res.statusCode >= 200 && res.statusCode < 300) put.run(key, JSON.stringify(body), res.statusCode);
    return send(body);
  };
  next();
}
