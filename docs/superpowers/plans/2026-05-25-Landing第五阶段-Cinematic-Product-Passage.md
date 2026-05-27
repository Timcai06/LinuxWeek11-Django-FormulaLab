# Landing 第五阶段 Cinematic Product Passage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a richer Formula Lab landing scroll story that moves from formula storm to manuscript gravity, decode chamber, paper workspace ghost, collaboration signals, and final Workbench Gate.

**Architecture:** `ScrollDirector.tsx` remains the only ScrollTrigger owner and writes phase/progress CSS variables. Three.js stays responsible for the manuscript and formula particle field, while product meaning is rendered through focused React DOM overlays that can be tested and styled independently. The final Workbench Gate remains the only end-state CTA.

**Tech Stack:** React 19, TypeScript, GSAP ScrollTrigger, optional GSAP SplitText runtime, Three.js via `@react-three/fiber`, Vite landing build, Django static asset pipeline, Node guard tests.

---

## File Structure

### Create

- `frontend/formulas/landing/components/DecodeChamberOverlay.tsx`
  Renders the formula extraction moment: KaTeX-like source labels, confidence, structure, and candidate repair signals.

- `frontend/formulas/landing/components/PaperWorkspaceGhost.tsx`
  Renders the ghosted paper workspace silhouette: LaTeX editor island, review inbox, and paper preview lineframe.

- `frontend/formulas/landing/components/CollaborationSignalField.tsx`
  Renders collaboration signals: comment, accept change, collaborator cursor, and version delta.

### Modify

- `frontend/formulas/landing/components/LandingScrollStory.tsx`
  Keeps composition only. Adds the three new overlay modules between scan beam and gate.

- `frontend/formulas/landing/components/ScrollDirector.tsx`
  Extends the scroll phases and CSS vars for decode, workspace ghost, collaboration, and final gate.

- `frontend/formulas/landing/components/ManuscriptCanvas.tsx`
  Retunes paper and particle behavior around the longer cinematic timeline while keeping particle count and DPR caps.

- `frontend/formulas/landing/components/SplitTextTitleSequence.tsx`
  Keeps optional SplitText support and adds safe CSS-class hooks for scroll-driven title exit.

- `frontend/formulas/landing/styles/landing.css`
  Adds overlay layout, visual effects, phase visibility, reduced-motion fallback, and desktop-first responsive rules.

- `frontend/formulas/landing/types.ts`
  Expands the shared phase union and story CSS var shape.

- `tests/frontend/landing_phase_modules_guard.mjs`
  Guards module boundaries and prohibits the old product preview card stack.

- `tests/frontend/landing_scroll_story_guard.mjs`
  Guards timeline thresholds, CSS vars, CTA gating, no blur-only exits, and performance boundaries.

- Generated assets after build:
  - `apps/formulas/static/formulas/js/generated/landing.js`
  - `apps/formulas/static/formulas/js/generated/landing-landing-three.js`
  - `apps/formulas/static/formulas/css/generated/landing.css`
  - Legacy note: the pre-Vite landing page stylesheet has since been removed.

---

## Task 1: Guard The Cinematic Passage Contract

**Files:**
- Modify: `tests/frontend/landing_phase_modules_guard.mjs`
- Modify: `tests/frontend/landing_scroll_story_guard.mjs`
- Modify: `frontend/formulas/landing/types.ts`
- Create: `frontend/formulas/landing/components/DecodeChamberOverlay.tsx`
- Create: `frontend/formulas/landing/components/PaperWorkspaceGhost.tsx`
- Create: `frontend/formulas/landing/components/CollaborationSignalField.tsx`
- Modify: `frontend/formulas/landing/components/LandingScrollStory.tsx`

- [ ] **Step 1: Update the phase/module guard with the new component contract**

Replace the `files` object and story/component assertions in `tests/frontend/landing_phase_modules_guard.mjs` with this structure while keeping the existing imports and performance assertions below it:

```js
const files = {
  story: "frontend/formulas/landing/components/LandingScrollStory.tsx",
  director: "frontend/formulas/landing/components/ScrollDirector.tsx",
  splitText: "frontend/formulas/landing/components/SplitTextTitleSequence.tsx",
  constellation: "frontend/formulas/landing/components/FormulaConstellationField.tsx",
  decode: "frontend/formulas/landing/components/DecodeChamberOverlay.tsx",
  workspaceGhost: "frontend/formulas/landing/components/PaperWorkspaceGhost.tsx",
  collaboration: "frontend/formulas/landing/components/CollaborationSignalField.tsx",
  gate: "frontend/formulas/landing/components/WorkbenchGateOverlay.tsx",
  manuscript: "frontend/formulas/landing/components/ManuscriptCanvas.tsx",
  shader: "frontend/formulas/landing/three/ManuscriptShaderMaterial.ts",
  motion: "frontend/formulas/landing/three/motion.ts",
  types: "frontend/formulas/landing/types.ts",
  styles: "frontend/formulas/landing/styles/landing.css",
};
```

Add reads for the new modules after existing reads:

```js
const decodeSource = readFileSync(files.decode, "utf8");
const workspaceGhostSource = readFileSync(files.workspaceGhost, "utf8");
const collaborationSource = readFileSync(files.collaboration, "utf8");
```

