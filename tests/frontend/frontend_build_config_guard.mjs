import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(path) {
  return readFileSync(path, "utf8");
}

const helperSource = read("frontend/formulas/shared/build/djangoStaticIslandConfig.ts");
assert.match(
  helperSource,
  /export function defineDjangoStaticIslandConfig/,
  "Shared build helper should expose defineDjangoStaticIslandConfig.",
);
assert.match(
  helperSource,
  /outDir:\s*"apps\/formulas\/static\/formulas"/,
  "Shared build helper should preserve the Django static output directory.",
);
assert.match(
  helperSource,
  /cssCodeSplit:\s*false/,
  "Shared build helper should preserve single CSS output per island.",
);
assert.match(
  helperSource,
  /emptyOutDir:\s*false/,
  "Shared build helper should not clear unrelated Django static assets.",
);
assert.match(
  helperSource,
  /manifest:\s*false/,
  "Shared build helper should preserve manifest-free Django static references.",
);

const landingConfig = read("vite.landing.config.ts");
assert.match(
  landingConfig,
  /import \{ defineDjangoStaticIslandConfig \} from "\.\/frontend\/formulas\/shared\/build\/djangoStaticIslandConfig"/,
  "Landing Vite config should use the shared Django static island helper.",
);
assert.match(
  landingConfig,
  /defineDjangoStaticIslandConfig\(\{/,
  "Landing Vite config should delegate common Vite shape to the shared helper.",
);
assert.match(landingConfig, /input:\s*"frontend\/formulas\/landing\/main\.tsx"/);
assert.match(landingConfig, /cssOutput:\s*"css\/generated\/landing\.css"/);
assert.match(landingConfig, /entryFileName:\s*"js\/generated\/landing\.js"/);
assert.match(landingConfig, /chunkFileName:\s*"js\/generated\/landing-\[name\]\.js"/);
assert.match(landingConfig, /chunkSizeWarningLimit:\s*1000/);
assert.match(landingConfig, /return "landing-three"/);
assert.match(landingConfig, /return "landing-motion"/);

const editorConfig = read("vite.workspace-editor.config.ts");
assert.match(
  editorConfig,
  /import \{ defineDjangoStaticIslandConfig \} from "\.\/frontend\/formulas\/shared\/build\/djangoStaticIslandConfig"/,
  "Workspace editor Vite config should use the shared Django static island helper.",
);
assert.match(
  editorConfig,
  /defineDjangoStaticIslandConfig\(\{/,
  "Workspace editor Vite config should delegate common Vite shape to the shared helper.",
);
assert.match(editorConfig, /input:\s*"frontend\/formulas\/workspace_editor\/main\.tsx"/);
assert.match(editorConfig, /cssOutput:\s*"css\/generated\/workspace-editor\.css"/);
assert.match(editorConfig, /entryFileName:\s*"js\/generated\/workspace-editor\.js"/);
assert.match(editorConfig, /chunkFileName:\s*"js\/generated\/\[name\]\.js"/);
assert.match(editorConfig, /return "codemirror"/);
