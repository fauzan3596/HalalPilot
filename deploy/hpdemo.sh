#!/usr/bin/env bash
# hpdemo — pembantu operator demo/rekaman HalalPilot di VPS (dipasang ke /usr/local/bin/hpdemo oleh deploy/vps-setup.sh atau manual).
# Semua perintah aman diulang. Waktu sweep memakai `now` maju N hari pukul 10:00 WIB (di luar jam tenang 21–07).
#   hpdemo reset                 # DB segar 120 UMK (akun Telegram dipertahankan), hapus PDF/inbound, akun → UMK-017
#   hpdemo reset-bergerak        # reset + portofolio sedang bergerak (untuk adegan pembuka); UMK skenario tetap segar
#   hpdemo role UMK-017|UMK-042|UMK-088|pendamping
#   hpdemo eval UMK-042          # evaluasi (membuat tugas pengejaran untuk dokumen yang harus dari UMK)
#   hpdemo sweep 2               # sapu pengejaran dengan now = +2 hari 10:00 WIB (tahap 1); 4 → tahap 2; 8 → tahap 3; 11 → tahap 4
#   hpdemo mark-sent UMK-042     # tandai tahap 1–3 UMK terkirim (agar sweep 11 hanya mengirim eskalasi tahap 4)
#   hpdemo digest                # jalankan automation digest pagi sekarang
#   hpdemo pdf UMK-017           # daftar PDF dossier UMK (untuk scp ke laptop)
#   hpdemo status                # layanan, port, RAM, health, peran akun
set -euo pipefail
REPO=/opt/halalpilot; DATA=/var/lib/halalpilot; : "${TG_DEMO:?set TG_DEMO (id numerik akun Telegram demo)}"; TG="$TG_DEMO"
ENVV="$(grep -v '^#' /etc/halalpilot/env | xargs)"
TOKEN="$(grep ^HALALPILOT_API_TOKEN /etc/halalpilot/env | cut -d= -f2)"
API="http://127.0.0.1:$(grep ^PORT /etc/halalpilot/env | cut -d= -f2 || echo 3000)/api/v1"
hp()    { (cd "$REPO" && sudo -u halalpilot env $ENVV node "$@"); }
hpapi() { curl -s -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" "$@"; }
now_plus_days() { date -u -d "+$1 days 03:00" +%FT%TZ; }   # 03:00Z = 10:00 WIB

case "${1:-}" in
  reset)
    systemctl stop halalpilot-api
    hp seed/demo.mjs --keep-actors | grep -o '"umk":[0-9]*' || true
    rm -rf "$DATA"/pdf/UMK-* "$DATA"/inbound/*
    systemctl start halalpilot-api; sleep 2
    hp seed/switch-role.mjs "$TG" UMK-017 | head -1
    hpapi "$API/health" | cut -c1-60; echo
    ;;
  reset-bergerak)
    # reset + portofolio "sedang bergerak" (12 selesai, 6 siap unggah, 6 menunggu review, 3 eskalasi) untuk adegan pembuka; UMK-017/042/088 tetap segar
    "$0" reset
    hp seed/bergerak.mjs | cut -c1-160
    hpapi "$API/portfolio/1/summary" | grep -o '"siap_unggah":[0-9]*\|"laju":{[^}]*}' | tr '
' ' '; echo ;;
  role)   hp seed/switch-role.mjs "$TG" "${2:?peran}" ;;
  eval)   hpapi -X POST "$API/umk/${2:?kode}/evaluate" -H "Idempotency-Key: demo-eval-$(date +%s)" -d '{}' | grep -o '"jalur":"[A-Z_]*"\|"skor_kesiapan":[0-9]*\|"dokumen_diminta":\[[^]]*\]' | tr '\n' ' '; echo ;;
  sweep)  NOW="$(now_plus_days "${2:?hari}")"; echo "now=$NOW"; hpapi -X POST "$API/chase/sweep" -d "{\"now\":\"$NOW\"}"; echo ;;
  mark-sent)
    sqlite3 "$DATA/halalpilot.db" "UPDATE chase_task SET status='terkirim', sent_at=datetime('now','-3 days') WHERE status='terjadwal' AND tahap<=3 AND umk_id=(SELECT id FROM umk WHERE kode='${2:?kode}');"
    sqlite3 "$DATA/halalpilot.db" "SELECT tahap, status FROM chase_task WHERE umk_id=(SELECT id FROM umk WHERE kode='$2') ORDER BY tahap;" ;;
  ensure-eskalasi)
    # Lengkapi tugas tahap 4 (eskalasi) yang tidak terbentuk karena koperasi tanpa pendamping saat evaluasi; target = pendamping koperasi saat ini
    sqlite3 "$DATA/halalpilot.db" "INSERT OR IGNORE INTO chase_task (umk_id, document_kode, target_actor_id, tahap, due_at, idempotency_key)
      SELECT ct.umk_id, ct.document_kode, k.pendamping_actor_id, 4, datetime(dr.requested_at, '+240 hours'), 'chase:'||ct.umk_id||':'||ct.document_kode||':4:demo'||strftime('%s','now')
      FROM chase_task ct JOIN umk u ON u.id=ct.umk_id JOIN koperasi k ON k.id=u.koperasi_id JOIN document_req dr ON dr.umk_id=ct.umk_id AND dr.kode=ct.document_kode
      WHERE ct.tahap=1 AND u.kode='${2:?kode}' AND k.pendamping_actor_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM chase_task x WHERE x.umk_id=ct.umk_id AND x.document_kode=ct.document_kode AND x.tahap=4 AND x.status='terjadwal');" 2>&1 | head -2
    sqlite3 "$DATA/halalpilot.db" "SELECT tahap, status, document_kode FROM chase_task WHERE umk_id=(SELECT id FROM umk WHERE kode='$2') ORDER BY tahap, document_kode;" ;;
  kembalikan)
    # Ulang pengembalian dossier terbaru sebuah UMK (untuk memundurkan keadaan ke akhir adegan 8). Butuh akun demo berperan pendamping.
    hp seed/switch-role.mjs "$TG" pendamping | head -1
    DID="$(hpapi "$API/umk/${2:?kode}" | grep -o '"dossiers":\[{"id":[0-9]*' | grep -o '[0-9]*$')"
    hpapi -X POST "$API/dossier/$DID/review" -H "X-Actor: pendamping:$TG" -H "Idempotency-Key: demo-return-$(date +%s)" -d "{\"aksi\":\"kembalikan\",\"catatan\":\"${3:-foto label kurang jelas, tolong foto ulang}\",\"pendamping_telegram_id\":\"$TG\"}"; echo
    hp seed/switch-role.mjs "$TG" "$2" | head -1 ;;
  digest-id) hpclaw automations list 2>/dev/null | awk '/HalalPilot digest pagi/{print $1}' | head -1 ;;
  digest) ID="$(hpclaw automations list 2>/dev/null | awk '/HalalPilot digest pagi/{print $1}' | head -1)"; echo "digest id=$ID"; hpclaw automations run "$ID" 2>/dev/null | grep -o '"ok":[a-z]*' ;;
  pdf)    ls -la "$DATA/pdf/${2:-UMK-017}/" 2>/dev/null || echo "belum ada PDF" ;;
  status)
    systemctl is-active halalpilot-api halalpilot-gateway | tr '\n' ' '; echo
    ss -tlnp | awk '/LISTEN/ && !/127.0.0|::1/' | awk '{print $4}' | tr '\n' ' '; echo "(publik)"
    free -m | awk 'NR==2{print "RAM terpakai:",$3,"MB dari",$2}'
    hpapi "$API/health" | cut -c1-80; echo
    hpapi "$API/whoami?telegram_id=$TG" | grep -o '"role":"[a-z]*"\|"kode":"UMK-[0-9]*"\|"status":"[a-z_]*"' | tr '\n' ' '; echo ;;
  *) sed -n 2,12p "$0" ;;
esac
