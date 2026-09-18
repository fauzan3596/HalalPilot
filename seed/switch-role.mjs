// Ganti peran satu akun Telegram tanpa menyentuh data lain. Untuk pengembangan dengan 1–2 akun Telegram
// dan untuk berpindah adegan saat rekaman (UMK-017 → UMK-042 → UMK-088 → pendamping).
//   npm run seed:switch -- <telegram_id> pendamping
//   npm run seed:switch -- <telegram_id> UMK-017
//   npm run seed:switch -- <telegram_id> pemasok
//
// Baris actor TIDAK dihapus (chase_task.target_actor_id merujuk ke sana); peran diubah di tempat.
// Tugas pengejaran UMK yang ditinggalkan dipindahkan ke akun pengganti (id sintetis 900000NNN, sama dengan seed),
// dan tugas UMK yang diambil alih dipindahkan ke akun ini.
import Database from "better-sqlite3";
import { join } from "node:path";
import { readFileSync } from "node:fs";
import yaml from "js-yaml";

const [, , tgId, peran] = process.argv;
if (!tgId || !peran) {
  console.error("Pakai: npm run seed:switch -- <telegram_id> <pendamping|pemasok|UMK-xxx>");
  process.exit(1);
}
const db = new Database(join(process.env.DATA_DIR ?? "./data", "halalpilot.db"));
db.pragma("foreign_keys = ON");

// Tahap pengejaran yang ditujukan ke pendamping (eskalasi) — dibaca dari rules/chase-policy.yaml agar tidak hardcode
const RULES_DIR = process.env.RULES_DIR ?? "./rules";
const tahapPend = (yaml.load(readFileSync(join(RULES_DIR, "chase-policy.yaml"), "utf8")).tahapan ?? []).filter((t) => t.target === "pendamping").map((t) => t.tahap);
const notPend = tahapPend.length ? `AND tahap NOT IN (${tahapPend.join(",")})` : "";
const isPend = tahapPend.length ? `tahap IN (${tahapPend.join(",")})` : "0";

const q = {
  me: db.prepare("SELECT id, role, umk_id FROM actor WHERE telegram_id = ?"),
  ins: db.prepare("INSERT INTO actor (telegram_id, role, display_name, umk_id) VALUES (?, ?, ?, ?) RETURNING id"),
  upd: db.prepare("UPDATE actor SET role = ?, display_name = ?, umk_id = ? WHERE id = ?"),
  umkByKode: db.prepare("SELECT id, kode, nama_usaha FROM umk WHERE kode = ?"),
  umkById: db.prepare("SELECT id, kode, nama_usaha FROM umk WHERE id = ?"),
  holders: db.prepare("SELECT id, telegram_id FROM actor WHERE role = 'umk' AND umk_id = ? AND id <> ?"),
  repoint: db.prepare(`UPDATE chase_task SET target_actor_id = ? WHERE umk_id = ? AND target_actor_id = ? ${notPend}`),           // hanya tugas untuk UMK
  repointAll: db.prepare("UPDATE chase_task SET target_actor_id = ? WHERE umk_id = ? AND target_actor_id = ?"),                  // sisa apa pun (jaga FK sebelum hapus)
  eskalasiKePend: db.prepare(`UPDATE chase_task SET target_actor_id = ? WHERE ${isPend} AND status = 'terjadwal' AND target_actor_id <> ?`), // eskalasi terbuka → pendamping aktif
  del: db.prepare("DELETE FROM actor WHERE id = ?"),
  kopUnset: db.prepare("UPDATE koperasi SET pendamping_actor_id = NULL WHERE pendamping_actor_id = ?"),
  kopSet: db.prepare("UPDATE koperasi SET pendamping_actor_id = ? WHERE id = 1"),
};
const placeholderTg = (kode) => "900000" + kode.slice(-3); // UMK-017 → 900000017 (pola default seed)

const tx = db.transaction(() => {
  const notes = [];
  let me = q.me.get(tgId);

  // 1) Lepas UMK yang sedang dipegang: sediakan akun pengganti dan pindahkan tugas pengejarannya ke sana
  if (me?.role === "umk" && me.umk_id && peran !== q.umkById.get(me.umk_id)?.kode) {
    const old = q.umkById.get(me.umk_id);
    if (old) {
      let sub = db.prepare("SELECT id FROM actor WHERE telegram_id = ?").get(placeholderTg(old.kode));
      if (!sub) sub = q.ins.get(placeholderTg(old.kode), "umk", old.nama_usaha, old.id);
      else q.upd.run("umk", old.nama_usaha, old.id, sub.id);
      const n = q.repoint.run(sub.id, old.id, me.id).changes;
      notes.push(`${old.kode} kini dipegang akun pengganti ${placeholderTg(old.kode)} (${n} tugas pengejaran dipindahkan)`);
    }
  }
  // 2) Lepas peran pendamping bila pindah ke peran lain
  if (me?.role === "pendamping" && peran !== "pendamping") {
    q.kopUnset.run(me.id);
    notes.push("koperasi kini tanpa pendamping; kembalikan dengan: npm run seed:switch -- <telegram_id> pendamping");
  }

  const setMe = (role, nama, umkId) => {
    if (me) q.upd.run(role, nama, umkId, me.id); else me = { id: q.ins.get(tgId, role, nama, umkId).id };
    return me.id;
  };

  if (peran === "pendamping") {
    const id = setMe("pendamping", "Pendamping Koperasi", null);
    q.kopSet.run(id);
    const esk = q.eskalasiKePend.run(id, id).changes;
    return [`akun ${tgId} kini PENDAMPING koperasi 1${esk ? `, ${esk} tugas eskalasi terbuka dialihkan ke akun ini` : ""}`, ...notes];
  }
  if (peran === "pemasok") {
    setMe("admin", "Pemasok (fiktif)", null); // role 'pemasok' belum ada di CHECK; pakai admin sementara
    return [`akun ${tgId} kini PEMASOK (fiktif)`, ...notes];
  }
  if (/^UMK-\d{3}$/.test(peran)) {
    const umk = q.umkByKode.get(peran);
    if (!umk) throw new Error(`UMK ${peran} tidak ada. Jalankan npm run seed:demo dulu.`);
    const id = setMe("umk", umk.nama_usaha, umk.id);
    // Ambil alih dari pemegang lain (akun seed/pengganti): pindahkan tugas pengejarannya ke akun ini, lalu hapus
    let moved = 0;
    for (const h of q.holders.all(umk.id, id)) { moved += q.repoint.run(id, umk.id, h.id).changes; q.repointAll.run(id, umk.id, h.id); q.del.run(h.id); }
    return [`akun ${tgId} kini UMK ${peran} (${umk.nama_usaha})${moved ? `, ${moved} tugas pengejaran dialihkan ke akun ini` : ""}`, ...notes];
  }
  throw new Error(`peran tidak dikenal: ${peran}`);
});

try {
  for (const line of tx()) console.log(line);
  db.prepare("INSERT INTO event_log (actor, aksi, detail_json) VALUES ('system', 'ROLE_SWITCH', ?)").run(JSON.stringify({ telegram_id_hash: tgId.slice(-3), peran }));
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
