import type { MutableRefObject, ReactNode } from "react";

export type LandingPhase = "intro" | "absorb" | "center" | "scan" | "reveal" | "cta";

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
  workspaceOpacity: number;
  ctaOpacity: number;
  phase: LandingPhase;
};
