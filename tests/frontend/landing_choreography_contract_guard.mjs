import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(path) {
  return readFileSync(path, "utf8");
}

const choreography = read("frontend/formulas/landing/storyChoreography.ts");
const storyStage = read("frontend/formulas/landing/components/StoryStage.tsx");
const tailSequence = read("frontend/formulas/landing/components/LandingTailSequence.tsx");
const timeline = read("frontend/formulas/landing/storyTimeline.ts");
const curtain = read("frontend/formulas/landing/components/MorphCurtain.tsx");
const copyStage = read("frontend/formulas/landing/components/CurtainCopyStage.tsx");

assert.match(
  storyStage,
  /<LandingTailSequence\s+scrollProgressRef=\{scrollProgressRef\}\s*\/>/,
  "StoryStage should route the entire late landing sequence through one tail orchestrator.",
);
assert.match(
  tailSequence,
  /<CurtainCopyStage[\s\S]*<HorizontalTicker[\s\S]*<WorkbenchGateOverlay[\s\S]*<MorphCurtain/,
  "LandingTailSequence should keep curtain copy, ticker, gate, and morph curtain together.",
);

for (const key of [
  "STORY_HEIGHT_VH",
  "PAPER_CENTER",
  "GREEN_LIQUID",
  "GREEN_COPY",
  "BLACK_LIQUID",
  "LETTER_STORM",
  "WORKBENCH_GATE",
  "STORY_SNAP_POINTS",
  "FREE_SCROLL_RANGES",
]) {
  assert.match(choreography, new RegExp(`\\b${key}\\b`), `Landing choreography should expose ${key}.`);
}

assert.match(
  timeline,
  /from "\.\/storyChoreography"/,
  "storyTimeline should consume named choreography constants instead of scattering magic progress numbers.",
);
assert.match(
  curtain,
  /from "\.\.\/storyChoreography"/,
  "MorphCurtain should use the shared choreography windows.",
);
assert.match(
  copyStage,
  /from "\.\.\/storyChoreography"/,
  "CurtainCopyStage should use the shared choreography windows.",
);

const numberMatch = (source, name) => {
  const match = source.match(new RegExp(`export const ${name} = \\[([0-9.]+),\\s*([0-9.]+)\\] as const;`));
  assert.ok(match, `${name} should be a readonly progress tuple.`);
  return [Number(match[1]), Number(match[2])];
};

const greenLiquid = numberMatch(choreography, "GREEN_LIQUID");
const greenCopy = numberMatch(choreography, "GREEN_COPY");
const blackLiquid = numberMatch(choreography, "BLACK_LIQUID");
const letterStorm = numberMatch(choreography, "LETTER_STORM");
const workbenchGate = numberMatch(choreography, "WORKBENCH_GATE");

assert.ok(greenLiquid[1] <= greenCopy[0], "Green SplitText should not start until the green liquid wipe has resolved.");
assert.ok(greenCopy[1] <= blackLiquid[0], "Black liquid transition should not interrupt the green SplitText copy.");
assert.ok(blackLiquid[1] <= letterStorm[0], "Letter storm should not start until the black liquid wipe has resolved.");
assert.ok(letterStorm[1] <= workbenchGate[0], "Workbench gate should not appear before the letter storm finishes.");
assert.ok(greenCopy[0] - greenLiquid[1] >= 0.01, "The completed green curtain needs a perceptible settled beat before SplitText starts.");
assert.ok(greenCopy[1] - greenCopy[0] >= 0.15, "Green SplitText needs enough scroll distance to avoid skipping between messages.");
assert.ok(letterStorm[1] - letterStorm[0] >= 0.055, "Letter storm should read as its own typographic chapter before the gate appears.");
assert.ok(workbenchGate[0] - letterStorm[1] >= 0.014, "Workbench gate should have a visible pause after the letter storm.");
assert.match(choreography, /export const LETTER_STORM = \[0\.904,\s*0\.962\] as const;/, "Letter storm should be compact after extending the green copy dwell.");
assert.match(choreography, /export const WORKBENCH_GATE = \[0\.978,\s*1\.0\] as const;/, "Workbench gate should enter after a real post-ticker breath.");
assert.match(copyStage, /eyebrow:\s*"01 CAPTURE"[\s\S]*eyebrow:\s*"02 REVIEW"[\s\S]*eyebrow:\s*"03 COLLABORATE"/, "Green curtain copy should read as three designed story chapters.");

assert.match(
  choreography,
  /export const SOFT_SNAP_RADIUS = 0\.032;/,
  "Soft snap radius should be tight enough to avoid skipping over short chapters.",
);
assert.match(
  choreography,
  /export const DIRECTIONAL_SNAP_RADIUS = 0\.055;/,
  "Directional snap should catch one-wheel movement into the next key beat.",
);
