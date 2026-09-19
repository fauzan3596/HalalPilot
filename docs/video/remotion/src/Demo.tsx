import React from "react";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { Closer, Opener } from "./Cards";
import { Scene } from "./Scene";
import { f, timeline, TRANSITION } from "./timeline";

/** Video utuh: pembuka → 12 blok adegan (11 adegan; 7 dan 7b digabung dalam penomoran) → penutup, dengan transisi silang. */
export const Demo: React.FC = () => {
  const total = 11;
  // nomor adegan untuk progres: "07b" ikut adegan 7
  const indexOf = (id: string) => parseInt(id, 10) - 1;
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={f(timeline.opener.seconds)} name="Pembuka">
        <Opener />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: TRANSITION })} />
      {timeline.scenes.map((s, i) => (
        <React.Fragment key={s.id}>
          {i > 0 ? <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITION })} /> : null}
          <TransitionSeries.Sequence durationInFrames={f(s.len)} name={`Adegan ${s.id}`}>
            <Scene scene={s} index={indexOf(s.id)} total={total} />
          </TransitionSeries.Sequence>
        </React.Fragment>
      ))}
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITION })} />
      <TransitionSeries.Sequence durationInFrames={f(timeline.closer.seconds)} name="Penutup">
        <Closer />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