Replace the top story assertions with:

```js
assert.match(storySource, /<ScrollDirector/, "LandingScrollStory should delegate scroll orchestration.");
assert.match(storySource, /<FormulaConstellationField/, "LandingScrollStory should render the formula constellation module.");
assert.match(storySource, /<DecodeChamberOverlay/, "LandingScrollStory should render the decode chamber module.");
assert.match(storySource, /<PaperWorkspaceGhost/, "LandingScrollStory should render the paper workspace ghost module.");
assert.match(storySource, /<CollaborationSignalField/, "LandingScrollStory should render the collaboration signal module.");
assert.match(storySource, /<WorkbenchGateOverlay/, "LandingScrollStory should render the Workbench Gate module.");
assert.doesNotMatch(storySource, /WorkspaceRevealOverlay/, "LandingScrollStory should not render the rejected Product Preview overlay.");
assert.doesNotMatch(storySource, /ScrollTrigger\.create/, "ScrollTrigger setup should live in ScrollDirector.");
assert.doesNotMatch(storySource, /workspace-pane|product-preview-/, "Old product preview card markup should stay out of LandingScrollStory.");
```

Replace the phase loop with the fifth-stage phase list:

```js
for (const phase of ["intro", "absorb", "center", "decode", "workspace", "collab", "cta"]) {
  assert.match(directorSource, new RegExp(`["']${phase}["']`), `ScrollDirector should expose the "${phase}" story phase.`);
}
```

Add component content guards before the existing gate assertions:

```js
assert.match(decodeSource, /DecodeChamberOverlay/, "DecodeChamberOverlay component should exist.");
assert.match(decodeSource, /decode-chamber/, "Decode Chamber should use a dedicated class namespace.");
assert.match(decodeSource, /LaTeX candidate/, "Decode Chamber should show formula-recognition product language.");
assert.match(decodeSource, /Confidence/, "Decode Chamber should show recognition confidence.");
assert.doesNotMatch(decodeSource, /GPU|VRAM|TARGET LOCKED/, "Decode Chamber should avoid fake machine telemetry language.");

assert.match(workspaceGhostSource, /PaperWorkspaceGhost/, "PaperWorkspaceGhost component should exist.");
assert.match(workspaceGhostSource, /paper-workspace-ghost/, "Paper Workspace Ghost should use a dedicated class namespace.");
assert.match(workspaceGhostSource, /main\.tex/, "Paper Workspace Ghost should show paper-editing context.");
assert.match(workspaceGhostSource, /Review inbox/, "Paper Workspace Ghost should show review-inbox context.");
assert.doesNotMatch(workspaceGhostSource, /product-preview-/, "Paper Workspace Ghost should not revive the old Product Preview namespace.");

assert.match(collaborationSource, /CollaborationSignalField/, "CollaborationSignalField component should exist.");
assert.match(collaborationSource, /collaboration-signal/, "Collaboration Signal Field should use a dedicated class namespace.");
assert.match(collaborationSource, /Accept change|Comment|cursor/, "Collaboration Signal Field should show collaboration language.");
assert.doesNotMatch(collaborationSource, /GPU|VRAM|TARGET LOCKED/, "Collaboration signals should avoid fake machine telemetry language.");
```

Run: `node tests/frontend/landing_phase_modules_guard.mjs`

Expected: FAIL because the three new component files do not exist yet.

- [ ] **Step 2: Update the scroll guard with fifth-stage variables**

In `tests/frontend/landing_scroll_story_guard.mjs`, keep the existing imports and product-preview rejection checks. Add these assertions near the existing CSS-var assertions:

```js
assert.match(directorSource, /--decode-chamber-opacity/, "ScrollDirector should expose Decode Chamber opacity.");
assert.match(directorSource, /--decode-chamber-y/, "ScrollDirector should expose Decode Chamber vertical motion.");
assert.match(directorSource, /--workspace-ghost-opacity/, "ScrollDirector should expose Paper Workspace Ghost opacity.");
assert.match(directorSource, /--workspace-ghost-y/, "ScrollDirector should expose Paper Workspace Ghost vertical motion.");
assert.match(directorSource, /--collab-signal-opacity/, "ScrollDirector should expose Collaboration Signal opacity.");
assert.match(directorSource, /--collab-signal-y/, "ScrollDirector should expose Collaboration Signal vertical motion.");
assert.match(styleSource, /var\(--decode-chamber-opacity\)/, "Landing styles should consume Decode Chamber opacity.");
assert.match(styleSource, /var\(--workspace-ghost-opacity\)/, "Landing styles should consume Paper Workspace Ghost opacity.");
assert.match(styleSource, /var\(--collab-signal-opacity\)/, "Landing styles should consume Collaboration Signal opacity.");
```

Replace the current gate threshold assertion with:

```js
assert.match(
  directorSource,
  /const gateProgress = progressBetween\(progress, 0\.92, 0\.99\)/,
  "Workbench Gate motion should start only after the collaboration signal phase.",
);
```

Add these phase assertions near the `phaseForProgress` checks:

```js
assert.match(directorSource, /if \(progress >= 0\.92\)[\s\S]*return "cta"/, "CTA phase should begin at the final gate threshold.");
assert.match(directorSource, /if \(progress >= 0\.82\)[\s\S]*return "collab"/, "Collaboration phase should precede the final gate.");
assert.match(directorSource, /if \(progress >= 0\.66\)[\s\S]*return "workspace"/, "Workspace ghost phase should follow decode.");
assert.match(directorSource, /if \(progress >= 0\.5\)[\s\S]*return "decode"/, "Decode phase should begin after manuscript centering.");
assert.doesNotMatch(directorSource, /return "reveal"/, "The old reveal phase should be replaced by explicit workspace/collaboration phases.");
assert.doesNotMatch(directorSource, /return "scan"/, "Scan should be a visual sub-progress, not a top-level fifth-stage phase.");
```

Run: `node tests/frontend/landing_scroll_story_guard.mjs`

Expected: FAIL because the new variables and phase thresholds are not implemented yet.

- [ ] **Step 3: Expand landing phase types**

Replace `LandingPhase` and `StoryCssVars` in `frontend/formulas/landing/types.ts` with:

```ts
import type { MutableRefObject, ReactNode } from "react";

