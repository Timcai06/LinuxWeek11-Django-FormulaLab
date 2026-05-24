import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { Hero } from "./Hero";
import { ManuscriptCanvas } from "./ManuscriptCanvas";

function phaseOpacity(progress: number, start: number, peak: number, end: number): number {
  if (progress <= start || progress >= end) {
    return 0;
  }
  if (progress <= peak) {
    return (progress - start) / (peak - start);
  }
  return 1 - (progress - peak) / (end - peak);
}

function progressBetween(progress: number, start: number, end: number): number {
  return Math.min(Math.max((progress - start) / (end - start), 0), 1);
}

export function LandingScrollStory() {
  const storyRef = useRef<HTMLElement>(null);
  const scrollProgressRef = useRef(0);

  useEffect(() => {
    const storyElement = storyRef.current;
    if (!storyElement) {
      return undefined;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      storyElement.style.setProperty("--story-progress", "0");
      storyElement.style.setProperty("--hero-opacity", "1");
      storyElement.style.setProperty("--hero-y", "0px");
      storyElement.style.setProperty("--text-disperse", "0px");
      storyElement.style.setProperty("--copy-x", "0px");
      storyElement.style.setProperty("--kicker-x", "0px");
      storyElement.style.setProperty("--actions-x", "0px");
      storyElement.style.setProperty("--text-scale", "1");
      storyElement.style.setProperty("--shutdown-opacity", "1");
      storyElement.style.setProperty("--readout-x", "0px");
      storyElement.style.setProperty("--cosmos-opacity", "1");
      storyElement.style.setProperty("--stardust-opacity", "0.32");
      storyElement.style.setProperty("--scanline-opacity", "0.36");
      storyElement.style.setProperty("--rail-opacity", "0");
      storyElement.style.setProperty("--scan-opacity", "0");
      storyElement.style.setProperty("--decode-opacity", "0");
      storyElement.style.setProperty("--workspace-opacity", "0");
      storyElement.style.setProperty("--workspace-scale", "0.96");
      storyElement.style.setProperty("--workspace-y", "28px");
      storyElement.style.setProperty("--scan-x", "0vw");
      storyElement.style.setProperty("--scan-y", "0vh");
      return undefined;
    }

    gsap.registerPlugin(ScrollTrigger);

    const context = gsap.context(() => {
      const trigger = ScrollTrigger.create({
        trigger: storyElement,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate(self) {
          const progress = self.progress;
          const centerProgress = progressBetween(progress, 0.18, 0.48);
          const heroOpacity = Math.max(1 - centerProgress * 1.25, 0);
          const shutdownOpacity = Math.max(1 - centerProgress * 1.4, 0);
          const cosmosOpacity = Math.max(1 - centerProgress * 1.18, 0);
          const scanOpacity = phaseOpacity(progress, 0.5, 0.62, 0.74);
          const decodeOpacity = phaseOpacity(progress, 0.66, 0.78, 0.94);
          const workspaceProgress = progressBetween(progress, 0.72, 0.92);

          scrollProgressRef.current = progress;
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
          storyElement.style.setProperty("--workspace-opacity", workspaceProgress.toFixed(4));
          storyElement.style.setProperty("--workspace-scale", (0.96 + workspaceProgress * 0.04).toFixed(4));
          storyElement.style.setProperty("--workspace-y", `${(28 * (1 - workspaceProgress)).toFixed(3)}px`);
          storyElement.style.setProperty("--scan-x", `${(-22 * progress).toFixed(3)}vw`);
          storyElement.style.setProperty("--scan-y", `${(16 * progress).toFixed(3)}vh`);
          storyElement.dataset.storyPhase = progress > 0.74 ? "decode" : progress > 0.5 ? "scan" : progress > 0.18 ? "converge" : "encounter";
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
  }, []);

  return (
    <section className="landing-story" ref={storyRef} data-story-phase="encounter">
      <div className="landing-story-stage">
        <ManuscriptCanvas scrollProgressRef={scrollProgressRef} />
        <Hero />
        <div className="manuscript-scan-beam" aria-hidden="true" />
        <div className="workspace-reveal" aria-hidden="true">
          <div className="workspace-shell">
            <div className="workspace-pane workspace-pane-outline">
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="workspace-pane workspace-pane-paper">
              <span />
              <span />
              <span />
            </div>
            <div className="workspace-pane workspace-pane-review">
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>
        <div className="story-rail" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
    </section>
  );
}
