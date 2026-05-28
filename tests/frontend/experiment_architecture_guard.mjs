import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

function read(path) {
  return readFileSync(path, "utf8");
}

const packageJson = JSON.parse(read("package.json"));
assert.equal(
  packageJson.scripts["build:experiment"],
  "ASTRO_TELEMETRY_DISABLED=1 astro build --config build/astro/astro.experiment.config.mjs",
  "Experiment page must build through Astro, not through the existing landing Vite island.",
);
assert.match(
  packageJson.scripts.build,
  /npm run build:experiment/,
  "The default frontend build must include the Astro experiment page.",
);
assert.match(
  packageJson.scripts["check:frontend"],
  /node tests\/frontend\/experiment_architecture_guard\.mjs/,
  "Frontend checks must include the experiment architecture guard.",
);

const astroConfigPath = "build/astro/astro.experiment.config.mjs";
assert.equal(existsSync(astroConfigPath), true, "Experiment Astro config must live under build/astro.");
const astroConfig = read(astroConfigPath);
assert.match(astroConfig, /import \{ defineConfig \} from "astro\/config"/);
assert.match(astroConfig, /const repoRoot = resolve\(dirname\(fileURLToPath\(import\.meta\.url\)\), "\.\.\/\.\."\)/);
assert.match(astroConfig, /const experimentRoot = resolve\(repoRoot, "frontend\/formulas\/experiment"\)/);
assert.match(astroConfig, /root:\s*experimentRoot/);
assert.match(astroConfig, /srcDir:\s*resolve\(experimentRoot, "src"\)/);
assert.match(astroConfig, /publicDir:\s*resolve\(experimentRoot, "public"\)/);
assert.match(astroConfig, /outDir:\s*resolve\(repoRoot, "apps\/formulas\/static\/formulas\/experiment"\)/);
assert.match(astroConfig, /base:\s*"\/static\/formulas\/experiment"/);
assert.match(astroConfig, /assets:\s*"_astro"/);

const experimentPagePath = "frontend/formulas/experiment/src/pages/index.astro";
const experimentRuntimePath = "frontend/formulas/experiment/src/scripts/experiment-runtime.ts";
const experimentRuntimeOrchestratorPath = "frontend/formulas/experiment/src/scripts/runtime/experiment-runtime.ts";
const experimentPaperScenePath = "frontend/formulas/experiment/src/scripts/runtime/paper-scene.ts";
const experimentChapterDirectorPath = "frontend/formulas/experiment/src/scripts/runtime/chapter-director.ts";
const experimentDomStoryPath = "frontend/formulas/experiment/src/scripts/runtime/dom-story.ts";
const experimentStylesPath = "frontend/formulas/experiment/src/styles/experiment.css";
const experimentManuscriptAssetPath = "frontend/formulas/experiment/public/assets/research-manuscript-sheet.png";
const chapterManifestPath = "frontend/formulas/experiment/src/data/formula-chapters.ts";
assert.equal(existsSync(experimentPagePath), true, "Experiment page must be authored as an Astro page.");
assert.equal(existsSync(experimentRuntimePath), true, "Experiment animation runtime must be isolated.");
for (const path of [
  experimentRuntimeOrchestratorPath,
  experimentPaperScenePath,
  experimentChapterDirectorPath,
  experimentDomStoryPath,
]) {
  assert.equal(existsSync(path), true, `${path} must exist to keep the experiment runtime modular.`);
}
assert.equal(existsSync(experimentStylesPath), true, "Experiment styles must be isolated.");
assert.equal(
  existsSync(experimentManuscriptAssetPath),
  true,
  "Experiment page must keep the generated manuscript texture in Astro public assets.",
);
assert.equal(existsSync(chapterManifestPath), true, "Experiment formula chapters must be data-driven.");

