import React from "react";
import { Audio } from "@remotion/media";
import { Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT } from "./theme";
import { timeline } from "./timeline";
import { DarkBackdrop, Watermark } from "./ui";

const ease = Easing.bezier(0.16, 1, 0.3, 1);

const Line: React.FC<{ text: string; size: number; y: number; at: number; weight?: number; color?: string }> = ({ text, size, y, at, weight = 400, color = C.ink }) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: y * 1080,
        textAlign: "center",
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
  const pct = interpolate(frame, [8, 8 + 1.6 * fps], [0, 4], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <DarkBackdrop>
      {o.mp3 ? <Sequence from={Math.round(0.8 * fps)}><Audio src={staticFile(`tts/${o.mp3}`)} /></Sequence> : null}
      {/* angka 4% menghitung naik */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0.1 * 1080, textAlign: "center", fontFamily: FONT, fontWeight: 700, fontSize: 210, color: C.ink, letterSpacing: -6,
        scale: String(interpolate(frame, [0, 30], [0.85, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease })) }}>
        {pct.toFixed(pct < 4 ? 1 : 0)}
        <span style={{ color: C.amber }}>%</span>
      </div>
      <Line text="pelaku usaha yang produknya bersertifikat halal" size={46} y={0.43} at={20} />
      <Line text="INDEF mengutip Bappenas 2026 · Republika, 21 Agustus 2026" size={28} y={0.51} at={28} color={C.muted} />
      {/* garis pemisah */}
      <div style={{ position: "absolute", left: "50%", top: 0.6 * 1080, height: 3, background: C.accent, translate: "-50% 0",
        width: interpolate(frame, [40, 70], [0, 520], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }) }} />
      <Line text="17 Oktober 2026: makanan-minuman UMK wajib halal (PP 42/2024)" size={40} y={0.64} at={46} weight={700} />
      <Line text="HalalPilot · agen OpenClaw yang menyiapkan dan mengejar berkas self-declare untuk koperasi UMK" size={32} y={0.76} at={70} />
      {/* logo */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0.85 * 1080, display: "flex", justifyContent: "center", alignItems: "center", gap: 28,
        opacity: interpolate(frame, [95, 115], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
        <Img src={staticFile("halalpilot-logo.svg")} style={{ height: 56 }} />
        <span style={{ fontFamily: FONT, color: C.muted, fontSize: 26 }}>berjalan di VPS AI Hosting</span>
        <Img src={staticFile("idwebhost-logo-negative.svg")} style={{ height: 40 }} />
        <span style={{ fontFamily: FONT, color: C.muted, fontSize: 26 }}>· demo AI HackFest 2026</span>
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
