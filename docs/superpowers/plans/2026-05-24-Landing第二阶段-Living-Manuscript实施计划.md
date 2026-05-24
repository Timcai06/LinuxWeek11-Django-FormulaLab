# Landing 第二阶段 Living Manuscript Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the current Formula Lab landing page into a modular Living Manuscript scroll story where the manuscript absorbs formula constellations, gets scanned on its own surface, and reveals a real product workspace entry.

**Architecture:** Keep the current Django route and React/Vite landing island. Split the landing island into focused React/Three/CSS modules: a scroll director for phase variables, a SplitText title sequence, a formula constellation field, a manuscript shader scan layer, and a product workspace reveal overlay. Preserve the existing DOM navigation and CTA surface while WebGL handles manuscript, particles, and scan motion.

**Tech Stack:** Django template mount, Vite, React, TypeScript, GSAP ScrollTrigger, GSAP SplitText fallback strategy, Three.js, React Three Fiber, KaTeX, CSS custom properties, Node guard tests, Django system checks.

---

## File Structure

- Create `frontend/formulas/landing/components/ScrollDirector.tsx`
  - Owns `ScrollTrigger`, reduced-motion setup, phase labels, CSS variables, and the `scrollProgressRef` bridge.
- Create `frontend/formulas/landing/components/SplitTextTitleSequence.tsx`
  - Owns the title entrance/disappearance behavior and prevents inline transforms from fighting scroll-driven containers.
- Create `frontend/formulas/landing/components/FormulaConstellationField.tsx`
  - Owns DOM/KaTeX formula background rendering and the semantic handoff into the Three.js particle field.
- Create `frontend/formulas/landing/components/WorkspaceRevealOverlay.tsx`
  - Owns the final product workspace skeleton and CTA staging.
- Create `frontend/formulas/landing/three/ManuscriptShaderMaterial.ts`
  - Owns shader uniforms and shader source for paper-surface scan effects.
- Create `frontend/formulas/landing/three/motion.ts`
  - Owns reusable `easedRange`, `progressBetween`, and `phaseOpacity`.
- Create `frontend/formulas/landing/types.ts`
  - Owns shared type definitions such as `LandingPhase`, `ScrollProgressRef`, and `StoryCssVars`.
- Modify `frontend/formulas/landing/components/LandingScrollStory.tsx`
  - Reduce it to composition: `ScrollDirector`, `ManuscriptCanvas`, `Hero`, `FormulaConstellationField`, `WorkspaceRevealOverlay`.
- Modify `frontend/formulas/landing/components/ManuscriptCanvas.tsx`
  - Use shared motion helpers and attach the manuscript shader scan material.
- Modify `frontend/formulas/landing/components/Hero.tsx`
  - Integrate `SplitTextTitleSequence` without writing inline transforms onto `.landing-copy`.
- Modify `frontend/formulas/landing/styles/landing.css`
  - Add phase-scoped styles, shader scan DOM companions, formula constellation layers, workspace reveal states, and final CTA states.
- Modify `tests/frontend/landing_scroll_story_guard.mjs`
  - Assert module boundaries, phase labels, no fixed right-side formula column, no blur-driven disappearance, no React state for per-frame scroll.
- Create `tests/frontend/landing_phase_modules_guard.mjs`
  - Assert new module files and integration points.
- Modify `package.json`
  - Add `node tests/frontend/landing_phase_modules_guard.mjs` to `check:frontend`.

---

## Task 1: Add Phase Module Guardrails

**Files:**
- Modify: `tests/frontend/landing_scroll_story_guard.mjs`
- Create: `tests/frontend/landing_phase_modules_guard.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write the failing module-boundary test**

Create `tests/frontend/landing_phase_modules_guard.mjs` with this complete content:

```javascript
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
assert.match(directorSource, /intro|absorb|center|scan|reveal|cta/, "ScrollDirector should expose named story phases.");
assert.match(directorSource, /--cta-opacity/, "ScrollDirector should drive the final CTA phase.");
assert.doesNotMatch(directorSource, /useState/, "ScrollDirector should not use React state for per-frame scroll progress.");

