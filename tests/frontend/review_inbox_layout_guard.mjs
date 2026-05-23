import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const layoutSource = readFileSync("frontend/formulas/layout_intelligence.js", "utf8");
const inboxSource = readFileSync("frontend/formulas/workspace_editor/components/FormulaReviewInbox.tsx", "utf8");
const inboxCss = readFileSync("frontend/formulas/workspace_editor/styles/review-inbox.css", "utf8");

assert.equal(
  layoutSource.includes("function measureReviewCard"),
  true,
  "Formula Review Inbox should use a dedicated Pretext card-height helper.",
);

assert.equal(
  inboxSource.includes("measureReviewCard"),
  true,
  "Formula Review Inbox should consume the Pretext card-height helper.",
);

assert.equal(
  inboxCss.includes("--review-card-width"),
  false,
  "Formula Review Inbox width should stay CSS-owned, not Pretext-owned.",
);

assert.equal(
  inboxCss.includes("grid-template-columns"),
  true,
  "Formula Review Inbox masonry should keep column sizing in CSS.",
);