const chapterManifest = read(chapterManifestPath);
assert.match(chapterManifest, /export type FormulaChapter/);
assert.match(chapterManifest, /uvBounds:\s*\{/);
assert.match(chapterManifest, /author:/);
assert.match(chapterManifest, /era:/);
assert.match(chapterManifest, /motion:/);
assert.match(chapterManifest, /sources:/);
assert.match(chapterManifest, /formulaChapters/);

const experimentPage = read(experimentPagePath);
assert.match(
  experimentPage,
  /\/static\/formulas\/vendor\/katex\/katex\.min\.css/,
  "Experiment page must reuse the project KaTeX vendor styles for rendered formulas.",
);
assert.match(experimentPage, /data-experiment-root/, "Experiment page must expose a stable root marker.");
assert.match(experimentPage, /data-experiment-canvas/, "Experiment page must include a dedicated WebGL canvas.");
assert.match(experimentPage, /ENTER WORKBENCH/, "Experiment page must still end in a real workbench CTA.");
assert.match(experimentPage, /data-chapter-label/);
assert.match(experimentPage, /data-chapter-formula/);
assert.match(experimentPage, /data-chapter-author/);
assert.match(experimentPage, /data-chapter-story/);
assert.match(experimentPage, /data-chapter-origin/);
assert.match(experimentPage, /data-chapter-conflict/);
assert.match(experimentPage, /data-chapter-legacy/);
assert.match(experimentPage, /data-chapter-product/);
assert.match(experimentPage, /experiment-chapter-story/);
assert.match(
  experimentPage,
  /\/static\/formulas\/experiment\/assets\/research-manuscript-sheet\.png/,
  "Experiment page must preload the generated manuscript texture through the deployed static path.",
);
assert.doesNotMatch(experimentPage, /landing-root/, "Experiment page must not reuse the landing React island.");

const experimentRuntime = read(experimentRuntimePath);
assert.match(experimentRuntime, /createExperimentRuntime/);
assert.doesNotMatch(experimentRuntime, /new THREE\.WebGLRenderer/, "Bootstrap must not own the renderer.");

const experimentRuntimeOrchestrator = read(experimentRuntimeOrchestratorPath);
assert.match(experimentRuntimeOrchestrator, /from "gsap"/, "Experiment runtime must use GSAP.");
assert.match(experimentRuntimeOrchestrator, /ScrollTrigger/, "Experiment runtime must be scroll-driven.");
assert.match(experimentRuntimeOrchestrator, /requestAnimationFrame/, "Experiment runtime must own a render loop.");
assert.match(experimentRuntimeOrchestrator, /createPaperScene/, "Experiment runtime must delegate rendering to the paper scene.");
assert.match(experimentRuntimeOrchestrator, /getChapterState/, "Experiment runtime must derive chapter state from normalized progress.");

const experimentPaperScene = read(experimentPaperScenePath);
assert.match(experimentPaperScene, /from "three"/, "Experiment paper scene must use Three.js.");
assert.match(
  experimentPaperScene,
  /MANUSCRIPT_TEXTURE_URL/,
  "Experiment paper scene must treat the generated manuscript as an explicit render asset.",
);
assert.match(
  experimentPaperScene,
  /TextureLoader/,
  "Experiment paper scene must load the generated manuscript as a Three.js texture.",
);
assert.match(
  experimentPaperScene,
  /uPaperTexture/,
  "Experiment paper scene shader must sample the generated manuscript texture.",
);
assert.match(experimentPaperScene, /uvBounds/);
assert.match(experimentPaperScene, /createFormulaRegionMesh/);
assert.match(experimentPaperScene, /createExtractedFormulaMesh/);
assert.match(experimentPaperScene, /uSourceUvRect/);
assert.match(experimentPaperScene, /sourceUv = uSourceUvRect\.xy \+ vUv \* uSourceUvRect\.zw/);
assert.doesNotMatch(
  experimentPaperScene,
  /CanvasTexture/,
  "Experiment formula lift must sample the original manuscript texture instead of redrawing formula text.",
);
assert.match(experimentPaperScene, /chapterIndex/);
assert.match(experimentPaperScene, /localProgress/);

const experimentChapterDirector = read(experimentChapterDirectorPath);
assert.match(experimentChapterDirector, /ChapterState/);
assert.match(experimentChapterDirector, /formulaChapters/);
assert.match(experimentChapterDirector, /globalProgress/);

const experimentDomStory = read(experimentDomStoryPath);
assert.match(experimentDomStory, /from "katex"/, "Experiment DOM story module must render formulas with KaTeX.");
assert.match(experimentDomStory, /katex\.render/, "Experiment formula overlay must render TeX instead of showing source code.");
assert.match(experimentDomStory, /gsap\/SplitText/, "Experiment DOM story module must use GSAP SplitText.");
assert.match(experimentDomStory, /SplitText\.create/, "Experiment story copy should animate as split text.");
assert.match(
  experimentDomStory,
  /--chapter-story-opacity/,
  "Experiment chapter story must control its own visible window to avoid overlapping adjacent narrative sections.",
);
assert.match(
  experimentDomStory,
  /data-chapter-story/,
  "Experiment DOM story module must render the active formula chapter copy.",
);
assert.doesNotMatch(
  experimentRuntime + experimentRuntimeOrchestrator + experimentPaperScene,
  /frontend\/formulas\/landing|performance\/motionRuntime|getLandingMotionRuntime/,
  "Experiment runtime must not import the landing page runtime.",
);

const navTemplate = read("apps/formulas/templates/formulas/partials/nav.html");
assert.match(navTemplate, /url 'experiment'/, "Primary header must include the experiment page entry.");
assert.match(navTemplate, />EXPERIMENT</, "Experiment header entry should use a compact label.");

const urls = read("apps/formulas/urls.py");
assert.match(urls, /path\("experiment\/", views\.experiment, name="experiment"\)/);

const workbenchViews = read("apps/formulas/views/workbench_views.py");
assert.match(workbenchViews, /def experiment\(request\):/);
assert.match(workbenchViews, /finders\.find\("formulas\/experiment\/index\.html"\)/);
assert.match(workbenchViews, /HttpResponse/);
