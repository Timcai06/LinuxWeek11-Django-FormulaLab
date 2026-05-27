import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(path) {
  return readFileSync(path, "utf8");
}

function staticRefs(templatePath) {
  const source = read(templatePath);
  const refs = [];
  const pattern = /\{% static '([^']+)' %\}([^"'\s<]*)/g;
  let match;
  while ((match = pattern.exec(source)) !== null) {
    refs.push(`${match[1]}${match[2] ?? ""}`);
  }
  return refs;
}

function assertRefs(templatePath, expected) {
  assert.deepEqual(
    staticRefs(templatePath),
    expected,
    `${templatePath} static asset contract changed. Architecture refactors must keep page resource order and paths stable.`,
  );
}

assertRefs("apps/formulas/templates/formulas/base.html", [
  "formulas/visuals/favicon.svg",
  "formulas/vendor/katex/katex.min.css",
  "formulas/vendor/katex/katex.min.js",
  "formulas/css/base.css",
  "formulas/css/components/console.css",
  "formulas/css/components/katex-preview.css",
  "formulas/css/components/dashboard.css",
  "formulas/js/generated/layout-intelligence.js",
]);

assertRefs("apps/formulas/templates/formulas/landing.html", [
  "formulas/css/generated/landing.css",
  "formulas/js/generated/landing.js",
]);

assertRefs("apps/formulas/templates/formulas/workbench.html", [
  "formulas/css/pages/workbench.css",
  "formulas/css/components/workbench-telemetry.css",
  "formulas/js/workbench.js",
]);

assertRefs("apps/formulas/templates/formulas/history.html", [
  "formulas/css/pages/history.css",
  "formulas/js/history.js",
]);

assertRefs("apps/formulas/templates/formulas/progress.html", [
  "formulas/css/pages/progress.css",
  "formulas/js/progress.js",
]);

assertRefs("apps/formulas/templates/formulas/projects.html", [
  "formulas/css/pages/projects.css?v=preview-workbench",
]);

assertRefs("apps/formulas/templates/formulas/project_workspace.html", [
  "formulas/css/pages/projects.css?v=workflow-inspector",
  "formulas/css/components/project-workspace-layout.css",
  "formulas/css/components/project-workspace-sidebar.css?v=component-split",
  "formulas/css/components/project-paper-preview.css?v=component-split",
  "formulas/css/generated/workspace-editor.css",
  "formulas/js/project_workspace/core.js?v=module-split",
  "formulas/js/project_workspace/preview.js?v=module-split",
  "formulas/js/project_workspace/paper_fit.js?v=module-split",
  "formulas/js/project_workspace/index.js?v=module-split",
  "formulas/js/generated/workspace-editor.js",
]);

assertRefs("apps/formulas/templates/formulas/result.html", [
  "formulas/css/pages/result.css",
  "formulas/css/pages/result-inspector.css",
  "formulas/css/components/paper-fit-preview.css?v=component-split",
  "formulas/css/pages/result-pipeline.css",
  "formulas/js/shared/katex_preview.js",
  "formulas/js/shared/format_tabs.js",
  "formulas/js/result/core.js?v=module-split",
  "formulas/js/result/preview.js?v=module-split",
  "formulas/js/result/paper_fit.js?v=module-split",
  "formulas/js/result/format_controls.js?v=module-split",
  "formulas/js/result/theme.js?v=module-split",
  "formulas/js/result/copy.js?v=module-split",
  "formulas/js/result/image_viewport.js?v=module-split",
  "formulas/js/result/index.js?v=module-split",
]);

assertRefs("apps/formulas/templates/formulas/system.html", [
  "formulas/css/pages/system.css",
  "formulas/css/components/system-service-flow.css",
  "formulas/js/system/core.js?v=module-split",
  "formulas/js/system/service_entries.js?v=module-split",
  "formulas/js/system/health_render.js?v=module-split",
  "formulas/js/system/polling.js?v=module-split",
  "formulas/js/system/warmup.js?v=module-split",
  "formulas/js/system/queue_control.js?v=module-split",
  "formulas/js/system/index.js?v=module-split",
]);

const landingTemplate = read("apps/formulas/templates/formulas/landing.html");
assert.match(landingTemplate, /<div id="landing-root">/, "Landing React island root id must remain stable.");
assert.match(landingTemplate, /<section class="landing-fallback"/, "Landing fallback shell must remain available before React mounts.");

const projectTemplate = read("apps/formulas/templates/formulas/project_workspace.html");
assert.match(projectTemplate, /id="workspace-editor-root"/, "Workspace editor React island root id must remain stable.");
assert.match(projectTemplate, /data-project-items-url=/, "Workspace editor must keep the Django-provided project API URL contract.");
assert.match(projectTemplate, /json_script:"paper-preview-data"/, "Project workspace must keep paper preview JSON boot data stable.");

const landingConfig = read("build/vite/vite.landing.config.ts");
assert.match(landingConfig, /input:\s*"frontend\/formulas\/landing\/main\.tsx"/, "Landing Vite input must remain stable.");
assert.match(landingConfig, /cssOutput:\s*"css\/generated\/landing\.css"/, "Landing CSS output path must remain stable.");
assert.match(landingConfig, /entryFileName:\s*"js\/generated\/landing\.js"/, "Landing JS entry output path must remain stable.");
assert.match(landingConfig, /chunkFileName:\s*"js\/generated\/landing-\[name\]\.js"/, "Landing chunk naming must remain stable.");

const editorConfig = read("build/vite/vite.workspace-editor.config.ts");
assert.match(editorConfig, /input:\s*"frontend\/formulas\/workspace_editor\/main\.tsx"/, "Workspace editor Vite input must remain stable.");
assert.match(editorConfig, /cssOutput:\s*"css\/generated\/workspace-editor\.css"/, "Workspace editor CSS output path must remain stable.");
assert.match(editorConfig, /entryFileName:\s*"js\/generated\/workspace-editor\.js"/, "Workspace editor JS entry output path must remain stable.");
assert.match(editorConfig, /return "codemirror"/, "Workspace editor CodeMirror chunk naming must remain stable.");

const packageJson = JSON.parse(read("package.json"));
const playwrightConfig = read("build/playwright/playwright.config.ts");
assert.equal(
  packageJson.scripts["build:layout"],
  "esbuild frontend/formulas/layout_intelligence.js --bundle --format=iife --global-name=FormulaLayoutBundle --outfile=apps/formulas/static/formulas/js/generated/layout-intelligence.js",
  "Layout intelligence build output path must remain stable.",
);
assert.equal(packageJson.scripts["build:landing"], "vite build --config build/vite/vite.landing.config.ts");
assert.equal(packageJson.scripts["build:editor"], "vite build --config build/vite/vite.workspace-editor.config.ts");
assert.match(
  playwrightConfig,
  /testDir:\s*"\.\.\/\.\.\/e2e"/,
  "Playwright config lives under build/playwright and must point back to the root e2e directory.",
);