export type LandingPhase = "intro" | "absorb" | "center" | "decode" | "workspace" | "collab" | "cta";

export type ScrollProgressRef = MutableRefObject<number>;

export type ScrollDirectorProps = {
  scrollProgressRef: ScrollProgressRef;
  children: ReactNode;
};

export type StoryCssVars = {
  storyProgress: number;
  heroOpacity: number;
  shutdownOpacity: number;
  cosmosOpacity: number;
  scanOpacity: number;
  decodeChamberOpacity: number;
  workspaceGhostOpacity: number;
  collabSignalOpacity: number;
  gateOpacity: number;
  ctaOpacity: number;
  phase: LandingPhase;
};
```

- [ ] **Step 4: Add the three focused overlay modules**

Create `frontend/formulas/landing/components/DecodeChamberOverlay.tsx`:

```tsx
const DECODE_LINES = [
  { label: "LaTeX candidate", value: String.raw`\int_\Omega \nabla u \cdot \nabla v\,dx` },
  { label: "Structure", value: "integral -> gradient -> bilinear form" },
  { label: "Confidence", value: "0.94" },
];

export function DecodeChamberOverlay() {
  return (
    <aside className="decode-chamber cinematic-overlay" aria-label="Formula decode chamber">
      <span className="cinematic-kicker">Decode Chamber</span>
      <div className="decode-chamber-core">
        {DECODE_LINES.map((line) => (
          <div className="decode-chamber-row" key={line.label}>
            <span>{line.label}</span>
            <code>{line.value}</code>
          </div>
        ))}
      </div>
      <p className="decode-chamber-note">Candidate repair ready for review inbox.</p>
    </aside>
  );
}
```

Create `frontend/formulas/landing/components/PaperWorkspaceGhost.tsx`:

```tsx
const REVIEW_ITEMS = ["Gaussian integral", "Matrix inverse", "Boundary condition"];

export function PaperWorkspaceGhost() {
  return (
    <section className="paper-workspace-ghost cinematic-overlay" aria-label="Paper workspace preview">
      <div className="paper-workspace-ghost-editor">
        <span className="cinematic-kicker">main.tex</span>
        <pre>{String.raw`\begin{equation}
  E = mc^2
\end{equation}`}</pre>
      </div>
      <div className="paper-workspace-ghost-inbox">
        <span className="cinematic-kicker">Review inbox</span>
        {REVIEW_ITEMS.map((item) => (
          <span className="paper-workspace-ghost-item" key={item}>
            {item}
          </span>
        ))}
      </div>
      <div className="paper-workspace-ghost-preview" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </section>
  );
}
```

Create `frontend/formulas/landing/components/CollaborationSignalField.tsx`:

```tsx
const SIGNALS = [
  { className: "collaboration-signal-comment", label: "Comment", value: "Check symbol domain" },
  { className: "collaboration-signal-accept", label: "Accept change", value: "Replace handwritten fraction" },
  { className: "collaboration-signal-cursor", label: "cursor", value: "Ada reviewing line 42" },
];

export function CollaborationSignalField() {
  return (
    <aside className="collaboration-signal-field cinematic-overlay" aria-label="Collaboration signals">
      {SIGNALS.map((signal) => (
        <div className={`collaboration-signal ${signal.className}`} key={signal.label}>
          <span>{signal.label}</span>
          <strong>{signal.value}</strong>
        </div>
      ))}
    </aside>
  );
}
```

- [ ] **Step 5: Integrate overlays into the composition layer**

Update `frontend/formulas/landing/components/LandingScrollStory.tsx` imports:

```tsx
import { useRef } from "react";

