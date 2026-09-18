#!/usr/bin/env bash
# Dari laptop/WSL: kirim repo ke VPS dan jalankan penyiapan. Pemakaian:
#   bash deploy/deploy.sh hp-vps                 # rsync + semua fase (hp-vps = alias ~/.ssh/config, port 4422)
#   Bisa dijalankan dari WSL menunjuk repo Windows: bash /mnt/c/.../halalpilot/deploy/deploy.sh hp-vps sistem
#   Rahasia dibaca dari .env.vps di root repo (fallback .env); .env dev TIDAK ikut terkirim.
#   bash deploy/deploy.sh root@IP_VPS api        # rsync + satu fase (update kode/aturan)
set -euo pipefail
HOST="${1:?pakai: deploy.sh user@host [fase]   (port non-22: SSH_PORT=4422 deploy.sh ... atau pakai alias di ~/.ssh/config)}"; PHASE="${2:-semua}"
SSH_PORT="${SSH_PORT:-}"; SSHCMD="ssh${SSH_PORT:+ -p $SSH_PORT}"
HERE="$(cd "$(dirname "$0")/.." && pwd)"
ENVSRC="$HERE/.env.vps"; [ -f "$ENVSRC" ] || ENVSRC="$HERE/.env"
[ -f "$ENVSRC" ] || { echo "Tidak ada .env.vps (atau .env). Buat dari .env.vps.example, isi token, simpan sebagai .env.vps (tidak masuk git)."; exit 1; }
grep -qE "^TELEGRAM_BOT_TOKEN=.+" "$ENVSRC" || { echo "TELEGRAM_BOT_TOKEN kosong di $ENVSRC"; exit 1; }
grep -qE "^OPENROUTER_API_KEY=.+" "$ENVSRC" || echo "PERINGATAN: OPENROUTER_API_KEY kosong di $ENVSRC (model & vision tidak akan jalan)"
echo "== env yang dipakai: $ENVSRC"

echo "== rsync ke $HOST:/opt/halalpilot"
$SSHCMD "$HOST" 'mkdir -p /opt/halalpilot'
rsync -az --delete -e "$SSHCMD" \
  --exclude node_modules --exclude data --exclude .git --exclude 'docs/h1-evidence/*' --exclude dashboard/node_modules --exclude '.env' --exclude '.env.*' --include '.env.vps.example' \
  "$HERE/" "$HOST:/opt/halalpilot/"
echo "== kirim env → /opt/halalpilot/.env"
rsync -az -e "$SSHCMD" "$ENVSRC" "$HOST:/opt/halalpilot/.env"
$SSHCMD "$HOST" 'chmod 600 /opt/halalpilot/.env'
echo "== jalankan vps-setup.sh $PHASE"
$SSHCMD -t "$HOST" "bash /opt/halalpilot/deploy/vps-setup.sh $PHASE"
