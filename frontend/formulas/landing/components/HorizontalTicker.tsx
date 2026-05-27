import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

import { LETTER_STORM } from "../storyChoreography";
import { getLandingMotionRuntime } from "../performance/motionRuntime";
import type { ScrollProgressRef } from "../types";
import { progressBetween } from "../three/motion";

const COPY = "FORMULA LAB • PAPER WORKSPACE • REVIEW INBOX • COLLABORATION MEMORY •";
const TICKER_REVEAL_RANGE = [LETTER_STORM[0] + 0.006, LETTER_STORM[1] - 0.014] as const;
const TICKER_CENTER_RANGE = [0.928, 0.952] as const;

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
    let resetRendererGate: (() => void) | undefined;

    const measureTickerDistance = () => {
      tickerDistancePx = textElement.scrollWidth + window.innerWidth * 1.15;
      resetRendererGate?.();
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
        .timeline({ paused: true, defaults: { ease: "power3.out" } })
        .fromTo(
          split.chars ?? [],
          {
            autoAlpha: 0,
            rotation: (index) => `${((seededRandom(index + 31) * 2 - 1) * 10).toFixed(2)}deg`,
            yPercent: (index) => Math.round((seededRandom(index) * 2 - 1) * 120),
          },
          {
            autoAlpha: 1,
            duration: 1.25,
            rotation: 0,
            stagger: { each: 0.01, from: "start" },
            yPercent: 0,
          },
        );
      measureTickerDistance();
    }, textElement);

    const runtime = getLandingMotionRuntime();
    const unsubscribe = runtime.subscribeRenderer({
      id: "horizontal-ticker",
      phases: ["letterStorm"],
      epsilon: 0.00001,
    }, (frame) => {
      const stormProgress = progressBetween(frame.progress, TICKER_REVEAL_RANGE[0], TICKER_REVEAL_RANGE[1]);
      const centerProgress = progressBetween(frame.progress, TICKER_CENTER_RANGE[0], TICKER_CENTER_RANGE[1]);
      const centerEase = gsap.parseEase("power2.inOut")(centerProgress);
      revealTimeline?.progress(stormProgress);
      trackElement.style.setProperty("--ticker-measured-x", `${(-stormProgress * tickerDistancePx).toFixed(3)}px`);
      trackElement.style.setProperty("--ticker-center-settle", centerEase.toFixed(4));
    });
    resetRendererGate = unsubscribe.reset;
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
