import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, Easing, Img, interpolate, random, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import raw from "../../public/pesan/pesan.json";
import { FONT } from "../theme";

type Word = { w: string; t: number; d: number };
type Clip = { nn: string; teks: string; t0: number; d: number; env: number[]; words: Word[] };
const P = raw as { fps: number; intro: number; bicara: number; total: number; clips: Clip[] };
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.bezier(0.16, 1, 0.3, 1);
const GOLD = "#f4c56a", GOLD2 = "#e0a84a", INK = "#fffaf2";

// lapis foto (2048×1144 = 2× foto asli 1024×572). Koordinat di bawah dalam piksel foto ASLI.
const IMG = { w: 1024, h: 572 };
const EYES = [{ cx: 470, cy: 195, rx: 21, ry: 11.5 }, { cx: 560, cy: 191, rx: 22, ry: 11.5 }];
const NECK = { x: 515, y: 318 };      // poros kepala
const SKIN = "#f1b689", LID = "#e2a77f";

// ---------- util ----------
const at = (nn: string) => P.clips.find((c) => c.nn === nn)!;
/** detik absolut saat kata (potongan teks) dalam kalimat nn mulai diucapkan */
const wordAt = (nn: string, needle: string) => {
  const c = at(nn); const bare = (x: string) => x.toLowerCase().replace(/[^a-z0-9#-]/g, "");
  const w = c.words.find((x) => bare(x.w) === bare(needle)) ?? c.words.find((x) => x.w.toLowerCase().includes(needle.toLowerCase()));
  return c.t0 + (w ? w.t : 0);
};
const SPONSOR_T = { idw: wordAt("02", "IDwebhost"), cb: wordAt("02", "CloudBaik"), pandi: wordAt("02", "PANDI") };
const TROFI_T = wordAt("03", "kedua");
const ALUR_T = wordAt("05", "AI");
const HARI_T = wordAt("04", "sepuluh");

/** amplitudo suara saat ini (0..1), dihaluskan */
const level = (t: number, fps: number) => {
  const c = P.clips.find((x) => t >= x.t0 && t < x.t0 + x.d);
  if (!c) return 0;
  const i = Math.round((t - c.t0) * fps), e = c.env;
  let s = 0, n = 0;
  for (let k = -2; k <= 2; k++) { const v = e[i + k]; if (v !== undefined) { s += v * (3 - Math.abs(k)); n += 3 - Math.abs(k); } }
  return n ? Math.pow(Math.min(1, s / n), 0.7) : 0;
};
/** noise halus (jumlah sinus) untuk gerak tangan-kamera */
const drift = (t: number, seed: number, amp: number) =>
  amp * (Math.sin(t * 0.71 + seed) * 0.5 + Math.sin(t * 1.37 + seed * 2.1) * 0.3 + Math.sin(t * 2.9 + seed * 3.7) * 0.2);

// ---------- wajah (mulut + kedip) di atas lapis kepala ----------
const Face: React.FC<{ mouth: number; blink: number }> = ({ mouth, blink }) => {
  const h = mouth * 20;
  const L = { x: 488, y: 271 }, R = { x: 552, y: 265 };
  return (
    <svg viewBox={`0 0 ${IMG.w} ${IMG.h}`} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
      <defs>{EYES.map((e, i) => <clipPath key={i} id={`se${i}`}><ellipse cx={e.cx} cy={e.cy} rx={e.rx + 3} ry={e.ry + 3} /></clipPath>)}</defs>
      {blink > 0.02 && EYES.map((e, i) => {
        const top = e.cy - e.ry - 3, lid = (2 * e.ry + 6) * blink;
        return (
          <g key={i} clipPath={`url(#se${i})`}>
            <rect x={e.cx - e.rx - 4} y={top} width={2 * e.rx + 8} height={lid} fill={SKIN} />
            <rect x={e.cx - e.rx - 4} y={top} width={2 * e.rx + 8} height={lid * 0.35} fill={LID} />
          </g>
        );
      })}
      {blink > 0.55 && EYES.map((e, i) => (
        <path key={`c${i}`} d={`M${e.cx - e.rx - 1} ${e.cy - 1} Q${e.cx} ${e.cy + 6} ${e.cx + e.rx + 1} ${e.cy - 1}`} stroke="#241912" strokeWidth={2.8} fill="none" strokeLinecap="round" />
      ))}
      {h > 0.8 && (
        <g>
          <path d={`M${L.x} ${L.y} Q520 276 ${R.x} ${R.y} Q522 ${276 + h * 1.6} ${L.x} ${L.y} Z`} fill="#4a1a16" stroke="#2c1a14" strokeWidth={1.6} />
          <path d={`M${L.x + 5} ${L.y + 0.6} Q520 276.5 ${R.x - 5} ${R.y + 1.2} L${R.x - 7} ${R.y + 1.2 + Math.min(4, h * 0.3)} Q520 ${277 + Math.min(4.5, h * 0.32)} ${L.x + 7} ${L.y + 0.6 + Math.min(4, h * 0.3)} Z`}
            fill="#fbf4ee" opacity={h > 3 ? 0.95 : 0} />
          <ellipse cx={521} cy={273 + h * 1.05} rx={13} ry={Math.max(0.5, h * 0.33)} fill="#c0574d" opacity={h > 5 ? 0.9 : 0} />
        </g>
      )}
    </svg>
  );
};

// ---------- avatar 2.5D: latar (paralaks + blur), badan (napas), kepala (miring/angguk mengikuti suara) ----------
const Avatar: React.FC<{ t: number; fps: number; frame: number }> = ({ t, fps, frame }) => {
  const lv = level(t, fps);
  const talking = lv > 0.04 ? 1 : 0;
  // kepala: miring pelan + angguk kecil saat tekanan suara, dengan sedikit "overshoot" pakai drift
  const tilt = drift(t, 1.3, 2.2) + talking * Math.sin(t * 3.1) * 1.6;
  const nod = lv * 7 + drift(t, 4.1, 2.5);
  const turn = drift(t, 7.7, 6);           // geser kiri-kanan (px foto) ≈ menoleh
  const breath = Math.sin(t * 1.6) * 0.006;
  const bp = (frame + 40) % 110;
  const blink = bp < 6 ? Math.sin((bp / 6) * Math.PI) : 0;
  const layer = (z: React.ReactNode, style: React.CSSProperties = {}) =>
    <div style={{ position: "absolute", inset: 0, ...style }}>{z}</div>;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {layer(<Img src={staticFile("pesan/lapis/body.png")} style={{ width: "100%", height: "100%" }} />,
        { transformOrigin: "50% 100%", transform: `scale(${1 + breath}, ${1 + breath * 1.6})` })}
      {layer(
        <>
          <Img src={staticFile("pesan/lapis/head.png")} style={{ width: "100%", height: "100%" }} />
          <Face mouth={lv} blink={blink} />
        </>,
        { transformOrigin: `${(NECK.x / IMG.w) * 100}% ${(NECK.y / IMG.h) * 100}%`,
          transform: `translate(${turn * 0.12}%, ${nod * 0.12 - breath * 60}%) rotate(${tilt}deg)` })}
    </div>
  );
};

// ---------- caption karaoke: kata muncul satu per satu, kata aktif menyala emas ----------
const SOROT = /IDwebhost|CloudBaik|PANDI|HalalPilot|HackFest|Best|Innovation|kedua|sepuluh|halal|UMK|ragu|bangsa/i;
const Karaoke: React.FC<{ c: Clip; t: number }> = ({ c, t }) => {
  const rel = t - c.t0;
  const end = c.d + 0.35;
  const out = interpolate(rel, [end - 0.2, end], [1, 0], clamp);
  // pecah ke baris maks ~32 karakter agar tetap besar
  const lines: Word[][] = []; let cur: Word[] = [], len = 0;
  for (const w of c.words) { if (len + w.w.length > 32 && cur.length) { lines.push(cur); cur = []; len = 0; } cur.push(w); len += w.w.length + 1; }
  if (cur.length) lines.push(cur);
  // tampilkan dua baris aktif sekaligus (seperti subtitle), geser saat baris ketiga mulai
  const activeLine = Math.max(0, lines.findIndex((l) => l[l.length - 1].t + l[l.length - 1].d > rel));
  const page = Math.floor((activeLine === -1 ? lines.length - 1 : activeLine) / 2);
  const shown = lines.slice(page * 2, page * 2 + 2);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 92, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, opacity: out }}>
      {shown.map((ln, li) => (
        <div key={`${page}-${li}`} style={{ display: "flex", gap: 22, flexWrap: "nowrap" }}>
          {ln.map((w, wi) => {
            const k = rel - w.t;
            const vis = interpolate(k, [-0.05, 0.08], [0, 1], clamp);
            const pop = interpolate(k, [-0.05, 0.12, 0.3], [0.7, 1.06, 1], { ...clamp, easing: ease });
            const active = k >= 0 && k < w.d + 0.08;
            const hot = SOROT.test(w.w);
            return (
              <span key={wi} style={{ fontFamily: FONT, fontWeight: 700, fontSize: 64, lineHeight: 1.15, letterSpacing: -0.5,
                color: hot ? GOLD : INK, opacity: vis, display: "inline-block", transform: `scale(${pop}) translateY(${(1 - vis) * 18}px)`,
                textShadow: active ? `0 0 26px ${hot ? "rgba(244,197,106,0.85)" : "rgba(255,255,255,0.55)"}, 0 4px 0 rgba(0,0,0,0.55), 0 10px 30px rgba(0,0,0,0.6)`
                  : "0 4px 0 rgba(0,0,0,0.55), 0 10px 30px rgba(0,0,0,0.6)",
                WebkitTextStroke: "1.5px rgba(0,0,0,0.35)" }}>{w.w}</span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

// ---------- kartu sponsor yang "jatuh" tepat saat namanya disebut ----------
const SponsorCard: React.FC<{ at: number; label: React.ReactNode; color: string; x: number; y: number; t: number; fps: number; until: number }> = ({ at, label, color, x, y, t, fps, until }) => {
  const f = Math.round((t - at) * fps);
  if (f < 0 || t > until) return null;
  const s = spring({ frame: f, fps, config: { damping: 11, stiffness: 140, mass: 0.8 } });
  const fade = interpolate(t, [until - 0.35, until], [1, 0], clamp);
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translateY(${(1 - s) * -220}px) rotate(${(1 - s) * -12 + Math.sin(t * 2 + x) * 1.2}deg) scale(${0.7 + s * 0.3})`,
      opacity: Math.min(1, s * 1.6) * fade }}>
      <div style={{ padding: "22px 34px", borderRadius: 22, background: "rgba(255,255,255,0.94)", boxShadow: `0 24px 60px rgba(0,0,0,0.45), 0 0 0 4px ${color}`,
        fontFamily: FONT, fontWeight: 700, fontSize: 46, color: "#141414", display: "flex", alignItems: "center", gap: 14 }}>{label}</div>
    </div>
  );
};

// ---------- momen trofi: kilat, cincin cahaya, confetti, teks raksasa ----------
const Trofi: React.FC<{ t: number; fps: number }> = ({ t, fps }) => {
  const rel = t - TROFI_T;
  if (rel < -0.1 || rel > 4.2) return null;
  const f = Math.round(rel * fps);
  const s = spring({ frame: f, fps, config: { damping: 9, stiffness: 120 } });
  const out = interpolate(rel, [3.6, 4.2], [1, 0], clamp);
  const flash = interpolate(rel, [0, 0.08, 0.45], [0, 0.85, 0], clamp);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: "#fff8e6", opacity: flash, mixBlendMode: "screen" }} />
      {/* cincin cahaya */}
      {[0, 0.18, 0.36].map((d, i) => {
        const r = interpolate(rel - d, [0, 1.2], [0, 1300], clamp);
        return <div key={i} style={{ position: "absolute", left: 1460 - r / 2, top: 330 - r / 2, width: r, height: r, borderRadius: "50%",
          border: `${6 - i * 1.5}px solid rgba(244,197,106,${interpolate(rel - d, [0, 1.2], [0.8, 0], clamp)})` }} />;
      })}
      {/* confetti */}
      {Array.from({ length: 70 }).map((_, i) => {
        const vx = (random(`vx${i}`) - 0.5) * 1500, vy = -400 - random(`vy${i}`) * 900, g = 1300;
        const x = 1460 + vx * rel, y = 330 + vy * rel + 0.5 * g * rel * rel;
        const rot = rel * (random(`r${i}`) - 0.5) * 1400;
        const col = ["#f4c56a", "#3f8a5f", "#ffffff", "#e86a5a", "#7fb3ff"][i % 5];
        return rel > 0 ? <div key={i} style={{ position: "absolute", left: x, top: y, width: 14, height: 8 + (i % 3) * 5, background: col,
          transform: `rotate(${rot}deg)`, opacity: out * interpolate(rel, [2.6, 3.6], [1, 0], clamp), borderRadius: 2 }} /> : null;
      })}
      {/* kartu trofi */}
      <div style={{ position: "absolute", left: 1460, top: 330, transform: `translate(-50%,-50%) scale(${s}) rotate(${(1 - s) * 18}deg)`, opacity: out, textAlign: "center" }}>
        <div style={{ fontSize: 150, lineHeight: 1, filter: "drop-shadow(0 18px 30px rgba(0,0,0,0.5))" }}>🏆</div>
        <div style={{ marginTop: 6, fontFamily: FONT, fontWeight: 700, fontSize: 120, lineHeight: 0.95, letterSpacing: -4,
          background: `linear-gradient(180deg, #fff3cf 0%, ${GOLD} 45%, ${GOLD2} 100%)`, WebkitBackgroundClip: "text", color: "transparent",
          filter: "drop-shadow(0 6px 0 rgba(0,0,0,0.45)) drop-shadow(0 16px 30px rgba(0,0,0,0.5))" }}>#2</div>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 46, color: INK, letterSpacing: 6, textTransform: "uppercase", textShadow: "0 4px 18px rgba(0,0,0,0.6)" }}>Best Innovation</div>
        <div style={{ fontFamily: FONT, fontSize: 26, color: "#f3e6cc", letterSpacing: 3, marginTop: 4, textShadow: "0 3px 12px rgba(0,0,0,0.6)" }}>AI HACKFEST 2026</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- kartu "10 hari": angka menghitung 1 → 10 ----------
const Hari: React.FC<{ t: number; fps: number }> = ({ t, fps }) => {
  const rel = t - HARI_T + 0.2; const c = at("04"); const end = c.t0 + c.d + 0.4 - HARI_T;
  if (rel < 0 || rel > end) return null;
  const s2 = spring({ frame: Math.round(rel * fps), fps, config: { damping: 11 } });
  const n = Math.round(interpolate(rel, [0.1, 1.1], [1, 10], { ...clamp, easing: Easing.out(Easing.cubic) }));
  const out = interpolate(rel, [end - 0.35, end], [1, 0], clamp);
  return (
    <div style={{ position: "absolute", left: 1330, top: 170, transform: `scale(${0.75 + 0.25 * s2}) rotate(${(1 - s2) * 8}deg)`, opacity: Math.min(1, s2 * 1.5) * out,
      padding: "26px 34px 30px", borderRadius: 28, background: "rgba(255,255,255,0.95)", boxShadow: "0 30px 80px rgba(0,0,0,0.5)", textAlign: "center", width: 420 }}>
      <div style={{ fontFamily: FONT, fontSize: 24, fontWeight: 700, color: "#c0392b", letterSpacing: 4 }}>HACKFEST</div>
      <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 150, lineHeight: 1, color: "#141414", fontVariantNumeric: "tabular-nums", letterSpacing: -6 }}>{n}</div>
      <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 34, color: "#3a3a3a", marginTop: -4 }}>hari</div>
      <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 16 }}>
        {Array.from({ length: 10 }).map((_, i) => <span key={i} style={{ width: 26, height: 26, borderRadius: 7, background: i < n ? "#3f8a5f" : "#e3e7e4" }} />)}
      </div>
    </div>
  );
};

// ---------- kartu alur: dari foto label ke berkas halal ----------
const Alur: React.FC<{ t: number; fps: number }> = ({ t, fps }) => {
  const c = at("05"); const rel = t - ALUR_T; const end = c.t0 + c.d + 0.5 - ALUR_T;
  if (rel < 0 || rel > end) return null;
  const out = interpolate(rel, [end - 0.4, end], [1, 0], clamp);
  const step = (i: number, emoji: string, label: string) => {
    const v = spring({ frame: Math.round((rel - i * 0.45) * fps), fps, config: { damping: 12 } });
    return (
      <div key={`s${i}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, opacity: Math.max(0, v), transform: `translateY(${(1 - v) * 40}px) scale(${0.7 + 0.3 * v})` }}>
        <div style={{ width: 120, height: 120, borderRadius: 30, background: "rgba(255,255,255,0.94)", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 66, boxShadow: "0 18px 40px rgba(0,0,0,0.4)" }}>{emoji}</div>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 26, color: INK, textShadow: "0 3px 12px rgba(0,0,0,0.6)" }}>{label}</div>
      </div>
    );
  };
  const arrow = (i: number) => {
    const v = interpolate(rel, [i * 0.45 + 0.25, i * 0.45 + 0.5], [0, 1], clamp);
    return <div key={`a${i}`} style={{ width: 54 * v, height: 6, borderRadius: 3, background: GOLD, marginTop: 58, boxShadow: `0 0 14px ${GOLD}` }} />;
  };
  return (
    <div style={{ position: "absolute", left: 1250, top: 190, padding: "30px 34px", borderRadius: 26, background: "rgba(12,20,15,0.62)", backdropFilter: "blur(14px)",
      border: "1px solid rgba(255,255,255,0.14)", boxShadow: "0 30px 80px rgba(0,0,0,0.45)", opacity: out }}>
      <div style={{ fontFamily: FONT, fontSize: 24, color: GOLD, letterSpacing: 4, textTransform: "uppercase", marginBottom: 18 }}>AI untuk UMK</div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        {step(0, "📸", "Foto label")}{arrow(0)}{step(1, "🤖", "Agen AI")}{arrow(1)}{step(2, "📄", "Berkas halal")}
      </div>
    </div>
  );
};

// ---------- penutup ----------
const Outro: React.FC<{ t: number; fps: number }> = ({ t, fps }) => {
  const rel = t - (P.bicara + 0.15);
  if (rel < 0) return null;
  const s = (d: number) => spring({ frame: Math.round((rel - d) * fps), fps, config: { damping: 14 } });
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(6,10,8,0) 30%, rgba(6,10,8,0.82) 62%)", opacity: interpolate(rel, [0, 0.6], [0, 1], clamp) }} />
      <div style={{ position: "absolute", left: 1080, top: 250, display: "flex", flexDirection: "column", gap: 26 }}>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 110, color: INK, letterSpacing: -3, lineHeight: 1, opacity: s(0), transform: `translateY(${(1 - s(0)) * 40}px)`,
          textShadow: "0 8px 40px rgba(0,0,0,0.5)" }}>Terima kasih!</div>
        <div style={{ display: "flex", gap: 14, opacity: s(0.25), transform: `translateY(${(1 - s(0.25)) * 30}px)` }}>
          {[<><Img src={staticFile("idwebhost-logo-negative.svg")} style={{ height: 34, filter: "invert(1) brightness(0.15)" }} /></>, <>☁️ CloudBaik</>, <>🇮🇩 PANDI</>].map((l, i) => (
            <div key={i} style={{ padding: "14px 24px", borderRadius: 16, background: "rgba(255,255,255,0.94)", fontFamily: FONT, fontWeight: 700, fontSize: 32, color: "#141414",
              display: "flex", alignItems: "center", boxShadow: "0 16px 40px rgba(0,0,0,0.35)" }}>{l}</div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 18, opacity: s(0.5), transform: `translateY(${(1 - s(0.5)) * 30}px)` }}>
          <Img src={staticFile("halalpilot-logo.svg")} style={{ height: 70, borderRadius: 16 }} />
          <div style={{ fontFamily: FONT, color: INK }}>
            <div style={{ fontSize: 38, fontWeight: 700 }}>Muhammad Fauzan Ramadhan</div>
            <div style={{ fontSize: 26, color: "#d6dfd9" }}>HalalPilot · #2 Best Innovation · AI HackFest 2026</div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- komposisi utama ----------
export const PesanSinema: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const lv = level(t, fps);

  // kamera: dolly-in pelan + handheld drift + punch-in di momen penting
  const punch = (center: number, amt: number, dur = 0.9) =>
    interpolate(t, [center - 0.05, center + 0.18, center + dur], [0, amt, amt * 0.6], clamp) * interpolate(t, [center + dur, center + dur + 1.4], [1, 0], clamp);
  const zoom = 1.06 + t * 0.0016 + punch(TROFI_T, 0.12, 2.6) + punch(ALUR_T, 0.05, 2) + punch(at("01").t0, 0.04, 1.2) + lv * 0.006;
  const camX = drift(t, 0.4, 9) + interpolate(t, [P.bicara, P.bicara + 1.2], [0, -330], { ...clamp, easing: ease });
  const camY = drift(t, 2.2, 6);
  const camR = drift(t, 5.5, 0.35);
  // intro: dari blur & gelap → fokus, sambil "whip" masuk
  const intro = interpolate(t, [0, 1.6], [0, 1], { ...clamp, easing: ease });
  const focus = interpolate(t, [0, 1.4], [18, 0], clamp);

  const S = Math.max(width / IMG.w, height / IMG.h);
  const W = IMG.w * S, H = IMG.h * S;
  const origin = `${(515 / IMG.w) * 100}% ${(230 / IMG.h) * 100}%`;
  const cam = (depth: number): React.CSSProperties => ({
    position: "absolute", left: (width - W) / 2, top: (height - H) / 2, width: W, height: H, transformOrigin: origin,
    transform: `translate(${camX * depth}px, ${camY * depth + (1 - intro) * 60 * depth}px) rotate(${camR}deg) scale(${zoom * (1 + (depth - 1) * 0.04) * (1.25 - 0.25 * intro)})`,
  });

  const musik = (f: number) => {
    const s = f / fps; const bic = P.clips.some((c) => s >= c.t0 - 0.3 && s < c.t0 + c.d + 0.3);
    return (bic ? 0.06 : 0.16) * interpolate(f, [0, 25, durationInFrames - 40, durationInFrames], [0, 1, 1, 0], clamp);
  };
  const cur = P.clips.find((c) => t >= c.t0 && t < c.t0 + c.d + 0.35);
  const light = 0.55 + 0.45 * Math.sin(t * 0.6);

  return (
    <AbsoluteFill style={{ background: "#0a0d0b", overflow: "hidden" }}>
      {/* ===== dunia (lapis foto) ===== */}
      <AbsoluteFill style={{ filter: `blur(${focus}px) saturate(1.12) contrast(1.06) brightness(${0.55 + 0.45 * intro})` }}>
        <div style={cam(0.55)}><Img src={staticFile("pesan/lapis/bg.png")} style={{ width: "100%", height: "100%", filter: "blur(3.5px) brightness(0.92)" }} /></div>
        <div style={cam(1)}><Avatar t={t} fps={fps} frame={frame} /></div>
      </AbsoluteFill>

      {/* sinar matahari menembus daun + debu cahaya */}
      <AbsoluteFill style={{ mixBlendMode: "screen", opacity: 0.55 * intro,
        background: `conic-gradient(from 200deg at 88% -10%, rgba(255,226,160,0) 0deg, rgba(255,226,160,${0.22 * light}) 8deg, rgba(255,226,160,0) 16deg, rgba(255,226,160,${0.16 * light}) 26deg, rgba(255,226,160,0) 34deg, rgba(255,226,160,${0.12 * light}) 44deg, rgba(255,226,160,0) 52deg)` }} />
      {Array.from({ length: 40 }).map((_, i) => {
        const x = (random(`dx${i}`) * 2200 + t * (8 + random(`ds${i}`) * 18)) % 2100 - 90;
        const y = (random(`dy${i}`) * 1200 - t * (6 + random(`dv${i}`) * 14) + 1300) % 1200 - 60;
        const r = 2 + random(`dr${i}`) * 5;
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: r, height: r, borderRadius: r, background: "#fff1c9",
          opacity: (0.25 + 0.5 * Math.abs(Math.sin(t * 1.3 + i))) * intro, filter: "blur(0.8px)", boxShadow: "0 0 10px rgba(255,236,190,0.9)" }} />;
      })}

      {/* grading: hangat di sorot, teal di bayangan + vignette */}
      <AbsoluteFill style={{ background: "linear-gradient(160deg, rgba(255,184,92,0.12), rgba(0,0,0,0) 45%, rgba(10,60,70,0.18))", mixBlendMode: "soft-light" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 42%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.62) 100%)" }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 62%, rgba(0,0,0,0.55) 100%)" }} />

      {/* ===== grafis ===== */}
      <SponsorCard t={t} fps={fps} at={SPONSOR_T.idw} x={1360} y={150} until={at("02").t0 + at("02").d + 0.5}
        color="#2a7de1" label={<Img src={staticFile("idwebhost-logo-negative.svg")} style={{ height: 46, filter: "invert(1) brightness(0.15)" }} />} />
      <SponsorCard t={t} fps={fps} at={SPONSOR_T.cb} x={1400} y={300} until={at("02").t0 + at("02").d + 0.5} color="#29b6f6" label={<>☁️ CloudBaik</>} />
      <SponsorCard t={t} fps={fps} at={SPONSOR_T.pandi} x={1440} y={450} until={at("02").t0 + at("02").d + 0.5} color="#e53935" label={<>🇮🇩 PANDI</>} />
      <Hari t={t} fps={fps} />
      <Alur t={t} fps={fps} />
      <Trofi t={t} fps={fps} />

      {/* label nama gaya "lower third" di awal */}
      {(() => {
        const rel = t - at("01").t0;
        if (rel < 0 || rel > 4.4) return null;
        const s = spring({ frame: Math.round(rel * fps), fps, config: { damping: 14 } });
        const o = interpolate(rel, [3.8, 4.4], [1, 0], clamp);
        return (
          <div style={{ position: "absolute", left: 90, top: 640, opacity: o }}>
            <div style={{ height: 6, width: 260 * s, background: GOLD, borderRadius: 3, marginBottom: 14 }} />
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 54, color: INK, transform: `translateX(${(1 - s) * -60}px)`, opacity: s, textShadow: "0 4px 20px rgba(0,0,0,0.6)" }}>Muhammad Fauzan Ramadhan</div>
            <div style={{ fontFamily: FONT, fontSize: 30, color: "#f0e2c4", transform: `translateX(${(1 - s) * -40}px)`, opacity: s, textShadow: "0 3px 14px rgba(0,0,0,0.6)" }}>Pembuat HalalPilot · Juara #2 Best Innovation</div>
          </div>
        );
      })()}

      {/* badge kecil tetap di pojok */}
      <div style={{ position: "absolute", left: 60, top: 48, display: "flex", alignItems: "center", gap: 12, padding: "10px 18px", borderRadius: 14,
        background: "rgba(10,14,12,0.55)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.12)", opacity: interpolate(t, [1.4, 2.2], [0, 1], clamp) * interpolate(t, [P.bicara, P.bicara + 0.5], [1, 0], clamp) }}>
        <span style={{ fontSize: 26 }}>🏆</span>
        <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 24, color: GOLD }}>#2 Best Innovation</span>
        <span style={{ fontFamily: FONT, fontSize: 22, color: "#d9e2dc" }}>· AI HackFest 2026</span>
      </div>

      {cur && <Karaoke c={cur} t={t} />}
      <Outro t={t} fps={fps} />

      {/* film grain + letterbox halus + light leak di intro/outro */}
      <AbsoluteFill style={{ opacity: 0.08, mixBlendMode: "overlay",
        backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='${frame % 8}'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")` }} />
      <AbsoluteFill style={{ mixBlendMode: "screen", pointerEvents: "none",
        opacity: interpolate(t, [0, 0.4, 1.8], [0.9, 0.7, 0], clamp) + interpolate(t, [P.total - 1.6, P.total - 0.2], [0, 0.6], clamp),
        background: "radial-gradient(ellipse at 15% 20%, rgba(255,170,80,0.9) 0%, rgba(255,120,60,0.4) 25%, rgba(0,0,0,0) 55%), radial-gradient(ellipse at 90% 85%, rgba(255,210,140,0.6) 0%, rgba(0,0,0,0) 45%)" }} />
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(t, [P.total - 0.5, P.total], [0, 1], clamp) }} />

      {/* ===== audio ===== */}
      {P.clips.map((c) => <Sequence key={c.nn} from={Math.round(c.t0 * fps)} name={`suara-${c.nn}`}><Audio src={staticFile(`pesan/${c.nn}.mp3`)} /></Sequence>)}
      <Audio src={staticFile("sfx/musik.mp3")} loop volume={musik} />
      <Sequence from={0}><Audio src={staticFile("sfx/whoosh.wav")} volume={0.5} /></Sequence>
      {[SPONSOR_T.idw, SPONSOR_T.cb, SPONSOR_T.pandi].map((s, i) => <Sequence key={i} from={Math.round(s * fps)}><Audio src={staticFile("sfx/pop.wav")} volume={0.35} /></Sequence>)}
      <Sequence from={Math.round((TROFI_T - 0.15) * fps)}><Audio src={staticFile("sfx/whoosh.wav")} volume={0.55} /></Sequence>
      <Sequence from={Math.round(TROFI_T * fps)}><Audio src={staticFile("sfx/ding.wav")} volume={0.6} /></Sequence>
      <Sequence from={Math.round((P.bicara + 0.15) * fps)}><Audio src={staticFile("sfx/whoosh.wav")} volume={0.4} /></Sequence>
    </AbsoluteFill>
  );
};

export const PESAN_TOTAL = P.total;