assert.match(splitTextSource, /SplitTextTitleSequence/, "SplitTextTitleSequence component should exist.");
assert.match(splitTextSource, /data-split-title/, "SplitTextTitleSequence should target explicit title text.");
assert.doesNotMatch(splitTextSource, /fromTo\("\.landing-copy"/, "SplitText should not animate the scroll-controlled copy container.");

assert.match(constellationSource, /FormulaConstellationField/, "FormulaConstellationField component should exist.");
assert.match(constellationSource, /katex|renderToString/, "Formula constellation should render formulas, not raw TeX strings.");

assert.match(workspaceSource, /WorkspaceRevealOverlay/, "WorkspaceRevealOverlay component should exist.");
assert.match(workspaceSource, /workspace-pane-outline/, "Workspace reveal should preserve the paper outline pane.");
assert.match(workspaceSource, /workspace-cta/, "Workspace reveal should expose final product CTAs.");

assert.match(manuscriptSource, /createManuscriptShaderMaterial|manuscriptShaderUniforms/, "ManuscriptCanvas should use the manuscript shader scan material.");
assert.match(shaderSource, /uScanProgress/, "Manuscript shader should expose scan progress uniform.");
assert.match(shaderSource, /uTime/, "Manuscript shader should expose time uniform.");
assert.match(shaderSource, /ShaderMaterial/, "Manuscript scan should be implemented as a Three.js shader material.");

assert.match(motionSource, /export function easedRange/, "Motion helpers should be reusable.");
assert.match(motionSource, /export function phaseOpacity/, "Phase opacity helper should be reusable.");
assert.match(typeSource, /export type LandingPhase/, "Landing phases should have a shared type.");
assert.match(styleSource, /\.workspace-cta/, "Final CTA styles should exist.");
assert.doesNotMatch(styleSource, /filter:\s*blur/, "Landing disappearance should not be blur-driven.");
```

- [ ] **Step 2: Update the existing scroll story guard**

Append these assertions near the existing module assertions in `tests/frontend/landing_scroll_story_guard.mjs`:

```javascript
assert.match(storySource, /ScrollDirector/, "Landing should use a scroll director module.");
assert.match(storySource, /FormulaConstellationField/, "Landing should keep formulas in a dedicated constellation module.");
assert.match(storySource, /WorkspaceRevealOverlay/, "Landing should keep workspace reveal markup in a dedicated module.");
assert.match(styleSource, /--cta-opacity/, "Landing should expose a final CTA phase variable.");
assert.doesNotMatch(
  storySource,
  /ScrollTrigger\.create/,
  "LandingScrollStory should compose modules instead of owning ScrollTrigger directly.",
);
```

- [ ] **Step 3: Register the new guard in `package.json`**

In the `check:frontend` script, insert this command after `node tests/frontend/landing_scroll_story_guard.mjs`:

```text
node tests/frontend/landing_phase_modules_guard.mjs
```

The relevant segment should include this exact ordered pair:

```json
"node tests/frontend/landing_scroll_story_guard.mjs && node tests/frontend/landing_phase_modules_guard.mjs"
```

- [ ] **Step 4: Run the new guard and verify it fails**

Run:

```bash
node tests/frontend/landing_phase_modules_guard.mjs
```

Expected: FAIL with missing module assertions for `ScrollDirector.tsx`, `SplitTextTitleSequence.tsx`, `FormulaConstellationField.tsx`, `WorkspaceRevealOverlay.tsx`, `ManuscriptShaderMaterial.ts`, `motion.ts`, and `types.ts`.

- [ ] **Step 5: Commit the red tests**

Run:

```bash
git add tests/frontend/landing_scroll_story_guard.mjs tests/frontend/landing_phase_modules_guard.mjs package.json
git commit -m "test: guard living manuscript landing modules"
```

---

## Task 2: Extract ScrollDirector And Shared Motion Types

**Files:**
- Create: `frontend/formulas/landing/types.ts`
- Create: `frontend/formulas/landing/three/motion.ts`
- Create: `frontend/formulas/landing/components/ScrollDirector.tsx`
- Modify: `frontend/formulas/landing/components/LandingScrollStory.tsx`
- Modify: `frontend/formulas/landing/components/ManuscriptCanvas.tsx`
- Test: `tests/frontend/landing_phase_modules_guard.mjs`

- [ ] **Step 1: Create shared types**

Create `frontend/formulas/landing/types.ts`:

```typescript
import type { MutableRefObject, ReactNode } from "react";

export type LandingPhase = "intro" | "absorb" | "center" | "scan" | "reveal" | "cta";

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
  workspaceOpacity: number;
  ctaOpacity: number;
  phase: LandingPhase;
};
```

- [ ] **Step 2: Create shared motion helpers**

Create `frontend/formulas/landing/three/motion.ts`:

```typescript
export function easedRange(progress: number, start: number, end: number): number {
  const value = Math.min(Math.max((progress - start) / (end - start), 0), 1);
  return value * value * (3 - 2 * value);
}

