import type { MutableRefObject, ReactNode } from "react";

export type LandingPhase = "intro" | "absorb" | "center" | "decode" | "workspace" | "collab" | "cta";

export type ScrollProgressRef = MutableRefObject<number>;

export type ScrollDirectorProps = {
  scrollProgressRef: ScrollProgressRef;
  children: ReactNode;
};

export type StoryCssVars = {
  storyProgress: number;
  heroOpacity: number;
  shutdownOpacity: number;
  cosmosOpacity: number;
  scanOpacity: number;
  decodeChamberOpacity: number;
  workspaceGhostOpacity: number;
  collabSignalOpacity: number;
  gateOpacity: number;
  ctaOpacity: number;
  phase: LandingPhase;
};
