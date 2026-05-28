# Formula Chapter Journey Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first version of an art-grade experiment page where each marked formula region on the generated manuscript becomes a scroll chapter with 3D formula reveal, historical context, and a path back to Formula Lab's workbench.

**Architecture:** Keep the experiment page isolated from the main landing runtime. Add a single experiment runtime that coordinates scroll progress, pointer input, visibility, Three.js rendering, paper texture sampling, and chapter state. Formula chapters are data-driven through normalized paper UV coordinates so the paper image, viewport, and 3D scene can change without hard-coded pixel positions breaking.

**Tech Stack:** Astro static page, TypeScript, Three.js/WebGL, GSAP ScrollTrigger, Django static serving, Node guard tests, Django view tests.

---

## File Structure

- Create: `frontend/formulas/experiment/src/data/formula-chapters.ts`
  - Owns chapter metadata, normalized UV bounds, author/history text, and motion style ids.
- Create: `frontend/formulas/experiment/src/scripts/runtime/experiment-runtime.ts`
  - Owns the single runtime lifecycle: renderer, scroll, pointer, visibility, resize, disposal.
- Create: `frontend/formulas/experiment/src/scripts/runtime/paper-scene.ts`
  - Owns Three.js scene construction, paper mesh, formula highlight meshes, shader uniforms, and texture loading.
- Create: `frontend/formulas/experiment/src/scripts/runtime/chapter-director.ts`
  - Converts normalized scroll progress into the active chapter, local chapter progress, focus camera target, and DOM state.
- Create: `frontend/formulas/experiment/src/scripts/runtime/dom-story.ts`
  - Renders chapter title, author, era, story, and CTA text into stable DOM nodes.
- Modify: `frontend/formulas/experiment/src/scripts/experiment-runtime.ts`
  - Convert it into a thin bootstrap that imports and starts the new runtime.
- Modify: `frontend/formulas/experiment/src/pages/index.astro`
  - Add chapter story overlay DOM and stable data attributes.
- Modify: `frontend/formulas/experiment/src/styles/experiment.css`
  - Add styles for formula chapter overlay, chapter progress rail, and active formula callout.
- Modify: `tests/frontend/experiment_architecture_guard.mjs`
  - Lock the runtime split, chapter manifest, normalized UV contract, and single render loop.
- Modify: `tests/formulas/views/test_workbench_views.py`
  - Keep the `/experiment/` serving test and assert the page contains chapter markers.

---

## Task 1: Add Formula Chapter Manifest

**Files:**
- Create: `frontend/formulas/experiment/src/data/formula-chapters.ts`
- Modify: `tests/frontend/experiment_architecture_guard.mjs`

- [ ] **Step 1: Add failing guard for chapter manifest**

Add these assertions to `tests/frontend/experiment_architecture_guard.mjs`:

```js
const chapterManifestPath = "frontend/formulas/experiment/src/data/formula-chapters.ts";
assert.equal(existsSync(chapterManifestPath), true, "Experiment formula chapters must be data-driven.");

const chapterManifest = read(chapterManifestPath);
assert.match(chapterManifest, /export type FormulaChapter/);
assert.match(chapterManifest, /uvBounds:\s*\{/);
assert.match(chapterManifest, /author:/);
assert.match(chapterManifest, /era:/);
assert.match(chapterManifest, /motion:/);
assert.match(chapterManifest, /sources:/);
assert.match(chapterManifest, /formulaChapters/);
```

- [ ] **Step 2: Run guard and verify it fails**

Run:

```bash
node tests/frontend/experiment_architecture_guard.mjs
```

Expected: FAIL because `formula-chapters.ts` does not exist.

- [ ] **Step 3: Create the chapter manifest**

Create `frontend/formulas/experiment/src/data/formula-chapters.ts`:

