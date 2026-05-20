# Review Drawer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Project Workspace Review Drawer so users can inspect, edit, preview, and confirm a single formula item.

**Architecture:** The workspace template embeds lightweight formula item data as JSON. A vanilla JS drawer opens when a formula row is clicked, renders KaTeX from the editable textarea, and submits to a Django POST endpoint. The endpoint updates `latex_current`, marks the item `CONFIRMED`, and returns to the same project workspace.

**Tech Stack:** Django views/urls/templates/tests, vanilla JavaScript, KaTeX, existing Formula Lab CSS.

---

## File Structure

- Modify `apps/formulas/urls.py`: add a POST route for reviewing formula items.
- Modify `apps/formulas/views.py`: add review payload building and `review_formula_item`.
- Modify `apps/formulas/templates/formulas/project_workspace.html`: add drawer markup and item trigger buttons.
- Modify `apps/formulas/static/formulas/js/project_workspace.js`: open drawer, update hidden item id, render editable preview.
- Modify `apps/formulas/static/formulas/css/pages/projects.css`: style drawer and clickable formula rows.
- Modify `tests/formulas/test_views.py`: cover drawer hooks and POST update behavior.
- Modify `docs/07-页面与交互流程.md`: record Review Drawer scope.

## Task 1: Review Endpoint and Workspace Contract

- [x] Write failing tests for drawer hooks/data and POST update behavior.
- [x] Run focused tests and verify they fail because the route and UI contract are absent.
- [x] Add route, view, context data, template hooks, and drawer UI.
- [x] Run focused tests and verify they pass.

## Task 2: Frontend Drawer Behavior

- [x] Extend `project_workspace.js` to open the drawer from formula rows, populate textarea, and render KaTeX.
- [x] Run frontend syntax checks.

## Task 3: Verification

- [x] Run Django formula tests, frontend check, migration check, and whitespace check.
- [x] Browser-smoke opening the drawer and rendering editable preview.
- [ ] Commit the slice.
