import { useRef } from "react";

import { CollaborationSignalField } from "./CollaborationSignalField";
import { CurtainCopyStage } from "./CurtainCopyStage";
import { DecodeChamberOverlay } from "./DecodeChamberOverlay";
import { FormulaConstellationField } from "./FormulaConstellationField";
import { FormulaVortex } from "./FormulaVortex";
import { Hero } from "./Hero";
import { HorizontalTicker } from "./HorizontalTicker";
import { ManuscriptCanvas } from "./ManuscriptCanvas";
import { MorphCurtain } from "./MorphCurtain";
import { PaperWorkspaceGhost } from "./PaperWorkspaceGhost";
import { ScrollDirector } from "./ScrollDirector";
import { WorkbenchGateOverlay } from "./WorkbenchGateOverlay";

export function LandingScrollStory() {
  const scrollProgressRef = useRef(0);

  return (
    <ScrollDirector scrollProgressRef={scrollProgressRef}>
      <div className="landing-story-stage">
        <FormulaConstellationField />
        <FormulaVortex scrollProgressRef={scrollProgressRef} />
        <ManuscriptCanvas scrollProgressRef={scrollProgressRef} />
        <Hero />
        <div className="manuscript-scan-beam" aria-hidden="true" />
        <DecodeChamberOverlay />
        <PaperWorkspaceGhost />
        <CollaborationSignalField />
        <CurtainCopyStage scrollProgressRef={scrollProgressRef} />
        <HorizontalTicker scrollProgressRef={scrollProgressRef} />
        <WorkbenchGateOverlay />
        <MorphCurtain scrollProgressRef={scrollProgressRef} />
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