```ts
export type FormulaMotionStyle = "scan-lift-spectrum" | "field-lines" | "probability-wave" | "inference-grid";

export type FormulaChapter = {
  id: string;
  label: string;
  formula: string;
  author: string;
  era: string;
  uvBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  motion: FormulaMotionStyle;
  origin: string;
  conflict: string;
  legacy: string;
  productLink: string;
  sources: Array<{
    label: string;
    url: string;
  }>;
};

export const formulaChapters: FormulaChapter[] = [
  {
    id: "euler-identity",
    label: "Chapter 01",
    formula: "e^{i\\pi}+1=0",
    author: "Leonhard Euler",
    era: "18th century",
    uvBounds: { x: 0.18, y: 0.18, width: 0.24, height: 0.08 },
    motion: "scan-lift-spectrum",
    origin: "A compact bridge between exponential growth, rotation, and the geometry of complex numbers.",
    conflict: "Mathematicians needed one language for curves, cycles, and imaginary quantities that did not feel like separate worlds.",
    legacy: "The identity became a symbol of mathematical compression: several fundamental constants meeting in one line.",
    productLink: "Formula Lab treats this kind of dense notation as a reviewable object, not a dead image.",
    sources: [
      { label: "MacTutor History of Mathematics", url: "https://mathshistory.st-andrews.ac.uk/" },
    ],
  },
  {
    id: "fourier-transform",
    label: "Chapter 02",
    formula: "\\hat f(\\xi)=\\int_{-\\infty}^{\\infty}f(x)e^{-2\\pi ix\\xi}\\,dx",
    author: "Joseph Fourier",
    era: "early 19th century",
    uvBounds: { x: 0.48, y: 0.2, width: 0.34, height: 0.1 },
    motion: "field-lines",
    origin: "Fourier's heat work turned changing signals into mixtures of waves.",
    conflict: "A physical process that looked continuous and messy could be explained by decomposing it into repeatable components.",
    legacy: "Modern audio, imaging, compression, scientific computing, and AI tooling still inherit this spectral way of seeing.",
    productLink: "Formula Lab should preserve the line of reasoning around a formula, not only the LaTeX string.",
    sources: [
      { label: "MacTutor History of Mathematics", url: "https://mathshistory.st-andrews.ac.uk/" },
    ],
  },
  {
    id: "schrodinger-equation",
    label: "Chapter 03",
    formula: "i\\hbar\\frac{\\partial}{\\partial t}\\Psi=\\hat H\\Psi",
    author: "Erwin Schroedinger",
    era: "1926",
    uvBounds: { x: 0.18, y: 0.55, width: 0.32, height: 0.08 },
    motion: "probability-wave",
    origin: "The equation made quantum state evolution feel like a wave with measurable consequences.",
    conflict: "Classical trajectories could not describe atomic behavior, so physics needed a new mathematical surface for probability.",
    legacy: "Quantum chemistry, materials science, semiconductors, and computation still orbit this equation.",
    productLink: "A paper workspace should let authors inspect the formula and the explanatory context together.",
    sources: [
      { label: "Nobel Prize", url: "https://www.nobelprize.org/" },
    ],
  },
  {
    id: "bayes-rule",
    label: "Chapter 04",
    formula: "P(A\\mid B)=\\frac{P(B\\mid A)P(A)}{P(B)}",
    author: "Thomas Bayes",
    era: "18th century",
    uvBounds: { x: 0.52, y: 0.68, width: 0.3, height: 0.08 },
    motion: "inference-grid",
    origin: "Bayesian reasoning reframed belief as something that can be updated by evidence.",
    conflict: "Researchers needed a disciplined way to move from uncertain observation to revised confidence.",
    legacy: "Statistical learning, scientific inference, diagnostics, and many AI systems rely on this update logic.",
    productLink: "Formula Lab can turn recognized formulas into traceable review decisions inside a paper workflow.",
    sources: [
      { label: "Stanford Encyclopedia of Philosophy", url: "https://plato.stanford.edu/" },
    ],
  },
];
```

- [ ] **Step 4: Run guard and verify it passes**

Run:

```bash
node tests/frontend/experiment_architecture_guard.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/formulas/experiment/src/data/formula-chapters.ts tests/frontend/experiment_architecture_guard.mjs
git commit -m "Add formula chapter manifest for experiment page"
```

---

