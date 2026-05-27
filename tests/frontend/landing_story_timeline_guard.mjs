import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(path) {
  return readFileSync(path, "utf8");
}

const timelineCore = read("frontend/formulas/landing/storyTimeline.ts");
const introTimeline = read("frontend/formulas/landing/timelines/introTimeline.ts");
const collabTimeline = read("frontend/formulas/landing/timelines/collabTimeline.ts");
const curtainTimeline = read("frontend/formulas/landing/timelines/curtainTimeline.ts");
const ctaTimeline = read("frontend/formulas/landing/timelines/ctaTimeline.ts");

const timeline = timelineCore + "\n" + introTimeline + "\n" + collabTimeline + "\n" + curtainTimeline + "\n" + ctaTimeline;

const choreography = read("frontend/formulas/landing/storyChoreography.ts");
const director = read("frontend/formulas/landing/components/ScrollDirector.tsx");

assert.match(
  choreography,
  /export const STORY_SNAP_POINTS = \[[\s\S]*PAPER_CENTER\[1\][\s\S]*GREEN_LIQUID\[1\][\s\S]*LETTER_STORM\[1\][\s\S]*WORKBENCH_GATE\[0\][\s\S]*1/,
  "Landing story snap points must remain stable during zero-visual architecture refactors.",
);
assert.match(
  choreography,
  /export const SOFT_SNAP_RADIUS = 0\.032;/,
  "Landing story snap radius must remain stable during zero-visual architecture refactors.",
);

for (const phase of [
  "cta",
  "letterStorm",
  "blackCurtain",
  "greenCopy",
  "greenCurtain",
  "paperExit",
  "collab",
  "workspace",
  "decode",
  "center",
  "absorb",
  "intro",
]) {
  assert.match(timeline, new RegExp(`return "${phase}"`), `Landing phase ${phase} must remain in the story timeline.`);
}

for (const cssVar of [
  "--hero-opacity",
  "--pre-stage-opacity",
  "--decode-chamber-opacity",
  "--workspace-ghost-opacity",
  "--collab-signal-opacity",
  "--pre-curtain-opacity",
  "--green-backdrop-opacity",
  "--green-stage-opacity",
  "--green-copy-opacity",
  "--black-backdrop-opacity",
  "--black-stage-opacity",
  "--ticker-opacity",
  "--gate-opacity",
  "--cta-opacity",
]) {
  assert.match(timeline, new RegExp(cssVar), `Landing CSS variable ${cssVar} must remain timeline-controlled.`);
}

assert.match(
  timeline,
  /function preStageStateForProgress\(progress: number\)[\s\S]*progress >= GREEN_LIQUID\[1\] - 0\.006[\s\S]*return "retired"[\s\S]*progress >= GREEN_LIQUID\[0\][\s\S]*return "retiring"[\s\S]*return "active"/,
  "The landing timeline should expose a hard pre-curtain stage lifecycle instead of relying only on overlay opacity.",
);
assert.doesNotMatch(
  timeline,
  /PRE_CURTAIN_STEP_SNAP_END|snapToPreCurtainStep|preCurtainStepTarget/,
  "Pre-curtain navigation should use shorter physical distances instead of a hard one-wheel snap helper.",
);
assert.match(
  timeline,
  /storyElement\.dataset\.preStage = preStageState/,
  "The landing timeline should write data-pre-stage so CSS can remove old visual stages after the liquid curtain completes.",
);
assert.match(
  timeline,
  /rawGreenBackdropOpacity = phaseOpacityHold\(progress,\s*GREEN_LIQUID\[1\] - 0\.024,\s*GREEN_LIQUID\[1\] \+ 0\.002,\s*BLACK_LIQUID\[1\] - 0\.004,\s*BLACK_LIQUID\[1\] \+ 0\.008\)[\s\S]*blackBackdropOpacity = progressBetween\(progress,\s*BLACK_LIQUID\[1\] - 0\.014,\s*BLACK_LIQUID\[1\] \+ 0\.002\)[\s\S]*greenBackdropOpacity = rawGreenBackdropOpacity \* \(1 - blackBackdropOpacity\)/,
  "The green curtain panel should cross-fade out against the black panel handoff so it cannot create a green film.",
);
assert.match(
  timeline,
  /blackBackdropOpacity = progressBetween\(progress,\s*BLACK_LIQUID\[1\] - 0\.014,\s*BLACK_LIQUID\[1\] \+ 0\.002\)/,
  "The black curtain panel should take over only after the black liquid SVG wipe is nearly complete.",
);
assert.match(
  timeline,
  /"--paper-transfer-opacity": \(transferProgress \* preCurtainOpacity\)\.toFixed\(4\)/,
  "The paper-to-workspace transfer layer should fade with the pre-curtain mask so it cannot flash behind the completed liquid wipe.",
);

assert.match(
  director,
  /import \{ phaseForProgress, setStoryVars, snapToStoryBeat \} from "\.\.\/storyTimeline"/,
  "ScrollDirector should delegate pure story timeline rules to storyTimeline.ts.",
);
assert.match(
  director,
  /gsap\.context\(\(\) => \{/,
  "ScrollDirector should keep GSAP context cleanup around ScrollTrigger lifecycle.",
);
