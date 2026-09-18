// Dashboard baca-saja HalalPilot. Tanpa build: ES module murni. Polling 10 s. Token di sessionStorage.
// Prinsip tampilan: setiap piksel menjawab "UMK mana yang harus dikerjakan berikutnya", dan memperlihatkan agen bekerja
// (input → aturan → keputusan → siapa yang memutuskan). Tidak ada aksi tulis: keputusan tetap lewat Telegram.
const API = "/api/v1";
const POLL_MS = 10000;
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const tgl = (iso) => iso ? new Date(iso.replace(" ", "T") + (iso.endsWith("Z") ? "" : "Z")).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : "";

const STATUS = {
  baru: ["gray", "Belum mulai"], intake: ["gray", "Intake"], menunggu_dokumen: ["amber", "Menunggu dokumen"], dikembalikan: ["amber", "Dikembalikan"],
  siap_review: ["blue", "Menunggu review"], disetujui: ["blue", "Disetujui"], siap_unggah: ["green", "Siap unggah"], diajukan_simulasi: ["green", "Diajukan"],
  ditolak_simulasi: ["red", "Ditolak"], selesai_simulasi: ["green", "Selesai"], ditunda: ["gray", "Ditunda"], dihapus: ["gray", "Dihapus"],
};
const JALUR = { SELF_DECLARE_SIAP: ["green", "Siap self-declare"], SELF_DECLARE_KURANG_DOKUMEN: ["amber", "Kurang dokumen"], REGULER: ["red", "Jalur reguler"], TIDAK_LAYAK: ["red", "Tidak layak"] };
const DOK = { // kode → bahasa awam
  NIB: "NIB", PENYELIA: "nama penyelia halal", FOTO_PRODUK: "foto produk/label", PROSES: "cerita proses produksi", DAFTAR_BAHAN: "daftar bahan",
  KONFIRMASI_BAHAN: "konfirmasi daftar bahan", MANUAL_SJPH: "Manual SJPH (disusun sistem)", PERMOHONAN: "surat permohonan (disusun sistem)",
  PERNYATAAN_HALAL: "pernyataan halal (disusun sistem)", IKRAR: "ikrar (disusun sistem)", PERBAIKAN_OSS: "perbaikan data usaha di OSS", PEMBAGIAN_PENGAJUAN: "pembagian daftar produk",
};
const dokLabel = (k) => DOK[k] ?? (k.startsWith("SERT_PEMASOK:") ? `sertifikat pemasok ${k.slice(13).replace(/_/g, " ")}` : k.toLowerCase().replace(/_/g, " "));
const DOKSTAT = { kurang: ["gray", "belum diminta"], diminta: ["amber", "diminta"], diterima: ["green", "diterima"], dihasilkan: ["green", "disusun sistem"], ditolak: ["red", "ditolak"] };
const SISTEM = new Set(["MANUAL_SJPH", "PERMOHONAN", "PERNYATAAN_HALAL", "IKRAR", "DAFTAR_BAHAN", "PEMBAGIAN_PENGAJUAN"]);
const colorOf = (u) => (u.jalur === "REGULER" || u.jalur === "TIDAK_LAYAK") ? "red" : u.eskalasi ? "red" : (STATUS[u.status]?.[0] ?? "gray");
const labelOf = (u) => u.eskalasi ? "eskalasi" : (u.jalur === "REGULER" || u.jalur === "TIDAK_LAYAK") ? JALUR[u.jalur][1].toLowerCase() : (STATUS[u.status]?.[1] ?? u.status).toLowerCase();

// Skor urgensi (dihitung di klien, 120 item): eskalasi dulu, lalu hari diam, dokumen kurang, bobot status. Selesai paling bawah.
const BOBOT = { siap_review: 50, disetujui: 50, siap_unggah: 40, dikembalikan: 35, menunggu_dokumen: 30, intake: 20, baru: 10, ditunda: 0, selesai_simulasi: -1000, diajukan_simulasi: -900, ditolak_simulasi: 60 };
const urgensi = (u) => (u.eskalasi ? 1000 : 0) + (u.hari_diam ?? 0) * 10 + (u.dokumen_kurang ?? 0) * 5 + (BOBOT[u.status] ?? 0);

let token = sessionStorage.getItem("hp_token") || "";
let timer = null;
let lastRoute = "";
const ui = { filter: "semua", sort: "mendesak", q: "" }; // keadaan papan (klien)

