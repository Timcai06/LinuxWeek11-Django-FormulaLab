import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import type { LandingPhase, ScrollDirectorProps } from "../types";
import { phaseOpacity, phaseOpacityHold, progressBetween } from "../three/motion";

const SNAP_LABELS = [0, 0.10, 0.25, 0.36, 0.50, 0.60];

function setStoryVars(storyElement: HTMLElement, phase: LandingPhase, progress: number) {
  const centerProgress = progressBetween(progress, 0.10, 0.50);
  const heroExitProgress = progressBetween(progress, 0.10, 0.35);
  const heroOpacity = Math.max(1 - heroExitProgress * 1.28, 0);
  const shutdownOpacity = Math.max(1 - heroExitProgress * 1.45, 0);
  const cosmosOpacity = Math.max(1 - heroExitProgress * 1.18, 0);
  
  const scanOpacity = phaseOpacity(progress, 0.46, 0.56, 0.66);
  const decodeChamberOpacity = phaseOpacityHold(progress, 0.46, 0.50, 0.62, 0.66);
  const workspaceGhostOpacity = phaseOpacityHold(progress, 0.54, 0.58, 0.64, 0.68);
  const collabSignalOpacity = phaseOpacity(progress, 0.60, 0.64, 0.70);
  const paperExitProgress = progressBetween(progress, 0.64, 0.76);
  const greenStageOpacity = phaseOpacityHold(progress, 0.72, 0.78, 0.90, 0.94);
  const greenCopyOpacity = phaseOpacityHold(progress, 0.80, 0.82, 0.89, 0.92);
  const blackStageOpacity = phaseOpacityHold(progress, 0.90, 0.94, 0.985, 1.0);
  const tickerOpacity = phaseOpacityHold(progress, 0.94, 0.95, 0.98, 0.992);
  const tickerSweep = progressBetween(progress, 0.94, 0.985);
  const tickerSettle = progressBetween(progress, 0.95, 0.975);
  const tickerChaos = Math.max(0, 1 - tickerSettle);
  
  const gateProgress = progressBetween(progress, 0.985, 0.998);
  const gateAuraOpacity = gateProgress * 0.24;
  const manuscriptFinalOpacity = 1 - progressBetween(progress, 0.64, 0.76) * 0.72;
  const ctaOpacity = progressBetween(progress, 0.985, 1.0);

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
  storyElement.style.setProperty("--rail-opacity", progressBetween(progress, 0.55, 0.65).toFixed(4));
  storyElement.style.setProperty("--scan-opacity", scanOpacity.toFixed(4));
  
  storyElement.style.setProperty("--decode-opacity", decodeChamberOpacity.toFixed(4));
  storyElement.style.setProperty("--decode-chamber-opacity", decodeChamberOpacity.toFixed(4));
  storyElement.style.setProperty("--decode-chamber-y", `${(26 * (1 - decodeChamberOpacity)).toFixed(3)}px`);
  
  storyElement.style.setProperty("--workspace-ghost-opacity", workspaceGhostOpacity.toFixed(4));
  storyElement.style.setProperty("--workspace-ghost-y", `${(30 * (1 - workspaceGhostOpacity)).toFixed(3)}px`);
  
  storyElement.style.setProperty("--collab-signal-opacity", collabSignalOpacity.toFixed(4));
  storyElement.style.setProperty("--collab-signal-y", `${(24 * (1 - collabSignalOpacity)).toFixed(3)}px`);
  storyElement.style.setProperty("--paper-exit-progress", paperExitProgress.toFixed(4));
  storyElement.style.setProperty("--green-stage-opacity", greenStageOpacity.toFixed(4));
  storyElement.style.setProperty("--green-copy-opacity", greenCopyOpacity.toFixed(4));
  storyElement.style.setProperty("--green-copy-y", `${(30 * (1 - greenCopyOpacity)).toFixed(3)}px`);
  storyElement.style.setProperty("--black-stage-opacity", blackStageOpacity.toFixed(4));
  storyElement.style.setProperty("--ticker-opacity", tickerOpacity.toFixed(4));
  storyElement.style.setProperty("--ticker-x", `${(42 - tickerSweep * 84).toFixed(3)}vw`);
  storyElement.style.setProperty("--ticker-y", `${(-4 + tickerSettle * 2).toFixed(3)}vh`);
  storyElement.style.setProperty("--ticker-chaos", tickerChaos.toFixed(4));
  storyElement.style.setProperty("--ticker-scale", (0.92 + tickerSettle * 0.08).toFixed(4));
  
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
  if (progress >= 0.985) {
    return "cta";
  }
  if (progress >= 0.94) {
    return "letterStorm";
  }
  if (progress >= 0.90) {
    return "blackCurtain";
  }
  if (progress >= 0.80) {
    return "greenCopy";
  }
  if (progress >= 0.72) {
    return "greenCurtain";
  }
  if (progress >= 0.64) {
    return "paperExit";
  }
  if (progress >= 0.60) {
    return "collab";
  }
  if (progress >= 0.54) {
    return "workspace";
  }
  if (progress >= 0.5) {
    return "decode";
  }
  if (progress >= 0.20) {
    return "center";
  }
  if (progress >= 0.10) {
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
        scrub: 0.8,
        snap: {
          snapTo(value) {
            if (value >= 0.62) {
              return value;
            }
            return gsap.utils.snap(SNAP_LABELS, value);
          },
          duration: { min: 0.25, max: 0.55 },
          delay: 0.08,
          ease: "power2.out",
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
