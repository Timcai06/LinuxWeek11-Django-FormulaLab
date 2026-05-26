import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(path) {
  return readFileSync(path, "utf8");
}

const timeline = read("frontend/formulas/landing/storyTimeline.ts");
const director = read("frontend/formulas/landing/components/ScrollDirector.tsx");

assert.match(
  timeline,
  /export const STORY_SNAP_POINTS = \[0, 0\.10, 0\.25, 0\.36, 0\.46, 0\.58, 0\.82, 0\.91, 0\.94, 0\.97, 0\.982, 0\.992, 0\.9994\]/,
  "Landing story snap points must remain stable during zero-visual architecture refactors.",
);
assert.match(
  timeline,
  /export const SOFT_SNAP_RADIUS = 0\.018/,
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
  "--decode-chamber-opacity",
  "--workspace-ghost-opacity",
  "--collab-signal-opacity",
  "--green-stage-opacity",
  "--green-copy-opacity",
  "--black-stage-opacity",
  "--ticker-opacity",
  "--gate-opacity",
  "--cta-opacity",
]) {
  assert.match(timeline, new RegExp(cssVar), `Landing CSS variable ${cssVar} must remain timeline-controlled.`);
}

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