export function progressBetween(progress: number, start: number, end: number): number {
  return Math.min(Math.max((progress - start) / (end - start), 0), 1);
}

export function phaseOpacity(progress: number, start: number, peak: number, end: number): number {
  if (progress <= start || progress >= end) {
    return 0;
  }
  if (progress <= peak) {
    return (progress - start) / (peak - start);
  }
  return 1 - (progress - peak) / (end - peak);
}
```

- [ ] **Step 3: Create `ScrollDirector`**

Create `frontend/formulas/landing/components/ScrollDirector.tsx`:

```typescript
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import type { LandingPhase, ScrollDirectorProps } from "../types";
import { phaseOpacity, progressBetween } from "../three/motion";

function setStoryVars(storyElement: HTMLElement, phase: LandingPhase, progress: number) {
  const centerProgress = progressBetween(progress, 0.18, 0.48);
  const heroOpacity = Math.max(1 - centerProgress * 1.25, 0);
  const shutdownOpacity = Math.max(1 - centerProgress * 1.4, 0);
  const cosmosOpacity = Math.max(1 - centerProgress * 1.18, 0);
  const scanOpacity = phaseOpacity(progress, 0.5, 0.62, 0.74);
  const decodeOpacity = phaseOpacity(progress, 0.66, 0.78, 0.94);
  const workspaceProgress = progressBetween(progress, 0.72, 0.92);
  const ctaOpacity = progressBetween(progress, 0.88, 0.98);

  storyElement.style.setProperty("--story-progress", progress.toFixed(4));
  storyElement.style.setProperty("--hero-opacity", heroOpacity.toFixed(4));
  storyElement.style.setProperty("--hero-y", `${(-42 * centerProgress).toFixed(3)}px`);
  storyElement.style.setProperty("--text-disperse", `${(54 * centerProgress).toFixed(3)}px`);
  storyElement.style.setProperty("--copy-x", `${(-17.28 * centerProgress).toFixed(3)}px`);
  storyElement.style.setProperty("--kicker-x", `${(-11.88 * centerProgress).toFixed(3)}px`);
  storyElement.style.setProperty("--actions-x", `${(-27 * centerProgress).toFixed(3)}px`);
  storyElement.style.setProperty("--text-scale", (1 + centerProgress * 0.026).toFixed(4));
  storyElement.style.setProperty("--shutdown-opacity", shutdownOpacity.toFixed(4));
  storyElement.style.setProperty("--readout-x", `${(42 * centerProgress).toFixed(3)}px`);
  storyElement.style.setProperty("--cosmos-opacity", cosmosOpacity.toFixed(4));
  storyElement.style.setProperty("--stardust-opacity", (cosmosOpacity * 0.32).toFixed(4));
  storyElement.style.setProperty("--scanline-opacity", (0.2 + cosmosOpacity * 0.16).toFixed(4));
  storyElement.style.setProperty("--rail-opacity", progressBetween(progress, 0.62, 0.72).toFixed(4));
  storyElement.style.setProperty("--scan-opacity", scanOpacity.toFixed(4));
  storyElement.style.setProperty("--decode-opacity", decodeOpacity.toFixed(4));
  storyElement.style.setProperty("--workspace-opacity", workspaceProgress.toFixed(4));
  storyElement.style.setProperty("--workspace-scale", (0.96 + workspaceProgress * 0.04).toFixed(4));
  storyElement.style.setProperty("--workspace-y", `${(28 * (1 - workspaceProgress)).toFixed(3)}px`);
  storyElement.style.setProperty("--cta-opacity", ctaOpacity.toFixed(4));
  storyElement.style.setProperty("--cta-y", `${(22 * (1 - ctaOpacity)).toFixed(3)}px`);
  storyElement.style.setProperty("--scan-x", `${(-22 * progress).toFixed(3)}vw`);
  storyElement.style.setProperty("--scan-y", `${(16 * progress).toFixed(3)}vh`);
  storyElement.dataset.storyPhase = phase;
}

