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
  /liquidTargetsForProgress[\s\S]*GREEN_LIQUID[\s\S]*BLACK_LIQUID[\s\S]*createLandingTransitionOrchestrator[\s\S]*dampProgress/,
  "Transition orchestration should own liquid ranges and damping rather than leaving them inside the SVG renderer.",
);
assert.match(
  orchestrator,
  /LIQUID_DAMPING[\s\S]*LIQUID_SETTLE_EPSILON[\s\S]*settling/,
  "Liquid transition orchestration should expose settling state for magnetic snap feel.",
);
assert.match(
  orchestrator,
  /LIQUID_FAST_INPUT_DAMPING[\s\S]*FAST_INPUT_DELTA[\s\S]*dampingForVelocity/,
  "Liquid transitions should soften fast wheel and snap jumps instead of teleporting the wave.",
);
assert.match(
  orchestrator,
  /VELOCITY_SMOOTHING[\s\S]*smoothedVelocity[\s\S]*dampProgress/,
  "Liquid transitions should smooth wheel velocity before damping green and black curtain progress.",
);
assert.match(
  orchestrator,
  /LIQUID_MAGNETIC_EDGE[\s\S]*target >= 1[\s\S]*target <= 0/,
  "Liquid transitions should magnetically settle at fully opened and fully closed curtain edges.",
);
assert.match(
  orchestrator,
  /LIQUID_PROFILES[\s\S]*introHold[\s\S]*outroHold[\s\S]*pullAhead[\s\S]*shapeLiquidTarget/,
  "Liquid transitions should have profile-shaped holds so the wave can breathe at curtain entry and settle.",
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
assert.match(
  curtain,
  /lastRenderedOpacity[\s\S]*applyCurtainOpacity/,
  "MorphCurtain should skip repeated opacity writes when the visible value has not changed.",
);
assert.match(
  curtain,
  /BLACK_WAVE_SWEEP_RANGE[\s\S]*BLACK_OPACITY_RANGE[\s\S]*blackWaveProgress = liquidWaveProgress\(blackSegmentProgress, BLACK_WAVE_SWEEP_RANGE\)/,
  "The green-to-black liquid transition should have its own readable sweep and opacity profile.",
);
assert.doesNotMatch(
  curtain,
  /liquidSegmentProgress\(progress/,
  "MorphCurtain should not compute liquid segment progress from raw scroll progress in its hot path.",
);
