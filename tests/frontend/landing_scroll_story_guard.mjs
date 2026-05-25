import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const appSource = readFileSync("frontend/formulas/landing/LandingApp.tsx", "utf8");
const storySource = readFileSync("frontend/formulas/landing/components/LandingScrollStory.tsx", "utf8");
const directorSource = readFileSync("frontend/formulas/landing/components/ScrollDirector.tsx", "utf8");
const canvasSource = readFileSync("frontend/formulas/landing/components/ManuscriptCanvas.tsx", "utf8");
const heroSource = readFileSync("frontend/formulas/landing/components/Hero.tsx", "utf8");
const splitTextSource = readFileSync("frontend/formulas/landing/components/SplitTextTitleSequence.tsx", "utf8");
const styleSource = readFileSync("frontend/formulas/landing/styles/landing.css", "utf8");

assert.match(appSource, /LandingScrollStory/, "Landing should wrap the hero in a scroll story controller.");
assert.match(directorSource, /ScrollTrigger/, "Landing scroll story should use GSAP ScrollTrigger.");
assert.match(storySource, /scrollProgressRef/, "Scroll progress should be stored in a ref bridge.");
assert.match(directorSource, /--hero-opacity/, "Landing story should fade hero text away as the manuscript takes focus.");
assert.match(directorSource, /--text-disperse/, "Landing text should disperse away instead of simply blurring.");
assert.match(directorSource, /--shutdown-opacity/, "Landing HUD should shut down as the paper takes focus.");
assert.match(storySource, /ScrollDirector/, "Landing should use a scroll director module.");
assert.match(storySource, /FormulaConstellationField/, "Landing should keep formulas in a dedicated constellation module.");
assert.match(storySource, /WorkbenchGateOverlay/, "Landing should keep the final Workbench Gate in a dedicated module.");
assert.doesNotMatch(storySource, /WorkspaceRevealOverlay/, "Landing should not keep the rejected Product Preview overlay.");
assert.match(styleSource, /--cta-opacity/, "Landing should expose a final CTA phase variable.");
assert.match(directorSource, /--decode-chamber-opacity/, "ScrollDirector should expose Decode Chamber opacity.");
assert.match(directorSource, /--decode-chamber-y/, "ScrollDirector should expose Decode Chamber vertical motion.");
assert.match(directorSource, /--workspace-ghost-opacity/, "ScrollDirector should expose Paper Workspace Ghost opacity.");
assert.match(directorSource, /--workspace-ghost-y/, "ScrollDirector should expose Paper Workspace Ghost vertical motion.");
assert.match(directorSource, /--collab-signal-opacity/, "ScrollDirector should expose Collaboration Signal opacity.");
assert.match(directorSource, /--collab-signal-y/, "ScrollDirector should expose Collaboration Signal vertical motion.");
assert.match(styleSource, /var\(--decode-chamber-opacity\)/, "Landing styles should consume Decode Chamber opacity.");
assert.match(styleSource, /var\(--workspace-ghost-opacity\)/, "Landing styles should consume Paper Workspace Ghost opacity.");
assert.match(styleSource, /var\(--collab-signal-opacity\)/, "Landing styles should consume Collaboration Signal opacity.");
assert.match(canvasSource, /FormulaStarfield/, "Landing should use a Three.js formula particle starfield.");
assert.match(directorSource, /center/, "Landing story should have a manuscript-centering phase before scan/decode.");
assert.match(directorSource, /if \(progress >= 0\.92\)[\s\S]*return "cta"/, "CTA phase should begin at the final gate threshold.");
assert.match(directorSource, /if \(progress >= 0\.82\)[\s\S]*return "collab"/, "Collaboration phase should precede the final gate.");
assert.match(directorSource, /if \(progress >= 0\.66\)[\s\S]*return "workspace"/, "Workspace ghost phase should follow decode.");
assert.match(directorSource, /if \(progress >= 0\.5\)[\s\S]*return "decode"/, "Decode phase should begin after manuscript centering.");
assert.doesNotMatch(directorSource, /return "reveal"/, "The old reveal phase should be replaced by explicit workspace/collaboration phases.");
assert.doesNotMatch(directorSource, /return "scan"/, "Scan should be a visual sub-progress, not a top-level fifth-stage phase.");
assert.match(directorSource, /phaseOpacity\(progress, 0\.46, 0\.56, 0\.66\)/, "Scan should begin after the paper moves to center.");
assert.match(canvasSource, /scrollProgressRef/, "The manuscript canvas should receive scroll progress.");
assert.match(canvasSource, /useFrame/, "The manuscript canvas should animate the paper per frame.");
assert.match(canvasSource, /easedRange\(progress, 0\.16, 0\.46\)/, "The paper should move to center during the manuscript gravity phase.");
assert.match(canvasSource, /easedRange\(progress, 0\.46, 0\.66\)/, "The paper scan should align with the decode chamber entrance.");
assert.match(canvasSource, /easedRange\(progress, 0\.66, 0\.92\)/, "The paper should recede as the workspace ghost appears.");
assert.match(canvasSource, /const releaseProgress = easedRange\(progress, 0\.82, 0\.99\)/, "The formula starfield should release as collaboration and gate layers appear.");
assert.match(
  canvasSource,
  /materialRef\.current\.opacity = THREE\.MathUtils\.lerp\(0\.34, 0\.72, absorbProgress\) \* \(1 - orbitProgress \* 0\.2\) \* \(1 - releaseProgress \* 0\.72\)/,
  "The starfield release should fade particles without increasing particle count.",
);
assert.match(splitTextSource, /type:\s*"lines,words,chars"/, "SplitText should request line, word, and character wrappers.");
assert.match(splitTextSource, /charsClass:\s*"split-title-char"/, "SplitText should expose character hook classes.");
assert.match(splitTextSource, /wordsClass:\s*"split-title-word"/, "SplitText should expose word hook classes.");
assert.match(splitTextSource, /linesClass:\s*"split-title-line"/, "SplitText should expose line hook classes.");
assert.match(styleSource, /\.split-title-line[\s\S]*?display:\s*block/, "SplitText line wrappers should keep block flow.");
assert.match(styleSource, /\.split-title-word[\s\S]*?display:\s*inline-block/, "SplitText word wrappers should stay inline-block without scroll transform.");
assert.match(styleSource, /\.split-title-char[\s\S]*?transform:\s*translate3d\(calc\(var\(--text-disperse\) \* 0\.16\), 0, 0\)/, "SplitText scroll exit should move only character wrappers.");
assert.match(canvasSource, /targetPositions\[baseOffset\]\s*=\s*-0\.18/, "The absorbed formula field should converge near the visually centered paper.");
assert.match(canvasSource, /<FormulaStarfield scrollProgressRef=\{scrollProgressRef\}/, "The formula starfield should absorb into the paper scene.");
assert.match(directorSource, /--gate-opacity/, "The final Workbench Gate should be controlled by scroll progress.");
assert.match(directorSource, /--gate-y/, "The final Workbench Gate should have a staged vertical entrance.");
assert.match(directorSource, /--gate-scale/, "The final Workbench Gate should settle into place without a hard cut.");
assert.match(directorSource, /--gate-aura-opacity/, "The final Workbench Gate should expose a subtle aura layer.");
assert.match(
  directorSource,
  /const gateProgress = progressBetween\(progress, 0\.92, 0\.99\)/,
  "Workbench Gate motion should start only after the collaboration signal phase.",
);
assert.match(
  directorSource,
  /const gateAuraOpacity = gateProgress \* 0\.24/,
  "Workbench Gate aura should follow the same final-stage progress as the shell.",
);
assert.match(directorSource, /--manuscript-final-opacity/, "ScrollDirector should lower manuscript dominance in the final gate.");
assert.doesNotMatch(directorSource, /--project-preview-opacity/, "Landing should not keep Product Preview project reveal variables.");
assert.doesNotMatch(directorSource, /--paper-preview-opacity/, "Landing should not keep Product Preview paper reveal variables.");
assert.doesNotMatch(directorSource, /--review-preview-opacity/, "Landing should not keep Product Preview review reveal variables.");
assert.doesNotMatch(directorSource, /--collab-preview-opacity/, "Landing should not keep Product Preview collaboration reveal variables.");
assert.match(styleSource, /\.workbench-gate/, "The final Workbench Gate should have a dedicated visual layer.");
assert.match(styleSource, /var\(--gate-opacity\)/, "Landing styles should consume the final gate opacity variable.");
assert.match(styleSource, /var\(--gate-aura-opacity\)/, "Landing styles should consume the final gate aura variable.");
assert.match(styleSource, /visibility:\s*hidden/, "Workbench Gate should stay hidden before the CTA phase.");
assert.match(styleSource, /\[data-story-phase="cta"\]\s+\.workbench-gate/, "Workbench Gate should become visible only in the CTA phase.");
assert.doesNotMatch(
  styleSource,
  /\[data-story-phase="reveal"\]\s+\.workbench-gate/,
  "Workbench Gate should not become visible during the reveal phase.",
);
assert.match(styleSource, /var\(--manuscript-final-opacity\)/, "Landing styles should consume the final manuscript fade variable.");
assert.doesNotMatch(styleSource, /product-preview-/, "Landing styles should not keep Product Preview terminal styles.");
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
assert.doesNotMatch(
  heroSource,
  /OPTICAL FORMULA RECOGNITION|MISSION CONTROL FOR LATEX RECOGNITION|SCAN GRID ACTIVE|LATEX TELEMETRY ONLINE|IMAGE INPUT READY/,
  "The landing hero should open on paper-workspace product language, not the old OCR telemetry story.",
);
assert.match(heroSource, /PAPER WORKSPACE FOR LATEX AUTHORS/, "The landing hero should introduce the paper workspace audience.");
assert.match(heroSource, /REVIEW INBOX PRIMED/, "The landing hero should preview the review workflow.");
assert.match(heroSource, /COLLABORATION LAYER READY/, "The landing hero should preview the collaboration layer.");
assert.match(
  directorSource,
  /const collabSignalOpacity = phaseOpacity\(progress, 0\.82, 0\.87, 0\.91\)/,
  "Collaboration signals should fully resolve before the CTA phase begins.",
);
assert.doesNotMatch(
  styleSource,
  /\[data-story-phase="cta"\]\s+\.collaboration-signal-field/,
  "Collaboration signal cards should not remain visible in the final CTA phase.",
);
assert.match(styleSource, /\.cinematic-overlay[\s\S]*?pointer-events:\s*none/, "Cinematic overlays should not steal clicks from the final CTA.");
assert.match(
  styleSource,
  /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.decode-chamber,\s*[\s\S]*?\.paper-workspace-ghost,\s*[\s\S]*?\.collaboration-signal-field[\s\S]*?display:\s*none/,
  "Reduced-motion mode should hide cinematic overlays.",
);
assert.match(
  styleSource,
  /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.workbench-gate[\s\S]*?visibility:\s*visible/,
  "Reduced-motion mode should expose the Workbench Gate without scroll.",
);
assert.match(
  styleSource,
  /@media \(max-width: 720px\)[\s\S]*?\.decode-chamber,\s*[\s\S]*?\.collaboration-signal-field[\s\S]*?width:\s*calc\(100vw - 36px\)/,
  "Mobile cinematic overlays should be constrained to the viewport width.",
);
assert.match(
  styleSource,
  /@media \(max-width: 720px\)[\s\S]*?\.collaboration-signal-field[\s\S]*?inset:\s*auto 18px 88px auto/,
  "Mobile collaboration signals should use the explicit mobile inset instead of inheriting desktop placement.",
);
