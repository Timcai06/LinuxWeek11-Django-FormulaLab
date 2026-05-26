import type { ScrollProgressRef } from "../types";
import { CurtainCopyStage } from "./CurtainCopyStage";
import { HorizontalTicker } from "./HorizontalTicker";
import { MorphCurtain } from "./MorphCurtain";
import { WorkbenchGateOverlay } from "./WorkbenchGateOverlay";

export function LandingTailSequence({ scrollProgressRef }: { scrollProgressRef: ScrollProgressRef }) {
  return (
    <>
      <CurtainCopyStage scrollProgressRef={scrollProgressRef} />
      <HorizontalTicker scrollProgressRef={scrollProgressRef} />
      <WorkbenchGateOverlay />
      <MorphCurtain scrollProgressRef={scrollProgressRef} />
    </>
  );
}
