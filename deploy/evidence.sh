#!/usr/bin/env bash
# Kumpulkan bukti H1–H5 ke docs/h1-evidence/<hari>/ (untuk artikel, video B-roll, dan skenario SYS-01/03/05/12). Jalankan di VPS sebagai root.
set -uo pipefail
REPO=/opt/halalpilot
OUT="$REPO/docs/h1-evidence/$(date +%Y-%m-%d)"
mkdir -p "$OUT"
PORT=$(grep -E '^PORT=' /etc/halalpilot/env 2>/dev/null | cut -d= -f2); PORT=${PORT:-3000}
save() { local name=$1; shift; { echo "# $(date -Is) :: $*"; "$@" 2>&1; } > "$OUT/$name.txt"; echo "  $name"; }

echo "Menulis ke $OUT"
save 00-versions      bash -c 'uname -a; lsb_release -ds 2>/dev/null; node --version; npm --version; openclaw --version; sqlite3 --version'
save 01-vps-spec      bash -c 'nproc; free -m; df -h / ; swapon --show'
save 02-ram-per-unit  bash -c 'systemd-cgtop -1 -m 2>/dev/null | head -15; echo; ps -o pid,rss,cmd -C node'
save 03-ports         bash -c 'ss -tlnp'
save 04-ufw           ufw status verbose
save 05-api-health    bash -c "curl -s http://127.0.0.1:$PORT/api/v1/health"
save 06-api-unit      systemctl status halalpilot-api --no-pager
save 07-gateway       openclaw gateway status
save 08-channels      openclaw channels status
save 09-automations   openclaw automations list
save 10-plugins       bash -c "openclaw plugins list | grep -iE 'telegram|llama|perplexity|openrouter'"
save 11-models        openclaw models list
save 12-security      openclaw security audit --deep
save 13-config-keys   bash -c "sed -E 's/(token|Token|KEY|key)\"?: ?\"[^\"]+\"/\1: \"***\"/g' /root/.openclaw/openclaw.json | grep -vE '^\s*//'"
save 14-db-counts     bash -c "sqlite3 /var/lib/halalpilot/halalpilot.db \"select 'umk',count(*) from umk union all select 'decision',count(*) from decision union all select 'chase_task',count(*) from chase_task union all select 'dossier',count(*) from dossier union all select 'event_log',count(*) from event_log\""
save 15-events-today  bash -c "sqlite3 -header /var/lib/halalpilot/halalpilot.db \"select aksi,count(*) n from event_log where date(created_at,'+7 hours')=date('now','+7 hours') group by aksi order by n desc\""
save 16-journal-api   journalctl -u halalpilot-api --since "24 hours ago" --no-pager -n 200
save 17-journal-gw    bash -c 'journalctl -u openclaw-gateway --since "24 hours ago" --no-pager -n 200 2>/dev/null || tail -n 200 /tmp/openclaw/openclaw-*.log 2>/dev/null'
echo "Selesai. Salin ke laptop: rsync -avz root@<vps>:$OUT/ ./docs/h1-evidence/"
