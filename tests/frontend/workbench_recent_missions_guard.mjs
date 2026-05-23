import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync("apps/formulas/static/formulas/css/components/workbench-telemetry.css", "utf8");
const template = readFileSync("apps/formulas/templates/formulas/workbench.html", "utf8");

assert.match(
  css,
  /\.recent-list li\s*\{[^}]*grid-template-columns:\s*minmax\(120px,\s*1fr\)\s*minmax\(78px,\s*auto\)/s,
  "Recent mission rows should use explicit mission/status grid columns.",
);

assert.doesNotMatch(
  css,
  /\.recent-list li\s*\{[^}]*justify-content:\s*space-between/s,
  "Recent mission rows should not push status chips to the far right with space-between.",
);

assert.match(
  css,
  /\.recent-list \.status-badge\.status-queued/s,
  "Recent mission status styling should include queued state.",
);

assert.doesNotMatch(
  template,
  /stage-badge|job\.stage_label/,
  "Workbench recent missions should show only mission code and status.",
);