## Task 2: Split Runtime Into Single Orchestrator Modules

**Files:**
- Create: `frontend/formulas/experiment/src/scripts/runtime/experiment-runtime.ts`
- Create: `frontend/formulas/experiment/src/scripts/runtime/paper-scene.ts`
- Create: `frontend/formulas/experiment/src/scripts/runtime/chapter-director.ts`
- Create: `frontend/formulas/experiment/src/scripts/runtime/dom-story.ts`
- Modify: `frontend/formulas/experiment/src/scripts/experiment-runtime.ts`
- Modify: `tests/frontend/experiment_architecture_guard.mjs`

- [ ] **Step 1: Add failing runtime split guard**

Add assertions:

```js
for (const path of [
  "frontend/formulas/experiment/src/scripts/runtime/experiment-runtime.ts",
  "frontend/formulas/experiment/src/scripts/runtime/paper-scene.ts",
  "frontend/formulas/experiment/src/scripts/runtime/chapter-director.ts",
  "frontend/formulas/experiment/src/scripts/runtime/dom-story.ts",
]) {
  assert.equal(existsSync(path), true, `${path} must exist to keep the experiment runtime modular.`);
}

const bootstrap = read("frontend/formulas/experiment/src/scripts/experiment-runtime.ts");
assert.match(bootstrap, /createExperimentRuntime/);
assert.doesNotMatch(bootstrap, /new THREE\.WebGLRenderer/, "Bootstrap must not own the renderer.");
```

- [ ] **Step 2: Run guard and verify it fails**

Run:

```bash
node tests/frontend/experiment_architecture_guard.mjs
```

Expected: FAIL because runtime modules do not exist.

- [ ] **Step 3: Create runtime type contract**

In `frontend/formulas/experiment/src/scripts/runtime/chapter-director.ts`:

```ts
import { formulaChapters } from "../../data/formula-chapters";

export type ChapterState = {
  activeIndex: number;
  activeId: string;
  localProgress: number;
  globalProgress: number;
};

export function getChapterState(globalProgress: number): ChapterState {
  const clamped = Math.min(1, Math.max(0, globalProgress));
  const count = formulaChapters.length;
  const scaled = clamped * count;
  const activeIndex = Math.min(count - 1, Math.floor(scaled));
  const localProgress = Math.min(1, Math.max(0, scaled - activeIndex));
  return {
    activeIndex,
    activeId: formulaChapters[activeIndex].id,
    localProgress,
    globalProgress: clamped,
  };
}
```

- [ ] **Step 4: Move scene code into `paper-scene.ts`**

Move the existing renderer, scene, camera, paper mesh, texture loading, resize, render, pointer update, and dispose responsibilities into:

```ts
export type PaperScene = {
  resize: () => void;
  render: (time: number, progress: number, chapterIndex: number, localProgress: number) => void;
  setPointer: (x: number, y: number) => void;
  dispose: () => void;
};

export function createPaperScene(canvas: HTMLCanvasElement): PaperScene {
  // Use the existing renderer, texture, paper shader, line group, and resize logic here.
}
```

- [ ] **Step 5: Create DOM story renderer**

In `frontend/formulas/experiment/src/scripts/runtime/dom-story.ts`:

```ts
import { formulaChapters } from "../../data/formula-chapters";
import type { ChapterState } from "./chapter-director";

export function renderChapterStory(root: HTMLElement, state: ChapterState) {
  const chapter = formulaChapters[state.activeIndex];
  root.style.setProperty("--chapter-progress", state.localProgress.toFixed(4));
  root.dataset.activeChapter = chapter.id;

  const label = root.querySelector<HTMLElement>("[data-chapter-label]");
  const formula = root.querySelector<HTMLElement>("[data-chapter-formula]");
  const author = root.querySelector<HTMLElement>("[data-chapter-author]");
  const story = root.querySelector<HTMLElement>("[data-chapter-story]");

  if (label) label.textContent = chapter.label;
  if (formula) formula.textContent = chapter.formula;
  if (author) author.textContent = `${chapter.author} / ${chapter.era}`;
  if (story) story.textContent = state.localProgress < 0.5 ? chapter.origin : chapter.legacy;
}
```

