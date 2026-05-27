import type { LandingPhase } from "../types";
import type { MotionRuntimeFrame, MotionRuntimeSubscriber } from "./motionRuntime";
import { createScrollFrameGate } from "./scrollFrameGate";

export type RendererSubscriptionOptions = {
  id: string;
  phases?: LandingPhase[];
  epsilon?: number;
  includeTransitionSettling?: boolean;
};

export function createRendererFrameGate({
  phases,
  epsilon,
  includeTransitionSettling = false,
}: RendererSubscriptionOptions) {
  const scrollGate = createScrollFrameGate({ epsilon, includeTransitionSettling });
  const phaseSet = phases ? new Set<LandingPhase>(phases) : null;

  return {
    shouldUpdate(frame: MotionRuntimeFrame) {
      const transitionSettling = includeTransitionSettling && frame.transitions.settling;
      if (phaseSet && !phaseSet.has(frame.phase) && !transitionSettling) {
        return false;
      }
      return scrollGate.shouldUpdate(frame);
    },
    reset() {
      scrollGate.reset();
    },
  };
}

export function createRendererSubscriber(
  options: RendererSubscriptionOptions,
  subscriber: MotionRuntimeSubscriber,
) {
  const gate = createRendererFrameGate(options);
  const wrapped: MotionRuntimeSubscriber = (frame) => {
    if (gate.shouldUpdate(frame)) {
      subscriber(frame);
    }
  };
  return { gate, wrapped };
}
