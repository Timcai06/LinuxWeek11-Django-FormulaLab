import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import type { ScrollDirectorProps } from "../types";
import { phaseForProgress, setStoryVars, snapToStoryBeat } from "../storyTimeline";

export function ScrollDirector({ scrollProgressRef, children }: ScrollDirectorProps) {
  const storyRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const storyElement = storyRef.current;
    if (!storyElement) {
      return undefined;
    }

    scrollProgressRef.current = 0;
    setStoryVars(storyElement, "intro", 0);

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      scrollProgressRef.current = 1;
      setStoryVars(storyElement, "cta", 1);
      return undefined;
    }

    gsap.registerPlugin(ScrollTrigger);

    const context = gsap.context(() => {
      const trigger = ScrollTrigger.create({
        trigger: storyElement,
        start: "top top",
        end: "bottom bottom",
        scrub: 1.35,
        snap: {
          snapTo: snapToStoryBeat,
          duration: { min: 0.35, max: 0.8 },
          delay: 0.12,
          ease: "power3.out",
        },
        onUpdate(self) {
          const progress = self.progress;
          scrollProgressRef.current = progress;
          setStoryVars(storyElement, phaseForProgress(progress), progress);
        },
      });

      return () => {
        trigger.kill();
      };
    }, storyElement);

    return () => {
      context.revert();
      scrollProgressRef.current = 0;
    };
  }, [scrollProgressRef]);

  return (
    <section className="landing-story" ref={storyRef} data-story-phase="intro">
      {children}
    </section>
  );
}
