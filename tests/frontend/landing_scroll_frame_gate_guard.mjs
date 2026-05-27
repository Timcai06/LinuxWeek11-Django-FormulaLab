import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

function read(path) {
  return readFileSync(path, "utf8");
}

const gatePath = "frontend/formulas/landing/performance/scrollFrameGate.ts";
const schedulerPath = "frontend/formulas/landing/performance/rendererScheduler.ts";
assert.ok(existsSync(gatePath), "Landing scroll-linked updates should have a shared frame gate.");
assert.ok(existsSync(schedulerPath), "Landing renderers should use a runtime-level scheduler.");

const gate = read(gatePath);
const scheduler = read(schedulerPath);
assert.match(
  gate,
  /createScrollFrameGate[\s\S]*frame\.visible[\s\S]*frame\.progress[\s\S]*lastProgress/,
  "Scroll frame gate should centralize visible/progress-change checks.",
);
assert.match(
  gate,
  /reset\(\)[\s\S]*Number\.NaN/,
  "Scroll frame gate should expose reset for resize and visibility invalidation.",
);
assert.match(
  scheduler,
  /createRendererFrameGate[\s\S]*phases[\s\S]*includeTransitionSettling[\s\S]*scrollGate\.shouldUpdate\(frame\)/,
  "Renderer scheduler should centralize phase and scroll-frame gating above individual components.",
);

const guardedComponents = [
  "frontend/formulas/landing/components/LandingFlowCanvas.tsx",
  "frontend/formulas/landing/components/HorizontalTicker.tsx",
  "frontend/formulas/landing/components/MorphCurtain.tsx",
  "frontend/formulas/landing/components/WorkbenchGateOverlay.tsx",
  "frontend/formulas/landing/components/CollaborationSignalField.tsx",
  "frontend/formulas/landing/components/PaperWorkspaceGhost.tsx",
];

for (const path of guardedComponents) {
  const source = read(path);
  assert.match(source, /subscribeRenderer/, `${path} should subscribe through the runtime renderer scheduler.`);
  assert.doesNotMatch(source, /createScrollFrameGate/, `${path} should not own scroll-frame gating locally.`);
}
