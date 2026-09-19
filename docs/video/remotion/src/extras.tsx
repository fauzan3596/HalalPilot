import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT, RoleSpan } from "./theme";
import { DarkBackdrop } from "./ui";

const ease = Easing.bezier(0.16, 1, 0.3, 1);

/** Lencana peran di bawah judul adegan; tetap tampil sepanjang adegan, berganti saat peran berganti. */
export const RoleBadge: React.FC<{ spans: RoleSpan[]; capStarts: number[] }> = ({ spans, capStarts }) => {
  const frame = useCurrentFrame();
  let cur = spans[0]; let since = 0;
  for (const s of spans) { const at = s.cap === undefined ? 0 : capStarts[s.cap] ?? 0; if (frame >= at) { cur = s; since = at; } }
  if (!cur) return null;
  const color = cur.kind === "umk" ? C.amber : cur.kind === "pendamping" ? "#7fb3ff" : C.muted;
  const local = frame - since;
  return (
    <div
      style={{
        position: "absolute",
        left: 40,
        top: 104,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "7px 14px",
        borderRadius: 999,
        background: "rgba(10,16,12,0.8)",
        border: `1px solid ${color}55`,
        fontFamily: FONT,
        fontSize: 22,
        color: C.ink,
        opacity: interpolate(local, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        translate: interpolate(local, [0, 16], ["-20px 0px", "0px 0px"], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }),
      }}
    >
      <span style={{ width: 12, height: 12, borderRadius: 6, background: color, boxShadow: `0 0 10px ${color}` }} />
      <span style={{ color: C.muted, fontSize: 19 }}>Peran</span>
      <span style={{ fontWeight: 700 }}>{cur.text}</span>
    </div>
  );
};

/** Lencana skor kesiapan: angka berjalan naik, kuning di bawah 100, hijau saat 100. Tampil 7 detik sejak `at`. */
export const ScoreBadge: React.FC<{ at: number; from: number; to: number }> = ({ at, from, to }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - at;
  if (local < 0 || local > 7 * fps) return null;
  const v = Math.round(interpolate(local, [0.3 * fps, 1.5 * fps], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }));
  const done = v >= 100;
  const color = done ? C.accent : C.amber;
  return (
    <div
      style={{
        position: "absolute",
        right: 40,
        top: 36,
        display: "flex",
        alignItems: "baseline",
        gap: 12,
        padding: "12px 22px",
        borderRadius: 14,
        background: "rgba(10,16,12,0.85)",
        border: `2px solid ${color}`,
        boxShadow: done ? `0 0 30px ${C.accent}66` : "none",
        fontFamily: FONT,
        color: C.ink,
        opacity: interpolate(local, [0, 8, 6.4 * fps, 7 * fps], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        scale: String(interpolate(local, [0, 14], [0.8, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease })),
      }}
    >
      <span style={{ fontSize: 20, color: C.muted }}>Skor kesiapan</span>
      <span style={{ fontSize: 44, fontWeight: 700, color, fontVariantNumeric: "tabular-nums" }}>{v}</span>
      <span style={{ fontSize: 20, color: C.muted }}>/ 100</span>
      {done ? <span style={{ fontSize: 20, color: C.accent, fontWeight: 700, marginLeft: 6 }}>siap</span> : null}
    </div>
  );
};

