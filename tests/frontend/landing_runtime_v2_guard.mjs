import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

function read(path) {
  return readFileSync(path, "utf8");
}

const files = {
  motionRuntime: "frontend/formulas/landing/performance/motionRuntime.ts",
  frameBudget: "frontend/formulas/landing/performance/frameBudget.ts",
  stageRegistry: "frontend/formulas/landing/performance/stageRegistry.ts",
  qualityController: "frontend/formulas/landing/performance/qualityController.ts",
  rendererScheduler: "frontend/formulas/landing/performance/rendererScheduler.ts",
  scrollDirector: "frontend/formulas/landing/components/ScrollDirector.tsx",
  styleVars: "frontend/formulas/landing/performance/styleVars.ts",
};

for (const [name, path] of Object.entries(files)) {
  assert.ok(existsSync(path), `${name} should exist at ${path}`);
}

const runtime = read(files.motionRuntime);
const frameBudget = read(files.frameBudget);
const stageRegistry = read(files.stageRegistry);
const qualityController = read(files.qualityController);
const rendererScheduler = read(files.rendererScheduler);
const director = read(files.scrollDirector);
const styleVars = read(files.styleVars);

assert.match(
  runtime,
  /createFrameBudgetTracker[\s\S]*createLandingStageRegistry[\s\S]*createMotionQualityController/,
  "Landing motion runtime should compose frame budget, stage registry, and quality controller modules.",
);
assert.match(
  runtime,
  /setStage: \(phase: LandingPhase, progress: number\) => LandingStageSnapshot/,
  "Landing motion runtime should expose a single stage update boundary.",
);
assert.match(
  runtime,
  /qualityMode: MotionQualityMode[\s\S]*shouldRunIdleWork: boolean/,
  "MotionRuntimeFrame should carry quality metadata for future stage-level scheduling.",
);
assert.match(
  runtime,
  /subscribeRenderer: \(options: RendererSubscriptionOptions, subscriber: MotionRuntimeSubscriber\) => RendererRuntimeSubscription/,
  "Landing motion runtime should expose a renderer-aware subscription boundary.",
);
assert.match(
  runtime,
  /__formulaLabMotionDebug[\s\S]*phase[\s\S]*progress[\s\S]*qualityMode/,
  "Debug snapshots should include phase, progress, and quality state.",
);

assert.match(
  frameBudget,
  /createFrameBudgetTracker[\s\S]*longFrameCount[\s\S]*estimatedHz/,
  "Frame budget tracking should be isolated from animation subscribers.",
);
assert.match(
  stageRegistry,
  /const INITIAL_STAGE: LandingStageSnapshot = \{[\s\S]*phase: "intro"[\s\S]*progressDelta: 0[\s\S]*createLandingStageRegistry/,
  "Stage registry should own phase/progress state and progress deltas.",
);
assert.match(
  qualityController,
  /MotionQualityMode = "active-scroll" \| "settling" \| "idle" \| "hidden"/,
  "Quality controller should expose explicit active, settling, idle, and hidden modes.",
);
assert.match(
  qualityController,
  /ACTIVE_PROGRESS_EPSILON[\s\S]*SETTLE_WINDOW_MS/,
  "Quality controller should centralize active-scroll and settling thresholds.",
);
assert.match(
  rendererScheduler,
  /createRendererSubscriber[\s\S]*createRendererFrameGate[\s\S]*gate\.shouldUpdate\(frame\)/,
  "Renderer scheduler should wrap component subscribers with runtime-owned frame gating.",
);

assert.match(
  director,
  /const phase = phaseForProgress\(progress\);[\s\S]*runtime\.setStage\(phase, progress\);[\s\S]*setStoryVars\(storyElement, phase, progress\)/,
  "ScrollDirector should derive the phase once, publish it to runtime, and then write story CSS vars.",
);
assert.doesNotMatch(
  director,
  /setStoryVars\(storyElement, phaseForProgress\(progress\), progress\)/,
  "ScrollDirector should not hide phase derivation inside the CSS-var writer call.",
);

assert.match(
  styleVars,
  /lastValues[\s\S]*continue;[\s\S]*element\.style\.setProperty/,
  "Style var writer should remain batched and skip unchanged values.",
);
