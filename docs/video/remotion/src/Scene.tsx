import React from "react";
import { Audio, Video } from "@remotion/media";
import { AbsoluteFill, Freeze, Sequence, staticFile, useCurrentFrame } from "remotion";
import { ArchInset, ChaseStrip, RoleBadge, ScoreBadge } from "./extras";
import { RulesInset } from "./extras2";
import { ARTICLES, ArticleCard } from "./extras3";
import { Kinetic, KINETIC } from "./kinetic";
import { ARCH, C, CHASE, FONT, ROLE, SCORE } from "./theme";
import { f, Scene as SceneT } from "./timeline";
import { Caption, Progress, SceneTitle, Watermark } from "./ui";
import { buildWindows, zoomAt, zoomOverlap } from "./zoom";

/**
 * Satu adegan: video potongan (sudah 1080p, sudah berisi frame beku), narasi per kalimat pada waktunya,
 * caption beranimasi, judul adegan, zoom + sorotan ke tiap balasan agen saat gelembungnya muncul (src/zoom.ts),
 * lencana peran, lencana skor, garis waktu pengejaran, sisipan diagram arsitektur / aturan / artikel.
 */
export const Scene: React.FC<{ scene: SceneT; index: number; total: number }> = ({ scene, index, total }) => {
  const frame = useCurrentFrame();
  const vlenF = f(scene.vlen);
  const capStarts = scene.captions.map((c) => f(c.t0));
  const wins = React.useMemo(() => buildWindows(scene), [scene]);
  const z = zoomAt(frame, wins);
  const scale = z?.scale ?? 1;
  const origin = z?.origin ?? { x: 0, y: 1 };
  const k = z?.k ?? 0;
  const rect = z?.rect;

  const media = <Video src={staticFile(`seg/${scene.cat}`)} muted style={{ width: 1920, height: 1080 }} />;
  const chase = CHASE[scene.id];
  const arch = ARCH[scene.id];

  return (
    <AbsoluteFill style={{ background: "#0b100d" }}>
      <AbsoluteFill style={{ scale: String(scale), transformOrigin: `${origin.x * 100}% ${origin.y * 100}%` }}>
        {/* video berjalan sampai vlen, lalu frame terakhir ditahan bila narasi lebih panjang */}
        <Sequence durationInFrames={vlenF} name="video">{media}</Sequence>
        {f(scene.len) > vlenF ? (
          <Sequence from={vlenF} name="tahan-frame-akhir">
            <Freeze frame={vlenF - 1}>{media}</Freeze>
          </Sequence>
        ) : null}
        {/* sorotan: gelembung balasan tetap terang, sekitarnya diredupkan, bingkai kuning tipis; ikut terskala bersama video */}
        {rect ? (
          <>
            <div style={{ position: "absolute", left: rect.x - 10, top: rect.y - 8, width: rect.w + 20, height: rect.h + 16, borderRadius: 18, pointerEvents: "none",
              boxShadow: `0 0 0 4000px rgba(0,0,0,${0.5 * k})`, border: `3px solid rgba(224,168,74,${k})` }} />
            {/* label di atas kotak; bila kotak tinggi (mendekati lencana peran di kiri atas), label pindah ke bawah kotak */}
            <div style={{ position: "absolute", left: rect.x - 10, top: rect.y < 420 ? rect.y + rect.h + 14 : rect.y - 50, padding: "5px 14px", borderRadius: 999, background: `rgba(224,168,74,${0.95 * k})`, color: "#1a1408",
              fontFamily: FONT, fontWeight: 700, fontSize: 21, letterSpacing: 0.5, whiteSpace: "nowrap", opacity: k }}>
              {z?.label}
            </div>
          </>
        ) : null}
      </AbsoluteFill>

      {scene.captions.map((c, i) => (
        <React.Fragment key={i}>
          {c.mp3 ? (
            <Sequence from={f(c.t0)} name={`narasi-${i}`}>
              <Audio src={staticFile(`tts/${c.mp3}`)} />
            </Sequence>
          ) : null}
          <Sequence from={f(c.t0)} durationInFrames={Math.max(1, f(c.t1) - f(c.t0))} name={`caption-${i}`}>
            <Caption text={c.text} src={c.src} side={zoomOverlap(c.t0, c.t1, wins) > 0.4 ? "right" : "center"} />
          </Sequence>
        </React.Fragment>
      ))}

      {scene.id === "03" && capStarts[4] !== undefined ? <RulesInset from={capStarts[4]} /> : null}
      {scene.id === "01" && scene.captions[1] ? <ArticleCard a={ARTICLES.republika4} from={capStarts[0]} until={capStarts[1] - 4} x={1010} y={110} w={870} h={620} /> : null}
      {scene.id === "01" && scene.captions[1] ? <ArticleCard a={ARTICLES.kemenag} from={capStarts[1]} until={f(scene.captions[1].t1)} x={1010} y={110} w={870} h={620} /> : null}
      {scene.id === "01" && scene.captions[2] ? <ArticleCard a={ARTICLES.kuota} from={capStarts[2]} until={f(scene.captions[2].t1)} x={1010} y={110} w={870} h={620} /> : null}
      {KINETIC[scene.id] ? <Kinetic cues={KINETIC[scene.id]} capStarts={capStarts} sceneLen={scene.len} /> : null}
      {arch ? <ArchInset from={capStarts[arch.fromCap]} autoAt={capStarts[arch.autoCap]} /> : null}
      {chase ? <ChaseStrip litAt={(fr) => chase.steps.reduce((lit, s) => (fr >= capStarts[s.cap] ? Math.max(lit, s.lit) : lit), chase.lit)} /> : null}
      {(SCORE[scene.id] ?? []).map((ev, i) => <ScoreBadge key={i} at={capStarts[ev.cap]} from={ev.from} to={ev.to} />)}

      <SceneTitle text={scene.judul} index={index} total={total} />
      {ROLE[scene.id] ? <RoleBadge spans={ROLE[scene.id]} capStarts={capStarts} /> : null}
      <Progress index={index} total={total} />
      <Watermark />
      {/* warna latar sorotan mengikuti tema */}
      <span style={{ display: "none", color: C.amber }} />
    </AbsoluteFill>
  );
};
