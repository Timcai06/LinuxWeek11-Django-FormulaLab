import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const files = {
  story: "frontend/formulas/landing/components/LandingScrollStory.tsx",
  director: "frontend/formulas/landing/components/ScrollDirector.tsx",
  splitText: "frontend/formulas/landing/components/SplitTextTitleSequence.tsx",
  constellation: "frontend/formulas/landing/components/FormulaConstellationField.tsx",
  workspace: "frontend/formulas/landing/components/WorkspaceRevealOverlay.tsx",
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
const workspaceSource = readFileSync(files.workspace, "utf8");
const manuscriptSource = readFileSync(files.manuscript, "utf8");
const shaderSource = readFileSync(files.shader, "utf8");
const motionSource = readFileSync(files.motion, "utf8");
const typeSource = readFileSync(files.types, "utf8");
const styleSource = readFileSync(files.styles, "utf8");

assert.match(storySource, /<ScrollDirector/, "LandingScrollStory should delegate scroll orchestration.");
assert.match(storySource, /<FormulaConstellationField/, "LandingScrollStory should render the formula constellation module.");
assert.match(storySource, /<WorkspaceRevealOverlay/, "LandingScrollStory should render the workspace reveal module.");
assert.doesNotMatch(storySource, /ScrollTrigger\.create/, "ScrollTrigger setup should live in ScrollDirector.");
assert.doesNotMatch(storySource, /workspace-pane/, "Workspace skeleton markup should live in WorkspaceRevealOverlay.");

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

assert.match(workspaceSource, /WorkspaceRevealOverlay/, "WorkspaceRevealOverlay component should exist.");
assert.match(workspaceSource, /product-preview-shell/, "Workspace reveal should render a semantic product preview shell.");
assert.match(workspaceSource, /product-preview-project/, "Product preview should include project context.");
assert.match(workspaceSource, /product-preview-paper/, "Product preview should include a paper workspace.");
assert.match(workspaceSource, /product-preview-review/, "Product preview should include formula review inbox.");
assert.match(workspaceSource, /product-preview-collab/, "Product preview should include collaboration signals.");
assert.match(workspaceSource, /main\.tex/, "Project context should expose a recognizable LaTeX project file.");
assert.match(workspaceSource, /references\.bib/, "Project context should expose bibliography context.");
assert.match(workspaceSource, /Accept|Edit/, "Formula review inbox should expose review actions.");
assert.match(workspaceSource, /workspace-cta/, "Workspace reveal should expose final product CTAs.");
assert.doesNotMatch(workspaceSource, /workspace-pane-outline/, "Product preview should not regress to the old decorative outline pane.");
assert.doesNotMatch(workspaceSource, /workspace-pane-paper/, "Product preview should not regress to the old decorative paper pane.");
assert.doesNotMatch(workspaceSource, /workspace-pane-review/, "Product preview should not regress to the old decorative review pane.");

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
