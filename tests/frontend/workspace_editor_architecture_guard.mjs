import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const files = {
  inbox: "frontend/formulas/workspace_editor/components/FormulaReviewInbox.tsx",
  miniPreview: "frontend/formulas/workspace_editor/components/MiniFormulaPreview.tsx",
  reviewLib: "frontend/formulas/workspace_editor/lib/reviewInbox.ts",
};

for (const [name, file] of Object.entries(files)) {
  assert.ok(existsSync(file), `Workspace editor ${name} module should exist at ${file}.`);
}

const inbox = readFileSync(files.inbox, "utf8");
const miniPreview = readFileSync(files.miniPreview, "utf8");
const reviewLib = readFileSync(files.reviewLib, "utf8");

assert.match(
  inbox,
  /from "\.\.\/lib\/reviewInbox"/,
  "FormulaReviewInbox should import review sorting, filtering, and layout helpers from the review lib.",
);
assert.match(
  inbox,
  /from "\.\/MiniFormulaPreview"/,
  "FormulaReviewInbox should delegate KaTeX mini rendering to MiniFormulaPreview.",
);
assert.doesNotMatch(
  inbox,
  /window\.katex|useEffect|useRef|FALLBACK_LAYOUT|STATUS_PRIORITY/,
  "FormulaReviewInbox should stay focused on state and composition, not preview effects or pure review logic.",
);
assert.match(miniPreview, /window\.katex\.render/, "MiniFormulaPreview should own KaTeX rendering.");
assert.match(miniPreview, /workspace-review-inbox-katex/, "MiniFormulaPreview should preserve the review card preview class.");
for (const exportName of [
  "FILTERS",
  "STATUS_LABEL",
  "filterCount",
  "formatUpdatedAt",
  "measureReviewCard",
  "normalizeReviewStatus",
  "sortReviewItems",
  "summarizeItems",
]) {
  assert.match(reviewLib, new RegExp(`export (const|function) ${exportName}`), `reviewInbox lib should export ${exportName}.`);
}
assert.match(
  reviewLib,
  /window\.FormulaLayout\?\.measureReviewCard\?/,
  "reviewInbox lib should keep using the Pretext card-height helper for masonry review cards.",
);