import { CollaborationSignalField } from "./CollaborationSignalField";
import { DecodeChamberOverlay } from "./DecodeChamberOverlay";
import { FormulaConstellationField } from "./FormulaConstellationField";
import { Hero } from "./Hero";
import { ManuscriptCanvas } from "./ManuscriptCanvas";
import { PaperWorkspaceGhost } from "./PaperWorkspaceGhost";
import { ScrollDirector } from "./ScrollDirector";
import { WorkbenchGateOverlay } from "./WorkbenchGateOverlay";
```

Update the stage body:

```tsx
<div className="landing-story-stage">
  <FormulaConstellationField />
  <ManuscriptCanvas scrollProgressRef={scrollProgressRef} />
  <Hero />
  <div className="manuscript-scan-beam" aria-hidden="true" />
  <DecodeChamberOverlay />
  <PaperWorkspaceGhost />
  <CollaborationSignalField />
  <WorkbenchGateOverlay />
  <div className="story-rail" aria-hidden="true">
    <span />
    <span />
    <span />
    <span />
    <span />
  </div>
</div>
```

- [ ] **Step 6: Run the module guard**

Run: `node tests/frontend/landing_phase_modules_guard.mjs`

Expected: FAIL only on ScrollDirector phase/variable assertions and CSS assertions that are intentionally handled in subsequent tasks. It must not fail for missing component files or missing imports.

- [ ] **Step 7: Commit the module contract**

```bash
git add tests/frontend/landing_phase_modules_guard.mjs tests/frontend/landing_scroll_story_guard.mjs frontend/formulas/landing/types.ts frontend/formulas/landing/components/DecodeChamberOverlay.tsx frontend/formulas/landing/components/PaperWorkspaceGhost.tsx frontend/formulas/landing/components/CollaborationSignalField.tsx frontend/formulas/landing/components/LandingScrollStory.tsx
git commit -m "feat: add cinematic landing passage modules"
```

---

## Task 2: Retune ScrollDirector Into The Six-Beat Story

**Files:**
- Modify: `frontend/formulas/landing/components/ScrollDirector.tsx`
- Modify: `frontend/formulas/landing/styles/landing.css`
- Test: `tests/frontend/landing_scroll_story_guard.mjs`
- Test: `tests/frontend/landing_phase_modules_guard.mjs`

- [ ] **Step 1: Replace the snap labels**

In `frontend/formulas/landing/components/ScrollDirector.tsx`, replace:

```ts
const SNAP_LABELS = [0, 0.18, 0.34, 0.5, 0.72, 0.88, 1];
```

with:

```ts
const SNAP_LABELS = [0, 0.16, 0.34, 0.5, 0.66, 0.82, 0.92, 1];
```

- [ ] **Step 2: Replace `setStoryVars` progress calculations**

Inside `setStoryVars`, replace the block from `const centerProgress = ...` through `const ctaOpacity = ...` with:

```ts
const centerProgress = progressBetween(progress, 0.16, 0.46);
const heroExitProgress = progressBetween(progress, 0.16, 0.42);
const heroOpacity = Math.max(1 - heroExitProgress * 1.28, 0);
const shutdownOpacity = Math.max(1 - heroExitProgress * 1.45, 0);
const cosmosOpacity = Math.max(1 - heroExitProgress * 1.18, 0);
const scanOpacity = phaseOpacity(progress, 0.46, 0.56, 0.66);
const decodeChamberOpacity = phaseOpacity(progress, 0.5, 0.58, 0.7);
const workspaceGhostOpacity = phaseOpacity(progress, 0.66, 0.74, 0.86);
const collabSignalOpacity = phaseOpacity(progress, 0.82, 0.87, 0.94);
const gateProgress = progressBetween(progress, 0.92, 0.99);
const gateAuraOpacity = gateProgress * 0.24;
const manuscriptFinalOpacity = 1 - progressBetween(progress, 0.74, 0.99) * 0.38;
const ctaOpacity = gateProgress;
```

- [ ] **Step 3: Write new CSS variables**

After the existing `--decode-opacity` write, replace the old decode/gate-only writes with:

```ts
storyElement.style.setProperty("--decode-chamber-opacity", decodeChamberOpacity.toFixed(4));
storyElement.style.setProperty("--decode-chamber-y", `${(26 * (1 - decodeChamberOpacity)).toFixed(3)}px`);
storyElement.style.setProperty("--workspace-ghost-opacity", workspaceGhostOpacity.toFixed(4));
storyElement.style.setProperty("--workspace-ghost-y", `${(30 * (1 - workspaceGhostOpacity)).toFixed(3)}px`);
storyElement.style.setProperty("--collab-signal-opacity", collabSignalOpacity.toFixed(4));
storyElement.style.setProperty("--collab-signal-y", `${(24 * (1 - collabSignalOpacity)).toFixed(3)}px`);
storyElement.style.setProperty("--gate-opacity", gateProgress.toFixed(4));
storyElement.style.setProperty("--gate-y", `${(34 * (1 - gateProgress)).toFixed(3)}px`);
storyElement.style.setProperty("--gate-scale", (0.985 + gateProgress * 0.015).toFixed(4));
storyElement.style.setProperty("--gate-aura-opacity", gateAuraOpacity.toFixed(4));
storyElement.style.setProperty("--manuscript-final-opacity", manuscriptFinalOpacity.toFixed(4));
storyElement.style.setProperty("--cta-opacity", ctaOpacity.toFixed(4));
storyElement.style.setProperty("--cta-y", `${(18 * (1 - ctaOpacity)).toFixed(3)}px`);
```

- [ ] **Step 4: Replace the phase mapping**

Replace `phaseForProgress` with:

```ts
function phaseForProgress(progress: number): LandingPhase {
  if (progress >= 0.92) {
    return "cta";
  }
  if (progress >= 0.82) {
    return "collab";
  }
  if (progress >= 0.66) {
    return "workspace";
  }
  if (progress >= 0.5) {
    return "decode";
  }
  if (progress >= 0.34) {
    return "center";
  }
  if (progress >= 0.16) {
    return "absorb";
  }
  return "intro";
}
```

- [ ] **Step 5: Add CSS variable defaults**

In `.landing-story`, replace `min-height: 320vh;` with:

```css
min-height: 420vh;
```

Add these defaults after `--decode-opacity: 0;`:

```css
--decode-chamber-opacity: 0;
--decode-chamber-y: 26px;
--workspace-ghost-opacity: 0;
--workspace-ghost-y: 30px;
--collab-signal-opacity: 0;
--collab-signal-y: 24px;
```

Replace:

```css
.landing-fallback,
#landing-root {
  min-height: 320vh;
}
```

with:

```css
.landing-fallback,
#landing-root {
  min-height: 420vh;
}
```

- [ ] **Step 6: Update phase rail states**

Replace the active rail selector block with:

```css
.landing-story[data-story-phase="intro"] .story-rail span:nth-child(1),
.landing-story[data-story-phase="absorb"] .story-rail span:nth-child(1),
.landing-story[data-story-phase="center"] .story-rail span:nth-child(2),
.landing-story[data-story-phase="decode"] .story-rail span:nth-child(3),
.landing-story[data-story-phase="workspace"] .story-rail span:nth-child(4),
.landing-story[data-story-phase="collab"] .story-rail span:nth-child(5),
.landing-story[data-story-phase="cta"] .story-rail span:nth-child(5) {
  background: rgba(255, 255, 255, 0.76);
  box-shadow: 0 0 18px rgba(255, 255, 255, 0.22);
  transform: scaleY(1.18);
}
```

- [ ] **Step 7: Run focused guards**

Run: `node tests/frontend/landing_scroll_story_guard.mjs`

Expected: FAIL only because CSS styles for new overlay classes have not been added yet.

Run: `node tests/frontend/landing_phase_modules_guard.mjs`

Expected: FAIL only because CSS styles for new overlay classes have not been added yet.

- [ ] **Step 8: Commit the timeline retune**

```bash
git add frontend/formulas/landing/components/ScrollDirector.tsx frontend/formulas/landing/styles/landing.css tests/frontend/landing_scroll_story_guard.mjs tests/frontend/landing_phase_modules_guard.mjs
git commit -m "feat: retune landing scroll passage timeline"
```

---

## Task 3: Style The Decode, Workspace, And Collaboration Overlays

**Files:**
- Modify: `frontend/formulas/landing/styles/landing.css`
- Test: `tests/frontend/landing_scroll_story_guard.mjs`
- Test: `tests/frontend/landing_phase_modules_guard.mjs`

- [ ] **Step 1: Add shared overlay base styles**

Add this block after `.manuscript-scan-beam`:

```css
.cinematic-overlay {
  position: absolute;
  z-index: 5;
  pointer-events: none;
  color: rgba(255, 255, 255, 0.9);
  font-family: "D-DIN", "D-DIN Exp", "Arial Narrow", Arial, "PingFang SC", "Microsoft YaHei", sans-serif;
  letter-spacing: 0;
  transition: opacity 0.18s ease, transform 0.18s ease, visibility 0.18s ease;
  visibility: hidden;
}

