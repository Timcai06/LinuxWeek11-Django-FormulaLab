# Architecture Governance Upgrade Implementation Plan
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade Formula Lab's architecture so repository governance, file boundaries, page modules, and product-domain seams stay maintainable as Project, Mission, Formula Item, Export, and Ops features grow.
**Architecture:** Keep one Django app, but split internal responsibilities into governance checks, focused view modules, selectors, presenters, component CSS, and shared page JS. Preserve current URLs, templates, database schema, and user-visible behavior.
**Tech Stack:** Django 5.2, Python 3.11, Celery, Redis, PostgreSQL/SQLite dev mode, vanilla JS, static CSS, Node/esbuild, Docker Compose.

---

## File Structure

```text
scripts/check_repository_governance.py
tests/formulas/{helpers.py,test_repository_governance.py,views/}
apps/formulas/{views/,selectors/,presenters/}
apps/formulas/static/formulas/{css/components/,js/shared/}
docs/superpowers/plans/archive/
```

---

### Task 1: Repository Governance Checker

**Files:** create `scripts/check_repository_governance.py`, create `tests/formulas/test_repository_governance.py`, modify `Makefile`.

- [ ] **Step 1: Add tests for governance helpers**

Create tests that verify `.gitignore` runtime paths and large-file classification:

```python
from pathlib import Path

from scripts.check_repository_governance import (
    GovernanceConfig,
    check_gitignore_contains_runtime_paths,
    classify_tracked_file,
)


def test_runtime_cache_paths_are_required_in_gitignore(tmp_path):
    gitignore = tmp_path / ".gitignore"
    gitignore.write_text(".conda/\n.pip-cache/\n.model-cache/\nnode_modules/\nmedia/\n*.sqlite3\n", encoding="utf-8")
    assert check_gitignore_contains_runtime_paths(gitignore) == []


def test_missing_runtime_cache_paths_are_reported(tmp_path):
    gitignore = tmp_path / ".gitignore"
    gitignore.write_text(".conda/\nnode_modules/\n", encoding="utf-8")
    result = check_gitignore_contains_runtime_paths(gitignore)
    assert ".pip-cache/" in result
    assert ".model-cache/" in result
    assert "media/" in result


def test_generated_bundle_is_allowed_but_handwritten_large_js_is_flagged():
    config = GovernanceConfig()
    generated = classify_tracked_file(Path("apps/formulas/static/formulas/js/generated/layout-intelligence.js"), line_count=3669, byte_size=120_000, config=config)
    handwritten = classify_tracked_file(Path("apps/formulas/static/formulas/js/workbench.js"), line_count=900, byte_size=60_000, config=config)
    assert generated is None
    assert handwritten is not None
    assert "handwritten JS" in handwritten.message
```

- [ ] **Step 2: Run failing test**

```bash
./.conda/bin/python manage.py test tests.formulas.test_repository_governance -v 2
```

Expected failure: `ModuleNotFoundError` for `scripts.check_repository_governance`.

- [ ] **Step 3: Implement `scripts/check_repository_governance.py`**

The script must define `REQUIRED_GITIGNORE_ENTRIES`, `GovernanceConfig`, `GovernanceFinding`, `check_gitignore_contains_runtime_paths()`, `classify_tracked_file()`, and `main()`.

```python
REQUIRED_GITIGNORE_ENTRIES = (
    ".conda/", ".pip-cache/", ".model-cache/", "node_modules/", "media/", "*.sqlite3",
)

@dataclass(frozen=True)
class GovernanceConfig:
    python_business_lines: int = 350
    test_lines: int = 450
    css_page_lines: int = 500
    handwritten_js_lines: int = 450
    markdown_decision_lines: int = 500

@dataclass(frozen=True)
class GovernanceFinding:
    path: Path
    message: str
```

Rules:
- ignore `/generated/`, `/vendor/`, and `docs/superpowers/plans/archive/`;
- flag `apps/**/*.py` over 350 lines;
- flag `tests/**/*.py` over 450 lines;
- flag `apps/**/css/pages/*.css` over 500 lines;
- flag handwritten static JS over 450 lines;
- require runtime cache paths in `.gitignore`.

