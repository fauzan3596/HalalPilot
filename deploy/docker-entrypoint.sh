#!/usr/bin/env sh
# Entrypoint container orchestrator: migrasi → seed jika DB kosong → server.
set -e
node db/migrate.mjs
if [ "$(node -e "const D=require('better-sqlite3');const d=new D(process.env.DATA_DIR+'/halalpilot.db');console.log(d.prepare('select count(*) n from umk').get().n)")" = "0" ]; then
  echo "DB kosong → seed demo"; node seed/demo.mjs
fi
exec node src/server.js
