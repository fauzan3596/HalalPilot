#!/usr/bin/env bash
# Automations OpenClaw untuk HalalPilot. Jalankan sekali di H1 setelah channel Telegram aktif.
# Sintaks diverifikasi dari docs.openclaw.ai/automation/cron-jobs (2026.8.x). Sesuaikan jika CLI menolak flag.
set -euo pipefail
OC="${OPENCLAW_BIN:-openclaw}"   # di VPS: hpclaw (OpenClaw kita, state terpisah)
# Diverifikasi 10 Sep 2026 (2026.8.2): bentuk cron menerima pesan posisi; bentuk --every menuntut --message eksplisit; tanpa --agent job jatuh ke agent default;
# job --command tanpa --no-deliver melempar keluarannya ke chat terakhir; --exact mematikan penggeseran acak jadwal cron. Hapus job lama: openclaw automations rm <id>.
: "${TG_PENDAMPING:?set TG_PENDAMPING (numeric Telegram id pendamping)}"

# 1) Digest harian 07:00 WIB ke pendamping
"$OC" automations create "0 7 * * *" \
  "[DIGEST] Buat ringkasan portofolio hari ini untuk pendamping: panggil skill halalpilot portfolio_summary koperasi 1, lalu laporkan total UMK, siap unggah, menunggu dokumen, belum mulai, hari tersisa ke 17 Oktober, 5 UMK paling mendesak, dan eskalasi terbuka. Maksimal 12 baris." \
  --name "HalalPilot digest pagi" \
  --exact \
  --agent halalpilot \
  --tz "Asia/Jakarta" \
  --session isolated \
  --announce --channel telegram --to "${TG_PENDAMPING}"

# 2) Sapuan pengejaran 09:00 dan 15:00 WIB — memicu scheduler Express (pengiriman aktual lewat /hooks/agent per target)
"$OC" automations create "0 9,15 * * *" \
  --name "HalalPilot chase sweep" \
  --agent halalpilot \
  --tz "Asia/Jakarta" \
  --command "curl -s -X POST -H 'Authorization: Bearer ${HALALPILOT_API_TOKEN}' http://127.0.0.1:3000/api/v1/chase/sweep" \
  --session isolated \
  --no-deliver \
  --exact

# 3) Kuota SEHATI (mock) tiap 6 jam — hanya lapor jika sisa kuota provinsi < 10%
"$OC" automations create --every 6h \
  --message "[QUOTA] Panggil skill halalpilot quota. Jika ada provinsi dengan sisa kuota di bawah 10 persen, beri tahu pendamping satu kalimat. Jika tidak, jangan kirim apa pun." \
  --name "HalalPilot kuota SEHATI" \
  --agent halalpilot \
  --session isolated \
  --announce --channel telegram --to "${TG_PENDAMPING}"

"$OC" automations list