- [ ] **Step 4: Add Makefile target**

```makefile
.PHONY: governance-check
governance-check:
	$(PYTHON) scripts/check_repository_governance.py
```

Reuse the existing Python variable in `Makefile`; if there is no variable, use `./.conda/bin/python`.

- [ ] **Step 5: Verify and commit**

```bash
./.conda/bin/python manage.py test tests.formulas.test_repository_governance -v 2
make governance-check
git add Makefile scripts/check_repository_governance.py tests/formulas/test_repository_governance.py
git commit -m "Add repository governance checks"
```

---

### Task 2: Split View Tests

**Files:** create `tests/formulas/helpers.py`, create `tests/formulas/views/__init__.py`, create focused view test files, modify `tests/formulas/test_views.py`.

- [ ] **Step 1: Extract shared upload helper**

Move the existing real-image helper from `tests/formulas/test_views.py` into `tests/formulas/helpers.py`:

```python
from io import BytesIO

from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image


def image_bytes(format_name: str = "PNG") -> bytes:
    buffer = BytesIO()
    Image.new("RGB", (10, 5), (255, 255, 255)).save(buffer, format=format_name)
    return buffer.getvalue()


def upload_file(name: str = "formula.png", content: bytes | None = None) -> SimpleUploadedFile:
    if content is None:
        content = image_bytes("JPEG" if name.lower().endswith((".jpg", ".jpeg")) else "PNG")
    return SimpleUploadedFile(name, content, content_type="image/png")
```

- [ ] **Step 2: Move tests by product surface**

Use `git mv` where possible. Split the current `FormulaMissionViewTests` methods into:

```text
test_workbench_views.py: landing, workbench, create_job
test_mission_views.py: progress, status API, report, retry
test_project_views.py: projects index, project workspace, exports, formula review
test_system_views.py: base assets, system, health API, warmup API
```

Each new file keeps its own `TestCase` class and `setUp`/`tearDown` for temporary `MEDIA_ROOT`.

- [ ] **Step 3: Replace old file with marker**

`tests/formulas/test_views.py` becomes:

```python
"""View tests live under tests.formulas.views."""
```

- [ ] **Step 4: Verify and commit**

```bash
./.conda/bin/python manage.py test tests.formulas.views -v 2
./.conda/bin/python manage.py test tests.formulas -v 2
git add tests/formulas/test_views.py tests/formulas/helpers.py tests/formulas/views
git commit -m "Split formula view tests by product surface"
```

---

### Task 3: Split Django Views into Modules

**Files:** move `apps/formulas/views.py`, create `apps/formulas/views/{__init__,workbench,missions,projects,system}.py`, modify `apps/formulas/urls.py` only if import names require it.

- [ ] **Step 1: Capture URL public API**

```bash
sed -n '1,220p' apps/formulas/urls.py
```

Record every callable imported from `apps.formulas.views`; these names must keep working.

- [ ] **Step 2: Convert file to package**

```bash
git mv apps/formulas/views.py apps/formulas/views_legacy.py
mkdir -p apps/formulas/views
touch apps/formulas/views/__init__.py
```

- [ ] **Step 3: Move functions by surface**

```text
workbench.py: landing, workbench, create_job
missions.py: mission_progress, mission_status, mission_report, retry_job
projects.py: projects, project_workspace, project_export, review_formula_item
system.py: system_dashboard, health_api, warmup_model
```

If the actual function names differ, keep the actual names from `urls.py`.

- [ ] **Step 4: Add facade imports**

`apps/formulas/views/__init__.py` must export the same public names:

```python
from .missions import mission_progress, mission_report, mission_status, retry_job
from .projects import project_export, project_workspace, projects, review_formula_item
from .system import health_api, system_dashboard, warmup_model
from .workbench import create_job, landing, workbench

__all__ = [
    "create_job",
    "health_api",
    "landing",
    "mission_progress",
    "mission_report",
    "mission_status",
    "project_export",
    "project_workspace",
    "projects",
    "retry_job",
    "review_formula_item",
    "system_dashboard",
    "warmup_model",
    "workbench",
]
```

