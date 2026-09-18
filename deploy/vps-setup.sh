#!/usr/bin/env bash
# Penyiapan VPS Ubuntu 24.04 untuk HalalPilot (AI HackFest 2026, Batch 2: 6–10 Sep). Idempoten; bisa dijalankan ulang per fase.
#   sudo bash deploy/vps-setup.sh            # semua fase
#   sudo bash deploy/vps-setup.sh sistem     # satu fase: sistem | node | openclaw | api | config | automations | verifikasi
# Prasyarat: repo ada di /opt/halalpilot (lihat deploy/deploy.sh) dan /opt/halalpilot/.env sudah diisi (salin dari .env.vps.example).
set -euo pipefail
OPENCLAW_VERSION="2026.8.2"
REPO=/opt/halalpilot
# Hidup berdampingan dengan OpenClaw prainstal panitia (2026.7.1-2 di /usr/bin, config /root/.openclaw, port 18789,
# dihidupkan ulang oleh sistem mereka lewat SSH/opsbridge-agent): milik mereka TIDAK disentuh. Milik kita terpisah:
OC_PREFIX=/opt/openclaw-halalpilot            # binari 2026.8.2 → $OC_PREFIX/bin/openclaw
OC_STATE=/root/.openclaw-halalpilot            # config + state + .env kita
OC_BIN=/usr/local/bin/hpclaw                   # wrapper: set OPENCLAW_STATE_DIR/OPENCLAW_CONFIG_PATH lalu exec binari kita
GATEWAY_PORT="${GATEWAY_PORT:-18790}"
ENVFILE=$REPO/.env
PHASE="${1:-semua}"
log() { printf '\n\033[1;32m== %s\033[0m\n' "$*"; }
need_root() { [ "$(id -u)" = 0 ] || { echo "jalankan dengan sudo"; exit 1; }; }
need_root
[ -f "$ENVFILE" ] || { echo "Tidak ada $ENVFILE. Salin .env.vps.example → .env dan isi token."; exit 1; }
set -a; # shellcheck disable=SC1090
source "$ENVFILE"; set +a
run() { case "$PHASE" in semua|"$1") return 0;; *) return 1;; esac; }

# ---------------------------------------------------------------- 1. sistem
if run sistem; then
  log "1/7 Sistem: paket, swap 2 GB, UFW (hanya port SSH), zona waktu"
  apt-get update -qq
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq curl git sqlite3 gettext-base ufw ca-certificates build-essential python3 htop jq >/dev/null
  if ! swapon --show | grep -q /swapfile; then
    fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile >/dev/null && swapon /swapfile
    grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  fi
  sysctl -w vm.swappiness=10 >/dev/null; grep -q vm.swappiness /etc/sysctl.conf || echo 'vm.swappiness=10' >> /etc/sysctl.conf
  # Port SSH dideteksi dari sshd (VPS lomba memakai 4422, bukan 22) — salah port = terkunci dari VPS
  SSH_PORTS="$( { sshd -T 2>/dev/null | awk '/^port /{print $2}'; grep -iE '^\s*Port\s+[0-9]+' /etc/ssh/sshd_config /etc/ssh/sshd_config.d/*.conf 2>/dev/null | awk '{print $NF}'; } | sort -u | tr '\n' ' ')"
  [ -n "${SSH_PORTS// /}" ] || SSH_PORTS="22"
  echo "port SSH terdeteksi: $SSH_PORTS (dibuka di UFW bersama 22 sebagai cadangan)"
  ufw --force reset >/dev/null; ufw default deny incoming >/dev/null; ufw default allow outgoing >/dev/null; ufw allow 22/tcp >/dev/null; for sp in $SSH_PORTS; do ufw allow ${sp}/tcp >/dev/null; done; ufw --force enable >/dev/null
  timedatectl set-timezone Asia/Jakarta
  id -u halalpilot >/dev/null 2>&1 || useradd -r -m -d /var/lib/halalpilot -s /usr/sbin/nologin halalpilot
  mkdir -p /var/lib/halalpilot/pdf /etc/halalpilot && chown -R halalpilot:halalpilot /var/lib/halalpilot
  # folder bersama media inbound: ditulis root (skill di gateway), dibaca API (user halalpilot, ProtectHome=true tidak bisa baca /root)
  mkdir -p /var/lib/halalpilot/inbound && chown root:halalpilot /var/lib/halalpilot/inbound && chmod 755 /var/lib/halalpilot/inbound
  free -m | head -2; swapon --show; ufw status | head -5
