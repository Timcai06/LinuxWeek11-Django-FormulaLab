import type { LandingPhase } from "../types";
import { createFrameBudgetTracker } from "./frameBudget";
import { createLandingStageRegistry, type LandingStageSnapshot } from "./stageRegistry";
import { createMotionQualityController, type MotionQualityMode } from "./qualityController";
import { createLandingTransitionOrchestrator, type LandingTransitionSnapshot } from "./transitionOrchestrator";
import { createRendererSubscriber, type RendererSubscriptionOptions } from "./rendererScheduler";

export type MotionRuntimeFrame = {
  timeMs: number;
  deltaMs: number;
  frameMs: number;
  estimatedHz: number;
  visible: boolean;
  phase: LandingPhase;
  progress: number;
  qualityMode: MotionQualityMode;
  shouldRunIdleWork: boolean;
  transitions: LandingTransitionSnapshot;
};

export type MotionRuntimeSubscriber = (frame: MotionRuntimeFrame) => void;

export type RendererRuntimeSubscription = (() => void) & {
  reset: () => void;
};

export type MotionRuntimeDebugState = {
  enabled: boolean;
  frameCount: number;
  longFrameCount: number;
  lastFrameMs: number;
  averageFrameMs: number;
  estimatedHz: number;
  subscribers: number;
  visible: boolean;
  phase: LandingPhase;
  progress: number;
  progressDelta: number;
  qualityMode: MotionQualityMode;
  qualityActive: boolean;
  transitionSettling: boolean;
  activeLiquid: LandingTransitionSnapshot["activeLiquid"];
};

type LandingMotionRuntimeOptions = {
  debug?: boolean;
  onVisibilityChange?: (visible: boolean) => void;
};

export type LandingMotionRuntime = {
  subscribe: (subscriber: MotionRuntimeSubscriber) => () => void;
  subscribeRenderer: (options: RendererSubscriptionOptions, subscriber: MotionRuntimeSubscriber) => RendererRuntimeSubscription;
  subscribeVisibility: (subscriber: (visible: boolean) => void) => () => void;
  setStage: (phase: LandingPhase, progress: number) => LandingStageSnapshot;
  getStage: () => LandingStageSnapshot;
  start: () => void;
  stop: () => void;
  destroy: () => void;
  snapshot: () => MotionRuntimeDebugState;
};

declare global {
  interface Window {
    __formulaLabMotionDebug?: MotionRuntimeDebugState;
  }
}

const INITIAL_FRAME_MS = 16.67;

export function isMotionDebugEnabled(search = window.location.search) {
  return new URLSearchParams(search).get("motion_debug") === "1";
}

