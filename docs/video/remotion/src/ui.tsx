import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT } from "./theme";

const ease = Easing.bezier(0.16, 1, 0.3, 1);

/** Badge IDwebhost di kanan bawah, tampil sepanjang video. */
export const Watermark: React.FC = () => {
  return (
    <div
      style={{
        position: "absolute",
        right: 40,
        bottom: 40,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "12px 20px",
        borderRadius: 12,
        background: "rgba(10,16,12,0.78)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <Img src={staticFile("idwebhost-logo-negative.svg")} style={{ height: 30 }} />
      <span style={{ fontFamily: FONT, fontSize: 20, color: C.muted, letterSpacing: 0.3 }}>AI Hosting</span>
    </div>
  );
};

/** Judul adegan meluncur dari kiri, keluar setelah `until` detik. Menampilkan progres adegan. */
export const SceneTitle: React.FC<{ text: string; index: number; total: number; until?: number }> = ({ text, index, total, until = 5.5 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const outStart = until * fps;
  const [nomor, ...rest] = text.split(" · ");
  const judul = rest.join(" · ");
  return (
    <div
      style={{
        position: "absolute",
        left: 40,
        top: 36,
        display: "flex",
        alignItems: "stretch",
        opacity: interpolate(frame, [0, 8, outStart, outStart + 12], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        translate: interpolate(frame, [0, 22, outStart, outStart + 14], ["-60px 0px", "0px 0px", "0px 0px", "-40px 0px"], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }),
      }}
    >
      <div style={{ background: C.accent, color: C.ink, fontFamily: FONT, fontWeight: 700, fontSize: 30, padding: "10px 18px", borderRadius: "12px 0 0 12px", display: "flex", alignItems: "center" }}>
        {nomor}
        <span style={{ fontWeight: 300, opacity: 0.8, fontSize: 22, marginLeft: 8 }}>/ {total}</span>
      </div>
      <div style={{ background: "rgba(10,16,12,0.85)", color: C.ink, fontFamily: FONT, fontSize: 30, padding: "10px 22px", borderRadius: "0 12px 12px 0", display: "flex", alignItems: "center", borderLeft: `2px solid ${C.bg}` }}>
        <span style={{ clipPath: `inset(0 ${interpolate(frame, [8, 34], [100, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease })}% 0 0)` }}>{judul}</span>
      </div>
    </div>
  );
};

/** Garis progres adegan tipis di tepi atas. */
export const Progress: React.FC<{ index: number; total: number }> = ({ index, total }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const p = (index + interpolate(frame, [0, durationInFrames], [0, 1], { extrapolateRight: "clamp" })) / total;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: 6, background: "rgba(255,255,255,0.12)" }}>
      <div style={{ width: `${p * 100}%`, height: "100%", background: C.accent }} />
    </div>
  );
};

/** Sorot angka dan kata kunci di caption. */
const highlight = (text: string) => {
  const parts = text.split(/(\d[\d.,]*(?:\s?(?:persen|dari 100|MB|megabyte|GB|gigabyte|vCPU|ribu|juta|hari))?|SELF_DECLARE_\w+|HalalPilot|OpenClaw|IDwebhost)/g);
  return parts.map((p, i) => (i % 2 === 1 ? <span key={i} style={{ color: C.amber, fontWeight: 700 }}>{p}</span> : <React.Fragment key={i}>{p}</React.Fragment>));
};

/** Caption narasi: naik dari bawah, keluar dengan memudar. Durasi = panjang Sequence pembungkusnya. */
export const Caption: React.FC<{ text: string; side?: "center" | "right" }> = ({ text, side = "center" }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <div
      style={{
        position: "absolute",
        left: side === "right" ? 1040 : 0,
        right: side === "right" ? 40 : 0,
        bottom: side === "right" ? 140 : 64,
        display: "flex",
        justifyContent: side === "right" ? "flex-end" : "center",
        opacity: interpolate(frame, [0, 8, durationInFrames - 8, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        translate: interpolate(frame, [0, 14], ["0px 26px", "0px 0px"], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }),
      }}
    >
      <div
        style={{
          maxWidth: side === "right" ? 840 : 1360,
          padding: "16px 28px",
          borderRadius: 14,
          background: C.box,
          borderLeft: `6px solid ${C.accent}`,
          color: C.ink,
          fontFamily: FONT,
          fontSize: side === "right" ? 32 : 36,
          lineHeight: 1.35,
          textAlign: "left",
          boxShadow: "0 10px 40px rgba(0,0,0,0.35)",
        }}
      >
        {highlight(text)}
      </div>
    </div>
  );
};

/** Latar gelap dengan gradasi lembut untuk kartu. */
export const DarkBackdrop: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at ${50 + Math.sin(frame / 90) * 6}% 40%, ${C.bg2} 0%, ${C.bg} 70%)` }}>
      {children}
    </AbsoluteFill>
  );
};