fi

# ---------------------------------------------------------------- 2. node
if run node; then
  log "2/7 Node 22 sistem (NodeSource) → /usr/bin/node untuk systemd"
  if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 22 ]; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - >/dev/null
    apt-get install -y -qq nodejs >/dev/null
  fi
  node --version; npm --version
fi

# ---------------------------------------------------------------- 3. openclaw
if run openclaw; then
  log "3/7 OpenClaw ${OPENCLAW_VERSION} terpisah di $OC_PREFIX (prainstal panitia dibiarkan)"
  GW_PID="$(pgrep -f 'openclaw/dist/index.js gateway' | head -1 || true)"
  if [ -n "$GW_PID" ]; then
    echo "gateway prainstal panitia berjalan (pid $GW_PID, $(ps -o etimes= -p "$GW_PID" | tr -d ' ') s) — dibiarkan; kita pakai port $GATEWAY_PORT & state $OC_STATE"
  fi
  CUR="$($OC_PREFIX/bin/openclaw --version 2>/dev/null | grep -oE '[0-9]{4}\.[0-9]+\.[0-9]+' | head -1 || true)"
  if [ "$CUR" != "$OPENCLAW_VERSION" ]; then
    mkdir -p "$OC_PREFIX"
    npm install -g --prefix "$OC_PREFIX" "openclaw@${OPENCLAW_VERSION}" --allow-scripts=openclaw >/dev/null
  fi
  # salinan nyasar dari percobaan sebelumnya (npm prefix root = /root/.npm-global)
  [ -d /root/.npm-global/lib/node_modules/openclaw ] && rm -rf /root/.npm-global/lib/node_modules/openclaw /root/.npm-global/bin/openclaw
  mkdir -p "$OC_STATE"; chmod 700 "$OC_STATE"
  cat > "$OC_BIN" <<EOF
#!/usr/bin/env bash
# hpclaw = OpenClaw ${OPENCLAW_VERSION} milik HalalPilot, state terpisah dari /root/.openclaw (prainstal panitia)
export OPENCLAW_STATE_DIR="$OC_STATE" OPENCLAW_CONFIG_PATH="$OC_STATE/openclaw.json"
exec "$OC_PREFIX/bin/openclaw" "\$@"
EOF
  chmod 755 "$OC_BIN"
  NEWV="$($OC_BIN --version 2>/dev/null | grep -oE '[0-9]{4}\.[0-9]+\.[0-9]+' | head -1 || true)"
  echo "hpclaw → $($OC_BIN --version | head -1)   | prainstal: $(/usr/bin/openclaw --version 2>/dev/null | head -1)"
  [ "$NEWV" = "$OPENCLAW_VERSION" ] || { echo "GAGAL: hpclaw versi '$NEWV', bukan $OPENCLAW_VERSION. Cek: ls $OC_PREFIX/bin; npm ls -g --prefix $OC_PREFIX openclaw"; exit 1; }
fi

