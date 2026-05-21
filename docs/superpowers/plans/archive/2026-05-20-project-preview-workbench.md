# Project Preview Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade Project Workspace from a structural data page into a paper-oriented preview surface with formula-level KaTeX previews and a first paper preview lane.

**Architecture:** Keep PDF generation out of this slice. The Django view prepares lightweight preview data from existing `FormulaItem` and `FormulaJob` records, the template renders source and preview containers, and a small page script renders KaTeX once the shared KaTeX bundle is ready. The paper preview is HTML-first so it is instant and can later feed async PDF export.

**Tech Stack:** Django views/templates/tests, vanilla JavaScript, KaTeX, existing Formula Lab CSS.

---

## File Structure

- Modify `apps/formulas/views.py`: build `paper_preview_items` for the workspace context.
- Modify `apps/formulas/templates/formulas/project_workspace.html`: add Project Paper Preview and formula-level preview surfaces.
- Create `apps/formulas/static/formulas/js/project_workspace.js`: render KaTeX into workspace preview nodes.
- Modify `apps/formulas/static/formulas/css/pages/projects.css`: style the paper preview lane and item previews.
- Modify `tests/formulas/test_views.py`: add red-first coverage for preview data and rendered preview hooks.
- Modify `docs/07-页面与交互流程.md`: record preview scope.

## Task 1: Workspace Preview Contract

- [x] Write failing tests asserting the workspace context contains `paper_preview_items`, renders `PAPER PREVIEW`, includes `data-project-katex-preview`, embeds `paper-preview-data`, and loads `project_workspace.js`.
- [x] Run the focused test and verify it fails because the preview contract is absent.
- [x] Implement `paper_preview_items` in `project_workspace`.
- [x] Update template, JS, and CSS for formula preview and paper preview lane.
- [x] Run the focused tests and verify they pass.

## Task 2: Verification

- [x] Run Django formula tests.
- [x] Run frontend syntax/build checks.
- [x] Smoke test the local Project Workspace in the browser.
- [x] Commit the slice.
