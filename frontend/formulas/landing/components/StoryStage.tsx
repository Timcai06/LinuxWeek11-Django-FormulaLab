import type { ScrollProgressRef } from "../types";
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
import { StoryRail } from "./StoryRail";
import { WorkbenchGateOverlay } from "./WorkbenchGateOverlay";

type StoryStageProps = {
  scrollProgressRef: ScrollProgressRef;
};

export function StoryStage({ scrollProgressRef }: StoryStageProps) {
  return (
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
      <StoryRail />
    </div>
  );
}
