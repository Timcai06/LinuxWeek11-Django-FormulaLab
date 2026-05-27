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
const LIQUID_DAMPING = 0.18;
const LIQUID_FAST_INPUT_DAMPING = 0.105;
const LIQUID_SETTLE_EPSILON = 0.0008;
const FAST_INPUT_DELTA = 0.006;
const VELOCITY_SMOOTHING = 0.2;
const LIQUID_MAGNETIC_EDGE = 0.014;

const LIQUID_PROFILES = {
  green: {
    introHold: 0.012,
    outroHold: 0.988,
    pullAhead: 0.018,
  },
  black: {
    introHold: 0.016,
    outroHold: 0.982,
    pullAhead: 0.014,
  },
} as const;

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function smootherStep(value: number) {
  const t = clamp01(value);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function shapeLiquidTarget(
  target: number,
  velocity: number,
  profile: typeof LIQUID_PROFILES[keyof typeof LIQUID_PROFILES],
) {
  if (target <= profile.introHold) {
    return 0;
  }
  if (target >= profile.outroHold) {
    return 1;
  }

  const normalized = (target - profile.introHold) / (profile.outroHold - profile.introHold);
  const directionalPull = Math.max(0, Math.sign(velocity)) * profile.pullAhead;
  return clamp01(smootherStep(normalized) + directionalPull);
}

function dampingForVelocity(velocity: number) {
  const velocityWeight = clamp01(Math.abs(velocity) / FAST_INPUT_DELTA);
  return LIQUID_DAMPING + (LIQUID_FAST_INPUT_DAMPING - LIQUID_DAMPING) * velocityWeight;
}

function dampProgress(current: number, target: number, deltaMs: number, velocity: number) {
  const damping = dampingForVelocity(velocity);
  const frameScale = Math.max(deltaMs, 1) / FRAME_BASELINE_MS;
  const alpha = 1 - Math.pow(1 - damping, frameScale);
  const next = current + (target - current) * alpha;
  if (target >= 1 && next >= 1 - LIQUID_MAGNETIC_EDGE) {
    return 1;
  }
  if (target <= 0 && next <= LIQUID_MAGNETIC_EDGE) {
    return 0;
  }
  return Math.abs(next - target) < LIQUID_SETTLE_EPSILON ? target : next;
}

function isSettling(current: number, target: number) {
  return Math.abs(current - target) > LIQUID_SETTLE_EPSILON;
}

function liquidTargetsForProgress(progress: number, velocity: number) {
  return {
    green: shapeLiquidTarget(
      progressBetween(progress, GREEN_LIQUID[0], GREEN_LIQUID[1]),
      velocity,
      LIQUID_PROFILES.green,
    ),
    black: shapeLiquidTarget(
      progressBetween(progress, BLACK_LIQUID[0], BLACK_LIQUID[1]),
      velocity,
      LIQUID_PROFILES.black,
    ),
  };
}

export function createLandingTransitionOrchestrator() {
  let greenLiquidProgress = 0;
  let blackLiquidProgress = 0;
  let previousProgress = 0;
  let smoothedVelocity = 0;
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
      const velocityFrameScale = Math.max(deltaMs, 1) / FRAME_BASELINE_MS;
      const velocityAlpha = 1 - Math.pow(1 - VELOCITY_SMOOTHING, velocityFrameScale);
      smoothedVelocity += (velocity - smoothedVelocity) * velocityAlpha;

      const targets = liquidTargetsForProgress(rawProgress, smoothedVelocity);

      greenLiquidProgress = dampProgress(greenLiquidProgress, targets.green, deltaMs, smoothedVelocity);
      blackLiquidProgress = dampProgress(blackLiquidProgress, targets.black, deltaMs, smoothedVelocity);

      const greenSettling = isSettling(greenLiquidProgress, targets.green);
      const blackSettling = isSettling(blackLiquidProgress, targets.black);
      const activeLiquid: ActiveLiquidTransition =
        targets.black > 0 || blackSettling ? "black" : targets.green > 0 || greenSettling ? "green" : null;

      snapshot = {
        greenLiquidProgress,
        blackLiquidProgress,
        activeLiquid,
        settling: greenSettling || blackSettling,
        velocity: smoothedVelocity,
      };
      return snapshot;
    },
    snapshot() {
      return snapshot;
    },
    reset(progress = 0) {
      const rawProgress = clamp01(progress);
      const targets = liquidTargetsForProgress(rawProgress, 0);
      greenLiquidProgress = targets.green;
      blackLiquidProgress = targets.black;
      previousProgress = rawProgress;
      smoothedVelocity = 0;
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
