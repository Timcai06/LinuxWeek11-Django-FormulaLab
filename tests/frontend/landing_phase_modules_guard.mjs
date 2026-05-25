import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const files = {
  story: "frontend/formulas/landing/components/LandingScrollStory.tsx",
  director: "frontend/formulas/landing/components/ScrollDirector.tsx",
  splitText: "frontend/formulas/landing/components/SplitTextTitleSequence.tsx",
  constellation: "frontend/formulas/landing/components/FormulaConstellationField.tsx",
  gate: "frontend/formulas/landing/components/WorkbenchGateOverlay.tsx",
  manuscript: "frontend/formulas/landing/components/ManuscriptCanvas.tsx",
  shader: "frontend/formulas/landing/three/ManuscriptShaderMaterial.ts",
  motion: "frontend/formulas/landing/three/motion.ts",
  types: "frontend/formulas/landing/types.ts",
  styles: "frontend/formulas/landing/styles/landing.css",
};

for (const [name, file] of Object.entries(files)) {
  assert.ok(existsSync(file), `${name} module should exist at ${file}`);
}

const storySource = readFileSync(files.story, "utf8");
const directorSource = readFileSync(files.director, "utf8");
const splitTextSource = readFileSync(files.splitText, "utf8");
const constellationSource = readFileSync(files.constellation, "utf8");
const gateSource = readFileSync(files.gate, "utf8");
const manuscriptSource = readFileSync(files.manuscript, "utf8");
const shaderSource = readFileSync(files.shader, "utf8");
const motionSource = readFileSync(files.motion, "utf8");
const typeSource = readFileSync(files.types, "utf8");
const styleSource = readFileSync(files.styles, "utf8");
const gateIndex = gateSource.indexOf("workbench-gate");
const ctaIndex = gateSource.indexOf("workbench-gate-cta");

assert.match(storySource, /<ScrollDirector/, "LandingScrollStory should delegate scroll orchestration.");
assert.match(storySource, /<FormulaConstellationField/, "LandingScrollStory should render the formula constellation module.");
assert.match(storySource, /<WorkbenchGateOverlay/, "LandingScrollStory should render the Workbench Gate module.");
assert.doesNotMatch(storySource, /WorkspaceRevealOverlay/, "LandingScrollStory should not render the rejected Product Preview overlay.");
assert.doesNotMatch(storySource, /ScrollTrigger\.create/, "ScrollTrigger setup should live in ScrollDirector.");
assert.doesNotMatch(storySource, /workspace-pane/, "Workspace skeleton markup should stay out of LandingScrollStory.");

assert.match(directorSource, /ScrollTrigger\.create/, "ScrollDirector should own ScrollTrigger setup.");
for (const phase of ["intro", "absorb", "center", "scan", "reveal", "cta"]) {
  assert.match(directorSource, new RegExp(`["']${phase}["']`), `ScrollDirector should expose the "${phase}" story phase.`);
}
assert.match(directorSource, /--cta-opacity/, "ScrollDirector should drive the final CTA phase.");
assert.doesNotMatch(directorSource, /useState/, "ScrollDirector should not use React state for per-frame scroll progress.");

assert.match(splitTextSource, /SplitTextTitleSequence/, "SplitTextTitleSequence component should exist.");
assert.match(splitTextSource, /data-split-title/, "SplitTextTitleSequence should target explicit title text.");
assert.doesNotMatch(splitTextSource, /fromTo\(\s*['"]\.landing-copy['"]/, "SplitText should not animate the scroll-controlled copy container.");

assert.match(constellationSource, /FormulaConstellationField/, "FormulaConstellationField component should exist.");
assert.match(constellationSource, /katex|renderToString/, "Formula constellation should render formulas, not raw TeX strings.");

assert.match(gateSource, /WorkbenchGateOverlay/, "WorkbenchGateOverlay component should exist.");
assert.match(gateSource, /workbench-gate/, "Workbench Gate should render a minimal terminal shell.");
assert.match(gateSource, /workbench-gate-copy/, "Workbench Gate should keep one short product landing sentence.");
assert.match(gateSource, /workbench-gate-cta/, "Workbench Gate should expose a final CTA.");
assert.match(gateSource, /Enter Workbench/, "The final CTA label should be Enter Workbench.");
assert.match(gateSource, /href="\/workbench\/"/, "The final CTA should navigate to the Workbench.");
assert.doesNotMatch(gateSource, /Start Recognition/, "Workbench Gate should not keep a competing Start Recognition CTA.");
assert.doesNotMatch(gateSource, /Open Workspace/, "Workbench Gate should not keep a competing Open Workspace CTA.");
assert.doesNotMatch(gateSource, /product-preview-/, "Workbench Gate should not render Product Preview markup.");
assert.doesNotMatch(gateSource, /Project|Formula Review|Suggested edit|references\.bib|main\.tex/, "Workbench Gate should not render product preview content.");
assert.notEqual(gateIndex, -1, "Workbench Gate should define its terminal shell.");
assert.notEqual(ctaIndex, -1, "Workbench Gate should define its CTA.");
assert.ok(gateIndex < ctaIndex, "Workbench Gate CTA should live inside the terminal shell.");

assert.match(manuscriptSource, /createManuscriptShaderMaterial|manuscriptShaderUniforms/, "ManuscriptCanvas should use the manuscript shader scan material.");
assert.match(manuscriptSource, /STARFIELD_PARTICLE_COUNT\s*=\s*720/, "Particle count should remain capped for desktop performance.");
assert.match(manuscriptSource, /MAX_DPR:\s*\[number,\s*number\]\s*=\s*\[1,\s*1\.5\]/, "Canvas DPR should remain capped.");
assert.match(shaderSource, /uScanProgress/, "Manuscript shader should expose scan progress uniform.");
assert.match(shaderSource, /uTime/, "Manuscript shader should expose time uniform.");
assert.match(shaderSource, /ShaderMaterial/, "Manuscript scan should be implemented as a Three.js shader material.");

assert.match(motionSource, /export function easedRange/, "Motion helpers should be reusable.");
assert.match(motionSource, /export function phaseOpacity/, "Phase opacity helper should be reusable.");
assert.match(typeSource, /export type LandingPhase/, "Landing phases should have a shared type.");
assert.match(styleSource, /\.workspace-cta/, "Final CTA styles should exist.");
assert.doesNotMatch(styleSource, /--hero-blur/, "Landing should not keep the old hero blur variable.");
assert.doesNotMatch(styleSource, /\.landing-copy[\s\S]*?filter:\s*blur\(/, "Landing copy should not disappear through a blur filter rule.");
