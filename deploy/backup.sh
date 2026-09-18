#!/usr/bin/env bash
# Backup malam HalalPilot (VPS). Checkpoint WAL dulu agar arsip konsisten (SYS-13). Jalankan sebagai root via cron 23:00.
set -euo pipefail
STAMP=$(date +%Y%m%d-%H%M)
DEST=${1:-/root/backup}
DATA=${DATA_DIR:-/var/lib/halalpilot}
mkdir -p "$DEST"

# 1) Checkpoint WAL → satu file .db konsisten
sqlite3 "$DATA/halalpilot.db" "PRAGMA wal_checkpoint(TRUNCATE);"
if [ -s "$DATA/halalpilot.db-wal" ]; then echo "WAL masih berisi data setelah checkpoint; batalkan backup" >&2; exit 1; fi
sqlite3 "$DATA/halalpilot.db" "PRAGMA integrity_check;" | grep -q '^ok$'

# 2) Arsip: DB + PDF + rules + konfigurasi OpenClaw (tanpa .env / token)
tar --exclude='.env' --exclude='*.token' -czf "$DEST/halalpilot-$STAMP.tgz" \
  -C / "${DATA#/}" "opt/halalpilot/rules" "root/.openclaw/openclaw.json5" "root/.openclaw/workspace" 2>/dev/null || \
tar --exclude='.env' -czf "$DEST/halalpilot-$STAMP.tgz" -C / "${DATA#/}" "opt/halalpilot/rules"

# 3) Bukti operasional hari itu
{
  date; free -m; openclaw --version 2>/dev/null; openclaw automations list 2>/dev/null; systemctl is-active openclaw halalpilot-api
} > "$DEST/evidence-$STAMP.txt" 2>&1 || true

echo "backup selesai: $DEST/halalpilot-$STAMP.tgz"
# Salin ke laptop dari sisi laptop: rsync -avz root@<vps>:/root/backup/ ./docs/h1-evidence/backup/
