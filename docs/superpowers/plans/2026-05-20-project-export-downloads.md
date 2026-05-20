# Project Export Downloads Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add project-level `.tex` and `.md` downloads so confirmed formulas can leave Formula Lab and enter a real paper workflow.

**Architecture:** Keep this slice as instant, idempotent GET downloads rather than persistent `ExportArtifact` records. A small exporter service collects non-rejected formulas with LaTeX, renders LaTeX and Markdown text, and a Django view returns attachment responses. Project Workspace exposes export buttons near the paper preview.

**Tech Stack:** Django views/urls/templates/tests, vanilla CSS, plain text LaTeX/Markdown generation.

---

## File Structure

- Create `apps/formulas/services/export_artifacts.py`: collect formula rows and render `.tex` / `.md` text.
- Modify `apps/formulas/urls.py`: add `/projects/<uuid:project_id>/export/<format_name>/`.
- Modify `apps/formulas/views.py`: add `export_project` response view.
- Modify `apps/formulas/templates/formulas/project_workspace.html`: add export buttons.
- Modify `apps/formulas/static/formulas/css/pages/projects.css`: style export actions.
- Modify `tests/formulas/test_views.py`: cover export links and downloads.
- Modify `docs/07-页面与交互流程.md`: record `.tex` / `.md` export scope.

## Task 1: Export Service and Download Routes

- [x] Write failing tests for Project Workspace export links, `.tex` download, `.md` download, and invalid export format.
- [x] Run focused tests and verify they fail because routes and service are absent.
- [x] Add exporter service and download view.
- [x] Add route and template links.
- [x] Run focused tests and verify they pass.

## Task 2: Verification

- [x] Run Django formula tests, frontend check, migration check, and whitespace check.
- [x] Browser-smoke export links on Project Workspace.
- [x] Commit the slice.
