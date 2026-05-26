import { useEffect, useRef } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

import type { ScrollProgressRef } from "../types";
import { easedRange, phaseOpacityHold } from "../three/motion";

const COPY_BLOCKS = [
  "Turn rough formula captures into trusted LaTeX evidence.",
  "Review every candidate beside the paper, not in a disconnected OCR box.",
  "Keep corrections, context, and collaboration moving inside one research workspace.",
];

const COPY_RANGES = [
  [0.900, 0.918],
  [0.930, 0.948],
  [0.960, 0.978],
] as const;

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

    const context = gsap.context(() => {
      copyNodes.forEach((node, index) => {
        const split = SplitText.create(node, {
          type: "words,lines",
          mask: "lines",
          linesClass: "curtain-copy-line",
          wordsClass: "curtain-copy-word",
          autoSplit: true,
          onSplit(instance) {
            const animation = gsap.fromTo(
              instance.lines,
              { autoAlpha: 0, yPercent: 120, rotateX: 8 },
              {
                autoAlpha: 1,
                yPercent: 0,
                rotateX: 0,
                duration: 1,
                ease: "power3.out",
                stagger: 0.1,
                paused: true,
              },
            );
            animationsRef.current[index]?.kill();
            animationsRef.current[index] = animation;
            return animation;
          },
        });
        splitRefs.current.push(split);
      });
    }, root);

    let raf = 0;
    const update = () => {
      const progress = scrollProgressRef.current;
      animationsRef.current.forEach((animation, index) => {
        const range = COPY_RANGES[index] ?? COPY_RANGES[COPY_RANGES.length - 1]!;
        const [start, end] = range;
        animation.progress(easedRange(progress, start, end));
      });
      containersRef.current.forEach((container, index) => {
        const fadeInStart = [0.895, 0.925, 0.955][index] ?? 0.955;
        const fadeInEnd = fadeInStart + 0.01;
        const fadeOutStart = fadeInStart + 0.022;
        const fadeOutEnd = fadeOutStart + 0.01;
        container.style.opacity = phaseOpacityHold(progress, fadeInStart, fadeInEnd, fadeOutStart, fadeOutEnd).toFixed(3);
      });
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(raf);
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
          <div className="curtain-copy-container" key={copy}>
            <h2 data-curtain-copy data-copy-index={index}>
              {copy}
            </h2>
          </div>
        ))}
      </div>
    </section>
  );
}
