import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readLandingStyles } from "./helpers/landing_styles.mjs";

const heroSource = readFileSync("frontend/formulas/landing/components/Hero.tsx", "utf8");
const landingStyles = readLandingStyles();

assert.match(
  landingStyles,
  /radial-gradient\(circle 420px at var\(--mouse-x, 68%\) var\(--mouse-y, 52%\), rgba\(255, 255, 255, 0\.04\), transparent 82%\)/,
  "Landing light falloff should stay subtle and biased toward the manuscript instead of fogging the center.",
);
assert.match(
  heroSource,
  /createRafThrottledPointerWriter\(\{[\s\S]*target:\s*document\.documentElement,[\s\S]*xVar:\s*"--mouse-x"[\s\S]*yVar:\s*"--mouse-y"/,
  "Landing light position should be written globally through the shared rAF pointer writer so the background layer can read it.",
);
assert.doesNotMatch(
  heroSource,
  /heroElement\.style\.setProperty\("--mouse-x"/,
  "Landing background light should not write mouse variables to the hero section only.",
);
