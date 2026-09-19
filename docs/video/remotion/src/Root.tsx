import "./index.css";
import React from "react";
import { Composition, Folder } from "remotion";
import { Closer, Opener } from "./Cards";
import { StatsCard } from "./extras2";
import { Demo } from "./Demo";
import { Scene } from "./Scene";
import { f, FPS, timeline, totalFrames } from "./timeline";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="Demo" component={Demo} durationInFrames={totalFrames()} fps={FPS} width={1920} height={1080} />
      <Folder name="Bagian">
        <Composition id="Pembuka" component={Opener} durationInFrames={f(timeline.opener.seconds)} fps={FPS} width={1920} height={1080} />
        <Composition id="Hasil" component={StatsCard} durationInFrames={f(timeline.hasil?.seconds ?? 8)} fps={FPS} width={1920} height={1080} />
        <Composition id="Penutup" component={Closer} durationInFrames={f(timeline.closer.seconds)} fps={FPS} width={1920} height={1080} />
        {timeline.scenes.map((s) => (
          <Composition
            key={s.id}
            id={`Adegan-${s.id}`}
            component={Scene}
            durationInFrames={f(s.len)}
            fps={FPS}
            width={1920}
            height={1080}
            defaultProps={{ scene: s, index: parseInt(s.id, 10) - 1, total: 11 }}
          />
        ))}
      </Folder>
    </>
  );
};
