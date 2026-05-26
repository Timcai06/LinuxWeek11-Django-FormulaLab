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

const sharedKatex = read("apps/formulas/static/formulas/js/shared/katex_preview.js");
assertHasAll(sharedKatex, [
  [/window\.FormulaLab = window\.FormulaLab \|\| \{\}/, "the shared FormulaLab namespace"],
  [/window\.FormulaLab\.previewSource = function previewSource\(formats, value\)/, "previewSource(formats, value)"],
  [/window\.FormulaLab\.renderKatexPreview = function renderKatexPreview\(preview, source, displayMode\)/, "renderKatexPreview(preview, source, displayMode)"],
  [/window\.katex\.render\(source, preview, \{throwOnError: false, displayMode\}\)/, "the existing KaTeX render options"],
], "Shared KaTeX module");

const sharedTabs = read("apps/formulas/static/formulas/js/shared/format_tabs.js");
assertHasAll(sharedTabs, [
  [/window\.FormulaLab = window\.FormulaLab \|\| \{\}/, "the shared FormulaLab namespace"],
  [/window\.FormulaLab\.bindFormatTabs = function bindFormatTabs\(tabs, onSelect\)/, "bindFormatTabs(tabs, onSelect)"],
  [/tab\.addEventListener\("click", \(\) => onSelect\(tab\.dataset\.formatTab\)\)/, "the format tab click contract"],
], "Shared format tabs module");