- [ ] **Step 6: Create single runtime orchestrator**

In `frontend/formulas/experiment/src/scripts/runtime/experiment-runtime.ts`:

```ts
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getChapterState } from "./chapter-director";
import { renderChapterStory } from "./dom-story";
import { createPaperScene } from "./paper-scene";

gsap.registerPlugin(ScrollTrigger);

export function createExperimentRuntime(root: HTMLElement, story: HTMLElement, canvas: HTMLCanvasElement) {
  const scene = createPaperScene(canvas);
  let raf = 0;
  let targetProgress = 0;
  let smoothProgress = 0;
  let lastTime = performance.now();
  let visible = !document.hidden;

  function writeProgress(value: number) {
    targetProgress = value;
    root.style.setProperty("--experiment-progress", value.toFixed(4));
  }

  function render(time: number) {
    if (!visible) return;
    const dt = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;
    smoothProgress += (targetProgress - smoothProgress) * Math.min(1, dt * 8.5);
    const state = getChapterState(smoothProgress);
    renderChapterStory(root, state);
    scene.render(time, smoothProgress, state.activeIndex, state.localProgress);
    raf = requestAnimationFrame(render);
  }

  function start() {
    if (!raf) {
      lastTime = performance.now();
      raf = requestAnimationFrame(render);
    }
  }

  function stop() {
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }

  const scrollTrigger = ScrollTrigger.create({
    trigger: story,
    start: "top top",
    end: "bottom bottom",
    scrub: 0.9,
    onUpdate: (self) => writeProgress(self.progress),
  });

  const onPointerMove = (event: PointerEvent) => {
    scene.setPointer(
      (event.clientX / window.innerWidth - 0.5) * 2,
      -(event.clientY / window.innerHeight - 0.5) * 2,
    );
  };
  const onResize = () => {
    scene.resize();
    ScrollTrigger.refresh();
  };
  const onVisibility = () => {
    visible = !document.hidden;
    if (visible) start();
    else stop();
  };

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
  document.addEventListener("visibilitychange", onVisibility);
  scene.resize();
  start();

  return {
    destroy() {
      stop();
      scrollTrigger.kill();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      scene.dispose();
    },
  };
}
```

- [ ] **Step 7: Replace bootstrap**

In `frontend/formulas/experiment/src/scripts/experiment-runtime.ts`:

```ts
import { createExperimentRuntime } from "./runtime/experiment-runtime";

const root = document.querySelector<HTMLElement>("[data-experiment-root]");
const story = document.querySelector<HTMLElement>("[data-experiment-story]");
const canvas = document.querySelector<HTMLCanvasElement>("[data-experiment-canvas]");

if (!root || !story || !canvas) {
  throw new Error("Formula Lab experiment root is incomplete.");
}

createExperimentRuntime(root, story, canvas);
```

- [ ] **Step 8: Run checks**

Run:

```bash
node tests/frontend/experiment_architecture_guard.mjs
npm run build:experiment
```

Expected: both PASS.

- [ ] **Step 9: Commit**

```bash
git add frontend/formulas/experiment/src/scripts tests/frontend/experiment_architecture_guard.mjs apps/formulas/static/formulas/experiment
git commit -m "Split experiment page into single runtime modules"
```

---

## Task 3: Add Chapter Story Overlay DOM

**Files:**
- Modify: `frontend/formulas/experiment/src/pages/index.astro`
- Modify: `frontend/formulas/experiment/src/styles/experiment.css`
- Modify: `tests/frontend/experiment_architecture_guard.mjs`
- Modify: `tests/formulas/views/test_workbench_views.py`

- [ ] **Step 1: Add failing guards**

Add page assertions:

```js
assert.match(experimentPage, /data-chapter-label/);
assert.match(experimentPage, /data-chapter-formula/);
assert.match(experimentPage, /data-chapter-author/);
assert.match(experimentPage, /data-chapter-story/);
assert.match(experimentPage, /experiment-chapter-story/);
```

