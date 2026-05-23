import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const historyJs = readFileSync("apps/formulas/static/formulas/js/history.js", "utf8");
const historyCss = readFileSync("apps/formulas/static/formulas/css/pages/history.css", "utf8");

assert.equal(
  historyJs.includes("--timeline-entry-width"),
  false,
  "Mission Log card shell width should stay CSS-grid-owned, not Pretext-owned.",
);

assert.equal(
  historyCss.includes("--timeline-entry-width"),
  false,
  "Mission Log card CSS should not depend on dynamic per-entry width variables.",
);
