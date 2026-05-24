import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const canvasSource = readFileSync("frontend/formulas/landing/components/ManuscriptCanvas.tsx", "utf8");
const landingStyles = readFileSync("frontend/formulas/landing/styles/landing.css", "utf8");

assert.doesNotMatch(
  landingStyles,
  /\.webgl-canvas-container::before/,
  "Landing should not paint a second static manuscript texture behind the animated canvas.",
);
assert.doesNotMatch(
  canvasSource,
  /--manuscript-texture/,
  "The manuscript texture should be owned by Three.js only, not duplicated into CSS.",
);
assert.match(
  canvasSource,
  /useLoader\(THREE\.TextureLoader,\s*MANUSCRIPT_TEXTURE\)/,
  "Landing should keep the animated Three.js manuscript texture.",
);
