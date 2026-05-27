import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

import type { ScrollDirectorProps } from "../types";
import { phaseForProgress, setStoryVars, snapToStoryBeat } from "../storyTimeline";
import { getLandingMotionRuntime, isMotionDebugEnabled } from "../performance/motionRuntime";

export function ScrollDirector({ scrollProgressRef, children }: ScrollDirectorProps) {
  const storyRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const storyElement = storyRef.current;
    if (!storyElement) {
      return undefined;
    }

    (window as any).__scrollProgressRef = scrollProgressRef;

    scrollProgressRef.current = 0;
    setStoryVars(storyElement, "intro", 0);

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      scrollProgressRef.current = 1;
      setStoryVars(storyElement, "cta", 1);
      return undefined;
    }

    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      duration: 0.92,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    const handleLenisScroll = () => ScrollTrigger.update();
    lenis.on("scroll", handleLenisScroll);

    const runtime = getLandingMotionRuntime({
      debug: isMotionDebugEnabled(),
    });
    runtime.setStage("intro", 0);
    const unsubscribeVisibility = runtime.subscribeVisibility((visible) => {
      if (!visible) {
        lenis.stop();
        return;
      }
      lenis.start();
      ScrollTrigger.refresh();
    });
    const unsubscribeLenis = runtime.subscribe(({ timeMs }) => {
      lenis.raf(timeMs);
    });

    const startRuntime = () => runtime.start();
    const stopRuntime = () => runtime.stop();

    if (!document.hidden) {
      startRuntime();
    } else {
      lenis.stop();
    }

    gsap.ticker.lagSmoothing(0);

    const context = gsap.context(() => {
      const trigger = ScrollTrigger.create({
        trigger: storyElement,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.86,
        snap: {
          snapTo: (value: number, self?: { direction?: number }) => snapToStoryBeat(value, self),
          duration: { min: 0.34, max: 0.72 },
          delay: 0.05,
          ease: "power4.out",
        },
        onUpdate(self) {
          const progress = self.progress;
          const phase = phaseForProgress(progress);
          scrollProgressRef.current = progress;
          runtime.setStage(phase, progress);
          setStoryVars(storyElement, phase, progress);
        },
      });

      return () => {
        trigger.kill();
      };
    }, storyElement);

    return () => {
      stopRuntime();
      unsubscribeLenis();
      unsubscribeVisibility();
      lenis.off("scroll", handleLenisScroll);
      context.revert();
      runtime.destroy();
      lenis.destroy();
      ScrollTrigger.update();
      scrollProgressRef.current = 0;
    };
  }, [scrollProgressRef]);

  return (
    <section className="landing-story" ref={storyRef} data-story-phase="intro">
      {children}
    </section>
  );
}
