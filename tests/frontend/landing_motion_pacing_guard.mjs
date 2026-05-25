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
  /snap:\s*\{[\s\S]*snapTo:\s*SNAP_LABELS[\s\S]*duration:\s*\{\s*min:\s*0\.25,\s*max:\s*0\.55\s*\}[\s\S]*ease:\s*"power2\.out"/,
  "Landing ScrollTrigger should gently snap to chapter anchors with a readable settle.",
);
assert.match(
  directorSource,
  /phaseOpacityHold\(progress,\s*0\.76,\s*0\.80,\s*0\.90,\s*0\.94\)/,
  "The letter-wave chapter should have a real hold window before the final CTA.",
);
assert.match(
  directorSource,
  /--ticker-x/,
  "ScrollDirector should expose ticker transform variables for the integrated letter wave.",
);
assert.match(
  curtainSource,
  /progressBetween\(progress,\s*0\.80,\s*0\.94\)/,
  "MorphCurtain should sweep across a longer transition window instead of snapping on late.",
);
assert.match(
  curtainSource,
  /progressBetween\(progress,\s*0\.94,\s*0\.99\)/,
  "MorphCurtain should fade away before the final Workbench Gate settles.",
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
assert.match(
  styleSource,
  /\.workbench-gate[\s\S]*?z-index:\s*18/,
  "The final Workbench Gate should sit above the liquid transition layer.",
);
