# Product Core Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce the first real Projects-first product core for Formula Lab: Paper Projects, Batch Missions, and Formula Items.

**Architecture:** Keep the existing `FormulaJob` OCR flow working. Add product entities around it rather than replacing it in one jump: `PaperProject` owns `BatchMission`, `BatchMission` owns `FormulaItem`, and `FormulaJob` can optionally attach to a project/batch/formula item. The first UI slice adds a Projects page and a Project workspace page without implementing Crop Studio, local LLM, or batch upload yet.

**Tech Stack:** Django models/migrations/admin, Django templates, vanilla CSS, existing Formula Lab navigation and tests.

---

## Scope

This plan implements the first product-core slice:

```text
PaperProject
  -> BatchMission
    -> FormulaItem
      -> optional FormulaJob
```

In scope:

- Data models and migration.
- Admin registration.
- `/projects/` index page.
- `/projects/<uuid>/` workspace page.
- Navigation entry for Projects.
- Tests for model creation and project pages.
- Documentation sync in existing docs.

Out of scope:

- Multi-image upload.
- Crop Studio.
- Review Drawer.
- Export files.
- Symbol Intelligence.
- Local LLM.
- Replacing the existing `/workbench/` upload flow.

## Task 1: Data Model Foundation

**Files:**
- Modify: `apps/formulas/models.py`
- Modify: `apps/formulas/admin.py`
- Create: `apps/formulas/migrations/0003_product_core.py`
- Modify: `tests/formulas/test_models.py`

Steps:

- [x] Add `PaperProject` with `id`, `project_code`, `name`, `writing_goal`, `default_export_format`, `created_at`, `updated_at`.
- [x] Add `BatchMission` with `id`, `batch_code`, `project`, `title`, `status`, `created_at`, `updated_at`.
- [x] Add `FormulaItem` with `id`, `formula_code`, `project`, `batch`, `recognition_job`, `latex_current`, `status`, `quality_score`, `quality_flags`, `sort_order`, `created_at`, `updated_at`.
- [x] Add optional `project` and `batch` foreign keys to `FormulaJob`.
- [x] Generate migration.
- [x] Register the new models in admin.
- [x] Add model tests for code generation, hierarchy, and default statuses.
- [x] Harden generated codes with retry on unique collisions and validate project/batch hierarchy.

## Task 2: Project Views and Routes

**Files:**
- Modify: `apps/formulas/views.py`
- Modify: `apps/formulas/urls.py`
- Modify: `tests/formulas/test_views.py`

Steps:

- [x] Add `projects(request)` view listing `PaperProject` ordered by latest update.
- [x] Add `project_workspace(request, project_id)` view showing one project, its recent batches, formula counts, needs-review count, ready count, and recent items.
- [x] Add routes `projects/` and `projects/<uuid:project_id>/`.
- [x] Add view tests for empty project index, project list, and project workspace.
- [x] Keep retry missions attached to their original project and batch.
- [x] Annotate project metrics to avoid per-project count queries.

## Task 3: Project UI

**Files:**
- Create: `apps/formulas/templates/formulas/projects.html`
- Create: `apps/formulas/templates/formulas/project_workspace.html`
- Create: `apps/formulas/static/formulas/css/pages/projects.css`
- Modify: `apps/formulas/templates/formulas/partials/nav.html`

Steps:

- [x] Build a Projects-first index page with a compact “new product core” layout, empty state, and project cards.
- [x] Build a Project workspace page with overview metrics, Needs Review, Ready to Export, Recent Batches, Symbol Intelligence placeholder, and Formula Items list.
- [x] Add `PROJECTS` to top navigation.
- [x] Keep the existing dark industrial Formula Lab design language.

## Task 4: Documentation and Verification

**Files:**
- Modify: `docs/04-数据模型.md`
- Modify: `docs/07-页面与交互流程.md`
- Modify: `docs/11-架构与体验决策记录.md`
- Modify: `README.md`

Steps:

- [x] Update data-model docs from “future expandable models” to actual first product-core models.
- [x] Add Projects page and Project workspace to page-flow docs.
- [x] Mark product-core foundation as implementation-started in decision record.
- [x] Mention Projects-first route in README without making the plan file a long-term source of truth.
- [x] Run `npm run build`, `make frontend-check`, Django tests, and migration check.

## Final Verification

Run:

```bash
npm run build
make frontend-check
./.conda/bin/python manage.py test tests.formulas -v 2
./.conda/bin/python manage.py makemigrations --check --dry-run
```

Expected:

```text
frontend build passes
Django tests pass
No missing migrations
```