# ---------------------------------------------------------------- 4. api (orchestrator)
if run api; then
  log "4/7 Orchestrator: dependensi, env, migrasi, seed, systemd"
  cd "$REPO"
  npm ci --omit=dev >/dev/null
  # /etc/halalpilot/env = variabel sisi API saja (tanpa token bot/gateway)
  {
    echo "TZ=Asia/Jakarta"; echo "PORT=${PORT:-3000}"; echo "BIND=127.0.0.1"
    echo "DATA_DIR=/var/lib/halalpilot"; echo "PDF_DIR=/var/lib/halalpilot/pdf"; echo "RULES_DIR=$REPO/rules"
    echo "HALALPILOT_API_TOKEN=${HALALPILOT_API_TOKEN}"
    echo "OPENCLAW_HOOKS_URL=${OPENCLAW_HOOKS_URL:-http://127.0.0.1:${GATEWAY_PORT}/hooks/agent}"; echo "HOOKS_TOKEN=${HOOKS_TOKEN}"; echo "OPENCLAW_AGENT_ID=${OPENCLAW_AGENT_ID:-halalpilot}"
    echo "OPENROUTER_API_KEY=${OPENROUTER_API_KEY:-}"; echo "VISION_MODEL=${VISION_MODEL:-google/gemini-2.5-flash-lite}"
    echo "TG_PENDAMPING=${TG_PENDAMPING}"; echo "TG_UMK_1=${TG_UMK_1}"; echo "TG_UMK_2=${TG_UMK_2:-}"; echo "TG_UMK_3=${TG_UMK_3:-}"; echo "TG_PEMASOK=${TG_PEMASOK:-}"
    echo "ENABLE_INTERNAL_CRON=${ENABLE_INTERNAL_CRON:-0}"; echo "HOOKS_RETRY_BASE_MS=2000"
    echo "DEMO_ROLE_BADGE=${DEMO_ROLE_BADGE:-1}"
    echo "COST_ALARM_USD_PER_DAY=${COST_ALARM_USD_PER_DAY:-2}"; echo "MEM_ALARM_AVAILABLE_MB=${MEM_ALARM_AVAILABLE_MB:-500}"
  } > /etc/halalpilot/env
  chmod 600 /etc/halalpilot/env; chown root:halalpilot /etc/halalpilot/env; chmod 640 /etc/halalpilot/env
  chown -R halalpilot:halalpilot "$REPO"
  sudo -u halalpilot env $(grep -v '^#' /etc/halalpilot/env | xargs) node db/migrate.mjs
  if [ "$(sudo -u halalpilot env $(grep -v '^#' /etc/halalpilot/env | xargs) node -e "const D=require('better-sqlite3');console.log(new D('/var/lib/halalpilot/halalpilot.db').prepare('select count(*) n from umk').get().n)")" = "0" ]; then
    sudo -u halalpilot env $(grep -v '^#' /etc/halalpilot/env | xargs) node seed/demo.mjs | head -1
  else
    echo "DB sudah berisi data; seed dilewati (gunakan: npm run seed:demo -- --keep-actors bila perlu reset)"
  fi
  cp deploy/halalpilot-api.service /etc/systemd/system/halalpilot-api.service
  install -m 755 deploy/hpdemo.sh /usr/local/bin/hpdemo   # pembantu operator demo (reset/role/eval/sweep/digest)
  systemctl daemon-reload; systemctl enable --now halalpilot-api >/dev/null; sleep 2
  systemctl is-active halalpilot-api && curl -s http://127.0.0.1:${PORT:-3000}/api/v1/health | jq -c .
fi

# ---------------------------------------------------------------- 5. config openclaw
if run config; then
  log "5/7 Konfigurasi OpenClaw kita ($OC_STATE, port $GATEWAY_PORT, unit halalpilot-gateway)"
  export OPENCLAW_WORKSPACE="${OPENCLAW_WORKSPACE:-/root/halalpilot-workspace}" GATEWAY_PORT
  export TG_UMK_2="${TG_UMK_2:-$TG_UMK_1}" TG_UMK_3="${TG_UMK_3:-$TG_UMK_1}" TG_PEMASOK="${TG_PEMASOK:-$TG_UMK_1}"
  export DEFAULT_MODEL="${DEFAULT_MODEL:-openrouter/deepseek/deepseek-v3.2}" IMAGE_MODEL="${IMAGE_MODEL:-openrouter/google/gemini-2.5-flash-lite}"
  : "${TELEGRAM_BOT_TOKEN:?TELEGRAM_BOT_TOKEN kosong}"; : "${GATEWAY_TOKEN:?GATEWAY_TOKEN kosong}"
  mkdir -p "$OPENCLAW_WORKSPACE/skills" "$OC_STATE"
  cp -r "$REPO/openclaw/workspace/." "$OPENCLAW_WORKSPACE/"
  rm -rf "$OPENCLAW_WORKSPACE/skills/halalpilot"; cp -r "$REPO/openclaw/skills/halalpilot" "$OPENCLAW_WORKSPACE/skills/halalpilot"
  chmod +x "$OPENCLAW_WORKSPACE/skills/halalpilot/scripts/api.mjs"
  cat > "$OC_STATE/.env" <<EOF
