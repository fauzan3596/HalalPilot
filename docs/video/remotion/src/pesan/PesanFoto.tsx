import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT } from "../theme";
import { PESAN } from "./PesanKesan";

const ease = Easing.bezier(0.16, 1, 0.3, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Koordinat wajah pada avatar-foto.webp (1024×572), diukur dari potongan bergrid.
const IMG = { w: 1024, h: 572 };
const EYES = [{ cx: 470, cy: 195, rx: 21, ry: 11.5 }, { cx: 560, cy: 191, rx: 22, ry: 11.5 }];
const SKIN = "#f1b689", LID = "#e2a77f";
const FACE = { x: 515, y: 230 };   // titik pusat gerak kepala

const sorot = (teks: string) =>
  teks.split(/(IDwebhost|CloudBaik|PANDI|HalalPilot|AI HackFest 2026|Best Innovation)/g).map((p, i) =>
    i % 2 ? <span key={i} style={{ color: C.amber, fontWeight: 700 }}>{p}</span> : <React.Fragment key={i}>{p}</React.Fragment>);

const Pill: React.FC<{ children: React.ReactNode; size?: number }> = ({ children, size = 26 }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 20px", borderRadius: 999, background: "rgba(10,16,12,0.72)",
    border: "1px solid rgba(255,255,255,0.18)", fontFamily: FONT, fontWeight: 700, fontSize: size, color: C.ink, backdropFilter: "blur(6px)" }}>{children}</div>
);

/** Lapisan wajah di atas foto: kelopak mata untuk kedip, mulut yang membuka mengikuti suara. */
const Face: React.FC<{ mouth: number; blink: number }> = ({ mouth, blink }) => {
  const h = mouth * 20;   // bukaan mulut (px foto)
  const L = { x: 488, y: 271 }, R = { x: 552, y: 265 };
  return (
    <svg viewBox={`0 0 ${IMG.w} ${IMG.h}`} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
      <defs>
        {EYES.map((e, i) => (
          <clipPath key={i} id={`eye${i}`}><ellipse cx={e.cx} cy={e.cy} rx={e.rx + 3} ry={e.ry + 3} /></clipPath>
        ))}
      </defs>
      {blink > 0.02 && EYES.map((e, i) => {
        const top = e.cy - e.ry - 3, lid = (2 * e.ry + 6) * blink;
        return (
          <g key={i} clipPath={`url(#eye${i})`}>
            <rect x={e.cx - e.rx - 4} y={top} width={2 * e.rx + 8} height={lid} fill={SKIN} />
            <rect x={e.cx - e.rx - 4} y={top} width={2 * e.rx + 8} height={lid * 0.35} fill={LID} />
            <path d={`M${e.cx - e.rx - 2} ${top + lid} Q${e.cx} ${top + lid + 3} ${e.cx + e.rx + 2} ${top + lid}`} stroke="#2a1d16" strokeWidth={2.2} fill="none" />
          </g>
        );
      })}
      {/* garis mata terpejam (di luar clip, agar tetap terlihat saat kelopak menutup penuh) */}
      {blink > 0.55 && EYES.map((e, i) => (
        <path key={`c${i}`} d={`M${e.cx - e.rx - 1} ${e.cy - 1} Q${e.cx} ${e.cy + 6} ${e.cx + e.rx + 1} ${e.cy - 1}`} stroke="#241912" strokeWidth={2.8} fill="none" strokeLinecap="round" />
      ))}
      {h > 0.8 && (
        <g>
          {/* rongga mulut: tepi atas mengikuti garis senyum asli, tepi bawah turun sesuai suara */}
          <path d={`M${L.x} ${L.y} Q520 276 ${R.x} ${R.y} Q522 ${276 + h * 1.6} ${L.x} ${L.y} Z`} fill="#4a1a16" stroke="#2c1a14" strokeWidth={1.6} />
          <path d={`M${L.x + 5} ${L.y + 0.6} Q520 276.5 ${R.x - 5} ${R.y + 1.2} L${R.x - 7} ${R.y + 1.2 + Math.min(4, h * 0.3)} Q520 ${277 + Math.min(4.5, h * 0.32)} ${L.x + 7} ${L.y + 0.6 + Math.min(4, h * 0.3)} Z`}
            fill="#fbf4ee" opacity={h > 3 ? 0.95 : 0} />
          <ellipse cx={521} cy={273 + h * 1.05} rx={13} ry={Math.max(0.5, h * 0.33)} fill="#c0574d" opacity={h > 5 ? 0.9 : 0} />
        </g>
      )}
    </svg>
  );
};

