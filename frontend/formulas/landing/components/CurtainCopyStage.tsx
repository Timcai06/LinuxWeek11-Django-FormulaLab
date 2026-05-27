import { useEffect, useRef } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

import { REAL_GREEN_COPY_BLOCK_RANGES, REAL_GREEN_COPY_VISIBILITY_RANGES } from "../storyChoreography";
import type { ScrollProgressRef } from "../types";
import { easedRange, phaseOpacityHold } from "../three/motion";
import { getLandingMotionRuntime } from "../performance/motionRuntime";

const COPY_BLOCKS = [
  {
    eyebrow: "01 CAPTURE",
    body: "Turn rough formula captures into trusted LaTeX evidence.",
  },
  {
    eyebrow: "02 REVIEW",
    body: "Review every candidate beside the paper, not in a disconnected OCR box.",
  },
  {
    eyebrow: "03 COLLABORATE",
    body: "Keep corrections, context, and collaboration moving inside one research workspace.",
  },
];

const COPY_PROGRESS_EPSILON = 0.00005;
const DWELL_TRANSLATE_PX = 12;
const COPY_SETTLE_SCALE = 0.018;

export function CurtainCopyStage({ scrollProgressRef }: { scrollProgressRef: ScrollProgressRef }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const animationsRef = useRef<gsap.core.Animation[]>([]);
  const splitRefs = useRef<SplitText[]>([]);
  const containersRef = useRef<HTMLElement[]>([]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }

    gsap.registerPlugin(SplitText);
    const copyNodes = Array.from(root.querySelectorAll<HTMLElement>("[data-curtain-copy]"));
    containersRef.current = Array.from(root.querySelectorAll<HTMLElement>(".curtain-copy-container"));

    let lastRenderedProgress = -1;

    const settleEase = gsap.parseEase("power3.out");

    const context = gsap.context(() => {
      copyNodes.forEach((node, index) => {
        const split = SplitText.create(node, {
          type: "lines,words,chars",
          mask: "lines",
          linesClass: "curtain-copy-line",
          wordsClass: "curtain-copy-word",
          charsClass: "curtain-copy-char",
          autoSplit: true,
          onSplit(instance) {
            const animation = gsap.fromTo(
              instance.chars,
              { autoAlpha: 0, y: 10, scale: 0.94, rotate: -2 },
              {
                autoAlpha: 1,
                y: 0,
                scale: 1,
                rotate: 0,
                duration: 1.18,
                ease: "power3.out",
                stagger: { each: 0.022, from: "start" },
                paused: true,
              },
            );
            animationsRef.current[index]?.kill();
            animationsRef.current[index] = animation;
            lastRenderedProgress = -1;
            return animation;
          },
        });
        splitRefs.current.push(split);
      });
    }, root);

    const update = () => {
      const progress = scrollProgressRef.current;
      if (Math.abs(progress - lastRenderedProgress) < COPY_PROGRESS_EPSILON) {
        return;
      }

      // 1. Text Animation Playback
      animationsRef.current.forEach((animation, index) => {
        const range = REAL_GREEN_COPY_BLOCK_RANGES[index] ?? REAL_GREEN_COPY_BLOCK_RANGES[REAL_GREEN_COPY_BLOCK_RANGES.length - 1]!;
        const [start, end] = range;
        animation.progress(easedRange(progress, start, end));
      });

      // 2. Text Container Opacity & Subtle Float
      containersRef.current.forEach((container, index) => {
        const [fadeInStart, fadeInEnd, fadeOutStart, fadeOutEnd] =
          REAL_GREEN_COPY_VISIBILITY_RANGES[index] ?? REAL_GREEN_COPY_VISIBILITY_RANGES[REAL_GREEN_COPY_VISIBILITY_RANGES.length - 1]!;
        const opacity = phaseOpacityHold(progress, fadeInStart, fadeInEnd, fadeOutStart, fadeOutEnd);
        const entry = 1 - easedRange(progress, fadeInStart, fadeInEnd);
        const exit = easedRange(progress, fadeOutStart, fadeOutEnd);
        const settle = settleEase(easedRange(progress, fadeInStart, fadeInEnd));
        const scale = 1 + (1 - settle) * COPY_SETTLE_SCALE - exit * 0.012;
        container.style.opacity = opacity.toFixed(3);
        container.style.transform = `translate3d(0, ${(entry * DWELL_TRANSLATE_PX - exit * DWELL_TRANSLATE_PX).toFixed(3)}px, 0) scale(${scale.toFixed(4)})`;
      });

      lastRenderedProgress = progress;
    };

    update();
    const runtime = getLandingMotionRuntime();
    const unsubscribe = runtime.subscribe(update);

    return () => {
      unsubscribe();
      animationsRef.current.forEach((animation) => animation.kill());
      animationsRef.current = [];
      splitRefs.current.forEach((split) => split.revert());
      splitRefs.current = [];
      context.revert();
    };
  }, [scrollProgressRef]);

  return (
    <section className="curtain-copy-stage" ref={rootRef} aria-hidden="true">
      <div className="green-curtain-panel" />
      <div className="black-curtain-panel" />

      <div className="curtain-copy-content">
        {COPY_BLOCKS.map((copy, index) => (
          <div className="curtain-copy-container" key={copy.eyebrow}>
            <p className="curtain-copy-eyebrow">{copy.eyebrow}</p>
            <h2 data-curtain-copy data-copy-index={index}>
              {copy.body}
            </h2>
          </div>
        ))}
      </div>
    </section>
  );
}
