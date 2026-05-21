# Workbench Project Capture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the loop between Workbench recognition and Project Workspace by letting uploads attach to a project and automatically become formula items after successful OCR.

**Architecture:** Keep the existing single-image mission flow intact for unassigned uploads. When the upload form carries an existing project or a new project name, the view creates a `BatchMission`, attaches the `FormulaJob`, and the Celery task materializes a `FormulaItem` on success. Batch status follows dispatch, success, and failure.

**Tech Stack:** Django forms/views/templates/tests, Celery task tests, existing Formula Lab CSS.

---

## File Structure

- Modify `apps/formulas/forms.py`: add optional `project` and `project_name` fields.
- Modify `apps/formulas/views.py`: provide projects to Workbench and create project/batch/job together.
- Modify `apps/formulas/tasks.py`: create `FormulaItem` when attached jobs succeed; mark batch success/failure.
- Modify `apps/formulas/templates/formulas/workbench.html`: render project selection and new project input.
- Modify `apps/formulas/static/formulas/css/pages/workbench.css`: style project routing controls.
- Modify `tests/formulas/test_views.py`: cover Workbench project controls and project-attached upload.
- Modify `tests/formulas/test_tasks.py`: cover successful OCR materializing a `FormulaItem`.
- Modify `docs/07-页面与交互流程.md`: record the Workbench-to-Project loop.

## Task 1: Upload Form and View

- [x] Write failing tests for Workbench rendering project controls and `/jobs/` creating a project-attached job/batch.
- [x] Run focused tests and verify they fail because fields/context are missing.
- [x] Add optional form fields and view logic.
- [x] Add project routing UI and CSS.
- [x] Run focused tests and verify they pass.

## Task 2: Task Materialization

- [x] Write a failing task test showing a successful attached OCR job creates one `FormulaItem`.
- [x] Run the focused test and verify it fails because no item is created.
- [x] Add task materialization and batch status updates.
- [x] Run focused task tests and verify they pass.

## Task 3: Verification

- [x] Run Django formula tests, frontend check, migration check, and whitespace check.
- [x] Browser-smoke Workbench project controls and Project Workspace preview.
- [ ] Commit the slice.