OPENROUTER_API_KEY=${OPENROUTER_API_KEY:-}
TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
HALALPILOT_API_URL=http://127.0.0.1:${PORT:-3000}/api/v1
HALALPILOT_API_TOKEN=${HALALPILOT_API_TOKEN}
${DEFAULT_MODEL_API_KEY_LINE:-}
EOF
  chmod 600 "$OC_STATE/.env"
  [ -f "$OC_STATE/openclaw.json" ] && cp "$OC_STATE/openclaw.json" "$OC_STATE/openclaw.json.bak.$(date +%s)"
  envsubst < "$REPO/openclaw/openclaw.json5" > "$OC_STATE/openclaw.json"
  chmod 600 "$OC_STATE/openclaw.json"
  # verifikasi env OPENCLAW_STATE_DIR/OPENCLAW_CONFIG_PATH dihormati: port yang dibaca CLI harus port kita
  PORT_READ="$($OC_BIN config get gateway.port 2>/dev/null | grep -oE '[0-9]+' | head -1 || true)"
  if [ "$PORT_READ" != "$GATEWAY_PORT" ]; then
    echo "GAGAL: hpclaw membaca gateway.port='$PORT_READ' (harap $GATEWAY_PORT) → OPENCLAW_CONFIG_PATH tidak dihormati versi ini."
    echo "  Alternatif: jalankan dengan --config? Cek: $OC_BIN gateway run --help | grep -i config; catat di docs/h1-evidence."; exit 1
  fi
  $OC_BIN plugins enable telegram >/dev/null 2>&1 || true
  sed -e "s#__OC_PREFIX__#$OC_PREFIX#g" -e "s#__OC_STATE__#$OC_STATE#g" "$REPO/deploy/halalpilot-gateway.service" > /etc/systemd/system/halalpilot-gateway.service
  systemctl daemon-reload; systemctl enable --now halalpilot-gateway >/dev/null; sleep 6
  systemctl is-active halalpilot-gateway || { echo "gateway kita tidak aktif; log:"; journalctl -u halalpilot-gateway -n 40 --no-pager; exit 1; }
  echo "port yang mendengarkan (harus ada 127.0.0.1:$GATEWAY_PORT milik kita; 18789 milik panitia):"; ss -tlnp | grep -E ":(18789|$GATEWAY_PORT) " || true
  journalctl -u halalpilot-gateway -n 25 --no-pager | grep -E "plugins:|heartbeat|ready|telegram|error|warn" | cut -c1-160 || true
  $OC_BIN gateway status 2>/dev/null | grep -E "Runtime|Connectivity|Config" || true
  $OC_BIN channels status 2>/dev/null | grep -iE "telegram" || echo "PERINGATAN: channel telegram belum terlihat; cek: journalctl -u halalpilot-gateway -f"
fi

# ---------------------------------------------------------------- 6. automations
if run automations; then
  log "6/7 Automations OpenClaw (digest 07:00, sweep 09/15, kuota 6h)"
  export TG_PENDAMPING HALALPILOT_API_TOKEN
  if $OC_BIN automations list 2>/dev/null | grep -q "HalalPilot digest pagi"; then echo "automations sudah ada"; else OPENCLAW_BIN=$OC_BIN bash "$REPO/openclaw/automations.sh"; fi
fi

# ---------------------------------------------------------------- 7. verifikasi
if run verifikasi; then
  log "7/7 Verifikasi cepat (bukti lengkap: bash deploy/evidence.sh)"
  echo "- port publik:"; ss -tlnp | awk 'NR==1 || /0.0.0.0|\[::\]/'
  echo "- RAM:"; free -m | head -2
  echo "- API:"; curl -s http://127.0.0.1:${PORT:-3000}/api/v1/health | jq -c .
  echo "- OpenClaw kita (hpclaw):"; $OC_BIN gateway status | grep -E "Runtime|Connectivity" || true; systemctl is-active halalpilot-gateway
  echo
  echo "Berikutnya (pakai 'hpclaw', bukan 'openclaw'): kirim 'halo' ke bot dari akun ${TG_PENDAMPING}; jalankan checklist V1–V7 (deploy/H1-checklist.md); simpan bukti: bash deploy/evidence.sh"
fi
