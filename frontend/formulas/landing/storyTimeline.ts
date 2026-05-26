import gsap from "gsap";

import type { LandingPhase } from "./types";
import { phaseOpacity, phaseOpacityHold, progressBetween } from "./three/motion";

export const STORY_SNAP_POINTS = [0, 0.06, 0.16, 0.24, 0.30, 0.42, 0.58, 0.68, 0.76, 0.84, 0.92, 0.965, 0.99];
export const SOFT_SNAP_RADIUS = 0.035;

export function snapToStoryBeat(value: number) {
  const nearest = gsap.utils.snap(STORY_SNAP_POINTS, value);
  if (value < 0.70 || Math.abs(nearest - value) <= SOFT_SNAP_RADIUS) {
    return nearest;
  }
  return value;
}

export function setStoryVars(storyElement: HTMLElement, phase: LandingPhase, progress: number) {
  const centerProgress = progressBetween(progress, 0.06, 0.30);
  const heroExitProgress = progressBetween(progress, 0.06, 0.24);
  const heroOpacity = Math.max(1 - heroExitProgress * 1.28, 0);
  const shutdownOpacity = Math.max(1 - heroExitProgress * 1.45, 0);
  const cosmosOpacity = Math.max(1 - heroExitProgress * 1.18, 0);

  const scanOpacity = phaseOpacity(progress, 0.28, 0.36, 0.44);
  const decodeChamberOpacity = phaseOpacityHold(progress, 0.30, 0.36, 0.44, 0.50);
  const workspaceGhostOpacity = phaseOpacityHold(progress, 0.42, 0.48, 0.54, 0.60);
  const collabSignalOpacity = phaseOpacityHold(progress, 0.58, 0.63, 0.68, 0.72);
  const paperExitProgress = progressBetween(progress, 0.66, 0.74);
  const greenStageOpacity = phaseOpacityHold(progress, 0.68, 0.76, 0.90, 0.925);
  const greenCopyOpacity = phaseOpacityHold(progress, 0.76, 0.79, 0.90, 0.925);
  const blackStageOpacity = phaseOpacityHold(progress, 0.92, 0.945, 0.968, 0.985);
  const tickerOpacity = phaseOpacityHold(progress, 0.965, 0.973, 0.988, 0.995);
  const tickerSweep = progressBetween(progress, 0.965, 0.994);
  const tickerSettle = progressBetween(progress, 0.973, 0.988);
  const tickerChaos = Math.max(0, 1 - tickerSettle);

  const gateProgress = progressBetween(progress, 0.99, 0.996);
  const gateAuraOpacity = gateProgress * 0.24;
  const manuscriptFinalOpacity = 1 - progressBetween(progress, 0.66, 0.74) * 0.72;
  const ctaOpacity = progressBetween(progress, 0.99, 1.0);

  storyElement.style.setProperty("--story-progress", progress.toFixed(4));
  storyElement.style.setProperty("--hero-opacity", heroOpacity.toFixed(4));
  storyElement.style.setProperty("--hero-y", `${(-42 * centerProgress).toFixed(3)}px`);
  storyElement.style.setProperty("--text-disperse", `${(54 * centerProgress).toFixed(3)}px`);
  storyElement.style.setProperty("--copy-x", `${(-17.28 * centerProgress).toFixed(3)}px`);
  storyElement.style.setProperty("--kicker-x", `${(-11.88 * centerProgress).toFixed(3)}px`);
  storyElement.style.setProperty("--actions-x", `${(-27 * centerProgress).toFixed(3)}px`);
  storyElement.style.setProperty("--text-scale", (1 + centerProgress * 0.026).toFixed(4));
  storyElement.style.setProperty("--shutdown-opacity", shutdownOpacity.toFixed(4));
  storyElement.style.setProperty("--readout-x", `${(42 * centerProgress).toFixed(3)}px`);
  storyElement.style.setProperty("--cosmos-opacity", cosmosOpacity.toFixed(4));
  storyElement.style.setProperty("--stardust-opacity", (cosmosOpacity * 0.32).toFixed(4));
  storyElement.style.setProperty("--scanline-opacity", (0.2 + cosmosOpacity * 0.16).toFixed(4));
  storyElement.style.setProperty("--rail-opacity", progressBetween(progress, 0.55, 0.65).toFixed(4));
  storyElement.style.setProperty("--scan-opacity", scanOpacity.toFixed(4));

  storyElement.style.setProperty("--decode-opacity", decodeChamberOpacity.toFixed(4));
  storyElement.style.setProperty("--decode-chamber-opacity", decodeChamberOpacity.toFixed(4));
  storyElement.style.setProperty("--decode-chamber-y", `${(26 * (1 - decodeChamberOpacity)).toFixed(3)}px`);

  storyElement.style.setProperty("--workspace-ghost-opacity", workspaceGhostOpacity.toFixed(4));
  storyElement.style.setProperty("--workspace-ghost-y", `${(30 * (1 - workspaceGhostOpacity)).toFixed(3)}px`);

  storyElement.style.setProperty("--collab-signal-opacity", collabSignalOpacity.toFixed(4));
  storyElement.style.setProperty("--collab-signal-y", `${(24 * (1 - collabSignalOpacity)).toFixed(3)}px`);
  storyElement.style.setProperty("--paper-exit-progress", paperExitProgress.toFixed(4));
  storyElement.style.setProperty("--green-stage-opacity", greenStageOpacity.toFixed(4));
  storyElement.style.setProperty("--green-copy-opacity", greenCopyOpacity.toFixed(4));
  storyElement.style.setProperty("--green-copy-y", `${(30 * (1 - greenCopyOpacity)).toFixed(3)}px`);
  storyElement.style.setProperty("--black-stage-opacity", blackStageOpacity.toFixed(4));
  storyElement.style.setProperty("--ticker-opacity", tickerOpacity.toFixed(4));
  storyElement.style.setProperty("--ticker-x", `${(70 - tickerSweep * 140).toFixed(3)}vw`);
  storyElement.style.setProperty("--ticker-y", `${(-4 + tickerSettle * 2).toFixed(3)}vh`);
  storyElement.style.setProperty("--ticker-chaos", tickerChaos.toFixed(4));
  storyElement.style.setProperty("--ticker-scale", (0.92 + tickerSettle * 0.08).toFixed(4));

  storyElement.style.setProperty("--gate-opacity", gateProgress.toFixed(4));
  storyElement.style.setProperty("--gate-y", `${(34 * (1 - gateProgress)).toFixed(3)}px`);
  storyElement.style.setProperty("--gate-scale", (0.985 + gateProgress * 0.015).toFixed(4));
  storyElement.style.setProperty("--gate-aura-opacity", gateAuraOpacity.toFixed(4));

  storyElement.style.setProperty("--manuscript-final-opacity", manuscriptFinalOpacity.toFixed(4));
  storyElement.style.setProperty("--cta-opacity", ctaOpacity.toFixed(4));
  storyElement.style.setProperty("--cta-y", `${(18 * (1 - ctaOpacity)).toFixed(3)}px`);
  storyElement.style.setProperty("--scan-x", `${(-22 * progress).toFixed(3)}vw`);
  storyElement.style.setProperty("--scan-y", `${(16 * progress).toFixed(3)}vh`);
  storyElement.dataset.storyPhase = phase;
}

export function phaseForProgress(progress: number): LandingPhase {
  if (progress >= 0.99) {
    return "cta";
  }
  if (progress >= 0.965) {
    return "letterStorm";
  }
  if (progress >= 0.92) {
    return "blackCurtain";
  }
  if (progress >= 0.76) {
    return "greenCopy";
  }
  if (progress >= 0.68) {
    return "greenCurtain";
  }
  if (progress >= 0.66) {
    return "paperExit";
  }
  if (progress >= 0.58) {
    return "collab";
  }
  if (progress >= 0.42) {
    return "workspace";
  }
  if (progress >= 0.30) {
    return "decode";
  }
  if (progress >= 0.16) {
    return "center";
  }
  if (progress >= 0.06) {
    return "absorb";
  }
  return "intro";
}
