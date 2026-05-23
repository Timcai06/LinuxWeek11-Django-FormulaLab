import { useEffect, useState } from "react";

import {
  fetchFormulaItem,
  fetchFormulaItemVersions,
  fetchProjectItems,
  restoreFormulaItemVersion,
  saveFormulaItem,
} from "../api";
import type { FormulaItem, FormulaItemVersion, WorkspaceEditorConfig } from "../types";
import { readCsrfToken } from "./csrf";

type LoadState = "idle" | "loading" | "ready" | "error";
type SaveState = "idle" | "saving" | "saved" | "error";

export function useFormulaReview(config: WorkspaceEditorConfig) {
  const [activeItem, setActiveItem] = useState<FormulaItem | null>(null);
  const [draftLatex, setDraftLatex] = useState("");
  const [formulaTransferMessage, setFormulaTransferMessage] = useState("");
  const [items, setItems] = useState<FormulaItem[]>([]);
  const [projectName, setProjectName] = useState("");
  const [restoringVersionId, setRestoringVersionId] = useState<number | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [state, setState] = useState<LoadState>("idle");
  const [versions, setVersions] = useState<FormulaItemVersion[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    setState("loading");

    fetchProjectItems(config.projectItemsUrl, controller.signal)
      .then((itemPayload) => {
        setItems(itemPayload.items);
        setProjectName(itemPayload.project.name);
        const selectedItem =
          itemPayload.items.find((item) => item.id === config.initialItemId) ?? itemPayload.items[0] ?? null;
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
    setFormulaTransferMessage("");
  }

  function updateDraftLatex(latex: string) {
    setDraftLatex(latex);
    setSaveState("idle");
    setFormulaTransferMessage("");
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
      setItems((currentItems) => updateItemInList(currentItems, freshItem));
      const versionPayload = await fetchFormulaItemVersions(freshItem.id);
      setVersions(versionPayload.versions);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }

  async function restoreVersion(versionId: number) {
    if (!activeItem) {
      return;
    }

    setRestoringVersionId(versionId);
    setSaveState("saving");
    try {
      const payload = await restoreFormulaItemVersion(activeItem.id, versionId, readCsrfToken());
      setActiveItem(payload.item);
      setDraftLatex(payload.item.latex_current);
      setItems((currentItems) => updateItemInList(currentItems, payload.item));
      const versionPayload = await fetchFormulaItemVersions(payload.item.id);
      setVersions(versionPayload.versions);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    } finally {
      setRestoringVersionId(null);
    }
  }

  return {
    activeItem,
    draftLatex,
    formulaTransferMessage,
    hasChanges,
    items,
    projectName,
    restoringVersionId,
    saveDraft,
    saveState,
    selectItem,
    setFormulaTransferMessage,
    state,
    updateDraftLatex,
    restoreVersion,
    versions,
  };
}

function updateItemInList(items: FormulaItem[], updatedItem: FormulaItem): FormulaItem[] {
  return items.map((item) => {
    if (item.id === updatedItem.id) {
      return updatedItem;
    }
    return item;
  });
}
