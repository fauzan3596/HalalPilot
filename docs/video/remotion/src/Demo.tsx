import React from "react";
import { Audio } from "@remotion/media";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { interpolate, Sequence, staticFile } from "remotion";
import { Closer, Opener } from "./Cards";
import { ChapterCard } from "./extras";
import { StatsCard } from "./extras2";
import { Scene } from "./Scene";
import { CHAPTERS, MUSIC, SFX } from "./theme";
import { FPS, layout, narrationSpans, sfxCues, TRANSITION } from "./timeline";

/** Volume musik: turun saat narasi berbunyi (ducking), naik lagi di jeda. */
const musicVolume = (spans: [number, number][]) => (frame: number) => {
  const fade = MUSIC.fade * FPS;
  let g = 1; // 1 = normal, 0 = teredam penuh
  for (const [a, b] of spans) {
    if (frame >= a - fade && frame <= b + fade) {
      const edge = Math.min(frame - (a - fade), b + fade - frame); // jarak ke tepi rentang (termasuk fade)
      g = Math.min(g, 1 - Math.min(1, edge / fade));
    }
  }
  return interpolate(g, [0, 1], [MUSIC.duck, MUSIC.base]);
};

/** Video utuh: pembuka → kartu bab → adegan → … → penutup, dengan transisi silang; musik + efek suara di atasnya. */
export const Demo: React.FC = () => {
  const total = 11;
  const indexOf = (id: string) => parseInt(id, 10) - 1;
  const { items } = layout();
  const spans = narrationSpans();
  const cues = sfxCues();
  let chapterNo = 0;
  return (
    <>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={items[0].dur} name="Pembuka">
          <Opener />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: TRANSITION })} />
        {items.slice(1, -1).map((it, i) => (
          <React.Fragment key={i}>
            {i > 0 ? <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITION })} /> : null}
            {it.kind === "chapter" ? (
              <TransitionSeries.Sequence durationInFrames={it.dur} name={`Bab sebelum ${it.id}`}>
                <ChapterCard nomor={++chapterNo + 1} title={CHAPTERS[it.id].title} sub={CHAPTERS[it.id].sub} />
              </TransitionSeries.Sequence>
            ) : it.kind === "scene" ? (
              <TransitionSeries.Sequence durationInFrames={it.dur} name={`Adegan ${it.scene.id}`}>
                <Scene scene={it.scene} index={indexOf(it.scene.id)} total={total} />
              </TransitionSeries.Sequence>
            ) : it.kind === "stats" ? (
              <TransitionSeries.Sequence durationInFrames={it.dur} name="Hasil dalam angka">
                <StatsCard />
              </TransitionSeries.Sequence>
            ) : null}
          </React.Fragment>
        ))}
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITION })} />
        <TransitionSeries.Sequence durationInFrames={items[items.length - 1].dur} name="Penutup">
          <Closer />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* musik latar (disintesis sendiri, bebas lisensi), di-loop, teredam saat narasi */}
      <Audio src={staticFile("sfx/musik.mp3")} loop volume={musicVolume(spans)} name="musik" />
      {cues.whoosh.map((fr, i) => (
        <Sequence key={`w${i}`} from={fr} name="sfx-whoosh"><Audio src={staticFile("sfx/whoosh.wav")} volume={SFX.whoosh} /></Sequence>
      ))}
      {cues.pop.map((fr, i) => (
        <Sequence key={`p${i}`} from={fr} name="sfx-pop"><Audio src={staticFile("sfx/pop.wav")} volume={SFX.pop} /></Sequence>
      ))}
      {cues.ding.map((fr, i) => (
        <Sequence key={`d${i}`} from={fr} name="sfx-ding"><Audio src={staticFile("sfx/ding.wav")} volume={SFX.ding} /></Sequence>
      ))}
      {cues.reply.map((fr, i) => (
        <Sequence key={`r${i}`} from={fr} name="sfx-balasan"><Audio src={staticFile("sfx/pop.wav")} volume={SFX.reply} /></Sequence>
      ))}
    </>
  );
};



