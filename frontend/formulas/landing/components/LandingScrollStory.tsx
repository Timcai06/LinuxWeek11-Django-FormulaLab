import { useRef } from "react";

import { CollaborationSignalField } from "./CollaborationSignalField";
import { DecodeChamberOverlay } from "./DecodeChamberOverlay";
import { FormulaConstellationField } from "./FormulaConstellationField";
import { Hero } from "./Hero";
import { ManuscriptCanvas } from "./ManuscriptCanvas";
import { PaperWorkspaceGhost } from "./PaperWorkspaceGhost";
import { ScrollDirector } from "./ScrollDirector";
import { WorkbenchGateOverlay } from "./WorkbenchGateOverlay";

export function LandingScrollStory() {
  const scrollProgressRef = useRef(0);

  return (
    <ScrollDirector scrollProgressRef={scrollProgressRef}>
      <div className="landing-story-stage">
        <FormulaConstellationField />
        <ManuscriptCanvas scrollProgressRef={scrollProgressRef} />
        <Hero />
        <div className="manuscript-scan-beam" aria-hidden="true" />
        <DecodeChamberOverlay />
        <PaperWorkspaceGhost />
        <CollaborationSignalField />
        <WorkbenchGateOverlay />
        <div className="story-rail" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
    </ScrollDirector>
  );
}
