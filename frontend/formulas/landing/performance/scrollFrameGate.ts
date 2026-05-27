import type { MotionRuntimeFrame } from "./motionRuntime";

type ScrollFrameGateOptions = {
  epsilon?: number;
  includeTransitionSettling?: boolean;
};

const DEFAULT_PROGRESS_EPSILON = 0;

export function createScrollFrameGate({
  epsilon = DEFAULT_PROGRESS_EPSILON,
  includeTransitionSettling = false,
}: ScrollFrameGateOptions = {}) {
  let lastProgress = Number.NaN;

  return {
    shouldUpdate(frame: MotionRuntimeFrame) {
      if (!frame.visible) {
        return false;
      }
      if (includeTransitionSettling && frame.transitions.settling) {
        lastProgress = frame.progress;
        return true;
      }
      const progress = frame.progress;
      if (Number.isNaN(lastProgress)) {
        lastProgress = progress;
        return true;
      }
      if (Math.abs(progress - lastProgress) <= epsilon) {
        return false;
      }
      lastProgress = progress;
      return true;
    },
    reset() {
      lastProgress = Number.NaN;
    },
  };
}
