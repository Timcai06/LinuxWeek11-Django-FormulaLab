import { useEffect, useRef } from "react";
import { COLLAB_SIGNALS } from "../storyChoreography";
import { getLandingMotionRuntime } from "../performance/motionRuntime";

const SIGNALS = [
  { className: "collaboration-signal-comment", label: "Comment", value: "Check symbol domain", range: [0.0, 0.35] },
  { className: "collaboration-signal-accept", label: "Accept change", value: "Replace handwritten fraction", range: [0.20, 0.50] },
  { className: "collaboration-signal-cursor", label: "cursor", value: "Ada reviewing line 42", range: [0.40, 0.65] },
] as const;

export function CollaborationSignalField() {
  const signalRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isReduced) {
      signalRefs.current.forEach((el) => {
        if (el) {
          el.style.opacity = "1";
          el.style.transform = "none";
          el.style.visibility = "visible";
        }
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

      const [start, end] = COLLAB_SIGNALS;
      let p = 0;
      if (progress > start) {
        p = Math.min(1, (progress - start) / (end - start));
      }

      signalRefs.current.forEach((el, index) => {
        if (!el) return;
        const signal = SIGNALS[index];
        if (!signal) return;
        const [sigStart, sigEnd] = signal.range;

        let sp = 0;
        if (p > sigStart) {
          sp = Math.min(1, (p - sigStart) / (sigEnd - sigStart));
        }

        el.style.opacity = sp.toFixed(3);
        el.style.transform = `translate3d(0, ${((1 - sp) * 16).toFixed(3)}px, 0)`;
        el.style.visibility = sp > 0 ? "visible" : "hidden";
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
    <aside className="collaboration-signal-field cinematic-overlay" aria-label="Collaboration signals">
      {SIGNALS.map((signal, index) => (
        <div
          className={`collaboration-signal ${signal.className}`}
          key={signal.label}
          ref={(el) => { signalRefs.current[index] = el; }}
          style={{ opacity: 0, visibility: "hidden" }}
        >
          <span>{signal.label}</span>
          <strong>{signal.value}</strong>
        </div>
      ))}
    </aside>
  );
}
