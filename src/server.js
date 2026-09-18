import { config } from "./config.js";
import { db } from "./db.js";
import { createApp } from "./app.js";
import { startInternalCron } from "./scheduler/cron.js";

const app = createApp();
console.log(`rules_version=${app.locals.rules.version}`);
startInternalCron(app.locals.rules);
app.listen(config.port, config.bind, () => console.log(`HalalPilot API di http://${config.bind}:${config.port}`));

process.on("SIGTERM", () => { db.close(); process.exit(0); });
