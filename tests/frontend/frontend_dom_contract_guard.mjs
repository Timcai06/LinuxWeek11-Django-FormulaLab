import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(path) {
  return readFileSync(path, "utf8");
}

function assertHas(source, pattern, message) {
  assert.match(source, pattern, message);
}

function assertHasAll(source, entries, context) {
  for (const [pattern, label] of entries) {
    assertHas(source, pattern, `${context} must keep ${label}.`);
  }
}

const landing = read("apps/formulas/templates/formulas/landing.html");
const base = read("apps/formulas/templates/formulas/base.html");
assertHas(
  base,
  /<link rel="icon" type="image\/svg\+xml" href="\{% static 'formulas\/visuals\/favicon\.svg' %\}">/,
  "Base template should declare a favicon so browsers do not request /favicon.ico.",
);

assertHasAll(landing, [
  [/<div id="landing-root">/, "the landing React island mount root"],
  [/<section class="landing-fallback" aria-label="Formula Lab landing">/, "the server-rendered fallback shell"],
  [/href="\{% url 'workbench' %\}"/, "the Workbench CTA route"],
  [/href="\{% url 'history' %\}"/, "the Mission Log CTA route"],
], "Landing template");

const workbench = read("apps/formulas/templates/formulas/workbench.html");
assertHasAll(workbench, [
  [/<form id="upload-form" class="upload-console" action="\{% url 'create-job' %\}" method="post" enctype="multipart\/form-data">/, "the upload form submission contract"],
  [/class="project-routing-panel" aria-label="Project routing"/, "the project routing panel"],
  [/class="drop-zone" for="id_image" data-drop-zone/, "the upload drop-zone hook"],
  [/data-preview-image hidden alt="Selected formula preview"/, "the selected-image preview hook"],
  [/data-preview-wrap hidden/, "the selected-image metadata wrapper hook"],
  [/data-preview-name/, "the selected-image name hook"],
  [/data-preview-meta/, "the selected-image metadata hook"],
  [/data-launch-button/, "the launch button hook"],
  [/class="model-status-light is-\{\{ model_status\.state\|default:'unknown' \}\}"/, "the model status light state class"],
  [/class="status-readout is-\{\{ model_status\.state\|default:'unknown' \}\}"/, "the model status text state class"],
  [/class="recent-list"/, "the recent missions list"],
  [/class="status-badge status-\{\{ job\.status\|lower \}\}"/, "the recent mission status badge"],
], "Workbench template");

const progress = read("apps/formulas/templates/formulas/progress.html");
assertHasAll(progress, [
  [/data-status-url="\{% url 'api-mission-status' job\.id %\}"/, "the mission polling URL"],
  [/data-report-url="\{% url 'mission-report' job\.id %\}"/, "the report URL"],
  [/data-current-stage-code="\{\{ job\.stage_code \}\}"/, "the initial stage code"],
  [/data-scan-wrapper/, "the scan wrapper hook"],
  [/data-stage/, "the stage label hook"],
  [/data-progress-value/, "the progress value hook"],
  [/data-progress-state/, "the progress state hook"],
  [/data-progress-bar data-initial-progress="\{\{ job\.progress \}\}"/, "the progress bar hook"],
  [/data-log-feed/, "the terminal log feed hook"],
  [/data-stage-item="UPLOAD_LOCKED"/, "the upload stage hook"],
  [/data-stage-item="RESULT_READY"/, "the result-ready stage hook"],
  [/data-report-link/, "the report link hook"],
  [/data-failure/, "the failure details hook"],
  [/data-error/, "the failure error hook"],
], "Progress template");

const history = read("apps/formulas/templates/formulas/history.html");
assertHasAll(history, [
  [/<form class="history-toolbar" action="\{% url 'history' %\}" method="get">/, "the history search form"],
  [/class="status-filter" aria-label="Mission status filter"/, "the status filter"],
  [/class="timeline\{% if not active_status %\} is-all-view\{% endif %\}"/, "the all-view timeline modifier"],
  [/class="timeline-entry status-\{\{ job\.status \}\}"/, "the mission status card class"],
  [/data-layout-summary/, "the layout summary hook"],
  [/href="\{% url 'mission-progress' job\.id %\}"/, "the mission progress link"],
  [/href="\{% url 'mission-report' job\.id %\}"/, "the succeeded report link"],
  [/action="\{% url 'retry-mission' job\.id %\}"/, "the failed mission retry action"],
], "History template");

