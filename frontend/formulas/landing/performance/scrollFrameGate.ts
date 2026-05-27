import type { MotionRuntimeFrame } from "./motionRuntime";

type ScrollFrameGateOptions = {
  epsilon?: number;
};

const DEFAULT_PROGRESS_EPSILON = 0;

export function createScrollFrameGate({ epsilon = DEFAULT_PROGRESS_EPSILON }: ScrollFrameGateOptions = {}) {
  let lastProgress = Number.NaN;

  return {
    shouldUpdate(frame: MotionRuntimeFrame) {
      if (!frame.visible) {
        return false;
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
