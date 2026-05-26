export type MotionRuntimeFrame = {
  timeMs: number;
  deltaMs: number;
  frameMs: number;
  estimatedHz: number;
  visible: boolean;
};

export type MotionRuntimeSubscriber = (frame: MotionRuntimeFrame) => void;

export type MotionRuntimeDebugState = {
  enabled: boolean;
  frameCount: number;
  longFrameCount: number;
  lastFrameMs: number;
  averageFrameMs: number;
  estimatedHz: number;
  subscribers: number;
  visible: boolean;
};

type LandingMotionRuntimeOptions = {
  debug?: boolean;
  onVisibilityChange?: (visible: boolean) => void;
};

export type LandingMotionRuntime = {
  subscribe: (subscriber: MotionRuntimeSubscriber) => () => void;
  subscribeVisibility: (subscriber: (visible: boolean) => void) => () => void;
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

const LONG_FRAME_MS = 34;
const INITIAL_FRAME_MS = 16.67;
const FRAME_AVERAGE_WEIGHT = 0.08;

function estimatedHzFromFrameMs(frameMs: number) {
  if (frameMs <= 0) {
    return 0;
  }
  return Math.round(1000 / frameMs);
}

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
  let averageFrameMs = INITIAL_FRAME_MS;
  let frameCount = 0;
  let longFrameCount = 0;
  let lastFrameMs = INITIAL_FRAME_MS;

  const snapshot = (): MotionRuntimeDebugState => ({
    enabled: debug,
    frameCount,
    longFrameCount,
    lastFrameMs,
    averageFrameMs,
    estimatedHz: estimatedHzFromFrameMs(averageFrameMs),
    subscribers: subscribers.size,
    visible: !document.hidden,
  });

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

    const deltaMs = lastTimeMs > 0 ? timeMs - lastTimeMs : averageFrameMs;
    lastTimeMs = timeMs;
    lastFrameMs = deltaMs;
    averageFrameMs += (deltaMs - averageFrameMs) * FRAME_AVERAGE_WEIGHT;
    frameCount += 1;
    if (deltaMs > LONG_FRAME_MS) {
      longFrameCount += 1;
    }

    const frame: MotionRuntimeFrame = {
      timeMs,
      deltaMs,
      frameMs: averageFrameMs,
      estimatedHz: estimatedHzFromFrameMs(averageFrameMs),
      visible: true,
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
    if (frameId) {
      cancelAnimationFrame(frameId);
      frameId = 0;
    }
    publishDebugState();
  };

  const handleVisibilityChange = () => {
    if (document.hidden) {
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
    subscribeVisibility(subscriber) {
      visibilitySubscribers.add(subscriber);
      return () => {
        visibilitySubscribers.delete(subscriber);
      };
    },
    start,
    stop,
    destroy() {
      destroyed = true;
      stop();
      subscribers.clear();
      visibilitySubscribers.clear();
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
