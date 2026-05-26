import { useEffect, useRef } from "react";
import { DECODE_CHAMBER } from "../storyChoreography";
import { getLandingMotionRuntime } from "../performance/motionRuntime";

const DECODE_LINES = [
  { label: "LaTeX candidate", value: String.raw`\int_\Omega \nabla u \cdot \nabla v\,dx`, range: [0.0, 0.40] },
  { label: "Structure", value: "integral -> gradient -> bilinear form", range: [0.25, 0.50] },
  { label: "Confidence", value: "0.94", range: [0.45, 0.60] },
] as const;

const GLITCH_CHARS = "01X$%&#@?[]{}+=";

export function DecodeChamberOverlay() {
  const codeRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isReduced) {
      codeRefs.current.forEach((el, idx) => {
        const line = DECODE_LINES[idx];
        if (el && line) el.textContent = line.value;
      });
      return undefined;
    }

    let lastProgress = -1;

    const update = () => {
      const scrollProgressRef = (window as any).__scrollProgressRef;
      const progress = scrollProgressRef ? scrollProgressRef.current : 0;
      if (progress === lastProgress) {
        return;
      }
      lastProgress = progress;

      const [start, end] = DECODE_CHAMBER;
      let p = 0;
      if (progress > start) {
        p = Math.min(1, (progress - start) / (end - start));
      }

      codeRefs.current.forEach((el, index) => {
        if (!el) return;
        const line = DECODE_LINES[index];
        if (!line) return;
        const [lineStart, lineEnd] = line.range;

        let lp = 0;
        if (p > lineStart) {
          lp = Math.min(1, (p - lineStart) / (lineEnd - lineStart));
        }

        if (lp <= 0) {
          el.textContent = "";
        } else if (lp >= 1) {
          el.textContent = line.value;
        } else {
          const totalLen = line.value.length;
          const revealLen = Math.floor(lp * totalLen);
          const baseText = line.value.substring(0, revealLen);
          const randomChar = GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
          el.textContent = baseText + randomChar + "_";
        }
      });

    };

    update();
    const runtime = getLandingMotionRuntime();
    const unsubscribe = runtime.subscribe(update);

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <aside className="decode-chamber cinematic-overlay" aria-label="Formula decode chamber">
      <span className="cinematic-kicker">Decode Chamber</span>
      <div className="decode-chamber-core">
        {DECODE_LINES.map((line, index) => (
          <div className="decode-chamber-row" key={line.label}>
            <span>{line.label}</span>
            <code ref={(el) => { codeRefs.current[index] = el; }} />
          </div>
        ))}
      </div>
      <p className="decode-chamber-note">Candidate repair ready for review inbox.</p>
    </aside>
  );
}
