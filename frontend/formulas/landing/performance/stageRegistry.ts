import type { LandingPhase } from "../types";

export type LandingStageSnapshot = {
  phase: LandingPhase;
  progress: number;
  progressDelta: number;
  updatedAtMs: number;
};

const INITIAL_STAGE: LandingStageSnapshot = {
  phase: "intro",
  progress: 0,
  progressDelta: 0,
  updatedAtMs: 0,
};

export function createLandingStageRegistry() {
  let current = { ...INITIAL_STAGE };

  return {
    setStage(phase: LandingPhase, progress: number, timeMs = performance.now()) {
      const clampedProgress = Math.max(0, Math.min(1, progress));
      current = {
        phase,
        progress: clampedProgress,
        progressDelta: Math.abs(clampedProgress - current.progress),
        updatedAtMs: timeMs,
      };
      return current;
    },
    snapshot(): LandingStageSnapshot {
      return current;
    },
    reset() {
      current = { ...INITIAL_STAGE };
    },
  };
}