Add Django test assertion:

```python
self.assertContains(response, "experiment-chapter-story")
self.assertContains(response, "data-chapter-formula")
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
node tests/frontend/experiment_architecture_guard.mjs
./.conda/bin/python manage.py test tests.formulas.views.test_workbench_views.FormulaWorkbenchViewTests.test_experiment_serves_astro_experience_page -v 2
```

Expected: FAIL because DOM markers are absent.

- [ ] **Step 3: Add overlay markup**

In `frontend/formulas/experiment/src/pages/index.astro`, inside `<main class="experiment-story"...>` before the gate section:

```astro
<aside class="experiment-chapter-story" aria-live="polite">
  <span class="experiment-chapter-story__label" data-chapter-label>Chapter 01</span>
  <strong class="experiment-chapter-story__formula" data-chapter-formula>e^{i\pi}+1=0</strong>
  <span class="experiment-chapter-story__author" data-chapter-author>Leonhard Euler / 18th century</span>
  <p class="experiment-chapter-story__body" data-chapter-story>
    A compact bridge between exponential growth, rotation, and the geometry of complex numbers.
  </p>
</aside>
```

- [ ] **Step 4: Add overlay styles**

In `frontend/formulas/experiment/src/styles/experiment.css`:

```css
.experiment-chapter-story {
  position: fixed;
  z-index: 8;
  right: 5vw;
  bottom: 8vh;
  width: min(420px, 34vw);
  border-top: 1px solid rgba(247, 247, 239, 0.22);
  padding-top: 18px;
  color: var(--experiment-ink);
  opacity: clamp(0, calc((var(--experiment-progress, 0) - 0.18) * 5), 1);
  transform: translate3d(0, calc((1 - var(--chapter-progress, 0)) * 16px), 0);
  pointer-events: none;
}

.experiment-chapter-story__label,
.experiment-chapter-story__author {
  display: block;
  color: var(--experiment-lime);
  font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.experiment-chapter-story__formula {
  display: block;
  margin-top: 12px;
  font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: clamp(24px, 2.8vw, 42px);
  line-height: 1.08;
}

.experiment-chapter-story__author {
  margin-top: 14px;
}

.experiment-chapter-story__body {
  margin: 12px 0 0;
  color: var(--experiment-muted);
  font-size: 17px;
  line-height: 1.5;
}
```

- [ ] **Step 5: Run tests**

Run:

```bash
node tests/frontend/experiment_architecture_guard.mjs
npm run build:experiment
./.conda/bin/python manage.py test tests.formulas.views.test_workbench_views.FormulaWorkbenchViewTests.test_experiment_serves_astro_experience_page -v 2
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/formulas/experiment/src/pages/index.astro frontend/formulas/experiment/src/styles/experiment.css tests/frontend/experiment_architecture_guard.mjs tests/formulas/views/test_workbench_views.py apps/formulas/static/formulas/experiment
git commit -m "Add formula chapter story overlay"
```

---

## Task 4: Add Formula Region Focus And 3D Lift

**Files:**
- Modify: `frontend/formulas/experiment/src/scripts/runtime/paper-scene.ts`
- Modify: `frontend/formulas/experiment/src/scripts/runtime/chapter-director.ts`
- Modify: `tests/frontend/experiment_architecture_guard.mjs`

- [ ] **Step 1: Add guard for normalized chapter focus**

Add assertions:

```js
const paperScenePath = "frontend/formulas/experiment/src/scripts/runtime/paper-scene.ts";
const paperScene = read(paperScenePath);
assert.match(paperScene, /uvBounds/);
assert.match(paperScene, /createFormulaRegionMesh/);
assert.match(paperScene, /chapterIndex/);
assert.match(paperScene, /localProgress/);
```

- [ ] **Step 2: Run guard and verify failure**

Run:

```bash
node tests/frontend/experiment_architecture_guard.mjs
```

Expected: FAIL until formula region meshes exist.

- [ ] **Step 3: Add UV to plane conversion**

In `paper-scene.ts`:

