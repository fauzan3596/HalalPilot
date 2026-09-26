import React from "react";
import { Audio } from "@remotion/media";
import { Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT } from "./theme";
import { timeline } from "./timeline";
import { DarkBackdrop, Watermark } from "./ui";

const ease = Easing.bezier(0.16, 1, 0.3, 1);

const Line: React.FC<{ text: string; size: number; y: number; at: number; weight?: number; color?: string; left?: number; right?: number; align?: "center" | "left" }> = ({ text, size, y, at, weight = 400, color = C.ink, left = 0, right = 0, align = "center" }) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute",
        left,
        right,
        top: y * 1080,
        textAlign: align,
        fontFamily: FONT,
        fontSize: size,
        fontWeight: weight,
        color,
        opacity: interpolate(frame, [at, at + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        translate: interpolate(frame, [at, at + 22], ["0px 28px", "0px 0px"], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }),
      }}
    >
      {text}
    </div>
  );
};

export const Opener: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const o = timeline.opener;
  // isyarat dari rekaman 00-pembuka (mulai 0,8 s): "Ini HalalPilot:" ≈ 2,8 s; "Semuanya jalan di VPS…" ≈ 7,1 s
  const t = (sec: number) => Math.round((0.8 + sec) * fps);
  return (
    <DarkBackdrop>
      {o.mp3 ? <Sequence from={Math.round(0.8 * fps)}><Audio src={staticFile(`tts/${o.mp3}`)} /></Sequence> : null}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0.2 * 1080, display: "flex", justifyContent: "center", alignItems: "center", gap: 44,
        opacity: interpolate(frame, [t(2.6), t(2.6) + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        scale: String(interpolate(frame, [t(2.6), t(2.6) + 26], [0.7, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease })) }}>
        <Img src={staticFile("halalpilot-logo.svg")} style={{ height: 230, filter: "drop-shadow(0 20px 50px rgba(0,0,0,.6))" }} />
        <div style={{ fontFamily: FONT, color: C.ink }}>
          <div style={{ fontSize: 150, fontWeight: 700, letterSpacing: -5, lineHeight: 1 }}>HalalPilot</div>
          <div style={{ fontSize: 30, color: C.muted, marginTop: 8, letterSpacing: 3, textTransform: "uppercase" }}>demo AI HackFest 2026</div>
        </div>
      </div>
      <Line text="Agen AI yang menyiapkan berkas halal UMK, lalu mengejarnya sampai lengkap." size={42} y={0.56} at={t(3.6)} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 0.68 * 1080, height: 3, display: "flex", justifyContent: "center" }}>
        <div style={{ height: 3, background: C.accent, width: interpolate(frame, [t(6.9), t(6.9) + 24], [0, 520], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }) }} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0.74 * 1080, display: "flex", justifyContent: "center", alignItems: "center", gap: 28,
        opacity: interpolate(frame, [t(7.1), t(7.1) + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        translate: interpolate(frame, [t(7.1), t(7.1) + 22], ["0px 28px", "0px 0px"], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }) }}>
        <span style={{ fontFamily: FONT, color: C.ink, fontSize: 36 }}>Semuanya berjalan di VPS</span>
        <Img src={staticFile("idwebhost-logo-negative.svg")} style={{ height: 56 }} />
        <span style={{ fontFamily: FONT, color: C.amber, fontSize: 36, fontWeight: 700 }}>AI Hosting</span>
      </div>
    </DarkBackdrop>
  );
};

export const Closer: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = timeline.closer;
  const batas = [
    "Menyiapkan berkas, bukan menerbitkan sertifikat.",
    "OSS, SEHATI, SiHalal dalam demo ini simulasi berlabel.",
    "Tanpa KTP, nomor HP, rekening. Data bisa dihapus.",
    "Muat di satu VPS AI Hosting IDwebhost 4 vCPU / 4 GB.",
  ];
  return (
    <DarkBackdrop>
      {c.mp3 ? <Sequence from={Math.round(0.8 * fps)}><Audio src={staticFile(`tts/${c.mp3}`)} /></Sequence> : null}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0.1 * 1080, display: "flex", justifyContent: "center", alignItems: "center", gap: 22,
        opacity: interpolate(frame, [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        scale: String(interpolate(frame, [0, 30], [0.9, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease })) }}>
        <Img src={staticFile("halalpilot-logo.svg")} style={{ height: 84 }} />
        <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 84, color: C.ink, letterSpacing: -2 }}>HalalPilot</span>
      </div>
      {batas.map((t, i) => (
        <div key={t} style={{ position: "absolute", left: 0, right: 0, top: (0.3 + i * 0.09) * 1080, display: "flex", justifyContent: "center", alignItems: "center", gap: 18,
          opacity: interpolate(frame, [30 + i * 22, 44 + i * 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          translate: interpolate(frame, [30 + i * 22, 52 + i * 22], ["-30px 0px", "0px 0px"], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }) }}>
          <span style={{ width: 14, height: 14, borderRadius: 7, background: C.accent, display: "inline-block" }} />
          <span style={{ fontFamily: FONT, fontSize: 40, color: C.ink }}>{t}</span>
        </div>
      ))}
      <Line text="Model memutuskan bahasa. Kode memutuskan hukum." size={46} y={0.71} at={130} weight={700} color={C.amber} />
      <Line text="Kode, aturan YAML, konfigurasi OpenClaw: terbuka (MIT) · tautan di deskripsi video" size={28} y={0.85} at={160} color={C.muted} />
      <Watermark />
    </DarkBackdrop>
  );
};