export const PesanFoto: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const t = frame / fps;

  const cur = PESAN.clips.find((c) => t >= c.t0 && t < c.t0 + c.d);
  let mouth = 0;
  if (cur) {
    const i = Math.round((t - cur.t0) * fps), e = cur.env;
    mouth = Math.pow(Math.min(1, ((e[i - 1] ?? 0) + (e[i] ?? 0) * 2 + (e[i + 1] ?? 0)) / 4), 0.7);
  }
  const talk = cur ? 1 : 0;
  const bp = (frame + 40) % 105;
  const blink = bp < 6 ? Math.sin((bp / 6) * Math.PI) : 0;

  // foto menutupi bingkai 1920×1080; gerak kamera pelan mendekat ke wajah + "napas" + anggukan kecil saat bicara
  const s = Math.max(width / IMG.w, height / IMG.h);
  const zoom = interpolate(t, [0, PESAN.total], [1.0, 1.07]) * (1 + 0.004 * Math.sin(t * 1.7));
  const nod = talk * (Math.sin(t * 6.3) * 1.2 + mouth * 1.5);
  const outroAt = PESAN.bicara + 0.2;
  const outro = interpolate(t, [outroAt, outroAt + 0.7], [0, 1], { ...clamp, easing: ease });
  const enter = interpolate(frame, [0, 24], [0, 1], { ...clamp, easing: ease });
  const musik = (f: number) => {
    const ss = f / fps; const bic = PESAN.clips.some((c) => ss >= c.t0 - 0.3 && ss < c.t0 + c.d + 0.3);
    return (bic ? 0.05 : 0.12) * interpolate(f, [0, 20, durationInFrames - 30, durationInFrames], [0, 1, 1, 0], clamp);
  };

  return (
    <AbsoluteFill style={{ background: "#0b100d", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: (width - IMG.w * s) / 2, top: (height - IMG.h * s) / 2, width: IMG.w * s, height: IMG.h * s,
        transformOrigin: `${(FACE.x / IMG.w) * 100}% ${(FACE.y / IMG.h) * 100}%`,
        transform: `scale(${zoom}) translateY(${nod}px)` , opacity: interpolate(frame, [0, 12], [0, 1], clamp) }}>
        <Img src={staticFile("pesan/avatar-foto.webp")} style={{ width: "100%", height: "100%", display: "block" }} />
        <Face mouth={mouth} blink={blink} />
      </div>
      {/* gradasi agar teks terbaca */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.65) 100%)" }} />
      <AbsoluteFill style={{ background: `rgba(6,12,8,${0.45 * outro})` }} />

      {/* lencana pemenang, kiri atas */}
      <div style={{ position: "absolute", left: 60, top: 50, opacity: enter, translate: `${(1 - enter) * -40}px 0px` }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 14, padding: "12px 24px", borderRadius: 16, background: "linear-gradient(90deg,#e0a84a,#f2c46b)",
          color: "#1a1408", fontFamily: FONT, fontWeight: 700, fontSize: 32, boxShadow: "0 12px 40px rgba(0,0,0,0.4)" }}>
          <span style={{ fontSize: 36 }}>🏆</span> #2 Best Innovation
        </div>
        <div style={{ fontFamily: FONT, fontSize: 26, color: "#fff", marginTop: 12, textShadow: "0 2px 10px rgba(0,0,0,0.7)" }}>AI HackFest 2026 · Pesan &amp; Kesan</div>
      </div>

      {/* sponsor, kanan atas → membesar ke tengah bawah di penutup */}
      <div style={{ position: "absolute", right: 60, top: 56, display: "flex", gap: 12, alignItems: "center", opacity: enter * (1 - outro) }}>
        <Pill><Img src={staticFile("idwebhost-logo-negative.svg")} style={{ height: 26 }} /></Pill>
        <Pill>☁️ CloudBaik</Pill>
        <Pill>🇮🇩 PANDI</Pill>
      </div>

      {/* caption kalimat yang sedang diucapkan */}
      {PESAN.clips.map((c) => {
        const a = Math.round(c.t0 * fps), b = Math.round((c.t0 + c.d) * fps) + 8;
        return <Sequence key={c.nn} from={a} durationInFrames={b - a} layout="none"><Cap teks={c.teks} /></Sequence>;
      })}

      {/* penutup */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 70, display: "flex", flexDirection: "column", alignItems: "center", gap: 22,
        opacity: outro, translate: `0px ${(1 - outro) * 30}px` }}>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 88, color: "#fff", letterSpacing: -2, textShadow: "0 6px 30px rgba(0,0,0,0.6)" }}>Terima kasih!</div>
        <div style={{ display: "flex", gap: 14 }}>
          <Pill size={30}><Img src={staticFile("idwebhost-logo-negative.svg")} style={{ height: 32 }} /></Pill>
          <Pill size={30}>☁️ CloudBaik</Pill>
          <Pill size={30}>🇮🇩 PANDI</Pill>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontFamily: FONT, color: "#fff", textShadow: "0 2px 10px rgba(0,0,0,0.7)" }}>
          <Img src={staticFile("halalpilot-logo.svg")} style={{ height: 44 }} />
          <span style={{ fontSize: 30, fontWeight: 700 }}>Muhammad Fauzan Ramadhan</span>
          <span style={{ fontSize: 24, color: "#d8e2db" }}>· HalalPilot · github.com/fauzan3596/HalalPilot</span>
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
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 60, display: "flex", justifyContent: "center",
      opacity: interpolate(frame, [0, 8, durationInFrames - 8, durationInFrames], [0, 1, 1, 0], clamp),
      translate: interpolate(frame, [0, 14], ["0px 24px", "0px 0px"], { ...clamp, easing: ease }) }}>
      <div style={{ maxWidth: 1400, padding: "20px 32px", borderRadius: 18, background: "rgba(10,16,12,0.78)", borderLeft: `6px solid ${C.accent}`,
        fontFamily: FONT, fontSize: 40, lineHeight: 1.3, color: C.ink, boxShadow: "0 16px 50px rgba(0,0,0,0.4)", textAlign: "center" }}>{sorot(teks)}</div>
    </div>
  );
};
