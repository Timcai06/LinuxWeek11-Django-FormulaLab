import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const entryPath = "frontend/formulas/workspace_editor/styles/workspace-editor.css";
const entrySource = readFileSync(entryPath, "utf8");

assert.equal(
  entrySource,
  [
    '@import "./workspace-editor/shell.css";',
    '@import "./workspace-editor/paper-workspace.css";',
    '@import "./workspace-editor/dialogs.css";',
    '@import "./workspace-editor/formula-editor.css";',
    '@import "./workspace-editor/responsive.css";',
    "",
  ].join("\n"),
  "Workspace editor CSS entry should remain a thin ordered import graph.",
);

const splitFiles = {
  shell: "frontend/formulas/workspace_editor/styles/workspace-editor/shell.css",
  paperWorkspace: "frontend/formulas/workspace_editor/styles/workspace-editor/paper-workspace.css",
  dialogs: "frontend/formulas/workspace_editor/styles/workspace-editor/dialogs.css",
  formulaEditor: "frontend/formulas/workspace_editor/styles/workspace-editor/formula-editor.css",
  responsive: "frontend/formulas/workspace_editor/styles/workspace-editor/responsive.css",
};

for (const [name, file] of Object.entries(splitFiles)) {
  assert.ok(existsSync(file), `Workspace editor ${name} CSS split should exist at ${file}.`);
}

const shell = readFileSync(splitFiles.shell, "utf8");
const paperWorkspace = readFileSync(splitFiles.paperWorkspace, "utf8");
const dialogs = readFileSync(splitFiles.dialogs, "utf8");
const formulaEditor = readFileSync(splitFiles.formulaEditor, "utf8");
const responsive = readFileSync(splitFiles.responsive, "utf8");

assert.match(shell, /\.workspace-editor-island\s*\{/, "Shell split should own the editor island root.");
assert.match(shell, /\.workspace-editor-grid\s*\{/, "Shell split should own shared grid layout.");
assert.match(paperWorkspace, /\.workspace-paper-shell\s*\{/, "Paper workspace split should own the paper shell.");
assert.match(paperWorkspace, /\.workspace-code-editor\s*\{/, "Paper workspace split should own CodeMirror frame styling.");
assert.match(dialogs, /\.workspace-paper-dialog-backdrop\s*\{/, "Dialog split should own paper file modal styling.");
assert.match(dialogs, /\.workspace-paper-template-options\s*\{/, "Dialog split should own paper template option styling.");
assert.match(formulaEditor, /\.workspace-editor-form\s*\{/, "Formula editor split should own formula editing layout.");
assert.match(formulaEditor, /\.workspace-editor-version-list\s*\{/, "Formula editor split should own version list styling.");
assert.match(responsive, /@media \(max-width: 1100px\)/, "Responsive split should own large breakpoint overrides.");
assert.match(responsive, /@media \(max-width: 900px\)/, "Responsive split should own compact breakpoint overrides.");
