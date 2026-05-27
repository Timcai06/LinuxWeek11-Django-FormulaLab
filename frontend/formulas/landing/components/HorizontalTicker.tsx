import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

import { LETTER_STORM } from "../storyChoreography";
import { getLandingMotionRuntime } from "../performance/motionRuntime";
import type { ScrollProgressRef } from "../types";
import { progressBetween } from "../three/motion";

const COPY = "FORMULA LAB • PAPER WORKSPACE • REVIEW INBOX • COLLABORATION MEMORY •";

gsap.registerPlugin(SplitText);

function seededRandom(index: number) {
  const seed = Math.sin(index * 999 + 42) * 10000;
  return seed - Math.floor(seed);
}

export function HorizontalTicker({ scrollProgressRef }: { scrollProgressRef: ScrollProgressRef }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);

  useLayoutEffect(() => {
    const trackElement = trackRef.current;
    const textElement = textRef.current;
    if (!trackElement || !textElement) {
      return undefined;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      return undefined;
    }

    let split: SplitText | undefined;
    let revealTimeline: gsap.core.Timeline | undefined;
    let tickerDistancePx = 0;

    const measureTickerDistance = () => {
      tickerDistancePx = textElement.scrollWidth + window.innerWidth * 1.15;
    };

    const context = gsap.context(() => {
      split = SplitText.create(textElement, {
        type: "chars, words",
        charsClass: "ht-char",
        wordsClass: "ht-word",
      });

      split.chars?.forEach((char, index) => {
        const charElement = char as HTMLElement;
        charElement.style.setProperty("--char-drift", `${Math.round((seededRandom(index) * 2 - 1) * 220)}%`);
        charElement.style.setProperty("--char-rotation", `${((seededRandom(index + 31) * 2 - 1) * 20).toFixed(2)}deg`);
      });

      revealTimeline = gsap
        .timeline({ paused: true, defaults: { ease: "back.out(1.2)" } })
        .fromTo(
          split.chars ?? [],
          {
            autoAlpha: 0,
            rotation: (index) => `${((seededRandom(index + 31) * 2 - 1) * 20).toFixed(2)}deg`,
            yPercent: (index) => Math.round((seededRandom(index) * 2 - 1) * 220),
          },
          {
            autoAlpha: 1,
            duration: 1,
            rotation: 0,
            stagger: { each: 0.014, from: "start" },
            yPercent: 0,
          },
        );
      measureTickerDistance();
    }, textElement);

    const runtime = getLandingMotionRuntime();
    const unsubscribe = runtime.subscribe(() => {
      const stormProgress = progressBetween(scrollProgressRef.current, LETTER_STORM[0] + 0.002, LETTER_STORM[1] - 0.006);
      revealTimeline?.progress(stormProgress);
      trackElement.style.setProperty("--ticker-measured-x", `${(-stormProgress * tickerDistancePx).toFixed(3)}px`);
    });
    window.addEventListener("resize", measureTickerDistance);

    return () => {
      window.removeEventListener("resize", measureTickerDistance);
      unsubscribe();
      revealTimeline?.kill();
      split?.revert();
      context.revert();
    };
  }, [scrollProgressRef]);

  return (
    <div className="ht-section" aria-hidden="true">
      <div className="ht-track" ref={trackRef}>
        <h3 className="ht-text heading-xl" ref={textRef}>
          {COPY}
        </h3>
      </div>
    </div>
  );
}
