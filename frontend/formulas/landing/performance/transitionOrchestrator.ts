import { BLACK_LIQUID, GREEN_LIQUID } from "../storyChoreography";
import { progressBetween } from "../three/motion";

export type ActiveLiquidTransition = "green" | "black" | null;

export type LandingTransitionSnapshot = {
  greenLiquidProgress: number;
  blackLiquidProgress: number;
  activeLiquid: ActiveLiquidTransition;
  settling: boolean;
  velocity: number;
};

type TransitionUpdateInput = {
  progress: number;
  deltaMs: number;
};

const FRAME_BASELINE_MS = 16.67;
const LIQUID_DAMPING = 0.16;
const LIQUID_SETTLE_EPSILON = 0.0008;

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function dampProgress(current: number, target: number, deltaMs: number) {
  const frameScale = Math.max(deltaMs, 1) / FRAME_BASELINE_MS;
  const alpha = 1 - Math.pow(1 - LIQUID_DAMPING, frameScale);
  const next = current + (target - current) * alpha;
  return Math.abs(next - target) < LIQUID_SETTLE_EPSILON ? target : next;
}

function isSettling(current: number, target: number) {
  return Math.abs(current - target) > LIQUID_SETTLE_EPSILON;
}

export function createLandingTransitionOrchestrator() {
  let greenLiquidProgress = 0;
  let blackLiquidProgress = 0;
  let previousProgress = 0;
  let snapshot: LandingTransitionSnapshot = {
    greenLiquidProgress: 0,
    blackLiquidProgress: 0,
    activeLiquid: null,
    settling: false,
    velocity: 0,
  };

  return {
    update({ progress, deltaMs }: TransitionUpdateInput) {
      const rawProgress = clamp01(progress);
      const velocity = rawProgress - previousProgress;
      previousProgress = rawProgress;

      const targetGreen = progressBetween(rawProgress, GREEN_LIQUID[0], GREEN_LIQUID[1]);
      const targetBlack = progressBetween(rawProgress, BLACK_LIQUID[0], BLACK_LIQUID[1]);

      greenLiquidProgress = dampProgress(greenLiquidProgress, targetGreen, deltaMs);
      blackLiquidProgress = dampProgress(blackLiquidProgress, targetBlack, deltaMs);

      const greenSettling = isSettling(greenLiquidProgress, targetGreen);
      const blackSettling = isSettling(blackLiquidProgress, targetBlack);
      const activeLiquid: ActiveLiquidTransition =
        targetBlack > 0 || blackSettling ? "black" : targetGreen > 0 || greenSettling ? "green" : null;

      snapshot = {
        greenLiquidProgress,
        blackLiquidProgress,
        activeLiquid,
        settling: greenSettling || blackSettling,
        velocity,
      };
      return snapshot;
    },
    snapshot() {
      return snapshot;
    },
    reset(progress = 0) {
      const rawProgress = clamp01(progress);
      greenLiquidProgress = progressBetween(rawProgress, GREEN_LIQUID[0], GREEN_LIQUID[1]);
      blackLiquidProgress = progressBetween(rawProgress, BLACK_LIQUID[0], BLACK_LIQUID[1]);
      previousProgress = rawProgress;
      snapshot = {
        greenLiquidProgress,
        blackLiquidProgress,
        activeLiquid: null,
        settling: false,
        velocity: 0,
      };
      return snapshot;
    },
  };
}