```ts
const PAPER_WIDTH = 3.35;
const PAPER_HEIGHT = 4.45;

function uvToPlaneRect(bounds: FormulaChapter["uvBounds"]) {
  return {
    x: (bounds.x + bounds.width / 2 - 0.5) * PAPER_WIDTH,
    y: (0.5 - bounds.y - bounds.height / 2) * PAPER_HEIGHT,
    width: bounds.width * PAPER_WIDTH,
    height: bounds.height * PAPER_HEIGHT,
  };
}
```

- [ ] **Step 4: Create formula highlight meshes**

In `paper-scene.ts`:

```ts
function createFormulaRegionMesh(bounds: FormulaChapter["uvBounds"]) {
  const rect = uvToPlaneRect(bounds);
  const geometry = new THREE.PlaneGeometry(rect.width, rect.height, 16, 4);
  const material = new THREE.MeshBasicMaterial({
    color: 0xb7ff4a,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(rect.x, rect.y, 0.035);
  return mesh;
}
```

- [ ] **Step 5: Animate active formula region**

In `PaperScene.render(...)`:

```ts
formulaRegionMeshes.forEach((mesh, index) => {
  const material = mesh.material as THREE.MeshBasicMaterial;
  const active = index === chapterIndex ? 1 : 0;
  const lift = active * Math.sin(localProgress * Math.PI);
  material.opacity = active * (0.08 + lift * 0.28);
  mesh.position.z = 0.035 + lift * 0.32;
  mesh.scale.setScalar(1 + lift * 0.08);
});
```

- [ ] **Step 6: Run checks**

Run:

```bash
node tests/frontend/experiment_architecture_guard.mjs
npm run build:experiment
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add frontend/formulas/experiment/src/scripts/runtime/paper-scene.ts tests/frontend/experiment_architecture_guard.mjs apps/formulas/static/formulas/experiment
git commit -m "Add normalized formula region focus meshes"
```

---

## Task 5: Verify Full Experiment Page Contract

**Files:**
- Modify: `tests/frontend/experiment_architecture_guard.mjs`
- Modify: `tests/formulas/views/test_workbench_views.py`

- [ ] **Step 1: Run focused checks**

Run:

```bash
node tests/frontend/experiment_architecture_guard.mjs
npm run build:experiment
./.conda/bin/python manage.py test tests.formulas.views.test_workbench_views.FormulaWorkbenchViewTests.test_experiment_serves_astro_experience_page -v 2
git diff --check
```

Expected: all PASS. The Astro build may print the existing `MODULE_TYPELESS_PACKAGE_JSON` warning; that warning is acceptable until the project decides whether to convert package module mode.

- [ ] **Step 2: Run broader frontend check**

Run:

```bash
make frontend-check
```

Expected: PASS.

- [ ] **Step 3: Manual browser check**

Start local app:

```bash
make dev
```

Open:

```text
http://127.0.0.1:8000/experiment/
```

Expected behavior:
- Header includes `FORMULA LAB` and `ENTER WORKBENCH`.
- Generated manuscript texture appears as the central WebGL paper.
- Scrolling enters formula chapters one by one.
- Chapter story text updates as active formula regions change.
- Formula region highlight lifts from the paper surface without opening a second render loop.
- Workbench CTA remains clickable at the end.

- [ ] **Step 4: Commit final verification updates**

```bash
git add tests/frontend/experiment_architecture_guard.mjs tests/formulas/views/test_workbench_views.py
git commit -m "Verify experiment formula chapter journey"
```

---

## Self-Review

- Spec coverage: The plan covers single runtime, normalized UV coordinates, formula chapters, historical story overlay, real manuscript texture, and first 3D formula lift.
- Placeholder scan: No `TBD`, `TODO`, or open-ended implementation placeholders remain.
- Type consistency: `FormulaChapter`, `uvBounds`, `ChapterState`, `createExperimentRuntime`, `createPaperScene`, and `renderChapterStory` are named consistently across tasks.
- Scope: The plan intentionally excludes WebGPU, rich 3D typography, and source-grade historical citations beyond initial source metadata. Those belong in a second pass after the chapter system works.
