import { useRef } from "react";

import { FormulaConstellationField } from "./FormulaConstellationField";
import { Hero } from "./Hero";
import { ManuscriptCanvas } from "./ManuscriptCanvas";
import { ScrollDirector } from "./ScrollDirector";
import { WorkspaceRevealOverlay } from "./WorkspaceRevealOverlay";

export function LandingScrollStory() {
  const scrollProgressRef = useRef(0);

  return (
    <ScrollDirector scrollProgressRef={scrollProgressRef}>
      <div className="landing-story-stage">
        <FormulaConstellationField />
        <ManuscriptCanvas scrollProgressRef={scrollProgressRef} />
        <Hero />
        <div className="manuscript-scan-beam" aria-hidden="true" />
        <WorkspaceRevealOverlay />
        <div className="story-rail" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
    </ScrollDirector>
  );
}
