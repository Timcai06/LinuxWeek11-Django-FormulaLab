import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

function read(path) {
  return readFileSync(path, "utf8");
}

const gatePath = "frontend/formulas/landing/performance/scrollFrameGate.ts";
assert.ok(existsSync(gatePath), "Landing scroll-linked updates should have a shared frame gate.");

const gate = read(gatePath);
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
  assert.match(source, /createScrollFrameGate/, `${path} should use the shared scroll frame gate.`);
  assert.match(source, /frameGate\.shouldUpdate\(frame\)/, `${path} should skip unchanged scroll-linked frames.`);
}
