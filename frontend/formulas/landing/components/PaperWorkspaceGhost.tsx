import { useEffect, useRef } from "react";
import { WORKSPACE_GHOST } from "../storyChoreography";
import { getLandingMotionRuntime } from "../performance/motionRuntime";

const REVIEW_ITEMS = ["Gaussian integral", "Matrix inverse", "Boundary condition"];
const EDITOR_TEXT = String.raw`\begin{equation}
  E = mc^2
\end{equation}`;

const GLITCH_CHARS = "01X$=+";

export function PaperWorkspaceGhost() {
  const codeRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isReduced) {
      if (codeRef.current) codeRef.current.textContent = EDITOR_TEXT;
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

      const [start, end] = WORKSPACE_GHOST;
      let p = 0;
      if (progress > start) {
        p = Math.min(1, (progress - start) / (end - start));
      }

      if (codeRef.current) {
        const tp = Math.min(1, p / 0.60);
        if (tp <= 0) {
          codeRef.current.textContent = "";
        } else if (tp >= 1) {
          codeRef.current.textContent = EDITOR_TEXT;
        } else {
          // Staggered typing with a small glitch character
          const revealLen = Math.floor(tp * EDITOR_TEXT.length);
          const baseText = EDITOR_TEXT.substring(0, revealLen);
          const randomChar = GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
          codeRef.current.textContent = baseText + randomChar + "_";
        }
      }

    };

    update();
    const runtime = getLandingMotionRuntime();
    const unsubscribe = runtime.subscribe(update);

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <section className="paper-workspace-ghost cinematic-overlay" aria-label="Paper workspace preview">
      <div className="paper-workspace-ghost-editor">
        <span className="cinematic-kicker">main.tex</span>
        <pre ref={codeRef} />
      </div>
      <div className="paper-workspace-ghost-inbox">
        <span className="cinematic-kicker">Review inbox</span>
        {REVIEW_ITEMS.map((item) => (
          <span className="paper-workspace-ghost-item" key={item}>
            {item}
          </span>
        ))}
      </div>
      <div className="paper-workspace-ghost-preview" aria-hidden="true">
        <span className="cinematic-kicker" style={{ position: "relative", zIndex: 5 }}>PDF Preview</span>
        <div className="paper-workspace-ghost-preview-body">
          <div className="paper-workspace-ghost-column">
            <span />
            <span />
            <span className="formula-block" />
            <span />
          </div>
          <div className="paper-workspace-ghost-column">
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    </section>
  );
}
