export type FrameBudgetSnapshot = {
  frameCount: number;
  longFrameCount: number;
  lastFrameMs: number;
  averageFrameMs: number;
  estimatedHz: number;
};

type FrameBudgetOptions = {
  initialFrameMs?: number;
  longFrameMs?: number;
  averageWeight?: number;
};

const DEFAULT_INITIAL_FRAME_MS = 16.67;
const DEFAULT_LONG_FRAME_MS = 34;
const DEFAULT_AVERAGE_WEIGHT = 0.08;

function estimatedHzFromFrameMs(frameMs: number) {
  if (frameMs <= 0) {
    return 0;
  }
  return Math.round(1000 / frameMs);
}

export function createFrameBudgetTracker({
  initialFrameMs = DEFAULT_INITIAL_FRAME_MS,
  longFrameMs = DEFAULT_LONG_FRAME_MS,
  averageWeight = DEFAULT_AVERAGE_WEIGHT,
}: FrameBudgetOptions = {}) {
  let frameCount = 0;
  let longFrameCount = 0;
  let lastFrameMs = initialFrameMs;
  let averageFrameMs = initialFrameMs;

  const snapshot = (): FrameBudgetSnapshot => ({
    frameCount,
    longFrameCount,
    lastFrameMs,
    averageFrameMs,
    estimatedHz: estimatedHzFromFrameMs(averageFrameMs),
  });

  return {
    record(deltaMs: number) {
      lastFrameMs = deltaMs;
      averageFrameMs += (deltaMs - averageFrameMs) * averageWeight;
      frameCount += 1;
      if (deltaMs > longFrameMs) {
        longFrameCount += 1;
      }
      return snapshot();
    },
    reset() {
      lastFrameMs = initialFrameMs;
      averageFrameMs = initialFrameMs;
    },
    snapshot,
  };
}