.cinematic-kicker {
  color: rgba(255, 255, 255, 0.48);
  font-size: 0.64rem;
  font-weight: 900;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}
```

- [ ] **Step 2: Add Decode Chamber styles**

Add this block after the shared overlay styles:

```css
.decode-chamber {
  right: clamp(22px, 6vw, 96px);
  bottom: clamp(82px, 18vh, 190px);
  width: min(38vw, 470px);
  opacity: var(--decode-chamber-opacity);
  transform: translate3d(0, var(--decode-chamber-y), 0);
}

[data-story-phase="decode"] .decode-chamber,
[data-story-phase="workspace"] .decode-chamber {
  visibility: visible;
}

.decode-chamber-core {
  display: grid;
  gap: 1px;
  margin-top: 10px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(0, 0, 0, 0.48);
  box-shadow: 0 22px 80px rgba(0, 0, 0, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.decode-chamber-row {
  display: grid;
  grid-template-columns: 132px minmax(0, 1fr);
  gap: 12px;
  padding: 10px 12px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.052), rgba(255, 255, 255, 0.014));
}

.decode-chamber-row span {
  color: rgba(255, 255, 255, 0.48);
  font-size: 0.62rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.decode-chamber-row code {
  overflow: hidden;
  color: rgba(255, 255, 255, 0.88);
  font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
  font-size: 0.74rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.decode-chamber-note {
  margin: 10px 0 0;
  color: rgba(92, 255, 176, 0.68);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
```

- [ ] **Step 3: Add Paper Workspace Ghost styles**

Add this block after Decode Chamber styles:

```css
.paper-workspace-ghost {
  left: 50%;
  bottom: clamp(42px, 8vh, 82px);
  display: grid;
  grid-template-columns: 1.1fr 0.84fr 0.92fr;
  gap: 12px;
  width: min(88vw, 980px);
  min-height: 230px;
  opacity: var(--workspace-ghost-opacity);
  transform: translate3d(-50%, var(--workspace-ghost-y), 0);
}

[data-story-phase="workspace"] .paper-workspace-ghost,
[data-story-phase="collab"] .paper-workspace-ghost,
[data-story-phase="cta"] .paper-workspace-ghost {
  visibility: visible;
}

.paper-workspace-ghost > div {
  min-width: 0;
  border: 1px solid rgba(255, 255, 255, 0.13);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.058), rgba(255, 255, 255, 0.016)),
    rgba(0, 0, 0, 0.44);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.paper-workspace-ghost-editor,
.paper-workspace-ghost-inbox,
.paper-workspace-ghost-preview {
  padding: 14px;
}

.paper-workspace-ghost-editor pre {
  margin: 14px 0 0;
  color: rgba(255, 255, 255, 0.78);
  font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
  font-size: 0.78rem;
  line-height: 1.45;
  white-space: pre-wrap;
}

.paper-workspace-ghost-inbox {
  display: grid;
  align-content: start;
  gap: 9px;
}

.paper-workspace-ghost-item {
  display: block;
  padding: 8px 9px;
  color: rgba(255, 255, 255, 0.76);
  font-size: 0.72rem;
  font-weight: 800;
  border: 1px solid rgba(255, 255, 255, 0.09);
  background: rgba(255, 255, 255, 0.035);
}

.paper-workspace-ghost-preview {
  display: grid;
  gap: 12px;
  align-content: center;
}

.paper-workspace-ghost-preview span {
  display: block;
  height: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.08), transparent);
}
```

- [ ] **Step 4: Add Collaboration Signal styles**

Add this block after Paper Workspace Ghost styles:

```css
.collaboration-signal-field {
  inset: clamp(110px, 17vh, 180px) clamp(28px, 7vw, 110px) auto auto;
  display: grid;
  gap: 10px;
  width: min(34vw, 390px);
  opacity: var(--collab-signal-opacity);
  transform: translate3d(0, var(--collab-signal-y), 0);
}

