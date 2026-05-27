import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

function read(path) {
  return readFileSync(path, "utf8");
}

const files = {
  orchestrator: "frontend/formulas/landing/performance/transitionOrchestrator.ts",
  runtime: "frontend/formulas/landing/performance/motionRuntime.ts",
  curtain: "frontend/formulas/landing/components/MorphCurtain.tsx",
  scheduler: "frontend/formulas/landing/performance/rendererScheduler.ts",
};

for (const [name, path] of Object.entries(files)) {
  assert.ok(existsSync(path), `${name} should exist at ${path}`);
}

const orchestrator = read(files.orchestrator);
const runtime = read(files.runtime);
const curtain = read(files.curtain);
const scheduler = read(files.scheduler);

assert.match(
  orchestrator,
  /createLandingTransitionOrchestrator[\s\S]*GREEN_LIQUID[\s\S]*BLACK_LIQUID[\s\S]*dampProgress/,
  "Transition orchestration should own liquid ranges and damping rather than leaving them inside the SVG renderer.",
);
assert.match(
  orchestrator,
  /LIQUID_DAMPING[\s\S]*LIQUID_SETTLE_EPSILON[\s\S]*settling/,
  "Liquid transition orchestration should expose settling state for magnetic snap feel.",
);
assert.match(
  runtime,
  /createLandingTransitionOrchestrator[\s\S]*transitionOrchestrator\.update[\s\S]*transitions: transitionSnapshot/,
  "Landing motion runtime should publish transition state on every frame.",
);
assert.match(
  runtime,
  /transitionSettling[\s\S]*activeLiquid/,
  "Motion debug snapshots should expose transition settling and active liquid state.",
);
assert.match(
  scheduler,
  /includeTransitionSettling[\s\S]*frame\.transitions\.settling/,
  "Renderer scheduler should allow components to keep painting while runtime transitions settle.",
);
assert.match(
  curtain,
  /frame\.transitions\.greenLiquidProgress[\s\S]*frame\.transitions\.blackLiquidProgress/,
  "MorphCurtain should consume runtime liquid transition progress instead of raw scroll progress.",
);
assert.doesNotMatch(
  curtain,
  /liquidSegmentProgress\(progress/,
  "MorphCurtain should not compute liquid segment progress from raw scroll progress in its hot path.",
);
