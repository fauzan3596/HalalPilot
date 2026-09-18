# Runbook Operasional Demo & Rekaman (H2–H5)

Pendamping naskah `docs/demo-script.md` (apa yang tampil di layar). Dokumen ini: perintah persis yang dijalankan operator.

## Sesi shell yang selalu terbuka (laptop → VPS)
```bash
# T1: tunnel dashboard + gateway UI (biarkan hidup)
ssh -L 3000:127.0.0.1:3000 -L 18789:127.0.0.1:18789 root@IP_VPS
# T2: log API (footage)
ssh root@IP_VPS 'journalctl -u halalpilot-api -f -o cat'
# T3: log gateway (footage)
ssh root@IP_VPS 'openclaw logs --follow'
# T4: perintah operator
ssh root@IP_VPS
```
Alias di T4 (tambahkan ke `/root/.bashrc`):
```bash
alias hp='sudo -u halalpilot env $(grep -v "^#" /etc/halalpilot/env | xargs) node'
alias hpapi='curl -s -H "Authorization: Bearer $(grep HALALPILOT_API_TOKEN /etc/halalpilot/env | cut -d= -f2)" -H "Content-Type: application/json"'
```

## Reset ke kondisi awal demo (sebelum setiap take)
```bash
cd /opt/halalpilot
systemctl stop halalpilot-api
hp seed/demo.mjs --keep-actors          # 120 UMK segar, pemetaan Telegram dipertahankan
rm -rf /var/lib/halalpilot/pdf/UMK-*     # dossier lama
systemctl start halalpilot-api && sleep 2 && hpapi http://127.0.0.1:3000/api/v1/health
```
Lalu pastikan akun kedua berperan UMK-017: `hp seed/switch-role.mjs <TG_UMK> UMK-017`.

## Pergantian peran antar adegan
| Adegan | Perintah |
|---|---|
| UMK-017 Nastar | `hp seed/switch-role.mjs <TG_UMK> UMK-017` |
| UMK-088 Bakso | `hp seed/switch-role.mjs <TG_UMK> UMK-088` |
| UMK-042 Sambal | `hp seed/switch-role.mjs <TG_UMK> UMK-042` |
| Pendamping | akun utama tetap pendamping sepanjang video |
Jika hanya satu akun: `hp seed/switch-role.mjs <TG> pendamping` sebelum adegan review; agent menyebut nama usaha sehingga pergantian terbaca.

## Mempercepat waktu untuk adegan pengejaran (menit 4:00)
```bash
# mundurkan tahap 1 sertifikat margarin UMK-017 ke masa lalu, lalu picu sapuan
sqlite3 /var/lib/halalpilot/halalpilot.db "update chase_task set due_at=datetime('now','-1 minute') where umk_id=(select id from umk where kode='UMK-017') and document_kode='SERT_PEMASOK:margarin' and tahap=1"
hpapi -X POST http://127.0.0.1:3000/api/v1/chase/sweep | jq .
# eskalasi pemasok diam (UMK-088): tandai tahap 1–3 terkirim kemarin, tahap 4 jatuh tempo
sqlite3 /var/lib/halalpilot/halalpilot.db "update chase_task set status='terkirim', sent_at=datetime('now','-2 days') where umk_id=(select id from umk where kode='UMK-088') and document_kode='SERT_PEMASOK:RPH' and tahap<4; update chase_task set due_at=datetime('now','-1 minute') where umk_id=(select id from umk where kode='UMK-088') and document_kode='SERT_PEMASOK:RPH' and tahap=4"
hpapi -X POST http://127.0.0.1:3000/api/v1/chase/sweep | jq .
```
Catatan: sweep menghormati jam tenang 21:00–07:00 WIB dan batas 2 pesan/UMK/hari. Rekam antara 08:00–20:00 WIB; jika batas harian tercapai saat gladi, reset seed.

## Digest untuk adegan menit 7:15
```bash
openclaw automations run "HalalPilot digest pagi"      # atau tunjukkan pesan 07:00 yang sudah masuk
openclaw automations list
```

## Simulasi pengajuan (menit 6:00–7:15)
Pendamping mengetik di Telegram: `setuju UMK-017` → `ajukan UMK-017`. Untuk memastikan hasil "diterima" saat rekaman, agent memanggil mock tanpa `force_result`; pengajuan ke-5 secara deterministik dikembalikan. Jika ingin pasti diterima pada take tertentu: reset seed dulu (hitungan pengajuan kembali 0).

## Adegan kegagalan yang ditangani (H3, opsional untuk video)
```bash
systemctl stop halalpilot-api      # tunggu 2 heartbeat (set heartbeat 2m sementara) → agent melapor
systemctl start halalpilot-api
```

## Sebelum rekaman final (H5 pagi)
- [ ] `bash deploy/evidence.sh` (bukti pra-rekaman), `openclaw security audit --deep`.
- [ ] Reset seed; `switch-role` ke UMK-017; buka dashboard di tunnel; OBS: Telegram Desktop kiri, dashboard kanan atas, T2/T3 kanan bawah; watermark IDwebhost.
- [ ] Rekam 2–3 take penuh (7–9 menit). Jeda model > 8 s dipotong saat edit, bukan dipercepat.
- [ ] Setelah take terakhir: `bash deploy/backup.sh` lalu `rsync -avz root@IP:/root/backup/ ./docs/h1-evidence/backup/`; `rsync -avz root@IP:/var/lib/halalpilot/pdf/ ./docs/h1-evidence/pdf/`.
- [ ] Ekspor: `openclaw automations list`, `openclaw security audit --deep` → teks untuk artikel.

## Setelah VM mati (11 Sep →)
Replika lokal untuk retake non-VPS: `docker compose up -d` + OpenClaw di WSL dengan bot lokal. Footage VPS (dashboard panel, terminal `gateway status`, `free -m`) sudah harus ada dari H1–H5.
