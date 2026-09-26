import React from "react";
import { Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT } from "./theme";
import { f } from "./timeline";

const ease = Easing.bezier(0.16, 1, 0.3, 1);

/** Isyarat teks kinetik: muncul `at` detik setelah caption ke-`cap` mulai (diukur dari jeda di rekaman suara), tampil sampai caption berikutnya. */
export type Cue = { cap: number; at: number; kind: "pct" | "tidak" | "num" | "logo"; text?: string; sub?: string; row?: number };

/** Waktu kata kunci di rekaman adegan 1 (detik relatif awal klip suara, dari silencedetect pada rekam/01-c*.mp3). */
export const KINETIC: Record<string, Cue[]> = {
  "01": [
    { cap: 0, at: 4.46, kind: "pct" },                                           // "... Empat persen."
    { cap: 1, at: 8.03, kind: "tidak" },                                         // "Kemenag bilang: tidak."
    { cap: 2, at: 3.0, kind: "num", text: "1,35 juta", sub: "kuota sertifikasi gratis", row: 0 },
    { cap: 2, at: 5.76, kind: "num", text: "111 ribu", sub: "pendamping halal", row: 1 },
    { cap: 2, at: 7.3, kind: "num", text: "1 : ratusan", sub: "satu pendamping, ratusan UMK", row: 2 },
    { cap: 3, at: 6.51, kind: "logo" },                                          // "Itu yang saya buat."
  ],
};

const pop = (local: number, fps: number) => ({
  opacity: interpolate(local, [0, 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
  scale: String(interpolate(local, [0, 0.45 * fps], [0.55, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease })),
});

/**
 * Lapisan teks kinetik di paruh kiri layar (paruh kanan dipakai kartu artikel): angka 4% raksasa, cap "TIDAK.",
 * tiga angka kuota, dan logo HalalPilot, masing-masing muncul tepat saat kata itu diucapkan.
 */
export const Kinetic: React.FC<{ cues: Cue[]; capStarts: number[]; sceneLen: number }> = ({ cues, capStarts, sceneLen }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const items = cues
    .map((c) => {
      const start = capStarts[c.cap] + f(c.at);
      const end = capStarts[c.cap + 1] !== undefined ? capStarts[c.cap + 1] - 2 : f(sceneLen);
      return { ...c, start, end };
    })
    .filter((c) => frame >= c.start && frame < c.end);
  if (!items.length) return null;
  const first = Math.min(...items.map((i) => i.start));
  const dim = interpolate(frame, [first, first + 8], [0, 0.62], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1000, height: 1080, background: `rgba(6,12,8,${dim})`, pointerEvents: "none" }} />
      {items.map((it, i) => {
        const local = frame - it.start;
        const p = pop(local, fps);
        if (it.kind === "pct") {
          return (
            <div key={i} style={{ position: "absolute", left: 0, width: 1000, top: 250, textAlign: "center", fontFamily: FONT, color: C.ink, ...p, transformOrigin: "50% 60%" }}>
              <div style={{ fontSize: 340, fontWeight: 700, lineHeight: 1, letterSpacing: -14, textShadow: "0 12px 50px rgba(0,0,0,.7)" }}>
                4<span style={{ color: C.amber, letterSpacing: -6 }}>%</span>
              </div>
              <div style={{ fontSize: 36, marginTop: 14, color: "#d8e2db", opacity: interpolate(local, [10, 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
                pelaku usaha yang produknya bersertifikat halal
              </div>
            </div>
          );
        }
        if (it.kind === "tidak") {
          return (
            <div key={i} style={{ position: "absolute", left: 0, width: 1000, top: 330, display: "flex", justifyContent: "center", ...p, transformOrigin: "50% 50%" }}>
              <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 210, lineHeight: 1, color: "#ff5a47", border: "12px solid #ff5a47", borderRadius: 28, padding: "10px 46px 24px", letterSpacing: -4,
                transform: "rotate(-6deg)", boxShadow: "0 30px 80px rgba(0,0,0,.6)", background: "rgba(40,12,10,.55)" }}>TIDAK.</div>
            </div>
          );
        }
        if (it.kind === "num") {
          return (
            <div key={i} style={{ position: "absolute", left: 70, top: 236 + (it.row ?? 0) * 200, display: "grid", gridTemplateColumns: "560px 340px", alignItems: "baseline", columnGap: 24, fontFamily: FONT, color: C.ink, ...p, transformOrigin: "0% 80%" }}>
              <div style={{ fontSize: 112, fontWeight: 700, lineHeight: 1, letterSpacing: -4, whiteSpace: "nowrap", textAlign: "right", color: it.row === 2 ? "#ff5a47" : C.amber, textShadow: "0 10px 40px rgba(0,0,0,.6)" }}>{it.text}</div>
              <div style={{ fontSize: 30, color: "#d8e2db", lineHeight: 1.2, borderLeft: "3px solid rgba(255,255,255,.25)", paddingLeft: 18 }}>{it.sub}</div>
            </div>
          );
        }
        return (
          <div key={i} style={{ position: "absolute", left: 0, width: 1000, top: 360, display: "flex", justifyContent: "center", alignItems: "center", gap: 30, ...p, transformOrigin: "50% 50%" }}>
            <Img src={staticFile("halalpilot-logo.svg")} style={{ height: 170, filter: "drop-shadow(0 16px 40px rgba(0,0,0,.6))" }} />
            <div style={{ fontFamily: FONT, color: C.ink }}>
              <div style={{ fontSize: 120, fontWeight: 700, letterSpacing: -4, lineHeight: 1 }}>HalalPilot</div>
              <div style={{ fontSize: 30, color: "#d8e2db", marginTop: 10 }}>agen AI yang mengerjakan dan menagih berkas</div>
            </div>
          </div>
        );
      })}
    </>
  );
};
