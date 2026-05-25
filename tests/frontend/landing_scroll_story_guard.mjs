import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const appSource = readFileSync("frontend/formulas/landing/LandingApp.tsx", "utf8");
const storySource = readFileSync("frontend/formulas/landing/components/LandingScrollStory.tsx", "utf8");
const directorSource = readFileSync("frontend/formulas/landing/components/ScrollDirector.tsx", "utf8");
const canvasSource = readFileSync("frontend/formulas/landing/components/ManuscriptCanvas.tsx", "utf8");
const heroSource = readFileSync("frontend/formulas/landing/components/Hero.tsx", "utf8");
const styleSource = readFileSync("frontend/formulas/landing/styles/landing.css", "utf8");

assert.match(appSource, /LandingScrollStory/, "Landing should wrap the hero in a scroll story controller.");
assert.match(directorSource, /ScrollTrigger/, "Landing scroll story should use GSAP ScrollTrigger.");
assert.match(storySource, /scrollProgressRef/, "Scroll progress should be stored in a ref bridge.");
assert.match(directorSource, /--hero-opacity/, "Landing story should fade hero text away as the manuscript takes focus.");
assert.match(directorSource, /--text-disperse/, "Landing text should disperse away instead of simply blurring.");
assert.match(directorSource, /--shutdown-opacity/, "Landing HUD should shut down as the paper takes focus.");
assert.match(storySource, /ScrollDirector/, "Landing should use a scroll director module.");
assert.match(storySource, /FormulaConstellationField/, "Landing should keep formulas in a dedicated constellation module.");
assert.match(storySource, /WorkspaceRevealOverlay/, "Landing should keep workspace reveal markup in a dedicated module.");
assert.match(styleSource, /--cta-opacity/, "Landing should expose a final CTA phase variable.");
assert.match(canvasSource, /FormulaStarfield/, "Landing should use a Three.js formula particle starfield.");
assert.match(directorSource, /center/, "Landing story should have a manuscript-centering phase before scan/decode.");
assert.match(directorSource, /phaseOpacity\(progress, 0\.5, 0\.62, 0\.74\)/, "Scan should begin after the paper moves to center.");
assert.match(canvasSource, /scrollProgressRef/, "The manuscript canvas should receive scroll progress.");
assert.match(canvasSource, /useFrame/, "The manuscript canvas should animate the paper per frame.");
assert.match(canvasSource, /centerProgress/, "The paper should move to center before scan/decode handoff.");
assert.match(canvasSource, /lerp\(3\.4,\s*-0\.18,\s*centerProgress\)/, "The paper should resolve close to the visual screen center.");
assert.match(canvasSource, /lerp\(-1\.35,\s*-0\.04,\s*centerProgress\)/, "The paper should resolve close to the vertical screen center.");
assert.match(canvasSource, /targetPositions\[baseOffset\]\s*=\s*-0\.18/, "The absorbed formula field should converge near the visually centered paper.");
assert.match(canvasSource, /<FormulaStarfield scrollProgressRef=\{scrollProgressRef\}/, "The formula starfield should absorb into the paper scene.");
assert.match(storySource, /WorkspaceRevealOverlay/, "After scanning, the landing should reveal a product workspace silhouette.");
assert.match(directorSource, /--workspace-opacity/, "The product workspace reveal should be controlled by scroll progress.");
assert.match(directorSource, /--project-preview-opacity/, "Product preview project context should have a staged reveal variable.");
assert.match(directorSource, /--paper-preview-opacity/, "Product preview paper workspace should have a staged reveal variable.");
assert.match(directorSource, /--review-preview-opacity/, "Product preview formula review should have a staged reveal variable.");
assert.match(directorSource, /--collab-preview-opacity/, "Product preview collaboration signals should have a staged reveal variable.");
assert.match(directorSource, /--manuscript-final-opacity/, "ScrollDirector should lower manuscript dominance in the final product preview.");
assert.match(styleSource, /\.workspace-reveal/, "The product workspace reveal should have a dedicated visual layer.");
assert.match(styleSource, /--project-preview-opacity/, "Landing styles should declare a project preview reveal variable name.");
assert.match(styleSource, /--paper-preview-opacity/, "Landing styles should declare a paper preview reveal variable name.");
assert.match(styleSource, /--review-preview-opacity/, "Landing styles should declare a review preview reveal variable name.");
assert.match(styleSource, /--collab-preview-opacity/, "Landing styles should declare a collaboration preview reveal variable name.");
assert.match(styleSource, /var\(--manuscript-final-opacity\)/, "Landing styles should consume the final manuscript fade variable.");
assert.doesNotMatch(
  storySource,
  /ScrollTrigger\.create/,
  "LandingScrollStory should compose modules instead of owning ScrollTrigger directly.",
);
assert.doesNotMatch(
  storySource,
  /decode-field|DECODE_FORMULAS|renderDecodeFormula/,
  "Landing should not leave a fixed right-side formula column after the manuscript centers.",
);
assert.doesNotMatch(
  storySource,
  /<span>\s*(CAPTURE|CENTER|SCAN|DECODE)\s*<\/span>/,
  "After the manuscript centers, the landing stage should not leave explanatory rail text on screen.",
);
assert.doesNotMatch(
  directorSource,
  /useState/,
  "Scroll progress should not be stored in React state for per-frame animation.",
);
assert.doesNotMatch(
  storySource,
  /useState/,
  "Scroll progress should not be stored in React state for per-frame animation.",
);
assert.doesNotMatch(
  storySource + canvasSource + styleSource,
  /--hero-blur/,
  "Landing should not keep the old hero blur variable.",
);
assert.doesNotMatch(
  styleSource,
  /\.landing-copy[\s\S]*?filter:\s*blur\(/,
  "Landing copy should not disappear through a blur filter rule.",
);
assert.doesNotMatch(
  heroSource,
  /fromTo\(\s*['"]\.landing-copy['"]/,
  "Hero entrance animation must not write inline opacity or transforms onto the scroll-controlled copy container.",
);
