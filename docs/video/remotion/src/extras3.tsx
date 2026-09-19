import React from "react";
import { Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT } from "./theme";

const ease = Easing.bezier(0.16, 1, 0.3, 1);

export type Article = { file: string; label: string; date: string; headline: string; quote: string; url: string; cropY: number };

/** Sumber berita yang ditampilkan sebagai kartu (tangkapan halaman asli). */
export const ARTICLES: Record<string, Article> = {
  republika4: {
    file: "artikel/republika-4persen.png", label: "REPUBLIKA · Ekonomi Syariah", date: "Jumat, 21 Agustus 2026",
    headline: "Sertifikasi Halal Wajib Oktober 2026, Kesiapan Pelaku Usaha Jadi Tantangan",
    quote: "“Berdasarkan data Bappenas, realitas di lapangan baru sekitar 4 persen pelaku usaha yang produknya bersertifikasi halal.”",
    url: "sharia.republika.co.id/berita/tk3rz0370", cropY: 630,
  },
  kemenag: {
    file: "artikel/republika-kemenag.png", label: "REPUBLIKA · Kemenag", date: "Selasa, 1 September 2026",
    headline: "Kemenag Pastikan Wajib Halal Tetap Berlaku Oktober 2026",
    quote: "“Tidak ada pergeseran waktu atau penundaan jadwal mandatori wajib halal tersebut.” · rakor Kemenko PMK, 12 Agustus 2026",
    url: "sharia.republika.co.id/berita/tkobdl423", cropY: 600,
  },
  kuota: {
    file: "artikel/bpjph-kuota.png", label: "BPJPH · Kementerian Agama", date: "Jumat, 2 Januari 2026",
    headline: "Kabar Gembira, BPJPH Buka Kuota 1,35 Juta Sertifikasi Halal Gratis 2026 bagi UMK",
    quote: "1,35 juta kuota SEHATI · lebih dari 111 ribu Pendamping Proses Produk Halal di seluruh Indonesia",
    url: "bpjph.halal.go.id/detail/kabar-gembira-bpjph-buka-kuota-1-35-juta", cropY: 80,
  },
};

/**
 * Kartu artikel: label sumber, judul, bingkai browser berisi tangkapan halaman yang bergulir pelan, kutipan.
 * `from` = frame mulai (relatif komposisi), `until` = frame akhir (opsional, untuk fade-out).
 */
export const ArticleCard: React.FC<{ a: Article; from: number; until?: number; x: number; y: number; w: number; h: number }> = ({ a, from, until, x, y, w, h }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - from;
  if (local < 0 || (until !== undefined && frame > until)) return null;
  const fadeOut = until !== undefined ? interpolate(frame, [until - 10, until], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
  const shotH = h - 300;
  const scroll = interpolate(local, [0.8 * fps, 9 * fps], [0, 140], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, borderRadius: 18, background: "rgba(10,16,12,0.94)", border: "1px solid rgba(255,255,255,0.12)", overflow: "hidden", fontFamily: FONT, color: C.ink,
      boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
      opacity: interpolate(local, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * fadeOut,
      translate: interpolate(local, [0, 22], ["0px 40px", "0px 0px"], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }) }}>
      {/* label sumber + tanggal */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px 0" }}>
        <span style={{ background: "#c0392b", color: "#fff", fontWeight: 700, fontSize: 18, letterSpacing: 1, padding: "5px 12px", borderRadius: 6, fontFamily: "Consolas, monospace" }}>{a.label}</span>
        <span style={{ color: C.muted, fontSize: 17 }}>{a.date} · sumber terbuka, bukan opini HalalPilot</span>
      </div>
      <div style={{ padding: "10px 18px 0", fontSize: 26, fontWeight: 700, lineHeight: 1.25, fontFamily: "Georgia, 'Times New Roman', serif" }}>{a.headline}</div>
      {/* bingkai browser */}
      <div style={{ margin: "12px 18px 0", borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,0.15)", background: "#1e1e1e" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "#2a2a2a" }}>
          <span style={{ width: 10, height: 10, borderRadius: 5, background: "#e0554f" }} /><span style={{ width: 10, height: 10, borderRadius: 5, background: "#e6b93f" }} /><span style={{ width: 10, height: 10, borderRadius: 5, background: "#57b85a" }} />
          <span style={{ marginLeft: 10, flex: 1, background: "#111", borderRadius: 6, padding: "3px 10px", fontSize: 14, color: C.muted, fontFamily: "Consolas, monospace", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.url}</span>
        </div>
        <div style={{ height: shotH, overflow: "hidden", background: "#fff" }}>
          <Img src={staticFile(a.file)} style={{ width: "100%", height: "auto", translate: `0px ${-(a.cropY + scroll) * (w - 36) / 1280}px` }} />
        </div>
      </div>
      {/* kutipan */}
      <div style={{ position: "absolute", left: 18, right: 18, bottom: 14, fontSize: 20, lineHeight: 1.35, color: C.amber, fontStyle: "italic",
        opacity: interpolate(local, [0.9 * fps, 1.4 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>{a.quote}</div>
    </div>
  );
};
