import React from "react";
import { Audio, Video } from "@remotion/media";
import { AbsoluteFill, Easing, Freeze, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { HIGHLIGHT, ZOOM, ZOOM_POINT } from "./theme";
import { f, Scene as SceneT } from "./timeline";
import { Caption, Progress, SceneTitle, Watermark } from "./ui";

const ease = Easing.bezier(0.16, 1, 0.3, 1);

/**
 * Satu adegan: video potongan (sudah 1080p, sudah berisi frame beku), narasi per kalimat pada waktunya,
 * caption beranimasi, judul adegan, zoom lembut ke area pesan untuk kalimat kunci.
 */
export const Scene: React.FC<{ scene: SceneT; index: number; total: number }> = ({ scene, index, total }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const vlenF = f(scene.vlen);
  const zoomIdx = ZOOM[scene.id] ?? [];
  const point = ZOOM_POINT[scene.id] ?? ZOOM_POINT.default;
  const rect = HIGHLIGHT[scene.id] ?? HIGHLIGHT.default;

  // skala zoom: naik 0.7 s di awal kalimat kunci, tahan, turun 0.7 s menjelang akhirnya
  let scale = 1;
  for (const i of zoomIdx) {
    const c = scene.captions[i];
    if (!c) continue;
    const a = f(c.t0), b = f(c.t1);
    const s = interpolate(frame, [a, a + 0.7 * fps, b - 0.7 * fps, b], [1, 1.22, 1.22, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
    if (s > scale) scale = s;
  }

  const media = <Video src={staticFile(`seg/${scene.cat}`)} muted style={{ width: 1920, height: 1080 }} />;

  return (
    <AbsoluteFill style={{ background: "#0b100d" }}>
      <AbsoluteFill style={{ scale: String(scale), transformOrigin: `${point.x * 100}% ${point.y * 100}%` }}>
        {/* video berjalan sampai vlen, lalu frame terakhir ditahan bila narasi lebih panjang */}
        <Sequence durationInFrames={vlenF} name="video">{media}</Sequence>
        {f(scene.len) > vlenF ? (
          <Sequence from={vlenF} name="tahan-frame-akhir">
            <Freeze frame={vlenF - 1}>{media}</Freeze>
          </Sequence>
        ) : null}
        {/* sorotan: area pesan terbaru tetap terang, sekitarnya diredupkan, bingkai kuning tipis; ikut terskala bersama video */}
        <div style={{ position: "absolute", left: rect.x, top: rect.y, width: rect.w, height: rect.h, borderRadius: 18, pointerEvents: "none",
          boxShadow: `0 0 0 4000px rgba(0,0,0,${(0.5 * (scale - 1)) / 0.22})`, border: `3px solid rgba(224,168,74,${(scale - 1) / 0.22})` }} />
      </AbsoluteFill>

      {scene.captions.map((c, i) => (
        <React.Fragment key={i}>
          {c.mp3 ? (
            <Sequence from={f(c.t0)} name={`narasi-${i}`}>
              <Audio src={staticFile(`tts/${c.mp3}`)} />
            </Sequence>
          ) : null}
          <Sequence from={f(c.t0)} durationInFrames={Math.max(1, f(c.t1) - f(c.t0))} name={`caption-${i}`}>
            <Caption text={c.text} side={zoomIdx.includes(i) ? "right" : "center"} />
          </Sequence>
        </React.Fragment>
      ))}

      <SceneTitle text={scene.judul} index={index} total={total} />
      <Progress index={index} total={total} />
      <Watermark />
    </AbsoluteFill>
  );
};