const result = read("apps/formulas/templates/formulas/result.html");
assertHasAll(result, [
  [/\{\{ formats\|json_script:"latex-formats" \}\}/, "the LaTeX formats boot data"],
  [/data-katex-preview-container/, "the KaTeX preview container hook"],
  [/data-katex-preview/, "the KaTeX preview render hook"],
  [/data-paper-fit-preview/, "the paper-fit preview root hook"],
  [/data-paper-fit-width/, "the paper-fit width metric hook"],
  [/data-paper-fit-lines/, "the paper-fit line metric hook"],
  [/data-paper-fit-tight/, "the paper-fit tightness metric hook"],
  [/data-paper-fit-message/, "the paper-fit message hook"],
  [/data-format-tab="raw"/, "the raw format tab"],
  [/data-format-tab="block"/, "the block format tab"],
  [/data-format-tab="inline"/, "the inline format tab"],
  [/data-copy-current/, "the copy-current button hook"],
  [/data-latex-output/, "the LaTeX output hook"],
], "Result template");

const projectWorkspace = read("apps/formulas/templates/formulas/project_workspace.html");
assertHasAll(projectWorkspace, [
  [/\{\{ paper_preview_items\|json_script:"paper-preview-data" \}\}/, "the paper preview boot data"],
  [/id="workspace-editor-root"/, "the workspace editor React mount root"],
  [/data-project-id="\{\{ project\.id \}\}"/, "the project id boot attribute"],
  [/data-initial-item-id=""/, "the initial item boot attribute"],
  [/data-project-items-url="\{% url 'api-project-items' project\.id %\}"/, "the project items API URL"],
  [/class="workspace-shell"/, "the server-rendered workspace shell"],
  [/class="workspace-overview" aria-label="Project overview"/, "the overview metrics region"],
  [/class="paper-preview-panel" aria-label="Paper preview"/, "the paper preview region"],
  [/data-paper-preview-slot data-preview-code="\{\{ preview_item\.code \}\}"/, "the paper preview formula hook"],
  [/href="\{% url 'export-project' project\.id 'tex' %\}"/, "the TeX export action"],
  [/href="\{% url 'export-project' project\.id 'markdown' %\}"/, "the Markdown export action"],
], "Project workspace template");

const system = read("apps/formulas/templates/formulas/system.html");
assertHasAll(system, [
  [/\{\{ health_snapshot\|json_script:"initial-health" \}\}/, "the initial health boot data"],
  [/class="system-shell"/, "the system shell root"],
  [/data-health-url="\{% url 'api-system-health' %\}"/, "the system health URL"],
  [/data-warmup-url="\{% url 'api-system-warmup' %\}"/, "the model warmup URL"],
  [/data-queue-pause-url="\{% url 'api-system-queue-pause' %\}"/, "the queue pause URL"],
  [/data-queue-resume-url="\{% url 'api-system-queue-resume' %\}"/, "the queue resume URL"],
  [/data-refresh-label/, "the refresh label hook"],
  [/data-service="WEB"/, "the WEB service row"],
  [/data-service="DATABASE"/, "the DATABASE service row"],
  [/data-service="REDIS"/, "the REDIS service row"],
  [/data-service="WORKER"/, "the WORKER service row"],
  [/data-service="MODEL"/, "the MODEL service row"],
  [/data-service="MEDIA"/, "the MEDIA service row"],
  [/data-health-score/, "the health score hook"],
  [/data-queue-segment="queued"/, "the queued load segment"],
  [/data-queue-count="failed"/, "the failed queue count"],
  [/data-warmup-form/, "the warmup form hook"],
  [/data-warmup-status/, "the warmup status hook"],
  [/data-warmup-button/, "the warmup button hook"],
  [/data-queue-control-form/, "the queue control form hook"],
  [/data-queue-control-state/, "the queue control state hook"],
  [/data-queue-control-status/, "the queue control status hook"],
  [/data-queue-control-button/, "the queue control button hook"],
  [/data-last-job-status/, "the latest mission status hook"],
  [/data-last-job-detail/, "the latest mission detail hook"],
], "System template");

const projects = read("apps/formulas/templates/formulas/projects.html");
assertHasAll(projects, [
  [/class="projects-shell"/, "the projects shell root"],
  [/href="\{% url 'workbench' %\}"/, "the Workbench action"],
  [/class="project-card-grid"/, "the project card grid"],
  [/class="project-card"/, "the project card class"],
  [/href="\{% url 'project-workspace' project\.id %\}"/, "the project workspace link"],
], "Projects template");