const layout = read("frontend/formulas/layout_intelligence.js");
assertHasAll(layout, [
  [/formulaLayoutTarget\.FormulaLayout = \{/, "the FormulaLayout global export"],
  [/measureTextBlock,/, "measureTextBlock export"],
  [/measureLatexSummary,/, "measureLatexSummary export"],
  [/findTightWidth,/, "findTightWidth export"],
  [/collectLineWidths,/, "collectLineWidths export"],
  [/fitTextToLines,/, "fitTextToLines export"],
  [/measureReviewCard,/, "measureReviewCard export"],
], "Layout intelligence module");

const resultCore = read("apps/formulas/static/formulas/js/result/core.js");
assertHasAll(resultCore, [
  [/const result = window\.FormulaResult \|\| \{\}/, "the FormulaResult namespace read"],
  [/result\.state = result\.state \|\| \{ current: "block", renderSequence: 0 \}/, "the result state default"],
  [/result\.maxKatexAttempts = 80/, "the KaTeX retry budget"],
  [/result\.tabIndices = \{ raw: 0, block: 1, inline: 2 \}/, "the format tab index map"],
  [/result\.nodes = nodes/, "nodes export"],
  [/result\.formulaLab = formulaLab/, "formulaLab export"],
  [/result\.formats = formats/, "formats export"],
  [/result\.ready = ready/, "ready export"],
  [/result\.metricNumber = metricNumber/, "metricNumber export"],
  [/result\.tightWidthValue = tightWidthValue/, "tightWidthValue export"],
  [/window\.FormulaResult = result/, "the FormulaResult namespace write"],
], "Result core module");

const resultModules = new Map([
  ["apps/formulas/static/formulas/js/result/preview.js", [
    [/result\.renderPreview = renderPreview/, "renderPreview export"],
    [/const lab = result\.formulaLab\(\)/, "shared FormulaLab lookup"],
    [/lab\.previewSource\(result\.formats\(\), value\)/, "shared previewSource usage"],
    [/lab\.renderKatexPreview\(dom\.preview, source, true\)/, "shared KaTeX preview rendering"],
  ]],
  ["apps/formulas/static/formulas/js/result/paper_fit.js", [
    [/result\.updatePaperFit = updatePaperFit/, "updatePaperFit export"],
    [/window\.FormulaLayout/, "FormulaLayout dependency"],
  ]],
  ["apps/formulas/static/formulas/js/result/format_controls.js", [
    [/result\.selectFormat = selectFormat/, "selectFormat export"],
    [/result\.setupFormatControls = setupFormatControls/, "setupFormatControls export"],
    [/result\.formulaLab\(\)\.bindFormatTabs\(dom\.tabs, selectFormat\)/, "shared bindFormatTabs usage"],
  ]],
  ["apps/formulas/static/formulas/js/result/theme.js", [
    [/result\.setupPreviewTheme = setupPreviewTheme/, "setupPreviewTheme export"],
  ]],
  ["apps/formulas/static/formulas/js/result/copy.js", [
    [/result\.setupCopyButton = setupCopyButton/, "setupCopyButton export"],
  ]],
  ["apps/formulas/static/formulas/js/result/image_viewport.js", [
    [/result\.setupImageViewport = setupImageViewport/, "setupImageViewport export"],
  ]],
  ["apps/formulas/static/formulas/js/result/index.js", [
    [/result\.setupFormatControls\(\)/, "format controls initialization"],
    [/result\.setupPreviewTheme\(\)/, "preview theme initialization"],
    [/result\.setupCopyButton\(\)/, "copy initialization"],
    [/result\.setupImageViewport\(\)/, "image viewport initialization"],
    [/result\.selectFormat\("block"\)/, "initial block format selection"],
  ]],
]);

for (const [path, entries] of resultModules) {
  assertHasAll(read(path), entries, path);
}

const systemCore = read("apps/formulas/static/formulas/js/system/core.js");
assertHasAll(systemCore, [
  [/const system = window\.FormulaSystem \|\| \{\}/, "the FormulaSystem namespace read"],
  [/system\.nodes = nodes/, "nodes export"],
  [/system\.getCookie = getCookie/, "getCookie export"],
  [/system\.label = label/, "label export"],
  [/system\.statusClass = statusClass/, "statusClass export"],
  [/system\.renderDetail = renderDetail/, "renderDetail export"],
  [/window\.FormulaSystem = system/, "the FormulaSystem namespace write"],
], "System core module");

const systemModules = new Map([
  ["apps/formulas/static/formulas/js/system/service_entries.js", [
    [/system\.modelStatusClass = modelStatusClass/, "modelStatusClass export"],
    [/system\.modelMessage = modelMessage/, "modelMessage export"],
    [/system\.serviceEntries = serviceEntries/, "serviceEntries export"],
  ]],
  ["apps/formulas/static/formulas/js/system/health_render.js", [
    [/system\.renderHealth = renderHealth/, "renderHealth export"],
  ]],
  ["apps/formulas/static/formulas/js/system/polling.js", [
    [/system\.refreshHealth = refreshHealth/, "refreshHealth export"],
    [/system\.renderInitialHealth = renderInitialHealth/, "renderInitialHealth export"],
  ]],
  ["apps/formulas/static/formulas/js/system/warmup.js", [
    [/system\.setupWarmupForm = setupWarmupForm/, "setupWarmupForm export"],
  ]],
  ["apps/formulas/static/formulas/js/system/queue_control.js", [
    [/system\.setupQueueControlForm = setupQueueControlForm/, "setupQueueControlForm export"],
  ]],
  ["apps/formulas/static/formulas/js/system/index.js", [
    [/system\.setupWarmupForm\(\)/, "warmup form initialization"],
    [/system\.setupQueueControlForm\(\)/, "queue control initialization"],
    [/system\.renderInitialHealth\(\)/, "initial health render"],
    [/window\.setTimeout\(system\.refreshHealth, 600\)/, "deferred health refresh"],
  ]],
]);

for (const [path, entries] of systemModules) {
  assertHasAll(read(path), entries, path);
}

const projectCore = read("apps/formulas/static/formulas/js/project_workspace/core.js");
assertHasAll(projectCore, [
  [/const workspace = window\.FormulaProjectWorkspace \|\| \{\}/, "the FormulaProjectWorkspace namespace read"],
  [/workspace\.cleanLatex = cleanLatex/, "cleanLatex export"],
  [/workspace\.renderLatex = renderLatex/, "renderLatex export"],
  [/workspace\.renderWhenReady = renderWhenReady/, "renderWhenReady export"],
  [/workspace\.readJsonScript = readJsonScript/, "readJsonScript export"],
  [/workspace\.previewData = \(\) => readJsonScript\("paper-preview-data"\)/, "previewData export"],
  [/window\.FormulaProjectWorkspace = workspace/, "the FormulaProjectWorkspace namespace write"],
], "Project workspace core module");

const projectModules = new Map([
  ["apps/formulas/static/formulas/js/project_workspace/preview.js", [
    [/workspace\.renderFormulaItems = renderFormulaItems/, "renderFormulaItems export"],
    [/workspace\.renderPaperPreview = renderPaperPreview/, "renderPaperPreview export"],
  ]],
  ["apps/formulas/static/formulas/js/project_workspace/paper_fit.js", [
    [/workspace\.updateInspectorFit = updateInspectorFit/, "updateInspectorFit export"],
    [/window\.FormulaLayout/, "FormulaLayout dependency"],
  ]],
  ["apps/formulas/static/formulas/js/project_workspace/index.js", [
    [/workspace\.renderWhenReady\(\(\) => \{/, "deferred project workspace rendering"],
    [/workspace\.renderFormulaItems\(\)/, "formula item preview initialization"],
    [/workspace\.renderPaperPreview\(\)/, "paper preview initialization"],
  ]],
]);

for (const [path, entries] of projectModules) {
  assertHasAll(read(path), entries, path);
}

const standaloneModules = new Map([
  ["apps/formulas/static/formulas/js/workbench.js", [
    [/\[data-drop-zone\]/, "drop-zone lookup"],
    [/\[data-preview-image\]/, "preview image lookup"],
    [/\[data-preview-wrap\]/, "preview metadata lookup"],
    [/\[data-launch-button\]/, "launch button lookup"],
    [/input\.addEventListener\("change"/, "file input change handler"],
    [/dropZone\.addEventListener\("drop"/, "drop handler"],
  ]],
  ["apps/formulas/static/formulas/js/history.js", [
    [/window\.FormulaLayout/, "FormulaLayout dependency"],
    [/\[data-layout-summary\]/, "summary measurement hook"],
    [/window\.addEventListener\("load", \(\) => \{/, "load initialization"],
    [/window\.addEventListener\("resize", applyMeasuredSummaries\)/, "resize remeasurement"],
  ]],
  ["apps/formulas/static/formulas/js/progress.js", [
    [/\[data-status-url\]/, "status polling root lookup"],
    [/\[data-stage-item\]/, "stage item lookup"],
    [/window\.setTimeout\(poll, 800\)/, "initial polling delay"],
    [/window\.setTimeout\(poll, 1800\)/, "active polling delay"],
    [/window\.setTimeout\(poll, 3200\)/, "terminal polling delay"],
  ]],
]);

for (const [path, entries] of standaloneModules) {
  assertHasAll(read(path), entries, path);
}
