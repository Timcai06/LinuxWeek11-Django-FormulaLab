import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const appSource = readFileSync("frontend/formulas/landing/LandingApp.tsx", "utf8");
const storySource = readFileSync("frontend/formulas/landing/components/LandingScrollStory.tsx", "utf8");
const directorSource = readFileSync("frontend/formulas/landing/components/ScrollDirector.tsx", "utf8");
const tickerSource = readFileSync("frontend/formulas/landing/components/HorizontalTicker.tsx", "utf8");
const curtainSource = readFileSync("frontend/formulas/landing/components/MorphCurtain.tsx", "utf8");
const styleSource = readFileSync("frontend/formulas/landing/styles/landing.css", "utf8");

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
  /scrub:\s*0\.8/,
  "Landing ScrollTrigger should use a damped scrub value so key scenes do not flash by.",
);
assert.match(
  directorSource,
  /snapTo\(value\)[\s\S]*if \(value >= 0\.74\)[\s\S]*return value/,
  "Late-stage liquid, letter, and CTA chapters should not be skipped by hard snap.",
);
assert.match(
  directorSource,
  /phaseOpacityHold\(progress,\s*0\.86,\s*0\.88,\s*0\.965,\s*0\.99\)/,
  "The letter-wave chapter should arrive after the liquid transition and hold until just before the final CTA.",
);
assert.match(
  directorSource,
  /--ticker-x/,
  "ScrollDirector should expose ticker transform variables for the integrated letter wave.",
);
assert.match(
  curtainSource,
  /progressBetween\(progress,\s*0\.76,\s*0\.86\)/,
  "MorphCurtain should have its own transition chapter after the manuscript recedes and before the letters enter.",
);
assert.match(
  curtainSource,
  /progressBetween\(progress,\s*0\.86,\s*0\.925\)/,
  "MorphCurtain should fade as the letter chapter begins, not during the final CTA.",
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
  /const gateProgress = progressBetween\(progress,\s*0\.965,\s*0\.995\)/,
  "The Workbench Gate should wait until the letter chapter has had time to resolve.",
);
assert.match(
  directorSource,
  /const manuscriptFinalOpacity = 1 - progressBetween\(progress,\s*0\.64,\s*0\.76\) \* 0\.72/,
  "The manuscript should visibly recede before the liquid transition takes over.",
);
assert.match(
  styleSource,
  /\.landing-story[\s\S]*?min-height:\s*1600vh/,
  "The cinematic landing story should be long enough for liquid and letter chapters to breathe.",
);
