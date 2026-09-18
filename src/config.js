// Konfigurasi dari env. Gagal cepat dengan pesan jelas jika variabel wajib kosong (SYS-09-N).
const required = ["HALALPILOT_API_TOKEN", "OPENCLAW_HOOKS_URL", "HOOKS_TOKEN"];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Konfigurasi tidak lengkap. Variabel wajib kosong: ${missing.join(", ")}. Lihat .env.example.`);
  process.exit(2);
}
if (process.env.TZ !== "Asia/Jakarta") console.warn("Peringatan: TZ bukan Asia/Jakarta; jam tenang pengejaran bisa salah.");

export const config = {
  port: Number(process.env.PORT ?? 3000),
  bind: process.env.BIND ?? "127.0.0.1",
  dataDir: process.env.DATA_DIR ?? "./data",
  pdfDir: process.env.PDF_DIR ?? "./data/pdf",
  rulesDir: process.env.RULES_DIR ?? "./rules",
  apiToken: process.env.HALALPILOT_API_TOKEN,
  hooks: {
    url: process.env.OPENCLAW_HOOKS_URL,
    token: process.env.HOOKS_TOKEN,
    agentId: process.env.OPENCLAW_AGENT_ID ?? "halalpilot",
  },
  vision: { apiKey: process.env.OPENROUTER_API_KEY ?? "", model: process.env.VISION_MODEL ?? "google/gemini-2.5-flash-lite" },
  alarms: { costUsdPerDay: Number(process.env.COST_ALARM_USD_PER_DAY ?? 2), memAvailableMb: Number(process.env.MEM_ALARM_AVAILABLE_MB ?? 500) },
};
