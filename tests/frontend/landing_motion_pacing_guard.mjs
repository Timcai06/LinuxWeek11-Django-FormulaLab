import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readLandingStoryComposition } from "./helpers/landing_story.mjs";
import { readLandingStyles } from "./helpers/landing_styles.mjs";

const appSource = readFileSync("frontend/formulas/landing/LandingApp.tsx", "utf8");
const storySource = readLandingStoryComposition();
const directorComponentSource = readFileSync("frontend/formulas/landing/components/ScrollDirector.tsx", "utf8");
const timelineSource = readFileSync("frontend/formulas/landing/storyTimeline.ts", "utf8");
const directorSource = `${directorComponentSource}\n${timelineSource}`;
const tickerSource = readFileSync("frontend/formulas/landing/components/HorizontalTicker.tsx", "utf8");
const curtainSource = readFileSync("frontend/formulas/landing/components/MorphCurtain.tsx", "utf8");
const copyStageSource = readFileSync("frontend/formulas/landing/components/CurtainCopyStage.tsx", "utf8");
const styleSource = readLandingStyles();

assert.doesNotMatch(
  appSource,
  /<HorizontalTicker\s*\/>/,
  "HorizontalTicker should not be appended after LandingScrollStory as an independent epilogue.",
);
assert.match(
  storySource,
  /<HorizontalTicker\s+scrollProgressRef=\{scrollProgressRef\}/,
  "HorizontalTicker should live inside the main scroll story and use the shared progress ref.",
);
assert.doesNotMatch(
  tickerSource,
  /ScrollTrigger|pin:\s*true|containerAnimation|xPercent:\s*-100/,
  "HorizontalTicker should be driven by ScrollDirector variables, not its own pinned ScrollTrigger.",
);
assert.match(
  directorSource,
  /scrub:\s*1\.1/,
  "Landing ScrollTrigger should stay damped without making the opening drag.",
);
assert.match(
  directorSource,
  /duration:\s*\{ min: 0\.42, max: 0\.95 \}/,
  "Story snap should settle with enough damping to feel like a pause instead of a jump cut.",
);
assert.match(
  directorSource,
  /delay:\s*0\.08/,
  "Story snap should wait briefly after wheel input so the hold feels intentional.",
);
assert.match(
  directorSource,
  /const STORY_SNAP_POINTS = \[0, 0\.06, 0\.16, 0\.24, 0\.30, 0\.42, 0\.58, 0\.68, 0\.76, 0\.84, 0\.92, 0\.965, 0\.99\]/,
  "Landing should define narrative keyframes that can act as soft magnetic beats.",
);
assert.match(
  directorSource,
  /const SOFT_SNAP_RADIUS = 0\.035/,
  "Late-stage keyframe snap should be soft and local rather than forcing a page-turn jump.",
);
assert.match(
  directorSource,
  /function snapToStoryBeat\(value: number\)/,
  "ScrollDirector should route ScrollTrigger snap through a named story-beat helper.",
);
assert.match(
  directorSource,
  /Math\.abs\(nearest - value\) <= SOFT_SNAP_RADIUS/,
  "Late-stage snap should only catch the scroll when the user releases near a key beat.",
);
assert.doesNotMatch(
  directorSource,
  /if \(value >= 0\.70\) \{[\s\S]*?return value;[\s\S]*?\}/,
  "Late-stage curtain, text, letter, and CTA chapters should use soft keyframe snap instead of disabling snap entirely.",
);
assert.match(
  directorSource,
  /phaseOpacityHold\(progress,\s*0\.965,\s*0\.973,\s*0\.988,\s*0\.995\)/,
  "The letter storm should arrive after the black curtain and hold until just before the final CTA.",
);
assert.match(
  directorSource,
  /70 - tickerSweep \* 140\)\.toFixed\(3\)/,
  "The final ticker should complete a full marquee pass before the Workbench Gate enters.",
);
assert.match(
  directorSource,
  /const tickerSweep = progressBetween\(progress,\s*0\.965,\s*0\.994\)/,
  "The final ticker should have enough scroll distance to finish before the CTA phase.",
);
assert.match(
  directorSource,
  /--ticker-x/,
  "ScrollDirector should expose ticker transform variables for the integrated letter wave.",
);
assert.match(
  curtainSource,
  /progressBetween\(progress,\s*0\.68,\s*0\.76\)/,
  "MorphCurtain should have a first liquid transition into the green curtain.",
);
assert.match(
  curtainSource,
  /progressBetween\(progress,\s*0\.92,\s*0\.945\)/,
  "MorphCurtain should have a second liquid transition from green into black.",
);
assert.match(
  curtainSource,
  /const DELAY_POINTS_MAX = 0\.3;[\s\S]*const DELAY_PER_PATH = 0\.25;[\s\S]*const MORPH_DURATION = 0\.9;/,
  "MorphCurtain should preserve the layered point/path delays from the GSAP liquid overlay reference.",
);
assert.match(
  curtainSource,
  /const timelineProgress = baseProgress \* \(MORPH_DURATION \+ DELAY_POINTS_MAX \+ DELAY_PER_PATH\)/,
  "MorphCurtain should map scroll progress through a delayed overlay timeline instead of directly filling all points.",
);
assert.doesNotMatch(
  curtainSource,
  /Math\.min\(1,\s*curtainProgress\s*\*\s*8\)/,
  "MorphCurtain opacity should not slam to full opacity immediately.",
);
assert.match(
  styleSource,
  /\.ht-section[\s\S]*?position:\s*absolute/,
  "Ticker should be a story overlay layer, not a separate full-page scroll section.",
);
assert.doesNotMatch(
  styleSource,
  /\.ht-text[\s\S]*?padding-left:\s*100vw/,
  "Letter chapter text should not begin a full viewport offscreen after the liquid transition.",
);
assert.match(
  styleSource,
  /\.workbench-gate[\s\S]*?z-index:\s*18/,
  "The final Workbench Gate should sit above the liquid transition layer.",
);
assert.match(
  directorSource,
  /const gateProgress = progressBetween\(progress,\s*0\.99,\s*0\.996\)/,
  "The Workbench Gate should wait until the ticker has fully faded out.",
);
assert.match(
  directorSource,
  /const manuscriptFinalOpacity = 1 - progressBetween\(progress,\s*0\.66,\s*0\.74\) \* 0\.72/,
  "The manuscript should visibly recede before the liquid transition takes over.",
);
assert.match(
  styleSource,
  /\.landing-story[\s\S]*?min-height:\s*6000vh/,
  "The cinematic landing story should be compact enough to avoid drag while preserving green copy, black curtain, and letter beats.",
);
assert.match(
  copyStageSource,
  /\[0\.770,\s*0\.790\][\s\S]*\[0\.820,\s*0\.840\][\s\S]*\[0\.870,\s*0\.890\]/,
  "Green curtain copy should animate in three clearly separated beats.",
);
assert.match(
  copyStageSource,
  /\[0\.760,\s*0\.810,\s*0\.860\]/,
  "Green curtain copy fade windows should not start on top of each other.",
);
assert.match(
  copyStageSource,
  /import \{ SplitText \} from "gsap\/SplitText"/,
  "Green curtain copy should use GSAP SplitText directly.",
);
assert.match(
  copyStageSource,
  /mask:\s*"lines"[\s\S]*autoSplit:\s*true[\s\S]*onSplit/,
  "Green curtain copy should use SplitText line masks with autoSplit and an onSplit animation callback.",
);
assert.match(
  storySource,
  /<CurtainCopyStage\s+scrollProgressRef=\{scrollProgressRef\}/,
  "Landing story should render the green curtain SplitText copy stage inside the main timeline.",
);