- [ ] **Step 5: Verify and commit**

```bash
./.conda/bin/python manage.py check
./.conda/bin/python manage.py test tests.formulas.views -v 2
git add apps/formulas/views apps/formulas/urls.py
git add -u apps/formulas/views.py apps/formulas/views_legacy.py
git commit -m "Split formula views into focused modules"
```

---

### Task 4: Add Selectors and Presenters

**Files:** create `apps/formulas/selectors/{__init__,missions,projects}.py`, create `apps/formulas/presenters/{__init__,missions,projects}.py`, modify mission and project view modules.

- [ ] **Step 1: Create mission selector and presenter**

`apps/formulas/selectors/missions.py`:

```python
from django.shortcuts import get_object_or_404

from apps.formulas.models import FormulaJob


def get_mission_for_report(job_id):
    return get_object_or_404(FormulaJob, id=job_id)
```

`apps/formulas/presenters/missions.py`:

```python
from apps.formulas.services.latex_formats import build_latex_formats


def mission_report_context(job):
    return {"job": job, "formats": build_latex_formats(job.latex_result or "")}
```

- [ ] **Step 2: Use mission selector/presenter**

In the report view:

```python
def mission_report(request, job_id):
    job = get_mission_for_report(job_id)
    return render(request, "formulas/result.html", mission_report_context(job))
```

- [ ] **Step 3: Create project selector and presenter**

`apps/formulas/selectors/projects.py`:

```python
from django.shortcuts import get_object_or_404

from apps.formulas.models import PaperProject


def get_project_workspace(project_id):
    return get_object_or_404(
        PaperProject.objects.prefetch_related("formula_items", "jobs", "batches"),
        id=project_id,
    )
```

`apps/formulas/presenters/projects.py`:

```python
def project_workspace_context(project, **extra):
    context = {"project": project}
    context.update(extra)
    return context
```

- [ ] **Step 4: Verify and commit**

```bash
./.conda/bin/python manage.py test tests.formulas.views.test_mission_views tests.formulas.views.test_project_views -v 2
git add apps/formulas/selectors apps/formulas/presenters apps/formulas/views
git commit -m "Introduce mission and project selectors"
```

---

### Task 5: Extract CSS Components

**Files:** create `apps/formulas/static/formulas/css/components/{console,katex-preview,dashboard}.css`, modify `base.html`, modify page CSS files.

- [ ] **Step 1: Load component CSS in base template**

```html
<link rel="stylesheet" href="{% static 'formulas/css/components/console.css' %}">
<link rel="stylesheet" href="{% static 'formulas/css/components/katex-preview.css' %}">
<link rel="stylesheet" href="{% static 'formulas/css/components/dashboard.css' %}">
```

Place these after `base.css` and before `{% block page_css %}`.

- [ ] **Step 2: Move only shared styles**

Move styles used across pages:

```text
console.css: console tabs, latex output primitives, compact actions
katex-preview.css: katex preview shell, header, rendered surface
dashboard.css: metric grid, telemetry labels, status primitives
```

Leave page-specific layout and spacing inside `css/pages/*.css`.

- [ ] **Step 3: Verify and commit**

```bash
make frontend-check
./.conda/bin/python manage.py test tests.formulas.views -v 2
git add apps/formulas/static/formulas/css apps/formulas/templates/formulas/base.html
git commit -m "Extract shared CSS components"
```

---

### Task 6: Extract Shared Frontend JS Helpers

**Files:** create `apps/formulas/static/formulas/js/shared/{katex_preview,format_tabs}.js`, modify `result.js`, `result.html`, and `package.json`.

- [ ] **Step 1: Add helper namespace**

`katex_preview.js` must create `window.FormulaLab.previewSource()` and `window.FormulaLab.renderKatexPreview()`:

```javascript
window.FormulaLab = window.FormulaLab || {};
window.FormulaLab.previewSource = function previewSource(formats, value) {
    return formats.render ? formats.render : value.replace(/\$\$/g, "").replace(/\$/g, "").trim();
};
window.FormulaLab.renderKatexPreview = function renderKatexPreview(preview, source, displayMode) {
    if (!source) { preview.textContent = "No LaTeX output recorded."; return; }
    if (!window.katex) { preview.textContent = "Loading formula renderer..."; return; }
    window.katex.render(source, preview, {throwOnError: false, displayMode});
};
```

`format_tabs.js` must create `window.FormulaLab.bindFormatTabs()`:

```javascript
window.FormulaLab = window.FormulaLab || {};
window.FormulaLab.bindFormatTabs = function bindFormatTabs(tabs, onSelect) {
    tabs.forEach((tab) => tab.addEventListener("click", () => onSelect(tab.dataset.formatTab)));
};
```

- [ ] **Step 2: Refactor report JS**

In `result.js`, replace local preview-source and tab-binding code with:

```javascript
const source = window.FormulaLab.previewSource(formats, value);
window.FormulaLab.renderKatexPreview(preview, source, true);
window.FormulaLab.bindFormatTabs(tabs, selectFormat);
```

- [ ] **Step 3: Load helpers before result page script**

In `result.html`:

```html
<script defer src="{% static 'formulas/js/shared/katex_preview.js' %}"></script>
<script defer src="{% static 'formulas/js/shared/format_tabs.js' %}"></script>
<script defer src="{% static 'formulas/js/result.js' %}"></script>
```

- [ ] **Step 4: Verify and commit**

```bash
node --check apps/formulas/static/formulas/js/shared/katex_preview.js
node --check apps/formulas/static/formulas/js/shared/format_tabs.js
node --check apps/formulas/static/formulas/js/result.js
make frontend-check
git add apps/formulas/static/formulas/js apps/formulas/templates/formulas/result.html package.json
git commit -m "Extract shared formula frontend helpers"
```

---

### Task 7: Govern Documentation History

**Files:** modify `docs/00-文档索引.md` and `docs/11-架构与体验决策记录.md`, create `docs/superpowers/plans/archive/README.md`, move completed plan docs into archive.

- [ ] **Step 1: Add current architecture entry to docs index**

```markdown
## 当前架构治理入口

- `docs/superpowers/specs/2026-05-20-架构治理升级设计.md`：当前架构治理升级设计。
- `docs/superpowers/plans/2026-05-20-architecture-governance-upgrade.md`：当前架构治理升级执行计划。
```

- [ ] **Step 2: Archive completed plans**

```bash
mkdir -p docs/superpowers/plans/archive
for plan in pretext-layout-intelligence product-core-foundation project-export-downloads project-preview-workbench review-drawer workbench-project-capture; do
  git mv "docs/superpowers/plans/2026-05-20-${plan}.md" docs/superpowers/plans/archive/
done
```

- [ ] **Step 3: Create archive README**

```markdown
# Historical Plans

These plans record completed implementation history. They are useful for audit context, but they are not the current architecture source of truth.
```

- [ ] **Step 4: Verify and commit**

```bash
rg -n "2026-05-20-pretext-layout-intelligence|2026-05-20-product-core-foundation|2026-05-20-project-export-downloads|2026-05-20-project-preview-workbench|2026-05-20-review-drawer|2026-05-20-workbench-project-capture" docs README.md
git add docs README.md
git commit -m "Govern architecture documentation history"
```

Expected: any remaining matches are inside `docs/superpowers/plans/archive/`.

---

### Task 8: Final Verification

**Files:** verify all files changed in Tasks 1-7.

- [ ] **Step 1: Run full backend tests**

```bash
./.conda/bin/python manage.py test tests.formulas -v 2
```

- [ ] **Step 2: Run frontend checks**

```bash
make frontend-check
```

- [ ] **Step 3: Run deployment-shape checks**

```bash
./.conda/bin/python manage.py makemigrations --check --dry-run
docker compose config --quiet
```

- [ ] **Step 4: Run governance and whitespace checks**

```bash
make governance-check
git diff --check
git status --short
```

Expected: backend, frontend, migration, Docker Compose, governance, and whitespace checks pass; remaining uncommitted files are either intentionally deferred UI work or absent.
