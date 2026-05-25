import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import type { LandingPhase, ScrollDirectorProps } from "../types";
import { phaseOpacity, progressBetween } from "../three/motion";

const SNAP_LABELS = [0, 0.18, 0.34, 0.5, 0.72, 0.88, 1];

function setStoryVars(storyElement: HTMLElement, phase: LandingPhase, progress: number) {
  const centerProgress = progressBetween(progress, 0.18, 0.48);
  const heroOpacity = Math.max(1 - centerProgress * 1.25, 0);
  const shutdownOpacity = Math.max(1 - centerProgress * 1.4, 0);
  const cosmosOpacity = Math.max(1 - centerProgress * 1.18, 0);
  const scanOpacity = phaseOpacity(progress, 0.5, 0.62, 0.74);
  const decodeOpacity = phaseOpacity(progress, 0.66, 0.78, 0.94);
  const gateProgress = progressBetween(progress, 0.76, 0.98);
  const gateAuraOpacity = phaseOpacity(progress, 0.66, 0.78, 1);
  const manuscriptFinalOpacity = 1 - progressBetween(progress, 0.78, 0.98) * 0.34;
  const ctaOpacity = progressBetween(progress, 0.88, 0.98);

  storyElement.style.setProperty("--story-progress", progress.toFixed(4));
  storyElement.style.setProperty("--hero-opacity", heroOpacity.toFixed(4));
  storyElement.style.setProperty("--hero-y", `${(-42 * centerProgress).toFixed(3)}px`);
  storyElement.style.setProperty("--text-disperse", `${(54 * centerProgress).toFixed(3)}px`);
  storyElement.style.setProperty("--copy-x", `${(-17.28 * centerProgress).toFixed(3)}px`);
  storyElement.style.setProperty("--kicker-x", `${(-11.88 * centerProgress).toFixed(3)}px`);
  storyElement.style.setProperty("--actions-x", `${(-27 * centerProgress).toFixed(3)}px`);
  storyElement.style.setProperty("--text-scale", (1 + centerProgress * 0.026).toFixed(4));
  storyElement.style.setProperty("--shutdown-opacity", shutdownOpacity.toFixed(4));
  storyElement.style.setProperty("--readout-x", `${(42 * centerProgress).toFixed(3)}px`);
  storyElement.style.setProperty("--cosmos-opacity", cosmosOpacity.toFixed(4));
  storyElement.style.setProperty("--stardust-opacity", (cosmosOpacity * 0.32).toFixed(4));
  storyElement.style.setProperty("--scanline-opacity", (0.2 + cosmosOpacity * 0.16).toFixed(4));
  storyElement.style.setProperty("--rail-opacity", progressBetween(progress, 0.62, 0.72).toFixed(4));
  storyElement.style.setProperty("--scan-opacity", scanOpacity.toFixed(4));
  storyElement.style.setProperty("--decode-opacity", decodeOpacity.toFixed(4));
  storyElement.style.setProperty("--gate-opacity", gateProgress.toFixed(4));
  storyElement.style.setProperty("--gate-y", `${(34 * (1 - gateProgress)).toFixed(3)}px`);
  storyElement.style.setProperty("--gate-scale", (0.985 + gateProgress * 0.015).toFixed(4));
  storyElement.style.setProperty("--gate-aura-opacity", gateAuraOpacity.toFixed(4));
  storyElement.style.setProperty("--manuscript-final-opacity", manuscriptFinalOpacity.toFixed(4));
  storyElement.style.setProperty("--cta-opacity", ctaOpacity.toFixed(4));
  storyElement.style.setProperty("--cta-y", `${(18 * (1 - ctaOpacity)).toFixed(3)}px`);
  storyElement.style.setProperty("--scan-x", `${(-22 * progress).toFixed(3)}vw`);
  storyElement.style.setProperty("--scan-y", `${(16 * progress).toFixed(3)}vh`);
  storyElement.dataset.storyPhase = phase;
}

function phaseForProgress(progress: number): LandingPhase {
  if (progress >= 0.88) {
    return "cta";
  }
  if (progress >= 0.72) {
    return "reveal";
  }
  if (progress >= 0.5) {
    return "scan";
  }
  if (progress >= 0.34) {
    return "center";
  }
  if (progress >= 0.18) {
    return "absorb";
  }
  return "intro";
}

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
        scrub: true,
        snap: {
          snapTo: SNAP_LABELS,
          duration: { min: 0.08, max: 0.18 },
          delay: 0.06,
          ease: "power1.out",
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