export function createLandingMotionRuntime({
  debug = false,
  onVisibilityChange,
}: LandingMotionRuntimeOptions = {}): LandingMotionRuntime {
  const subscribers = new Set<MotionRuntimeSubscriber>();
  const visibilitySubscribers = new Set<(visible: boolean) => void>();
  if (onVisibilityChange) {
    visibilitySubscribers.add(onVisibilityChange);
  }
  let frameId = 0;
  let running = false;
  let destroyed = false;
  let lastTimeMs = 0;
  const frameBudget = createFrameBudgetTracker({ initialFrameMs: INITIAL_FRAME_MS });
  const stageRegistry = createLandingStageRegistry();
  const qualityController = createMotionQualityController();
  const transitionOrchestrator = createLandingTransitionOrchestrator();

  const snapshot = (): MotionRuntimeDebugState => {
    const frameSnapshot = frameBudget.snapshot();
    const stageSnapshot = stageRegistry.snapshot();
    const qualitySnapshot = qualityController.snapshot();
    const transitionSnapshot = transitionOrchestrator.snapshot();
    return {
      enabled: debug,
      frameCount: frameSnapshot.frameCount,
      longFrameCount: frameSnapshot.longFrameCount,
      lastFrameMs: frameSnapshot.lastFrameMs,
      averageFrameMs: frameSnapshot.averageFrameMs,
      estimatedHz: frameSnapshot.estimatedHz,
      subscribers: subscribers.size,
      visible: !document.hidden,
      phase: stageSnapshot.phase,
      progress: stageSnapshot.progress,
      progressDelta: stageSnapshot.progressDelta,
      qualityMode: qualitySnapshot.mode,
      qualityActive: qualitySnapshot.active,
      transitionSettling: transitionSnapshot.settling,
      activeLiquid: transitionSnapshot.activeLiquid,
    };
  };

  const publishDebugState = () => {
    if (debug) {
      window.__formulaLabMotionDebug = snapshot();
    }
  };

  const tick = (timeMs: number) => {
    if (!running || destroyed || document.hidden) {
      frameId = 0;
      return;
    }

    const deltaMs = lastTimeMs > 0 ? timeMs - lastTimeMs : INITIAL_FRAME_MS;
    lastTimeMs = timeMs;
    const frameSnapshot = frameBudget.record(deltaMs);
    const stageSnapshot = stageRegistry.snapshot();
    const qualitySnapshot = qualityController.update({
      visible: true,
      phase: stageSnapshot.phase,
      progress: stageSnapshot.progress,
      progressDelta: stageSnapshot.progressDelta,
      timeMs,
    });
    const transitionSnapshot = transitionOrchestrator.update({
      progress: stageSnapshot.progress,
      deltaMs,
    });

    const frame: MotionRuntimeFrame = {
      timeMs,
      deltaMs,
      frameMs: frameSnapshot.averageFrameMs,
      estimatedHz: frameSnapshot.estimatedHz,
      visible: true,
      phase: stageSnapshot.phase,
      progress: stageSnapshot.progress,
      qualityMode: qualitySnapshot.mode,
      shouldRunIdleWork: qualitySnapshot.shouldRunIdleWork,
      transitions: transitionSnapshot,
    };
    subscribers.forEach((subscriber) => subscriber(frame));
    publishDebugState();
    frameId = requestAnimationFrame(tick);
  };

  const start = () => {
    if (running || destroyed || document.hidden) {
      return;
    }
    running = true;
    lastTimeMs = 0;
    frameId = requestAnimationFrame(tick);
    publishDebugState();
  };

  const stop = () => {
    running = false;
    lastTimeMs = 0;
    frameBudget.reset();
    if (frameId) {
      cancelAnimationFrame(frameId);
      frameId = 0;
    }
    publishDebugState();
  };

  const handleVisibilityChange = () => {
    if (document.hidden) {
      const stageSnapshot = stageRegistry.snapshot();
      qualityController.update({
        visible: false,
        phase: stageSnapshot.phase,
        progress: stageSnapshot.progress,
        progressDelta: 0,
        timeMs: performance.now(),
      });
      stop();
      visibilitySubscribers.forEach((subscriber) => subscriber(false));
      return;
    }
    visibilitySubscribers.forEach((subscriber) => subscriber(true));
    start();
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);

  const runtime: LandingMotionRuntime = {
    subscribe(subscriber) {
      subscribers.add(subscriber);
      publishDebugState();
      return () => {
        subscribers.delete(subscriber);
        publishDebugState();
      };
    },
    subscribeRenderer(options, subscriber) {
      const { gate, wrapped } = createRendererSubscriber(options, subscriber);
      subscribers.add(wrapped);
      const unsubscribeVisibility = runtime.subscribeVisibility((visible) => {
        if (visible) {
          gate.reset();
        }
      });
      publishDebugState();
      const unsubscribe = (() => {
        unsubscribeVisibility();
        subscribers.delete(wrapped);
        publishDebugState();
      }) as RendererRuntimeSubscription;
      unsubscribe.reset = gate.reset;
      return unsubscribe;
    },
    subscribeVisibility(subscriber) {
      visibilitySubscribers.add(subscriber);
      return () => {
        visibilitySubscribers.delete(subscriber);
      };
    },
    setStage(phase, progress) {
      return stageRegistry.setStage(phase, progress);
    },
    getStage() {
      return stageRegistry.snapshot();
    },
    start,
    stop,
    destroy() {
      destroyed = true;
      stop();
      subscribers.clear();
      visibilitySubscribers.clear();
      stageRegistry.reset();
      transitionOrchestrator.reset();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (debug) {
        delete window.__formulaLabMotionDebug;
      }
    },
    snapshot,
  };

  publishDebugState();
  return runtime;
}

let activeLandingMotionRuntime: LandingMotionRuntime | undefined;

export function getLandingMotionRuntime(options: LandingMotionRuntimeOptions = {}) {
  if (!activeLandingMotionRuntime) {
    activeLandingMotionRuntime = createLandingMotionRuntime(options);
    const destroy = activeLandingMotionRuntime.destroy;
    activeLandingMotionRuntime.destroy = () => {
      destroy();
      activeLandingMotionRuntime = undefined;
    };
  } else if (options.onVisibilityChange) {
    activeLandingMotionRuntime.subscribeVisibility(options.onVisibilityChange);
  }
  return activeLandingMotionRuntime;
}
