import { useEffect, useState } from "react";

import { fetchFormulaItem, fetchFormulaItemVersions, fetchProjectItems, saveFormulaItem } from "../api";
import type { FormulaItem, FormulaItemVersion, WorkspaceEditorConfig } from "../types";

type LoadState = "idle" | "loading" | "ready" | "error";
type SaveState = "idle" | "saving" | "saved" | "error";

type EditorIslandProps = {
  config: WorkspaceEditorConfig;
};

export function EditorIsland({ config }: EditorIslandProps) {
  const [activeItem, setActiveItem] = useState<FormulaItem | null>(null);
  const [draftLatex, setDraftLatex] = useState("");
  const [items, setItems] = useState<FormulaItem[]>([]);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [state, setState] = useState<LoadState>("idle");
  const [versions, setVersions] = useState<FormulaItemVersion[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    setState("loading");

    fetchProjectItems(config.projectItemsUrl, controller.signal)
      .then((payload) => {
        setItems(payload.items);
        const selectedItem =
          payload.items.find((item) => item.id === config.initialItemId) ?? payload.items[0] ?? null;
        setActiveItem(selectedItem);
        setDraftLatex(selectedItem?.latex_current ?? "");
        setState("ready");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setState("error");
      });

    return () => controller.abort();
  }, [config.initialItemId, config.projectItemsUrl]);

  useEffect(() => {
    if (!activeItem) {
      setVersions([]);
      return undefined;
    }

    const controller = new AbortController();
    fetchFormulaItemVersions(activeItem.id, controller.signal)
      .then((payload) => setVersions(payload.versions))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setVersions([]);
      });

    return () => controller.abort();
  }, [activeItem]);

  const hasChanges = Boolean(activeItem && draftLatex.trim() && draftLatex !== activeItem.latex_current);

  function selectItem(itemId: string) {
    const item = items.find((candidate) => candidate.id === itemId);
    if (!item) {
      return;
    }
    setActiveItem(item);
    setDraftLatex(item.latex_current);
    setSaveState("idle");
  }

  async function saveDraft() {
    if (!activeItem || !hasChanges) {
      return;
    }

    setSaveState("saving");
    try {
      const savedItem = await saveFormulaItem(activeItem.id, draftLatex, readCsrfToken());
      const freshItem = await fetchFormulaItem(savedItem.id);
      setActiveItem(freshItem);
      setDraftLatex(freshItem.latex_current);
      setItems((currentItems) =>
        currentItems.map((item) => {
          if (item.id === freshItem.id) {
            return freshItem;
          }
          return item;
        }),
      );
      const versionPayload = await fetchFormulaItemVersions(freshItem.id);
      setVersions(versionPayload.versions);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }

  return (
    <div
      className="workspace-editor-island"
      data-editor-state={state}
      data-editor-item-count={items.length}
      data-initial-item-id={config.initialItemId}
      data-project-id={config.projectId}
    >
      <section className="workspace-editor-panel" aria-label="Formula editor island">
        <header className="workspace-editor-header">
          <div>
            <span>REACT EDITOR ISLAND</span>
            <h2>{activeItem?.formula_code ?? "No Formula Selected"}</h2>
          </div>
          <div className="workspace-editor-status" data-save-state={saveState}>
            {saveState.toUpperCase()}
          </div>
        </header>

        <div className="workspace-editor-grid">
          <nav className="workspace-editor-item-list" aria-label="Editor formula items">
            {items.map((item) => (
              <button
                className={item.id === activeItem?.id ? "is-active" : ""}
                key={item.id}
                onClick={() => selectItem(item.id)}
                type="button"
              >
                <span>{item.formula_code}</span>
                <small>{item.review_status.toUpperCase()}</small>
              </button>
            ))}
          </nav>

          <form className="workspace-editor-form" onSubmit={(event) => event.preventDefault()}>
            <label>
              <span>LATEX SOURCE</span>
              <textarea
                onChange={(event) => {
                  setDraftLatex(event.target.value);
                  setSaveState("idle");
                }}
                spellCheck={false}
                value={draftLatex}
              />
            </label>
            <div className="workspace-editor-actions">
              <button disabled={!hasChanges || saveState === "saving"} onClick={saveDraft} type="button">
                SAVE
              </button>
            </div>
          </form>

          <aside className="workspace-editor-version-list" aria-label="Formula version timeline">
            <span>VERSION TIMELINE</span>
            {versions.length ? (
              <ol>
                {versions.map((version) => (
                  <li key={version.id}>
                    <strong>{version.source.toUpperCase()}</strong>
                    <small>{version.created_by_label || "system"}</small>
                    <code>{version.latex}</code>
                  </li>
                ))}
              </ol>
            ) : (
              <p>No versions recorded.</p>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
}

function readCsrfToken(): string {
  const tokenInput = document.querySelector<HTMLInputElement>("input[name='csrfmiddlewaretoken']");
  return tokenInput?.value ?? "";
}