function phaseForProgress(progress: number): LandingPhase {
  if (progress > 0.88) {
    return "cta";
  }
  if (progress > 0.72) {
    return "reveal";
  }
  if (progress > 0.5) {
    return "scan";
  }
  if (progress > 0.34) {
    return "center";
  }
  if (progress > 0.18) {
    return "absorb";
  }
  return "intro";
}

export function ScrollDirector({ scrollProgressRef, children }: ScrollDirectorProps) {
  const storyRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const storyElement = storyRef.current;
    if (!storyElement) {
      return undefined;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      scrollProgressRef.current = 0;
      setStoryVars(storyElement, "intro", 0);
      return undefined;
    }

    gsap.registerPlugin(ScrollTrigger);

    const context = gsap.context(() => {
      const trigger = ScrollTrigger.create({
        trigger: storyElement,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        snap: {
          snapTo: [0, 0.18, 0.34, 0.5, 0.72, 0.88, 1],
          duration: { min: 0.08, max: 0.18 },
          delay: 0.06,
          ease: "power1.out",
        },
        onUpdate(self) {
          const progress = self.progress;
          scrollProgressRef.current = progress;
          setStoryVars(storyElement, phaseForProgress(progress), progress);
        },
      });

      return () => {
        trigger.kill();
      };
    }, storyElement);

    return () => {
      context.revert();
      scrollProgressRef.current = 0;
    };
  }, [scrollProgressRef]);

  return (
    <section className="landing-story" ref={storyRef} data-story-phase="intro">
      {children}
    </section>
  );
}
```

- [ ] **Step 4: Simplify `LandingScrollStory`**

Replace `frontend/formulas/landing/components/LandingScrollStory.tsx` with:

```typescript
import { useRef } from "react";

import { FormulaConstellationField } from "./FormulaConstellationField";
import { Hero } from "./Hero";
import { ManuscriptCanvas } from "./ManuscriptCanvas";
import { ScrollDirector } from "./ScrollDirector";
import { WorkspaceRevealOverlay } from "./WorkspaceRevealOverlay";

export function LandingScrollStory() {
  const scrollProgressRef = useRef(0);

  return (
    <ScrollDirector scrollProgressRef={scrollProgressRef}>
      <div className="landing-story-stage">
        <FormulaConstellationField />
        <ManuscriptCanvas scrollProgressRef={scrollProgressRef} />
        <Hero />
        <div className="manuscript-scan-beam" aria-hidden="true" />
        <WorkspaceRevealOverlay />
        <div className="story-rail" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
    </ScrollDirector>
  );
}
```

This replacement depends on modules created in later tasks, so TypeScript is expected to fail until Tasks 3 and 5 create those modules.

- [ ] **Step 5: Use shared motion helpers in `ManuscriptCanvas`**

Remove the local `easedRange` function from `frontend/formulas/landing/components/ManuscriptCanvas.tsx` and add:

```typescript
import { easedRange } from "../three/motion";
```

- [ ] **Step 6: Run focused checks**

Run:

```bash
npm run check:landing
```

Expected after Step 4 before later modules exist: FAIL with missing `FormulaConstellationField` and `WorkspaceRevealOverlay`. If it fails for `motion.ts` or `types.ts`, fix those files before continuing.

- [ ] **Step 7: Commit the scroll extraction once later tasks make TypeScript pass**

After Tasks 3 and 5 create the missing modules, run:

```bash
node tests/frontend/landing_phase_modules_guard.mjs
npm run check:landing
git add frontend/formulas/landing/types.ts frontend/formulas/landing/three/motion.ts frontend/formulas/landing/components/ScrollDirector.tsx frontend/formulas/landing/components/LandingScrollStory.tsx frontend/formulas/landing/components/ManuscriptCanvas.tsx
git commit -m "refactor: extract landing scroll director"
```

---

## Task 3: Add SplitTextTitleSequence And FormulaConstellationField

**Files:**
- Create: `frontend/formulas/landing/components/SplitTextTitleSequence.tsx`
- Create: `frontend/formulas/landing/components/FormulaConstellationField.tsx`
- Modify: `frontend/formulas/landing/components/Hero.tsx`
- Modify: `frontend/formulas/landing/styles/landing.css`
- Test: `tests/frontend/landing_phase_modules_guard.mjs`

- [ ] **Step 1: Create SplitText title sequence**

Create `frontend/formulas/landing/components/SplitTextTitleSequence.tsx`:

```typescript
import { useEffect } from "react";
import gsap from "gsap";

