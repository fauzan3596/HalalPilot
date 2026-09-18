import express from "express";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { config } from "./config.js";
import { auth } from "./middleware/auth.js";
import { idempotency } from "./middleware/idempotency.js";
import { loadRules } from "./rules/loader.js";
import { HttpError } from "./http.js";
import health from "./routes/health.js";
import whoami from "./routes/whoami.js";
import umk from "./routes/umk.js";
import products from "./routes/products.js";
import chase from "./routes/chase.js";
import dossier from "./routes/dossier.js";
import mocks from "./routes/mocks.js";
import portfolio from "./routes/portfolio.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "2mb" }));
  app.locals.rules = loadRules(config.rulesDir);

  app.use("/api/v1/health", health);              // tanpa auth
  app.use("/api/v1", auth, idempotency);
  app.use("/api/v1", whoami);
  app.use("/api/v1", umk);
  app.use("/api/v1", products);
  app.use("/api/v1", chase);
  app.use("/api/v1", dossier);
  app.use("/api/v1", mocks);
  app.use("/api/v1", portfolio);
  app.use("/dashboard", express.static(join(ROOT, "dashboard/dist")));

  app.use((req, res) => res.status(404).json({ error: "not_found", detail: `${req.method} ${req.path}` }));
  app.use((err, req, res, _next) => {                // 4 argumen wajib agar Express mengenali error handler
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.error, detail: err.detail });
    if (err?.type === "entity.parse.failed") return res.status(400).json({ error: "validation", detail: "JSON tidak valid" });
    console.error(err);
    res.status(500).json({ error: "internal", detail: err.message });
  });
  return app;
}