/** Garis waktu pengejaran di tengah atas: H+1, H+3, H+7, lalu eskalasi H+10 (merah). */
export const ChaseStrip: React.FC<{ litAt: (frame: number) => number }> = ({ litAt }) => {
  const frame = useCurrentFrame();
  const lit = litAt(frame);
  const steps = [
    { label: "H+1", sub: "ramah" },
    { label: "H+3", sub: "tegas" },
    { label: "H+7", sub: "mendesak" },
    { label: "H+10", sub: "eskalasi" },
  ];
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 36, display: "flex", justifyContent: "center", opacity: interpolate(frame, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
      <div style={{ display: "flex", alignItems: "center", gap: 0, padding: "10px 18px", borderRadius: 999, background: "rgba(10,16,12,0.85)", fontFamily: FONT }}>
        <span style={{ color: C.muted, fontSize: 19, marginRight: 14 }}>Pengejaran</span>
        {steps.map((s, i) => {
          const on = i < lit; const last = i === 3;
          const color = last ? C.red : C.accent;
          return (
            <React.Fragment key={s.label}>
              {i > 0 ? <span style={{ width: 34, height: 3, background: i < lit ? color : "rgba(255,255,255,0.15)" }} /> : null}
              <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, minWidth: 74 }}>
                <span style={{ width: 16, height: 16, borderRadius: 8, background: on ? color : "rgba(255,255,255,0.12)", boxShadow: on ? `0 0 12px ${color}` : "none", border: `2px solid ${on ? color : "rgba(255,255,255,0.25)"}` }} />
                <span style={{ fontSize: 17, color: on ? C.ink : C.muted, fontWeight: on ? 700 : 400 }}>{s.label}</span>
                <span style={{ fontSize: 13, color: C.muted }}>{s.sub}</span>
              </span>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

/** Sisipan diagram arsitektur (adegan 2): kotak menyala berurutan mengikuti narasi. */
export const ArchInset: React.FC<{ from: number; autoAt: number }> = ({ from, autoAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - from;
  if (local < 0) return null;
  const lit = (delay: number) => interpolate(local, [delay, delay + 0.5 * fps], [0.25, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const box = (label: string, sub: string, delay: number, accent = C.accent) => (
    <div style={{ opacity: lit(delay), scale: String(interpolate(local, [delay, delay + 0.5 * fps], [0.96, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease })),
      padding: "12px 16px", borderRadius: 12, background: "rgba(255,255,255,0.06)", border: `2px solid ${accent}`, fontFamily: FONT, color: C.ink, minWidth: 250 }}>
      <div style={{ fontWeight: 700, fontSize: 24 }}>{label}</div>
      <div style={{ fontSize: 17, color: C.muted, marginTop: 2 }}>{sub}</div>
    </div>
  );
  const arrow = (delay: number, vertical = false) => (
    <div style={{ opacity: lit(delay), width: vertical ? 3 : 40, height: vertical ? 26 : 3, background: C.muted, margin: vertical ? "0 auto" : "0 8px" }} />
  );
  const auto = Math.max(0, frame - autoAt);
  return (
    <div style={{ position: "absolute", left: 1010, top: 110, width: 870, padding: 26, borderRadius: 20, background: "rgba(10,16,12,0.9)", border: "1px solid rgba(255,255,255,0.1)",
      opacity: interpolate(local, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      translate: interpolate(local, [0, 20], ["40px 0px", "0px 0px"], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }) }}>
      <div style={{ fontFamily: FONT, color: C.muted, fontSize: 19, marginBottom: 16, letterSpacing: 1, textTransform: "uppercase" }}>Arsitektur di satu VPS</div>
      <div style={{ display: "flex", alignItems: "center" }}>
        {box("Telegram", "UMK & pendamping", 0)}
        {arrow(0.6 * fps)}
        {box("OpenClaw Gateway", "agen halalpilot + skill", 0.8 * fps)}
      </div>
      {arrow(1.6 * fps, true)}
      <div style={{ display: "flex", alignItems: "center" }}>
        {box("API Node/Express", "mesin aturan deterministik", 1.8 * fps, C.amber)}
        {arrow(2.4 * fps)}
        {box("SQLite + PDF", "keputusan, jejak audit, dossier", 2.6 * fps, C.amber)}
      </div>
      {arrow(3.2 * fps, true)}
      <div style={{ display: "flex", alignItems: "center" }}>
        {box("rules/*.yaml", "bisa dibaca pendamping, berversi", 3.4 * fps, C.amber)}
        <div style={{ width: 40 }} />
        <div style={{ opacity: frame >= autoAt ? interpolate(auto, [0, 0.5 * fps], [0.25, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0.25,
          padding: "12px 16px", borderRadius: 12, background: "rgba(255,255,255,0.06)", border: `2px solid ${frame >= autoAt ? "#7fb3ff" : "rgba(255,255,255,0.2)"}`, fontFamily: FONT, color: C.ink, minWidth: 250 }}>
          <div style={{ fontWeight: 700, fontSize: 24 }}>Automations cron</div>
          <div style={{ fontSize: 17, color: C.muted, marginTop: 2 }}>digest 07.00 · sapuan 09.00 & 15.00 · kuota 6 jam</div>
        </div>
      </div>
      <div style={{ fontFamily: FONT, color: C.amber, fontSize: 21, marginTop: 18, fontWeight: 700, opacity: lit(4 * fps) }}>Model membaca & berbicara · kode memutuskan hukum</div>
    </div>
  );
};

/** Kartu bab 2 detik di antara bagian besar. */
export const ChapterCard: React.FC<{ nomor: number; title: string; sub: string }> = ({ nomor, title, sub }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <DarkBackdrop>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", fontFamily: FONT, color: C.ink,
        opacity: interpolate(frame, [0, 8, durationInFrames - 10, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
        <div style={{ color: C.accent, fontSize: 30, letterSpacing: 6, textTransform: "uppercase", marginBottom: 18,
          opacity: interpolate(frame, [4, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>Bagian {nomor}</div>
        <div style={{ fontSize: 96, fontWeight: 700, letterSpacing: -2, lineHeight: 1.05,
          translate: interpolate(frame, [0, 24], ["0px 40px", "0px 0px"], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }) }}>{title}</div>
        <div style={{ width: interpolate(frame, [10, 34], [0, 260], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }), height: 4, background: C.accent, margin: "26px 0" }} />
        <div style={{ fontSize: 34, color: C.muted, opacity: interpolate(frame, [18, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>{sub}</div>
      </AbsoluteFill>
    </DarkBackdrop>
  );
};
