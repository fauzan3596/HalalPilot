import { db } from "./db.js";

const ins = db.prepare("INSERT INTO event_log (umk_id, actor, aksi, detail_json) VALUES (?, ?, ?, ?)");

/**
 * Catat aksi ke event_log. `detail` tidak boleh berisi data pribadi atau isi dokumen — hanya kode, id, hash, status.
 */
export function audit({ umkId = null, actor = "system", aksi, detail = null }) {
  ins.run(umkId, actor, aksi, detail ? JSON.stringify(detail) : null);
}