[data-story-phase="collab"] .collaboration-signal-field,
[data-story-phase="cta"] .collaboration-signal-field {
  visibility: visible;
}

.collaboration-signal {
  display: grid;
  gap: 4px;
  padding: 11px 12px;
  border: 1px solid rgba(255, 255, 255, 0.13);
  background: rgba(0, 0, 0, 0.46);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.collaboration-signal span {
  color: rgba(92, 255, 176, 0.66);
  font-size: 0.62rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.collaboration-signal strong {
  color: rgba(255, 255, 255, 0.84);
  font-size: 0.78rem;
  font-weight: 850;
}
```

- [ ] **Step 5: Extend responsive and reduced-motion styles**

Inside `@media (max-width: 720px)`, replace the old `.decode-field` block with:

```css
.decode-chamber,
.collaboration-signal-field {
  right: 18px;
  bottom: 88px;
  width: calc(100vw - 36px);
}

.paper-workspace-ghost {
  grid-template-columns: 1fr;
  width: min(92vw, 560px);
}
```

Inside `@media (prefers-reduced-motion: reduce)`, replace the old `.decode-field` block with:

```css
.decode-chamber,
.paper-workspace-ghost,
.collaboration-signal-field {
  display: none;
}
```

Add to the reduced-motion `.workbench-gate` rule:

```css
visibility: visible;
```

- [ ] **Step 6: Run focused guards**

Run: `node tests/frontend/landing_scroll_story_guard.mjs`

Expected: PASS.

Run: `node tests/frontend/landing_phase_modules_guard.mjs`

Expected: PASS.

- [ ] **Step 7: Commit the overlay styling**

```bash
git add frontend/formulas/landing/styles/landing.css tests/frontend/landing_scroll_story_guard.mjs tests/frontend/landing_phase_modules_guard.mjs
git commit -m "style: add cinematic landing overlays"
```

---

## Task 4: Tune Manuscript And Formula Storm Motion

**Files:**
- Modify: `frontend/formulas/landing/components/ManuscriptCanvas.tsx`
- Modify: `frontend/formulas/landing/components/SplitTextTitleSequence.tsx`
- Modify: `frontend/formulas/landing/styles/landing.css`
- Test: `tests/frontend/landing_scroll_story_guard.mjs`
- Test: `tests/frontend/landing_phase_modules_guard.mjs`

- [ ] **Step 1: Keep the Three.js performance caps explicit**

Do not change these constants in `ManuscriptCanvas.tsx`:

```ts
const MAX_DPR: [number, number] = [1, 1.5];
const STARFIELD_PARTICLE_COUNT = 720;
```

The existing guard checks these exact values. If the design needs more visual density, use opacity, size, and motion staging rather than increasing the particle count.

- [ ] **Step 2: Retune starfield progress windows**

In `FormulaStarfield`, replace:

```ts
const absorbProgress = easedRange(progress, 0.18, 0.55);
const orbitProgress = easedRange(progress, 0.55, 0.88);
```

with:

```ts
const absorbProgress = easedRange(progress, 0.16, 0.5);
const orbitProgress = easedRange(progress, 0.5, 0.92);
const releaseProgress = easedRange(progress, 0.82, 0.99);
```

Replace the material opacity line with:

```ts
materialRef.current.opacity = THREE.MathUtils.lerp(0.34, 0.72, absorbProgress) * (1 - orbitProgress * 0.2) * (1 - releaseProgress * 0.72);
```

- [ ] **Step 3: Retune manuscript progress windows**

In `PaperMesh`, replace:

```ts
const centerProgress = easedRange(progress, 0.18, 0.48);
const scanProgress = easedRange(progress, 0.5, 0.68);
const decodeProgress = easedRange(progress, 0.66, 0.88);
```

with:

```ts
const centerProgress = easedRange(progress, 0.16, 0.46);
const scanProgress = easedRange(progress, 0.46, 0.66);
const decodeProgress = easedRange(progress, 0.5, 0.82);
const workspaceProgress = easedRange(progress, 0.66, 0.92);
```

Replace the `z` and `scale` calculations with:

```ts
const z = THREE.MathUtils.lerp(-2, -0.54, centerProgress) - decodeProgress * 0.12 - workspaceProgress * 0.1;
const scale = 1 + centerProgress * 0.36 + scanProgress * 0.05 - workspaceProgress * 0.14;
```

Replace the final rotation assignments with:

```ts
meshRef.current.rotation.y = Math.sin(time * 0.2) * 0.15 * floatAmount - centerProgress * 0.18 + decodeProgress * 0.08 - workspaceProgress * 0.04;
meshRef.current.rotation.x = Math.cos(time * 0.3) * 0.1 * floatAmount - 0.1 + centerProgress * 0.14 + scanProgress * 0.04;
meshRef.current.rotation.z = -centerProgress * 0.035 + decodeProgress * 0.035 - workspaceProgress * 0.018;
```

- [ ] **Step 4: Add scroll-exit hooks for SplitText output**

In `SplitTextTitleSequence.tsx`, keep the optional runtime path. Add this line inside `createSplitInstance` config:

```ts
type: "lines,words,chars",
```

Confirm it is already present. Then add CSS selectors in `landing.css` after `.landing-copy` rules:

```css
.split-title-char,
.split-title-word,
.split-title-line {
  display: inline-block;
  transform: translate3d(calc(var(--text-disperse) * 0.16), 0, 0);
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.landing-story[data-story-phase="absorb"] .split-title-char,
.landing-story[data-story-phase="center"] .split-title-char,
.landing-story[data-story-phase="decode"] .split-title-char,
.landing-story[data-story-phase="workspace"] .split-title-char,
.landing-story[data-story-phase="collab"] .split-title-char,
.landing-story[data-story-phase="cta"] .split-title-char {
  opacity: var(--shutdown-opacity);
}
```

- [ ] **Step 5: Update guards for retuned windows**

In `tests/frontend/landing_scroll_story_guard.mjs`, replace the old paper-center threshold assertions with:

```js
assert.match(canvasSource, /easedRange\(progress, 0\.16, 0\.46\)/, "The paper should move to center during the manuscript gravity phase.");
assert.match(canvasSource, /easedRange\(progress, 0\.46, 0\.66\)/, "The paper scan should align with the decode chamber entrance.");
assert.match(canvasSource, /easedRange\(progress, 0\.66, 0\.92\)/, "The paper should recede as the workspace ghost appears.");
```

Keep the existing particle count and DPR assertions unchanged.

- [ ] **Step 6: Run focused guards**

Run: `node tests/frontend/landing_scroll_story_guard.mjs`

Expected: PASS.

Run: `node tests/frontend/landing_phase_modules_guard.mjs`

Expected: PASS.

- [ ] **Step 7: Commit motion tuning**

```bash
git add frontend/formulas/landing/components/ManuscriptCanvas.tsx frontend/formulas/landing/components/SplitTextTitleSequence.tsx frontend/formulas/landing/styles/landing.css tests/frontend/landing_scroll_story_guard.mjs
git commit -m "feat: tune cinematic manuscript landing motion"
```

---

## Task 5: Regenerate Landing Assets And Run Frontend Checks

**Files:**
- Modify: generated landing asset files produced by the build
- Verify: frontend and Django checks

- [ ] **Step 1: Run focused TypeScript check**

Run: `npm run check:landing`

Expected: PASS with TypeScript reporting no errors.

- [ ] **Step 2: Build the landing bundle**

Run: `npm run build:landing`

Expected: PASS. Vite updates the generated landing JavaScript and CSS assets.

- [ ] **Step 3: Run all frontend checks**

Run: `npm run check:frontend`

Expected: PASS. This includes editor checks, landing checks, static builds, and frontend guard scripts.

- [ ] **Step 4: Run Django project check**

Run: `./.conda/bin/python manage.py check`

Expected: PASS with `System check identified no issues`.

- [ ] **Step 5: Run repository governance check**

Run: `./.conda/bin/python scripts/check_repository_governance.py`

Expected: PASS.

- [ ] **Step 6: Run whitespace check**

Run: `git diff --check`

Expected: no output.

- [ ] **Step 7: Commit generated assets and any build-driven changes**

```bash
git add apps/formulas/static/formulas/js/generated/landing.js apps/formulas/static/formulas/js/generated/landing-landing-three.js apps/formulas/static/formulas/css/generated/landing.css package-lock.json package.json
git commit -m "build: regenerate cinematic landing assets"
```

If `package.json` and `package-lock.json` are unchanged, omit them from the `git add` command.

---

## Task 6: Browser Smoke Test And Final Review

**Files:**
- Verify in browser: `http://127.0.0.1:8000/?cinematic_check=20260525`
- Verify git state and final diffs

- [ ] **Step 1: Start or reuse a landing-only local server**

If Django is already running at `127.0.0.1:8000`, reuse it.

If it is not running and only landing UI is being checked, run:

```bash
./.conda/bin/python manage.py migrate
./.conda/bin/python manage.py runserver 127.0.0.1:8000
```

Expected: Django serves `http://127.0.0.1:8000/`. Redis and Celery are not required for landing-only verification.

- [ ] **Step 2: Check initial state in the browser**

Open:

```text
http://127.0.0.1:8000/?cinematic_check=20260525
```

Expected:

- Formula field is visible.
- Hero copy is readable.
- Manuscript is present as the visual anchor.
- Decode, workspace, collaboration, and final gate overlays are not dominant on first paint.
- No raw TeX such as `\alpha` or `\nabla` is visible in the formula constellation.

- [ ] **Step 3: Check middle scroll states**

Scroll to the middle third of the page.

Expected:

- Hero text and background formulas visibly exit instead of only blurring.
- Manuscript centers before product overlays dominate.
- Decode Chamber appears around the scan stage.
- Paper Workspace Ghost appears after Decode Chamber.
- Collaboration Signals appear after the workspace ghost.

- [ ] **Step 4: Check final gate state**

Scroll to the bottom.

Expected:

- `Enter Workbench` is visible.
- The final CTA points to `/workbench/`.
- CTA is clickable only in the final phase.
- Old Product Preview card stack is absent.
- The final scene still reads as a Formula Lab paper workspace entry rather than a standalone decorative button.

- [ ] **Step 5: Run final commands**

Run:

```bash
npm run check:frontend
./.conda/bin/python manage.py check
./.conda/bin/python scripts/check_repository_governance.py
git diff --check
git status --short --branch
```

Expected:

- All checks pass.
- Git status shows only intentional committed changes or a clean worktree.

- [ ] **Step 6: Request code review**

Use `superpowers:requesting-code-review` for the completed landing feature. Ask the reviewer to focus on:

- Scroll phase contract and CTA visibility.
- Old Product Preview regressions.
- Runtime performance risk from WebGL and scroll-driven DOM.
- Reduced-motion behavior.
- Whether `LandingScrollStory` remains a composition layer.

- [ ] **Step 7: Address review feedback**

If the reviewer returns findings, use `superpowers:receiving-code-review`, fix each valid issue, rerun the focused checks from the affected task, then rerun the final command set from Step 5.

- [ ] **Step 8: Final commit if review fixes changed files**

```bash
git add frontend/formulas/landing tests/frontend apps/formulas/static/formulas/js/generated apps/formulas/static/formulas/css/generated apps/formulas/static/formulas/css/pages
git commit -m "fix: harden cinematic landing passage"
```

If review produces no code changes, skip this commit.

---

## Self-Review

### Spec Coverage

- Formula Storm: covered by Task 4 SplitText hooks and starfield retuning.
- Manuscript Gravity: covered by Task 2 timeline and Task 4 manuscript retuning.
- Decode Chamber: covered by Task 1 component and Task 3 styles.
- Paper Workspace Ghost: covered by Task 1 component and Task 3 styles.
- Collaboration Signals: covered by Task 1 component and Task 3 styles.
- Workbench Gate: preserved by Task 2 gate threshold and Task 6 browser final-state check.
- No old Product Preview card stack: guarded in Task 1 and Task 2.
- Reduced motion: covered in Task 3.
- Performance caps: covered in Task 4 and existing guards.
- Verification: covered in Tasks 5 and 6.

### Placeholder Scan

This plan contains no placeholder markers, no incomplete sections, no unnamed files, and no open-ended implementation steps.

### Type Consistency

The plan uses one phase union throughout: `intro | absorb | center | decode | workspace | collab | cta`.

The overlay class namespaces are stable throughout:

- `decode-chamber`
- `paper-workspace-ghost`
- `collaboration-signal`
- `workbench-gate`

The CSS vars are stable throughout:

- `--decode-chamber-opacity`
- `--decode-chamber-y`
- `--workspace-ghost-opacity`
- `--workspace-ghost-y`
- `--collab-signal-opacity`
- `--collab-signal-y`
- `--gate-opacity`
- `--cta-opacity`
