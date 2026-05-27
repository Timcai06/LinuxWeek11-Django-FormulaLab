import type { LandingPhase } from "../types";

export type MotionQualityMode = "active-scroll" | "settling" | "idle" | "hidden";

export type MotionQualitySnapshot = {
  mode: MotionQualityMode;
  active: boolean;
  phase: LandingPhase;
  progress: number;
  shouldRunIdleWork: boolean;
};

type QualityUpdateInput = {
  visible: boolean;
  phase: LandingPhase;
  progress: number;
  progressDelta: number;
  timeMs: number;
};

const ACTIVE_PROGRESS_EPSILON = 0.00022;
const SETTLE_WINDOW_MS = 180;

export function createMotionQualityController() {
  let lastActiveAtMs = 0;
  let snapshot: MotionQualitySnapshot = {
    mode: "idle",
    active: false,
    phase: "intro",
    progress: 0,
    shouldRunIdleWork: true,
  };

  return {
    update({ visible, phase, progress, progressDelta, timeMs }: QualityUpdateInput) {
      if (!visible) {
        snapshot = {
          mode: "hidden",
          active: false,
          phase,
          progress,
          shouldRunIdleWork: false,
        };
        return snapshot;
      }

      const active = progressDelta > ACTIVE_PROGRESS_EPSILON;
      if (active) {
        lastActiveAtMs = timeMs;
      }
      const settling = !active && timeMs - lastActiveAtMs <= SETTLE_WINDOW_MS;
      const mode: MotionQualityMode = active ? "active-scroll" : settling ? "settling" : "idle";

      snapshot = {
        mode,
        active: active || settling,
        phase,
        progress,
        shouldRunIdleWork: mode !== "active-scroll",
      };
      return snapshot;
    },
    snapshot() {
      return snapshot;
    },
  };
}
