// Pembuatan & pembatalan tugas pengejaran (bagian M2). Sweep + pengiriman via hooks ada di M3 (sweep.js).
import { db, tx } from "../db.js";

const q = {
  docs: db.prepare("SELECT id, kode, status, requested_at FROM document_req WHERE umk_id = ? AND kode = ?"),
  // 'kurang' → siklus pertama (requested_at diisi jika kosong); 'ditolak' → siklus baru (requested_at di-reset) agar tahapan mulai ulang
  markDiminta: db.prepare(`UPDATE document_req SET status = 'diminta', updated_at = datetime('now'),
    requested_at = CASE WHEN status = 'ditolak' OR requested_at IS NULL THEN datetime('now') ELSE requested_at END
    WHERE umk_id = ? AND kode = ? AND status IN ('kurang','ditolak')`),
  requestedAt: db.prepare("SELECT requested_at FROM document_req WHERE umk_id = ? AND kode = ? AND status = 'diminta'"),
  ins: db.prepare(`INSERT OR IGNORE INTO chase_task (umk_id, document_kode, target_actor_id, tahap, due_at, idempotency_key)
    VALUES (?, ?, ?, ?, datetime(?, '+' || ? || ' hours'), ?)`),
  cycleCount: db.prepare("SELECT COUNT(*) n FROM chase_task WHERE umk_id = ? AND document_kode = ? AND tahap = 1"),
  umkActor: db.prepare("SELECT id FROM actor WHERE role = 'umk' AND umk_id = ? LIMIT 1"),
  pendamping: db.prepare("SELECT k.pendamping_actor_id AS id FROM umk u JOIN koperasi k ON k.id = u.koperasi_id WHERE u.id = ?"),
  // cadangan bila koperasi sedang tanpa pendamping (mis. satu akun berganti peran): aktor berperan pendamping mana pun,
  // agar tugas eskalasi TETAP dibuat; saat pendamping kembali aktif, switch-role mengalihkan tugas terbuka ke akunnya
  pendampingCadangan: db.prepare("SELECT id FROM actor WHERE role = 'pendamping' ORDER BY id LIMIT 1"),
  cancel: db.prepare("UPDATE chase_task SET status = 'dibatalkan' WHERE umk_id = ? AND document_kode = ? AND status = 'terjadwal'"),
  cancelAll: db.prepare("UPDATE chase_task SET status = 'dibatalkan' WHERE umk_id = ? AND status = 'terjadwal'"),
};

/**
 * Untuk setiap dokumen 'kurang' → tandai 'diminta' dan buat task tahap 1–4 sesuai rules.chase.tahapan.
 * Idempoten: kunci unik chase:<umk>:<doc>:<tahap>. Jika UMK belum punya akun Telegram, target = pendamping.
 * @returns {number} jumlah task baru
 */
export function createChaseTasks(umkId, kodeList, rules) {
  const tahapan = rules.chase?.tahapan ?? [];
  const umkActor = q.umkActor.get(umkId)?.id ?? null;
  const pend = q.pendamping.get(umkId)?.id ?? q.pendampingCadangan.get()?.id ?? null;
  return tx(() => {
    let created = 0;
    for (const kode of kodeList) {
      // Siklus baru (dokumen 'ditolak'): batalkan sisa tugas siklus lama agar UMK tidak menerima pengingat ganda
      if (q.docs.get(umkId, kode)?.status === "ditolak") q.cancel.run(umkId, kode);
      q.markDiminta.run(umkId, kode);
      const base = q.requestedAt.get(umkId, kode)?.requested_at;
      if (!base) continue;
      // siklus = nomor urut permintaan untuk dokumen ini (bukan waktu: dua siklus dalam detik yang sama pernah bertabrakan)
      const cycle = q.cycleCount.get(umkId, kode).n + 1;
      for (const t of tahapan) {
        const target = t.target === "pendamping" ? pend : (umkActor ?? pend);
        if (!target) continue;
        const r = q.ins.run(umkId, kode, target, t.tahap, base, t.setelah_jam, `chase:${umkId}:${kode}:${t.tahap}:${cycle}`);
        created += r.changes;
      }
    }
    return created;
  });
}

export function cancelChaseFor(umkId, kode) { return q.cancel.run(umkId, kode).changes; }
export function cancelAllChase(umkId) { return q.cancelAll.run(umkId).changes; }
