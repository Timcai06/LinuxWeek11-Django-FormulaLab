import { useEffect, useRef } from "react";
import type { ScrollProgressRef } from "../types";
import { DECODE_CHAMBER, COLLAB_SIGNALS } from "../storyChoreography";
import { getLandingMotionRuntime } from "../performance/motionRuntime";
import { CollaborationSignalField } from "./CollaborationSignalField";
import { DecodeChamberOverlay } from "./DecodeChamberOverlay";
import { FormulaConstellationField } from "./FormulaConstellationField";
import { FormulaVortex } from "./FormulaVortex";
import { Hero } from "./Hero";
import { LandingTailSequence } from "./LandingTailSequence";
import { ManuscriptCanvas } from "./ManuscriptCanvas";
import { PaperWorkspaceGhost } from "./PaperWorkspaceGhost";
import { StoryRail } from "./StoryRail";

type StoryStageProps = {
  scrollProgressRef: ScrollProgressRef;
};

/* SVG Overlay for drawing blueprint-like alignment guides and tethers */
function StoryTetherCanvas({ scrollProgressRef }: { scrollProgressRef: ScrollProgressRef }) {
  const targetGroupRef = useRef<SVGGElement>(null);
  const dcLineRef = useRef<SVGPathElement>(null);
  const dcDotRef = useRef<SVGCircleElement>(null);
  const collabLineRef = useRef<SVGPathElement>(null);
  const collabDotRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isReduced) return undefined;

    const dcCore = document.querySelector(".decode-chamber-core");
    const cursorSignal = document.querySelector(".collaboration-signal-cursor");
    const editorBlock = document.querySelector(".paper-workspace-ghost-column span.formula-block");

    const update = () => {
      const progress = scrollProgressRef.current;
      const cw = window.innerWidth;
      const ch = window.innerHeight;

      // Target box on centered paper
      const targetX = cw * 0.46;
      const targetY = ch * 0.45;

      if (targetGroupRef.current) {
        targetGroupRef.current.setAttribute("transform", `translate(${targetX}, ${targetY})`);
      }

      // 1. Decode Chamber Line & Target Box visibility
      const [startDC, endDC] = DECODE_CHAMBER;
      const dcActive = progress >= startDC && progress <= endDC;

      let dcOpacity = 0;
      if (dcActive) {
        dcOpacity = Math.min(1, (progress - startDC) / 0.015) * Math.min(1, (endDC - progress) / 0.015);
      }

      if (targetGroupRef.current) {
        targetGroupRef.current.style.opacity = dcOpacity.toFixed(3);
      }

      // Find Decode Chamber position for line drawing
      if (dcCore && dcActive && dcLineRef.current && dcDotRef.current) {
        const rect = dcCore.getBoundingClientRect();
        const endX = rect.left;
        const endY = rect.top + 32;
        const midX = targetX + (endX - targetX) * 0.55;

        const pathD = `M ${targetX} ${targetY} H ${midX} V ${endY} H ${endX}`;
        dcLineRef.current.setAttribute("d", pathD);
        dcLineRef.current.style.opacity = (dcOpacity * 0.5).toFixed(3);

        // Pulse dot moving repeatingly along the line
        const t = ((progress - startDC) / (endDC - startDC) * 5) % 1.0;
        let px = targetX;
        let py = targetY;

        if (t < 0.35) {
          px = targetX + (midX - targetX) * (t / 0.35);
        } else if (t < 0.7) {
          px = midX;
          py = targetY + (endY - targetY) * ((t - 0.35) / 0.35);
        } else {
          px = midX + (endX - midX) * ((t - 0.7) / 0.3);
          py = endY;
        }

        dcDotRef.current.setAttribute("cx", px.toString());
        dcDotRef.current.setAttribute("cy", py.toString());
        dcDotRef.current.style.opacity = dcOpacity.toFixed(3);
      } else {
        if (dcLineRef.current) dcLineRef.current.style.opacity = "0";
        if (dcDotRef.current) dcDotRef.current.style.opacity = "0";
      }

      // 2. Collab Signal cursor to Workspace Editor line
      const [startCollab, endCollab] = COLLAB_SIGNALS;
      const collabActive = progress >= startCollab && progress <= endCollab;

      let collabOpacity = 0;
      if (collabActive) {
        collabOpacity = Math.min(1, (progress - startCollab) / 0.015) * Math.min(1, (endCollab - progress) / 0.015);
      }

      if (cursorSignal && editorBlock && collabActive && collabLineRef.current && collabDotRef.current) {
        const rect1 = cursorSignal.getBoundingClientRect();
        const rect2 = editorBlock.getBoundingClientRect();

        const xStart = rect1.left;
        const yStart = rect1.top + rect1.height / 2;
        const xEnd = rect2.left + rect2.width;
        const yEnd = rect2.top + rect2.height / 2;

        const pathD = `M ${xStart} ${yStart} L ${xEnd} ${yEnd}`;
        collabLineRef.current.setAttribute("d", pathD);
        collabLineRef.current.style.opacity = (collabOpacity * 0.45).toFixed(3);

        const t = ((progress - startCollab) / (endCollab - startCollab) * 4) % 1.0;
        const px = xStart + (xEnd - xStart) * t;
        const py = yStart + (yEnd - yStart) * t;

        collabDotRef.current.setAttribute("cx", px.toString());
        collabDotRef.current.setAttribute("cy", py.toString());
        collabDotRef.current.style.opacity = collabOpacity.toFixed(3);
      } else {
        if (collabLineRef.current) collabLineRef.current.style.opacity = "0";
        if (collabDotRef.current) collabDotRef.current.style.opacity = "0";
      }
    };

    update();
    const runtime = getLandingMotionRuntime();
    const unsubscribe = runtime.subscribe(update);

    return () => {
      unsubscribe();
    };
  }, [scrollProgressRef]);

  return (
    <svg className="story-tether-svg" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 4, pointerEvents: "none" }}>
      {/* Target scanning lock-box brackets */}
      <g ref={targetGroupRef} style={{ opacity: 0 }}>
        <path d="M -50 -18 H -38 V -6 M 50 -18 H 38 V -6 M -50 18 H -38 V 6 M 50 18 H 38 V 6" stroke="rgba(92, 255, 176, 0.95)" strokeWidth="1.5" fill="none" />
        <text x="-46" y="-23" fill="rgba(92, 255, 176, 0.95)" fontSize="9" fontFamily="JetBrains Mono" fontWeight="bold" letterSpacing="0.05em">LOCK: ACQ</text>
      </g>

      {/* Decode Chamber orthogonal path and tracing dot */}
      <path ref={dcLineRef} fill="none" stroke="rgba(92, 255, 176, 0.6)" strokeWidth="1" strokeDasharray="3 3" style={{ opacity: 0 }} />
      <circle ref={dcDotRef} r="4" fill="rgba(92, 255, 176, 1)" style={{ opacity: 0, filter: "drop-shadow(0 0 4px rgba(92, 255, 176, 0.8))" }} />

      {/* Collab cursor log tracking line and tracing dot */}
      <path ref={collabLineRef} fill="none" stroke="rgba(92, 255, 176, 0.5)" strokeWidth="1" strokeDasharray="3 3" style={{ opacity: 0 }} />
      <circle ref={collabDotRef} r="3.5" fill="rgba(92, 255, 176, 0.9)" style={{ opacity: 0, filter: "drop-shadow(0 0 3px rgba(92, 255, 176, 0.7))" }} />
    </svg>
  );
}

export function StoryStage({ scrollProgressRef }: StoryStageProps) {
  return (
    <div className="landing-story-stage">
      <FormulaConstellationField />
      <FormulaVortex scrollProgressRef={scrollProgressRef} />
      <ManuscriptCanvas scrollProgressRef={scrollProgressRef} />
      <Hero />
      <div className="manuscript-scan-beam" aria-hidden="true" />
      <div className="paper-system-transfer" aria-hidden="true" />
      <div className="story-gallery-strip" style={{ transform: "translate3d(var(--gallery-x, 0vw), 0, 0)" }}>
        <div className="gallery-slide slide-decode">
          <DecodeChamberOverlay />
        </div>
        <div className="gallery-slide slide-workspace">
          <PaperWorkspaceGhost />
        </div>
        <div className="gallery-slide slide-collab">
          <CollaborationSignalField />
        </div>
      </div>
      <StoryTetherCanvas scrollProgressRef={scrollProgressRef} />
      <LandingTailSequence scrollProgressRef={scrollProgressRef} />
      <StoryRail />
    </div>
  );
}
