import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import raw from "../../public/pesan/pesan.json";
import { C, FONT } from "../theme";
import { Avatar } from "./Avatar";

type Clip = { nn: string; teks: string; t0: number; d: number; env: number[] };
export const PESAN = raw as { fps: number; intro: number; bicara: number; total: number; clips: Clip[] };
const ease = Easing.bezier(0.16, 1, 0.3, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Sorot nama sponsor dan HalalPilot di caption. */
const sorot = (teks: string) =>
  teks.split(/(IDwebhost|CloudBaik|PANDI|HalalPilot|AI HackFest 2026|Best Innovation)/g).map((p, i) =>
    i % 2 ? <span key={i} style={{ color: C.amber, fontWeight: 700 }}>{p}</span> : <React.Fragment key={i}>{p}</React.Fragment>);

const Pill: React.FC<{ children: React.ReactNode; size?: number }> = ({ children, size = 30 }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 24px", borderRadius: 999, background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.16)", fontFamily: FONT, fontWeight: 700, fontSize: size, color: C.ink }}>{children}</div>
);

export const PesanKesan: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;

  // klip yang sedang berbunyi dan bukaan mulut (rata-rata 3 frame agar halus)
  const cur = PESAN.clips.find((c) => t >= c.t0 && t < c.t0 + c.d);
  let mouth = 0;
  if (cur) {
    const i = Math.round((t - cur.t0) * fps);
    const e = cur.env;
    mouth = ((e[i - 1] ?? 0) + (e[i] ?? 0) * 2 + (e[i + 1] ?? 0)) / 4;
    mouth = Math.pow(Math.min(1, mouth), 0.7);
  }
  const talk = cur ? 1 : 0;
  // kedip tiap ~3,4 detik, 5 frame
  const bp = frame % 102;
  const blink = bp < 5 ? Math.sin((bp / 5) * Math.PI) : 0;
  // melambai saat "Halo" (klip pertama) dan di ucapan penutup
  const c1 = PESAN.clips[0], cl = PESAN.clips[PESAN.clips.length - 1];
  const wave = Math.max(
    interpolate(t, [c1.t0 - 0.3, c1.t0 + 0.2, c1.t0 + c1.d - 0.4, c1.t0 + c1.d + 0.2], [0, 1, 1, 0], clamp),
    interpolate(t, [cl.t0, cl.t0 + 0.4, PESAN.total - 0.6, PESAN.total], [0, 1, 1, 0.6], clamp),
  );

  const outroAt = PESAN.bicara + 0.2;
  const outro = interpolate(t, [outroAt, outroAt + 0.6], [0, 1], { ...clamp, easing: ease });
  const enter = interpolate(frame, [0, 22], [0, 1], { ...clamp, easing: ease });
  const musik = (f: number) => {
    const s = f / fps; const bic = PESAN.clips.some((c) => s >= c.t0 - 0.3 && s < c.t0 + c.d + 0.3);
    return (bic ? 0.05 : 0.12) * interpolate(f, [0, 20, durationInFrames - 30, durationInFrames], [0, 1, 1, 0], clamp);
  };

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 28% 55%, #24402f 0%, ${C.bg} 55%, #070c09 100%)`, overflow: "hidden" }}>
      {/* titik melayang di latar */}
      {Array.from({ length: 26 }).map((_, i) => {
        const x = (i * 337) % 1920, y0 = (i * 211) % 1080, sp = 8 + (i % 5) * 4;
        return <div key={i} style={{ position: "absolute", left: x, top: (y0 - t * sp + 1080) % 1080, width: 6 + (i % 3) * 3, height: 6 + (i % 3) * 3,
          borderRadius: 99, background: i % 4 ? "rgba(255,255,255,0.06)" : "rgba(224,168,74,0.18)" }} />;
      })}
      {/* sorot cahaya di belakang avatar */}
      <div style={{ position: "absolute", left: 120, top: 150, width: 680, height: 680, borderRadius: "50%", background: "radial-gradient(circle, rgba(224,168,74,0.18) 0%, rgba(224,168,74,0) 65%)" }} />

      {/* avatar */}
      <div style={{ position: "absolute", left: 60, top: 110, width: 800, height: 900, opacity: enter, translate: `0px ${(1 - enter) * 60}px` }}>
        <Avatar mouth={mouth} blink={blink} wave={wave} t={t} talk={talk} />
      </div>

      {/* lencana pemenang */}
      <div style={{ position: "absolute", left: 900, top: 90, right: 80, opacity: enter }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 16, padding: "14px 26px", borderRadius: 16, background: "linear-gradient(90deg,#e0a84a,#f2c46b)",
          color: "#1a1408", fontFamily: FONT, fontWeight: 700, fontSize: 34, boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
          scale: String(interpolate(frame, [6, 26], [0.7, 1], { ...clamp, easing: ease })) }}>
          <span style={{ fontSize: 40 }}>🏆</span> #2 Best Innovation
        </div>
        <div style={{ fontFamily: FONT, fontSize: 30, color: C.muted, marginTop: 14 }}>AI HackFest 2026 · IDwebhost × PANDI</div>
        <div style={{ fontFamily: FONT, fontSize: 64, fontWeight: 700, color: C.ink, marginTop: 6, letterSpacing: -1, opacity: 1 - outro }}>Pesan &amp; Kesan</div>
      </div>

      {/* caption kalimat yang sedang diucapkan */}
      {PESAN.clips.map((c) => {
        const a = Math.round(c.t0 * fps), b = Math.round((c.t0 + c.d) * fps) + 8;
        return (
          <Sequence key={c.nn} from={a} durationInFrames={b - a} layout="none">
            <Cap teks={c.teks} />
          </Sequence>
        );
      })}

      {/* strip sponsor sepanjang video, membesar di penutup */}
      <div style={{ position: "absolute", left: 900, right: 80, bottom: interpolate(outro, [0, 1], [70, 250]), display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center",
        opacity: enter, scale: String(interpolate(outro, [0, 1], [0.8, 1.15])), transformOrigin: "0% 100%" }}>
        <span style={{ fontFamily: FONT, color: C.muted, fontSize: 26, marginRight: 4 }}>Terima kasih</span>
        <Pill><Img src={staticFile("idwebhost-logo-negative.svg")} style={{ height: 30 }} /></Pill>
        <Pill>☁️ CloudBaik</Pill>
        <Pill>🇮🇩 PANDI</Pill>
      </div>

      {/* penutup */}
      <div style={{ position: "absolute", left: 900, right: 80, top: 400, opacity: outro, translate: `0px ${(1 - outro) * 30}px` }}>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 92, color: C.ink, lineHeight: 1, letterSpacing: -2 }}>Terima kasih!</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 28 }}>
          <Img src={staticFile("halalpilot-logo.svg")} style={{ height: 64 }} />
          <div style={{ fontFamily: FONT, color: C.ink }}>
            <div style={{ fontSize: 34, fontWeight: 700 }}>Muhammad Fauzan Ramadhan</div>
            <div style={{ fontSize: 24, color: C.muted }}>HalalPilot · github.com/fauzan3596/HalalPilot</div>
          </div>
        </div>
      </div>

      {PESAN.clips.map((c) => (
        <Sequence key={`a${c.nn}`} from={Math.round(c.t0 * fps)} name={`suara-${c.nn}`}><Audio src={staticFile(`pesan/${c.nn}.mp3`)} /></Sequence>
      ))}
      <Audio src={staticFile("sfx/musik.mp3")} loop volume={musik} />
    </AbsoluteFill>
  );
};

const Cap: React.FC<{ teks: string }> = ({ teks }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <div style={{ position: "absolute", left: 900, right: 80, top: 420,
      opacity: interpolate(frame, [0, 8, durationInFrames - 8, durationInFrames], [0, 1, 1, 0], clamp),
      translate: interpolate(frame, [0, 14], ["0px 24px", "0px 0px"], { ...clamp, easing: ease }) }}>
      <div style={{ padding: "26px 32px", borderRadius: 20, background: "rgba(10,16,12,0.72)", borderLeft: `6px solid ${C.accent}`,
        fontFamily: FONT, fontSize: 44, lineHeight: 1.3, color: C.ink, boxShadow: "0 16px 50px rgba(0,0,0,0.35)" }}>{sorot(teks)}</div>
    </div>
  );
};
