#!/usr/bin/env bash
# Penyiapan lingkungan pengembangan HalalPilot di WSL2 Ubuntu 24.04 (identik dengan VPS).
# Jalankan dari dalam WSL, di folder repo:  bash deploy/wsl-setup.sh
# Idempoten: aman dijalankan ulang.
set -euo pipefail
OPENCLAW_VERSION="2026.8.2"
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "== 1/6 Paket sistem"
sudo apt-get update -qq
sudo apt-get install -y -qq git curl build-essential python3 sqlite3 gettext-base ca-certificates >/dev/null

echo "== 2/6 Node 22 via nvm"
if [ ! -d "$HOME/.nvm" ]; then
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
fi
# shellcheck disable=SC1090
source "$HOME/.nvm/nvm.sh"
nvm install 22 >/dev/null
nvm alias default 22 >/dev/null
node --version

echo "== 3/6 OpenClaw ${OPENCLAW_VERSION} (dipin; JANGAN update selama lomba)"
if ! command -v openclaw >/dev/null || [ "$(openclaw --version 2>/dev/null | grep -oE '[0-9]{4}\.[0-9]+\.[0-9]+' | head -1)" != "$OPENCLAW_VERSION" ]; then
  npm install -g "openclaw@${OPENCLAW_VERSION}" --allow-scripts=openclaw
fi
openclaw --version

echo "== 4/6 Zona waktu"
sudo timedatectl set-timezone Asia/Jakarta 2>/dev/null || sudo ln -sf /usr/share/zoneinfo/Asia/Jakarta /etc/localtime

echo "== 5/6 Workspace agent + skill"
[ -f "$REPO_DIR/.env" ] || { echo "Tidak ada $REPO_DIR/.env. Salin dari .env.example dan isi dulu."; exit 1; }
set -a; # shellcheck disable=SC1091
source "$REPO_DIR/.env"; set +a
: "${TELEGRAM_BOT_TOKEN:?TELEGRAM_BOT_TOKEN kosong di .env}"
: "${GATEWAY_TOKEN:?GATEWAY_TOKEN kosong}"; : "${HOOKS_TOKEN:?HOOKS_TOKEN kosong}"; : "${HALALPILOT_API_TOKEN:?HALALPILOT_API_TOKEN kosong}"
: "${TG_PENDAMPING:?TG_PENDAMPING kosong}"; : "${TG_UMK_1:?TG_UMK_1 kosong}"
export TG_UMK_2="${TG_UMK_2:-$TG_UMK_1}" TG_UMK_3="${TG_UMK_3:-$TG_UMK_1}" TG_PEMASOK="${TG_PEMASOK:-$TG_UMK_1}"
# Workspace: pakai nilai .env hanya jika bisa dibuat oleh user ini; jika tidak (mis. /home/openclaw milik VPS), pakai $HOME.
if [ -z "${OPENCLAW_WORKSPACE:-}" ] || ! mkdir -p "$OPENCLAW_WORKSPACE" 2>/dev/null; then
  [ -n "${OPENCLAW_WORKSPACE:-}" ] && echo "Peringatan: $OPENCLAW_WORKSPACE tidak bisa dibuat; memakai $HOME/halalpilot-workspace"
  export OPENCLAW_WORKSPACE="$HOME/halalpilot-workspace"
  export GATEWAY_PORT="${GATEWAY_PORT:-18789}"
fi
mkdir -p "$OPENCLAW_WORKSPACE/skills" "$HOME/.openclaw"
cp -r "$REPO_DIR/openclaw/workspace/." "$OPENCLAW_WORKSPACE/"
rm -rf "$OPENCLAW_WORKSPACE/skills/halalpilot"
cp -r "$REPO_DIR/openclaw/skills/halalpilot" "$OPENCLAW_WORKSPACE/skills/halalpilot"
chmod +x "$OPENCLAW_WORKSPACE/skills/halalpilot/scripts/api.mjs"

echo "== 6/6 Konfigurasi OpenClaw"
# Rahasia untuk gateway (dibaca OpenClaw dari ~/.openclaw/.env)
cat > "$HOME/.openclaw/.env" <<EOF
OPENROUTER_API_KEY=${OPENROUTER_API_KEY:-}
TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
HALALPILOT_API_URL=http://127.0.0.1:3000/api/v1
HALALPILOT_API_TOKEN=${HALALPILOT_API_TOKEN}
EOF
chmod 600 "$HOME/.openclaw/.env"

# Config dari template repo; nilai ${VAR} diisi dari .env. Backup config lama bila ada.
[ -f "$HOME/.openclaw/openclaw.json" ] && cp "$HOME/.openclaw/openclaw.json" "$HOME/.openclaw/openclaw.json.bak.$(date +%s)"
envsubst < "$REPO_DIR/openclaw/openclaw.json5" > "$HOME/.openclaw/openclaw.json"
chmod 600 "$HOME/.openclaw/openclaw.json"
chmod 700 "$HOME/.openclaw"

echo
echo "Selesai. Berikutnya:"
echo "  1) openclaw gateway run          # latar depan untuk dev; di VPS: openclaw gateway install && openclaw gateway start"
echo "  2) openclaw gateway status && openclaw channels status"
echo "  3) Kirim 'halo' ke bot dari akun ${TG_PENDAMPING}. Jika diam: cek allowFrom & log: openclaw logs --follow"
echo "  4) Jika gateway menolak kunci config bertanda [VERIFIKASI], hapus blok itu satu per satu (lihat docs/spec-index.md V3)."