function render(html, routeKey) {
  const v = $("#view");
  if (v.dataset.html === html && lastRoute === routeKey) return;
  v.innerHTML = html; v.dataset.html = html;
  if (lastRoute !== routeKey) { v.classList.remove("view-enter"); void v.offsetWidth; v.classList.add("view-enter"); lastRoute = routeKey; }
}
const skeleton = () => `<div class="hero skeleton" style="min-height:120px">&nbsp;</div><div class="grid2"><div class="card skeleton" style="min-height:420px">&nbsp;</div><div><div class="card skeleton" style="min-height:200px">&nbsp;</div><div class="card skeleton section" style="min-height:120px">&nbsp;</div></div></div>`;

async function api(path) {
  const res = await fetch(API + path, { headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 401) { showGate("Token ditolak (401)."); throw new Error("401"); }
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.json();
}

function showGate(msg = "") { $("#token-gate").hidden = false; $("#token-err").textContent = msg; $("#token-input").focus(); }
$("#token-form").addEventListener("submit", (e) => { e.preventDefault(); token = $("#token-input").value.trim().replace(/^HALALPILOT_API_TOKEN\s*=\s*/i, "").replace(/^["']|["']$/g, "").trim(); sessionStorage.setItem("hp_token", token); $("#token-gate").hidden = true; route(); });
$("#logout").addEventListener("click", () => { sessionStorage.removeItem("hp_token"); token = ""; showGate(); });

// ---------- header: chip sistem & aturan ----------
async function renderHeader() {
  const h = await fetch(API + "/health").then((r) => r.json()).catch(() => null);
  const sys = $("#sys"), rules = $("#rules");
  if (!h) { sys.className = "chip-sys warn"; sys.innerHTML = `<i class="dot warn"></i>API tidak terjangkau`; return; }
  const v = String(h.rules_version).split("+")[0];
  rules.innerHTML = `Aturan v${esc(v)}`; rules.title = `rules_version ${h.rules_version} — versi aturan yang sama tercatat di setiap keputusan (lihat Audit)`;
  if (h.hooks_last_error) { sys.className = "chip-sys warn"; sys.innerHTML = `<i class="dot warn"></i>Hook agen gagal`; sys.title = h.hooks_last_error; }
  else { sys.className = "chip-sys"; sys.innerHTML = `<i class="dot"></i>Sistem normal`; sys.title = `API ok · diperbarui ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`; }
}

// ---------- Papan ----------
function tileHtml(u) {
  const c = colorOf(u), lbl = labelOf(u);
  const dok = u.dokumen_total ? `${u.dokumen_diterima}/${u.dokumen_total} dokumen` : "belum ada dokumen";
  const diam = u.hari_diam == null ? "" : u.hari_diam === 0 ? "aktif hari ini" : `diam ${u.hari_diam} hari`;
  const aria = `${u.kode} ${u.nama_usaha}, ${lbl}, ${dok}${diam ? ", " + diam : ""}${u.skor_kesiapan != null ? ", skor " + u.skor_kesiapan : ""}`;
  return `<a class="tile ${c}" href="#/umk/${u.id}" aria-label="${esc(aria)}" title="${esc(u.nama_usaha)}">
    <div class="tile-top"><span class="kode">${esc(u.kode.slice(4))}</span>${u.eskalasi ? '<span class="flag" aria-hidden="true">⚑</span>' : ""}<span class="skor">${u.skor_kesiapan ?? "–"}</span></div>
    <div class="nama">${esc(u.nama_usaha)}</div>
    <div class="meta"><span>${dok}</span>${diam ? `<span>${diam}</span>` : ""}</div>
    <div class="lbl">${esc(lbl)}</div></a>`;
}

function applyBoard(list) {
  let arr = list.slice();
  const f = ui.filter;
  if (f === "belum_mulai") arr = arr.filter((u) => u.status === "baru" || u.status === "intake");
  else if (f === "menunggu_dokumen") arr = arr.filter((u) => u.status === "menunggu_dokumen" || u.status === "dikembalikan");
  else if (f === "review") arr = arr.filter((u) => u.status === "siap_review" || u.status === "disetujui");
  else if (f === "siap") arr = arr.filter((u) => ["siap_unggah", "diajukan_simulasi", "selesai_simulasi"].includes(u.status));
  else if (f === "eskalasi") arr = arr.filter((u) => u.eskalasi);
  else if (f === "diam10") arr = arr.filter((u) => (u.hari_diam ?? 0) > 10 && !["selesai_simulasi", "siap_unggah"].includes(u.status));
  else if (f === "tidak_layak") arr = arr.filter((u) => u.jalur === "REGULER" || u.jalur === "TIDAK_LAYAK");
  if (ui.q) { const q = ui.q.toLowerCase(); arr = arr.filter((u) => u.kode.toLowerCase().includes(q) || u.nama_usaha.toLowerCase().includes(q) || (u.produk ?? "").toLowerCase().includes(q)); }
  if (ui.sort === "mendesak") arr.sort((a, b) => urgensi(b) - urgensi(a) || a.kode.localeCompare(b.kode));
  else if (ui.sort === "diam") arr.sort((a, b) => (b.hari_diam ?? 0) - (a.hari_diam ?? 0) || a.kode.localeCompare(b.kode));
  else arr.sort((a, b) => a.kode.localeCompare(b.kode));
  return arr;
}

let boardCache = null; // {s, list} — agar filter/sort/search tidak menunggu jaringan
function paintBoard() {
  if (!boardCache) return;
  const { s, list } = boardCache;
  const shown = applyBoard(list);
  const n = (pred) => list.filter(pred).length;
  const counts = {
    semua: list.length,
    belum_mulai: n((u) => u.status === "baru" || u.status === "intake"),
    menunggu_dokumen: n((u) => u.status === "menunggu_dokumen" || u.status === "dikembalikan"),
    review: n((u) => u.status === "siap_review" || u.status === "disetujui"),
    siap: n((u) => ["siap_unggah", "diajukan_simulasi", "selesai_simulasi"].includes(u.status)),
    eskalasi: n((u) => u.eskalasi), diam10: n((u) => (u.hari_diam ?? 0) > 10 && !["selesai_simulasi", "siap_unggah"].includes(u.status)),
    tidak_layak: n((u) => u.jalur === "REGULER" || u.jalur === "TIDAK_LAYAK"),
  };
  const chip = (key, label, color) => `<button type="button" class="fchip ${ui.filter === key ? "on" : ""} ${color ?? ""}" data-f="${key}" ${counts[key] === 0 && key !== "semua" ? "disabled" : ""}><i></i>${label} <b>${counts[key]}</b></button>`;
  const seg = (key, color, val) => val ? `<button type="button" class="seg ${color}" style="flex:${val}" data-f="${key}" title="${val} UMK — klik untuk memfilter" aria-label="${val} ${key.replace(/_/g, " ")}"></button>` : "";
  const pct = s.total_umk ? Math.round(100 * counts.siap / s.total_umk) : 0;
  const laju = s.laju ?? { dibutuhkan_per_hari: 0, aktual_7hari_per_hari: 0, sisa_umk: s.total_umk - s.siap_unggah };
  const onTrack = laju.aktual_7hari_per_hari >= laju.dibutuhkan_per_hari;
  const butuhSaya = counts.eskalasi + counts.review;
  const dariUmk = counts.menunggu_dokumen + counts.belum_mulai;
  const mendesak = s.umk_mendesak.map((u, i) => `<li><span><span class="rank">${i + 1}</span><span><a href="#/umk/${u.id}"><b>${esc(u.nama_usaha)}</b> <span class="mono muted">${esc(u.kode)}</span></a><div class="m">${u.dokumen_kurang} dokumen kurang${u.menunggu_sejak ? " · menunggu sejak " + esc(tgl(u.menunggu_sejak)) : ""}</div></span></span><span class="badge ${JALUR[u.jalur]?.[0] ?? "gray"}">${u.skor_kesiapan ?? "–"}</span></li>`).join("") || `<li><div class="empty" style="width:100%"><b>Tidak ada yang mendesak</b>Semua UMK aktif sudah melengkapi dokumen.</div></li>`;
  const antrean = (s.antrean_review ?? []).map((d) => `<li><span><span class="rank" style="background:var(--blue-soft);color:var(--blue)">v${d.versi}</span><span><a href="#/umk/${d.umk_id}"><b>${esc(d.nama_usaha)}</b> <span class="mono muted">${esc(d.kode)}</span></a><div class="m">berkas skor ${d.skor_kesiapan ?? "–"} · aturan v${esc(String(d.rules_version ?? "").split("+")[0])} · Telegram: <code>setuju ${esc(d.kode)}</code> / <code>kembalikan ${esc(d.kode)} &lt;alasan&gt;</code></div></span></span><span class="badge blue">menunggu</span></li>`).join("") || `<li><div class="empty" style="width:100%"><b>Antrean kosong</b>Agen menyusun berkas begitu skor mencapai 100; pendamping memutuskan lewat Telegram.</div></li>`;
  const eskalasi = s.eskalasi_terbuka.map((e) => `<li><span><span class="rank" style="background:var(--red-soft);color:var(--red)">⚑</span><span><a href="#/umk/${e.umk_id}"><b>${esc(e.nama_usaha)}</b> <span class="mono muted">${esc(e.kode)}</span></a><div class="m">${esc(dokLabel(e.document_kode))} · 3 pengingat tanpa respons · eskalasi ${esc(tgl(e.sent_at))}</div></span></span><span class="badge red">tahap 4</span></li>`).join("") || `<li><div class="empty" style="width:100%"><b>Tidak ada eskalasi terbuka</b>Belum ada UMK yang diam lebih dari 10 hari setelah 3 pengingat.</div></li>`;
  const aktEntries = Object.entries(s.aktivitas_hari_ini).filter(([k]) => !["SEED", "ROLE_SWITCH"].includes(k)).sort((a, b) => b[1] - a[1]);
  const aktTotal = aktEntries.reduce((a, [, v]) => a + v, 0);
  const akt = aktEntries.map(([k, v]) => `<span class="chip">${esc(k.toLowerCase().replace(/_/g, " "))} <b>${v}</b></span>`).join("") || `<div class="empty"><b>Belum ada aktivitas hari ini</b>Setiap tindakan agen tercatat di sini: input, aturan, keputusan.</div>`;
  const tiles = shown.map(tileHtml).join("") || `<div class="empty board-empty"><b>Tidak ada UMK di tampilan ini</b>Belum ada UMK yang mencapai tahap ini${ui.q ? ` atau cocok dengan "${esc(ui.q)}"` : ""}.<div style="margin-top:10px"><button type="button" class="ghost" data-f="semua">Lihat semua UMK</button></div></div>`;

  render(`
    <section class="hero">
      <div class="hero-main">
        <div class="situasi"><b>${s.siap_unggah}</b> dari <b>${s.total_umk}</b> UMK siap unggah <span class="sep">·</span> <b>${s.hari_tersisa}</b> hari menuju 17 Okt 2026</div>
        <div class="laju ${onTrack ? "ok" : "warn"}"><i></i>Perlu <b>${laju.dibutuhkan_per_hari}</b> UMK selesai per hari untuk mengejar tenggat. Laju 7 hari terakhir: <b>${laju.aktual_7hari_per_hari}</b> per hari${onTrack ? " — sesuai jalur." : " — di bawah kebutuhan."}</div>
        <div class="funnel" role="group" aria-label="Sebaran status">${seg("belum_mulai", "gray", counts.belum_mulai)}${seg("menunggu_dokumen", "amber", counts.menunggu_dokumen)}${seg("review", "blue", counts.review)}${seg("siap", "green", counts.siap)}${seg("tidak_layak", "red", counts.tidak_layak)}</div>
        <div class="funnel-legend"><span><i class="gray"></i>belum mulai ${counts.belum_mulai}</span><span><i class="amber"></i>menunggu dokumen ${counts.menunggu_dokumen}</span><span><i class="blue"></i>menunggu review ${counts.review}</span><span><i class="green"></i>siap / selesai ${counts.siap}</span>${counts.tidak_layak ? `<span><i class="red"></i>reguler / tidak layak ${counts.tidak_layak}</span>` : ""}<span class="muted">${pct}% siap</span></div>
      </div>
      <div class="hero-side">
        <button type="button" class="act ${butuhSaya ? "hot" : ""}" data-f="${counts.eskalasi ? "eskalasi" : "review"}"><small>Butuh tindakan pendamping</small><b>${butuhSaya}</b><span>${counts.eskalasi} eskalasi · ${counts.review} menunggu review</span></button>
        <button type="button" class="act" data-f="menunggu_dokumen"><small>Ditunggu dari UMK</small><b>${dariUmk}</b><span>${counts.menunggu_dokumen} menunggu dokumen · ${counts.belum_mulai} belum mulai</span></button>
        <div class="act info"><small>Agen hari ini</small><b>${aktTotal}</b><span>tindakan tercatat · ${(s.antrean_review ?? []).length} menunggu persetujuan</span></div>
      </div>
    </section>
    <div class="grid2">
      <div class="card">
        <div class="toolbar">
          <div class="fchips">${chip("semua", "Semua")}${chip("belum_mulai", "Belum mulai", "gray")}${chip("menunggu_dokumen", "Menunggu dokumen", "amber")}${chip("review", "Menunggu review", "blue")}${chip("siap", "Siap / selesai", "green")}${chip("eskalasi", "Eskalasi", "red")}<span class="vsep"></span>${chip("diam10", "Diam >10 hari", "amber")}${counts.tidak_layak ? chip("tidak_layak", "Reguler / tidak layak", "red") : ""}</div>
          <div class="tools"><input id="q" type="search" placeholder="Cari kode, nama, produk…" value="${esc(ui.q)}" aria-label="Cari UMK"><select id="sort" aria-label="Urutkan"><option value="mendesak" ${ui.sort === "mendesak" ? "selected" : ""}>Paling mendesak</option><option value="diam" ${ui.sort === "diam" ? "selected" : ""}>Paling lama diam</option><option value="kode" ${ui.sort === "kode" ? "selected" : ""}>Nomor UMK</option></select></div>
        </div>
        <div class="board-head"><span class="muted">${shown.length} dari ${list.length} UMK${ui.filter !== "semua" ? " · filter aktif" : ""}</span><span class="muted">urut: ${ui.sort === "mendesak" ? "paling mendesak (eskalasi → hari diam → dokumen kurang)" : ui.sort === "diam" ? "paling lama diam" : "nomor UMK"}</span></div>
        <div class="board">${tiles}</div>
      </div>
      <div>
        <div class="card"><h2>Aktivitas agen hari ini <span class="cnt">${aktTotal} tindakan</span></h2><div class="chips">${akt}</div></div>
        <div class="card section"><h2>Menunggu persetujuan pendamping <span class="cnt">${(s.antrean_review ?? []).length}</span></h2><ul class="list">${antrean}</ul></div>
        <div class="card section"><h2>Eskalasi terbuka <span class="cnt">${s.eskalasi_terbuka.length}</span></h2><ul class="list">${eskalasi}</ul></div>
        <div class="card section"><h2>Paling mendesak <span class="cnt">5 teratas</span></h2><ul class="list">${mendesak}</ul></div>
      </div>
    </div>`, "papan");

  // interaksi papan (delegasi; render() hanya mengganti HTML bila berubah, jadi listener dipasang di #view sekali)
}
function bindBoardEvents() {
  const v = $("#view");
  v.addEventListener("click", (e) => {
    const b = e.target.closest("[data-f]"); if (!b || !boardCache) return;
    ui.filter = b.dataset.f; paintBoard(); $("#view").dataset.html = ""; paintBoard();
  });
  v.addEventListener("input", (e) => {
    if (e.target.id === "q") { ui.q = e.target.value; const pos = e.target.selectionStart; $("#view").dataset.html = ""; paintBoard(); const q = $("#q"); if (q) { q.focus(); q.setSelectionRange(pos, pos); } }
  });
  v.addEventListener("change", (e) => { if (e.target.id === "sort") { ui.sort = e.target.value; $("#view").dataset.html = ""; paintBoard(); } });
}
async function viewPapan() {
  const [s, list] = await Promise.all([api("/portfolio/1/summary"), api("/umk?koperasi_id=1")]);
  $("#kop").textContent = s.koperasi.nama;
  $("#countdown .num").textContent = s.hari_tersisa;
  boardCache = { s, list: list.umk };
  paintBoard();
}

// ---------- Detail UMK ----------
function langkahBerikutnya(u, d) {
  // Turunan dari keputusan terakhir + status: siapa yang harus bertindak. Tidak ada tombol tulis — dashboard baca-saja.
  const steps = [];
  if (!u.profil.consent_at) steps.push({ who: "UMK", text: "Memberi persetujuan pemrosesan data usaha lewat Telegram", blocked: false });
  const docs = u.documents;
  const kurangUmk = docs.filter((x) => ["kurang", "diminta", "ditolak"].includes(x.status) && !SISTEM.has(x.kode));
  const kurangSis = docs.filter((x) => ["kurang", "diminta"].includes(x.status) && SISTEM.has(x.kode));
  for (const x of kurangUmk) steps.push({ who: "UMK", text: `${dokLabel(x.kode)}${x.status === "diminta" ? ` — sudah diminta ${tgl(x.requested_at)}, agen mengejar` : x.status === "ditolak" ? " — ditolak, perlu ulang" : ""}`, blocked: !u.profil.consent_at });
  if (kurangSis.length) steps.push({ who: "Sistem", text: `Menyusun ${kurangSis.map((x) => dokLabel(x.kode).replace(" (disusun sistem)", "")).join(", ")} setelah data UMK lengkap`, blocked: kurangUmk.length > 0 });
  if (u.status === "siap_review" || (u.dossiers?.[0]?.status === "menunggu_review")) steps.push({ who: "Pendamping", text: `Meninjau berkas v${u.dossiers?.[0]?.versi ?? ""} — Telegram: setuju ${u.kode} atau kembalikan ${u.kode} <alasan>`, blocked: false });
  if (u.status === "siap_unggah") steps.push({ who: "Pendamping", text: `Mengajukan ke SiHalal (simulasi) — Telegram: ajukan ${u.kode}`, blocked: false });
  if (u.status === "selesai_simulasi") steps.push({ who: "Selesai", text: "Pengajuan simulasi diterima. Tidak ada langkah tersisa.", blocked: false });
  if (d && (d.jalur === "REGULER" || d.jalur === "TIDAK_LAYAK")) steps.unshift({ who: "Pendamping", text: d.jalur === "REGULER" ? "Jalur self-declare tidak berlaku (skala/fasilitas) — arahkan ke jalur reguler" : "Produk tidak layak self-declare — lihat alasan di bawah", blocked: false });
  if (!steps.length) steps.push({ who: "Agen", text: "Menunggu foto label untuk memulai evaluasi", blocked: false });
  return steps.map((s, i) => `<li class="${s.blocked ? "blocked" : ""}"><span class="rank">${i + 1}</span><span><span class="who ${s.who.toLowerCase()}">${esc(s.who)}</span> ${esc(s.text)}${s.blocked ? ' <span class="muted">· tertahan</span>' : ""}</span></li>`).join("");
}
function drafPesan(u) {
  const kurang = u.documents.filter((x) => ["kurang", "diminta", "ditolak"].includes(x.status) && !SISTEM.has(x.kode));
  if (!kurang.length) return "";
  const nama = u.nama_usaha; const produk = u.products[0]?.nama ?? "produk Anda";
  const daftar = kurang.map((x) => `- ${dokLabel(x.kode)}${x.status === "ditolak" && x.catatan ? ` (perlu diulang: ${x.catatan.replace(/^dikembalikan pendamping: /, "")})` : ""}`).join("\n");
  return `Halo ${nama}, untuk sertifikasi halal ${produk} masih ada yang kami tunggu:\n${daftar}\nCukup kirim lewat chat ini (foto boleh dari HP). Tenggat wajib halal 17 Oktober 2026, tersisa ${u.hari_tersisa} hari. Terima kasih.`;
}
async function viewUmk(id) {
  const [u, ev] = await Promise.all([api(`/umk/${id}`), api(`/events?umk_id=${id}&limit=60`)]);
  const d = u.keputusan_terakhir;
  const docsUtama = u.documents.filter((x) => !x.kode.startsWith("SERT_PEMASOK:") && x.kode !== "KONFIRMASI_BAHAN" && x.kode !== "PERBAIKAN_OSS");
  const diterima = docsUtama.filter((x) => x.status === "diterima" || x.status === "dihasilkan").length;
  const dokRows = u.documents.map((x) => { const [c, l] = DOKSTAT[x.status] ?? ["gray", x.status]; const cat = x.status === "diminta" && x.requested_at ? `diminta ${tgl(x.requested_at)}${x.catatan ? " · " + x.catatan : ""}` : (x.catatan ?? ""); return `<tr><td><div>${esc(dokLabel(x.kode))}</div><div class="mono muted" style="font-size:11px">${esc(x.kode)}</div></td><td><span class="badge ${c}">${esc(l)}</span></td><td class="muted">${esc(cat)}</td></tr>`; }).join("");
  const bahan = u.products.flatMap((p) => p.ingredients.map((i) => `<tr><td>${esc(i.nama_asli)}</td><td class="mono">${esc(i.nama_normal ?? "–")}</td><td><span class="badge ${i.kelas === "kritis" ? "red" : i.kelas === "tidak_dikenal" ? "amber" : "green"}">${esc(i.kelas.replace(/_/g, " "))}</span></td><td class="mono muted">${esc(i.rule_id ?? "")}</td><td>${i.supplier_cert ? `<span class="badge ${i.supplier_cert.status === "valid" ? "green" : "red"}">${esc(i.supplier_cert.status)}</span> ${esc(i.supplier_cert.nama_pemasok ?? "")}` : (i.kelas === "kritis" ? '<span class="badge red">belum ada</span>' : '<span class="muted">tidak wajib</span>')}</td></tr>`)).join("");
  const alasan = (d?.alasan ?? []).filter((a) => a.hasil !== "lolos").map((a) => `<div class="reason"><span class="rid">${esc(a.rule_id)}</span><div>${esc(a.pesan_umk ?? "")} <span class="muted mono">· ${esc(a.hasil)}</span></div></div>`).join("") || (d ? `<div class="empty"><b>Semua aturan lolos</b>Tidak ada dokumen yang diminta.</div>` : `<div class="empty"><b>Belum dievaluasi</b>Evaluasi berjalan otomatis setelah daftar bahan dikonfirmasi UMK di Telegram.</div>`);
  const lolos = (d?.alasan ?? []).filter((a) => a.hasil === "lolos").length;
  const dossierLinks = (u.dossiers ?? []).map((ds) => `<a class="badge ${ds.status === "disetujui" ? "green" : ds.status === "dikembalikan" ? "amber" : "blue"}" href="${API}/dossier/${ds.id}/pdf" title="status: ${esc(ds.status)}">PDF v${ds.versi} · ${esc(ds.status.replace(/_/g, " "))}</a>`).join("");
  const timeline = ev.events.filter((e) => e.aksi !== "ROLE_SWITCH").map((e) => `<li><span></span><span><div class="when">${esc(tgl(e.created_at))} · ${esc(e.created_at.slice(11, 16))} UTC</div><b>${esc(e.aksi.toLowerCase().replace(/_/g, " "))}</b> <span class="muted">· ${esc(e.actor)}</span>${e.detail?.rules_version ? ` <span class="badge gray">aturan v${esc(String(e.detail.rules_version).split("+")[0])}</span>` : ""}${e.detail ? `<details><summary>detail</summary><pre>${esc(JSON.stringify(e.detail, null, 1)).slice(0, 600)}</pre></details>` : ""}</span></li>`).join("");
  const draf = drafPesan(u);
  const consentBanner = u.profil.consent_at ? "" : `<div class="banner blocker"><b>Agen belum dapat bertindak.</b> ${esc(u.nama_usaha)} belum memberi persetujuan pemrosesan data usaha. Semua permintaan dokumen ditahan sampai UMK menyetujui lewat Telegram.</div>`;

  render(`
    <a href="#/papan" class="crumb">← Papan</a>
    ${consentBanner}
    <div class="card section">
      <div class="detail-head">
        <div><h2 class="detail-title"><span class="kode">${esc(u.kode)}</span>${esc(u.nama_usaha)}</h2><div class="muted" style="margin-top:4px">${esc(u.profil.alamat ?? "")}${u.products[0] ? " · produk: " + esc(u.products[0].nama) : ""}</div></div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center"><span class="badge ${STATUS[u.status]?.[0] ?? "gray"}">${esc(STATUS[u.status]?.[1] ?? u.status)}</span>${d ? `<span class="badge ${JALUR[d.jalur]?.[0] ?? "gray"}">${esc(JALUR[d.jalur]?.[1] ?? d.jalur)} · skor ${d.skor_kesiapan}</span>` : ""}${dossierLinks}</div>
      </div>
      <div class="kv">
        <div><small>NIB</small><span class="mono">${esc(u.profil.nib ?? "–")}</span></div>
        <div><small>KBLI</small><span class="mono">${esc(u.profil.kbli ?? "–")}</span></div>
        <div><small>Skala</small>${esc(u.profil.skala ?? "–")}</div>
        <div><small>Penyelia halal</small>${u.profil.penyelia_halal ? esc(u.profil.penyelia_halal) : '<span class="badge amber">belum ada</span>'}</div>
        <div><small>Consent</small>${u.profil.consent_at ? `<span class="mono">${esc(tgl(u.profil.consent_at))}</span>` : '<span class="badge red">belum</span>'}</div>
        <div><small>Tenggat</small><b>${u.hari_tersisa}</b> hari tersisa</div>
      </div>
    </div>
    <div class="grid2">
      <div>
        <div class="card section"><h2>Langkah berikutnya</h2><ol class="steps">${langkahBerikutnya(u, d)}</ol></div>
        <div class="card section"><h2>Keputusan terakhir <span class="cnt">${d ? `aturan v${esc(String(d.rules_version).split("+")[0])} · ${lolos} lolos` : "belum dievaluasi"}</span></h2>${alasan}<p class="muted" style="margin:10px 0 0;font-size:12px">Jalur dan skor ditetapkan mesin aturan deterministik dari data di atas; agen hanya membaca label dan berbicara. Pendamping dapat mengembalikan berkas kapan saja.</p></div>
        <div class="card section"><h2>Bahan <span class="cnt">${u.products[0] ? esc(u.products[0].nama) : ""}</span></h2><table><thead><tr><th>Terbaca di label</th><th>Nama normal</th><th>Kelas</th><th>Rule</th><th>Sertifikat pemasok</th></tr></thead><tbody>${bahan || `<tr><td colspan="5"><div class="empty"><b>Belum ada bahan terdaftar</b>Daftar bahan terbentuk saat UMK mengirim foto label ke Telegram dan mengonfirmasi hasil bacaan agen.</div></td></tr>`}</tbody></table></div>
      </div>
      <div>
        <div class="card section"><h2>Dokumen <span class="cnt">${diterima} dari ${docsUtama.length} utama siap</span></h2><div class="bar" style="margin:0 0 12px"><i style="width:${docsUtama.length ? Math.round(100 * diterima / docsUtama.length) : 0}%"></i></div><table><thead><tr><th>Dokumen</th><th>Status</th><th>Catatan</th></tr></thead><tbody>${dokRows}</tbody></table></div>
        ${draf ? `<div class="card section"><h2>Draf pesan ke UMK <span class="cnt">bahasa awam</span></h2><textarea class="draf" readonly rows="6">${esc(draf)}</textarea><div style="display:flex;gap:8px;align-items:center;margin-top:8px"><button type="button" id="copy-draf">Salin</button><span class="muted" style="font-size:12px">Agen mengirim versi ini otomatis lewat pengejaran; pendamping bisa menyalinnya untuk WhatsApp/telepon.</span></div></div>` : ""}
        <div class="card section"><h2>Jejak agen <span class="cnt">${ev.events.length} aksi</span></h2><ul class="list timeline">${timeline || '<li><div class="empty" style="width:100%"><b>Belum ada aksi agen</b>Setiap tindakan agen dicatat di sini: input, aturan yang dipakai, keputusan, dan siapa yang memutuskan.</div></li>'}</ul></div>
      </div>
    </div>`, "umk-" + id);
  $("#view").querySelectorAll('a[href*="/dossier/"]').forEach((a) => a.addEventListener("click", async (e) => {
    e.preventDefault();
    const res = await fetch(a.getAttribute("href"), { headers: { Authorization: `Bearer ${token}` } });
    const blob = await res.blob(); window.open(URL.createObjectURL(blob), "_blank");
  }));
  $("#copy-draf")?.addEventListener("click", async (e) => { try { await navigator.clipboard.writeText($(".draf").value); e.target.textContent = "Tersalin"; setTimeout(() => (e.target.textContent = "Salin"), 1500); } catch { $(".draf").select(); } });
}

// ---------- Audit ----------
async function viewAudit() {
  const ev = await api("/events?limit=200");
  const rows = ev.events.map((e) => `<tr><td class="mono muted">${esc(e.created_at)}</td><td><b>${esc(e.aksi.toLowerCase().replace(/_/g, " "))}</b></td><td class="mono">${esc(e.actor)}</td><td>${e.umk_id ? `<a href="#/umk/${e.umk_id}">UMK #${e.umk_id}</a>` : ""}</td><td>${e.detail?.rules_version ? `<span class="badge gray">v${esc(String(e.detail.rules_version).split("+")[0])}</span> ` : ""}<span class="mono muted">${esc(JSON.stringify(e.detail ?? {})).slice(0, 140)}</span></td></tr>`).join("");
  render(`<div class="card"><h2>Audit <span class="cnt">${ev.events.length} aksi terakhir</span></h2><p class="muted" style="margin:0 0 12px">Setiap tindakan agen, UMK, pendamping, dan scheduler, dengan versi aturan yang dipakai. Tidak memuat data pribadi maupun isi dokumen; hanya kode, id, hash, dan status.</p><div style="overflow-x:auto"><table><thead><tr><th>Waktu (UTC)</th><th>Aksi</th><th>Aktor</th><th>UMK</th><th>Aturan &amp; detail</th></tr></thead><tbody>${rows || '<tr><td colspan="5"><div class="empty"><b>Belum ada aksi</b></div></td></tr>'}</tbody></table></div></div>`, "audit");
}

// ---------- Kuota ----------
async function viewKuota() {
  const q = await api("/mock/sehati/quota");
  const rows = q.provinsi.map((p) => `<tr><td>${esc(p.provinsi)}</td><td class="mono">${p.kuota_total.toLocaleString("id-ID")}</td><td class="mono">${p.kuota_terpakai.toLocaleString("id-ID")}</td><td><div class="bar"><i style="width:${100 - p.sisa_persen}%;background:${p.sisa_persen < 10 ? "var(--red)" : "var(--accent)"}"></i></div></td><td><span class="badge ${p.sisa_persen < 10 ? "red" : "green"}">${p.sisa_persen}% sisa</span></td></tr>`).join("");
  render(`<div class="card"><h2>Kuota SEHATI <span class="cnt">per provinsi</span></h2><p class="muted" style="margin:0 0 12px">Angka tiruan untuk demo; bukan data BPJPH. Agen memberi tahu pendamping bila sisa kuota provinsi di bawah 10%.</p><table><thead><tr><th>Provinsi</th><th>Kuota</th><th>Terpakai</th><th>Pemakaian</th><th>Sisa</th></tr></thead><tbody>${rows}</tbody></table></div>`, "kuota");
}

// ---------- router & polling ----------
async function route() {
  if (!token) return showGate();
  const hash = location.hash || "#/papan";
  const [, tab, id] = hash.match(/^#\/(\w+)\/?(\d+)?/) ?? [null, "papan"];
  document.querySelectorAll(".tabs a").forEach((a) => a.classList.toggle("active", a.dataset.tab === tab || (tab === "umk" && a.dataset.tab === "papan")));
  if (!$("#view").dataset.html) $("#view").innerHTML = skeleton();
  try {
    renderHeader();
    if (tab === "umk" && id) await viewUmk(id); else if (tab === "audit") await viewAudit(); else if (tab === "kuota") await viewKuota(); else await viewPapan();
  } catch (e) { if (e.message !== "401") render(`<div class="card"><div class="empty"><b>Tidak bisa memuat data</b>${esc(e.message)}. Dicoba lagi otomatis dalam 10 detik.</div></div>`, "error"); }
  clearTimeout(timer); timer = setTimeout(route, POLL_MS);
}
window.addEventListener("hashchange", route);
bindBoardEvents();
route();