type SplitTextGlobal = {
  create?: (target: Element | Element[], vars?: { type?: string; mask?: string }) => { lines?: Element[]; words?: Element[]; chars?: Element[]; revert: () => void };
  new?: (target: Element | Element[], vars?: { type?: string; mask?: string }) => { lines?: Element[]; words?: Element[]; chars?: Element[]; revert: () => void };
};

declare global {
  interface Window {
    SplitText?: SplitTextGlobal;
  }
}

function createSplit(targets: Element[]) {
  if (window.SplitText?.create) {
    return window.SplitText.create(targets, { type: "lines,words", mask: "lines" });
  }
  return undefined;
}

export function SplitTextTitleSequence() {
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const targets = Array.from(document.querySelectorAll("[data-split-title]"));
    if (reduceMotion || targets.length === 0) {
      return undefined;
    }

    const split = createSplit(targets);
    const animatedTargets = split?.words && split.words.length > 0 ? split.words : targets;
    const context = gsap.context(() => {
      gsap.fromTo(
        animatedTargets,
        { autoAlpha: 0, y: 18 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.72,
          ease: "power3.out",
          stagger: 0.035,
          clearProps: "opacity,visibility,transform",
        },
      );
    });

    return () => {
      context.revert();
      split?.revert();
    };
  }, []);

  return null;
}
```

- [ ] **Step 2: Integrate SplitText into `Hero`**

In `frontend/formulas/landing/components/Hero.tsx`, add:

```typescript
import { SplitTextTitleSequence } from "./SplitTextTitleSequence";
```

Inside the returned hero markup, render:

```tsx
<SplitTextTitleSequence />
```

Add `data-split-title` to the title and one short supporting text element. The `h1` should look like:

```tsx
<h1 className="glitch-title" data-split-title>FORMULA LAB</h1>
```

Keep the existing GSAP intro in `Hero`, but confirm it does not target `.landing-copy`.

- [ ] **Step 3: Create formula constellation module**

Create `frontend/formulas/landing/components/FormulaConstellationField.tsx`:

```typescript
const FORMULA_CONSTELLATION = [
  { tex: String.raw`\nabla_\mu F^{\mu\nu}=J^\nu`, x: "8%", y: "16%", size: "1.05rem", depth: "far" },
  { tex: String.raw`\int_\Omega \psi^\* H\psi\,d\Omega`, x: "72%", y: "18%", size: "0.82rem", depth: "far" },
  { tex: String.raw`\mathcal{L}=\mathbb{E}_{q(z|x)}[\log p(x|z)]`, x: "17%", y: "68%", size: "0.76rem", depth: "mid" },
  { tex: String.raw`\frac{\partial \mathcal{F}}{\partial t}+\nabla\cdot\mathbf{J}=0`, x: "63%", y: "58%", size: "0.98rem", depth: "mid" },
  { tex: String.raw`\operatorname*{argmin}_\theta \sum_i \lVert y_i-f_\theta(x_i)\rVert^2`, x: "42%", y: "31%", size: "0.7rem", depth: "near" },
];

type KatexRuntime = {
  renderToString: (
    source: string,
    options: {
      displayMode: boolean;
      output: "html";
      strict: "ignore";
      throwOnError: boolean;
    },
  ) => string;
};

declare global {
  interface Window {
    katex?: KatexRuntime;
  }
}

function renderFormula(source: string) {
  return window.katex?.renderToString(source, {
    displayMode: false,
    output: "html",
    strict: "ignore",
    throwOnError: false,
  }) ?? source;
}

export function FormulaConstellationField() {
  return (
    <div className="math-cosmos formula-constellation" aria-hidden="true">
      {FORMULA_CONSTELLATION.map((formula) => (
        <span
          className={`cosmos-item constellation-item constellation-item-${formula.depth}`}
          key={formula.tex}
          style={{ left: formula.x, top: formula.y, fontSize: formula.size }}
          dangerouslySetInnerHTML={{ __html: renderFormula(formula.tex) }}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Add constellation CSS**

Append to `frontend/formulas/landing/styles/landing.css`:

```css
.formula-constellation {
  opacity: var(--cosmos-opacity);
}

.constellation-item {
  transform: translate3d(0, calc(var(--text-disperse) * -0.12), 0);
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.constellation-item-far {
  opacity: calc(var(--cosmos-opacity) * 0.36);
}

.constellation-item-mid {
  opacity: calc(var(--cosmos-opacity) * 0.52);
}

.constellation-item-near {
  opacity: calc(var(--cosmos-opacity) * 0.7);
}
```

- [ ] **Step 5: Run focused checks**

Run:

```bash
node tests/frontend/landing_phase_modules_guard.mjs
npm run check:landing
```

Expected after Task 3: The guard still fails on `WorkspaceRevealOverlay` and `ManuscriptShaderMaterial`, but passes `SplitTextTitleSequence` and `FormulaConstellationField` assertions. `npm run check:landing` still fails until Task 5 creates `WorkspaceRevealOverlay`.

- [ ] **Step 6: Commit after Task 5 makes all imports resolvable**

After Task 5, run:

```bash
git add frontend/formulas/landing/components/SplitTextTitleSequence.tsx frontend/formulas/landing/components/FormulaConstellationField.tsx frontend/formulas/landing/components/Hero.tsx frontend/formulas/landing/styles/landing.css
git commit -m "feat: add landing split text and formula constellation"
```

---

## Task 4: Add Manuscript Shader Scan

**Files:**
- Create: `frontend/formulas/landing/three/ManuscriptShaderMaterial.ts`
- Modify: `frontend/formulas/landing/components/ManuscriptCanvas.tsx`
- Modify: `frontend/formulas/landing/styles/landing.css`
- Test: `tests/frontend/landing_phase_modules_guard.mjs`

- [ ] **Step 1: Create the shader material module**

Create `frontend/formulas/landing/three/ManuscriptShaderMaterial.ts`:

```typescript
import * as THREE from "three";

export type ManuscriptShaderUniforms = {
  uTexture: { value: THREE.Texture | null };
  uTime: { value: number };
  uScanProgress: { value: number };
  uDecodeProgress: { value: number };
  uOpacity: { value: number };
};

export function manuscriptShaderUniforms(texture: THREE.Texture | null): ManuscriptShaderUniforms {
  return {
    uTexture: { value: texture },
    uTime: { value: 0 },
    uScanProgress: { value: 0 },
    uDecodeProgress: { value: 0 },
    uOpacity: { value: 1 },
  };
}

const vertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;

  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D uTexture;
  uniform float uTime;
  uniform float uScanProgress;
  uniform float uDecodeProgress;
  uniform float uOpacity;

  varying vec2 vUv;
  varying vec3 vPosition;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  void main() {
    vec4 paper = texture2D(uTexture, vUv);
    float scanLine = smoothstep(0.025, 0.0, abs(vUv.x - uScanProgress));
    float scanWake = smoothstep(0.18, 0.0, abs(vUv.x - uScanProgress));
    float grain = hash(vUv * 180.0 + uTime * 0.08);
    vec3 scanColor = vec3(0.36, 1.0, 0.72);
    vec3 decodedInk = mix(paper.rgb, vec3(0.92), uDecodeProgress * scanWake * 0.18);
    vec3 litPaper = decodedInk + scanColor * scanLine * 0.42 + scanColor * scanWake * 0.08;
    litPaper += (grain - 0.5) * 0.035;
    gl_FragColor = vec4(litPaper, paper.a * uOpacity);
  }
`;

export function createManuscriptShaderMaterial(texture: THREE.Texture) {
  return new THREE.ShaderMaterial({
    uniforms: manuscriptShaderUniforms(texture),
    vertexShader,
    fragmentShader,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: true,
  });
}
```

- [ ] **Step 2: Wire shader into `ManuscriptCanvas`**

In `frontend/formulas/landing/components/ManuscriptCanvas.tsx`, import:

```typescript
import { createManuscriptShaderMaterial, type ManuscriptShaderUniforms } from "../three/ManuscriptShaderMaterial";
```

Replace the material ref:

```typescript
const materialRef = useRef<THREE.ShaderMaterial & { uniforms: ManuscriptShaderUniforms }>(null);
```

Create the shader material after the texture clone:

```typescript
const shaderMaterial = useMemo(() => createManuscriptShaderMaterial(texture), [texture]);
```

Dispose it with the texture:

```typescript
useEffect(() => {
  return () => {
    texture.dispose();
    shaderMaterial.dispose();
  };
}, [texture, shaderMaterial]);
```

Inside `useFrame`, update uniforms:

```typescript
if (materialRef.current) {
  const uniforms = materialRef.current.uniforms;
  uniforms.uTime.value = time;
  uniforms.uScanProgress.value = THREE.MathUtils.clamp((progress - 0.5) / 0.22, 0, 1);
  uniforms.uDecodeProgress.value = decodeProgress;
  uniforms.uOpacity.value = THREE.MathUtils.lerp(1, 0.9, decodeProgress);
}
```

Replace the current `meshStandardMaterial` JSX element with this primitive material attachment:

```tsx
<primitive ref={materialRef} object={shaderMaterial} attach="material" />
```

- [ ] **Step 3: Keep lighting useful but not dominant**

In `SceneLights`, lower the green spotlight intensity:

```tsx
<spotLight position={[4, 4, 4]} angle={Math.PI / 3} penumbra={0.8} intensity={14} color={0x5cffb0} />
```

- [ ] **Step 4: Run shader guard and TypeScript**

Run:

```bash
node tests/frontend/landing_phase_modules_guard.mjs
npm run check:landing
```

Expected after Task 4 and Task 5: PASS. If Task 5 is not done yet, `npm run check:landing` may still fail on missing `WorkspaceRevealOverlay`.

- [ ] **Step 5: Commit after TypeScript passes**

Run:

```bash
git add frontend/formulas/landing/three/ManuscriptShaderMaterial.ts frontend/formulas/landing/components/ManuscriptCanvas.tsx
git commit -m "feat: add manuscript surface shader scan"
```

---

## Task 5: Extract WorkspaceRevealOverlay And Final CTA

**Files:**
- Create: `frontend/formulas/landing/components/WorkspaceRevealOverlay.tsx`
- Modify: `frontend/formulas/landing/styles/landing.css`
- Test: `tests/frontend/landing_phase_modules_guard.mjs`

- [ ] **Step 1: Create workspace reveal component**

Create `frontend/formulas/landing/components/WorkspaceRevealOverlay.tsx`:

```typescript
export function WorkspaceRevealOverlay() {
  return (
    <div className="workspace-reveal" aria-hidden="true">
      <div className="workspace-shell">
        <div className="workspace-pane workspace-pane-outline">
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="workspace-pane workspace-pane-paper">
          <span />
          <span />
          <span />
        </div>
        <div className="workspace-pane workspace-pane-review">
          <span />
          <span />
          <span />
        </div>
      </div>
      <div className="workspace-cta">
        <a className="button primary" href="/workbench/">Start Recognition</a>
        <a className="button secondary" href="/projects/">Open Workspace</a>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update reveal CSS for the CTA phase**

Append to `frontend/formulas/landing/styles/landing.css`:

```css
.workspace-cta {
  position: absolute;
  left: 50%;
  bottom: -58px;
  z-index: 2;
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
  opacity: var(--cta-opacity);
  transform: translate3d(-50%, var(--cta-y), 0);
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.workspace-cta .button {
  min-width: 164px;
  justify-content: center;
  pointer-events: auto;
}

.landing-story[data-story-phase="cta"] .workspace-reveal {
  opacity: 0.92;
}
```

- [ ] **Step 3: Confirm real links align with existing routes**

Confirm routes by reading `apps/formulas/urls.py`:

```bash
rg -n "workbench|projects" apps/formulas/urls.py
```

Expected: existing URL patterns include:

```text
path("projects/", views.projects, name="projects")
path("workbench/", views.workbench, name="workbench")
```

- [ ] **Step 4: Run focused checks**

Run:

```bash
node tests/frontend/landing_phase_modules_guard.mjs
npm run check:landing
```

Expected: PASS after Tasks 2-5 are complete.

- [ ] **Step 5: Commit reveal component**

Run:

```bash
git add frontend/formulas/landing/components/WorkspaceRevealOverlay.tsx frontend/formulas/landing/styles/landing.css
git commit -m "feat: add landing workspace reveal overlay"
```

---

## Task 6: Performance Gate, Build, And Browser Proof

**Files:**
- Modify: `frontend/formulas/landing/components/ManuscriptCanvas.tsx`
- Modify: `tests/frontend/landing_light_treatment_guard.mjs`
- Modify: `tests/frontend/landing_phase_modules_guard.mjs`
- Generated by build: `apps/formulas/static/formulas/css/generated/landing.css`
- Generated by build: `apps/formulas/static/formulas/js/generated/landing.js`
- Generated by build: `apps/formulas/static/formulas/js/generated/landing-landing-motion.js`
- Generated by build: `apps/formulas/static/formulas/js/generated/landing-landing-three.js`

- [ ] **Step 1: Add explicit motion quality constants**

At the top of `frontend/formulas/landing/components/ManuscriptCanvas.tsx`, add:

```typescript
const MAX_DPR: [number, number] = [1, 1.5];
const STARFIELD_PARTICLE_COUNT = 720;
```

Replace:

```typescript
const count = 720;
```

with:

```typescript
const count = STARFIELD_PARTICLE_COUNT;
```

Replace:

```tsx
dpr={[1, 1.5]}
```

with:

```tsx
dpr={MAX_DPR}
```

- [ ] **Step 2: Guard performance constants**

Append to `tests/frontend/landing_phase_modules_guard.mjs`:

```javascript
assert.match(manuscriptSource, /STARFIELD_PARTICLE_COUNT\s*=\s*720/, "Particle count should remain capped for desktop performance.");
assert.match(manuscriptSource, /MAX_DPR:\s*\[number,\s*number\]\s*=\s*\[1,\s*1\.5\]/, "Canvas DPR should remain capped.");
```

- [ ] **Step 3: Run full frontend validation**

Run:

```bash
npm run check:frontend
```

Expected: PASS. If it fails because generated static assets cannot be overwritten in a sandboxed worktree, rerun in the main repo or with the approved project command path and keep the output in the task notes.

- [ ] **Step 4: Run backend and governance validation**

Run:

```bash
/Users/tim/Desktop/shared-Linux/formula-lab/.conda/bin/python manage.py check
/Users/tim/Desktop/shared-Linux/formula-lab/.conda/bin/python scripts/check_repository_governance.py
git diff --check
```

Expected:

```text
System check identified no issues (0 silenced).
```

The governance and diff commands should exit with code 0 and no output.

- [ ] **Step 5: Browser proof on desktop**

Start the local server:

```bash
PYTHON=/Users/tim/Desktop/shared-Linux/formula-lab/.conda/bin/python PORT=8018 make dev
```

Open:

```text
http://127.0.0.1:8018/
```

Verify these frames manually in the real browser:

- First viewport: title and navigation are visible, no duplicate paper layer.
- Mid scroll: text and formula background disappear by opacity/mask/particle handoff, not blur.
- Center/scan: paper is the visual center, shader scan lives on the paper surface.
- Reveal: workspace skeleton appears below/in front of the paper, no right-side formula column.
- Final: `Start Recognition` and `Open Workspace` are visible and clickable.

Stop the server after inspection with `Ctrl-C`. If the terminal is detached, find the listener and kill it:

```bash
kill $(lsof -tiTCP:8018 -sTCP:LISTEN)
```

- [ ] **Step 6: Commit final assets**

Run:

```bash
git add frontend/formulas/landing apps/formulas/static/formulas/css/generated/landing.css apps/formulas/static/formulas/js/generated/landing.js apps/formulas/static/formulas/js/generated/landing-landing-motion.js apps/formulas/static/formulas/js/generated/landing-landing-three.js tests/frontend package.json package-lock.json
git commit -m "chore: validate living manuscript landing build"
```

If `package-lock.json` has no changes, omit it from `git add`.

---

## Self-Review Checklist

- Spec coverage: Tasks cover Ignition, Absorb, Center, Scan, Workspace Reveal, CTA, module boundaries, performance caps, and browser proof.
- Marker scan: The plan contains no unresolved marker words or undefined future slots.
- Type consistency: `LandingPhase`, `ScrollProgressRef`, `ScrollDirectorProps`, `ManuscriptShaderUniforms`, and helper names are consistent across tasks.
- Scope control: The plan only touches the landing island, generated landing assets, frontend guard tests, and package scripts. It does not modify Project Workspace backend, OCR, database, or Docker deployment.

---

## Execution Choice

Plan complete and saved to `docs/superpowers/plans/2026-05-24-Landing第二阶段-Living-Manuscript实施计划.md`. Two execution options:

1. **Subagent-Driven (recommended)** - dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** - execute tasks in this session using executing-plans, batch execution with checkpoints.

Choose option 1 if the goal is speed and separation of concerns. Choose option 2 if you want tighter step-by-step control in this same conversation.
