import { useEffect, useState } from "react";

import {
  createPaperFile,
  createProjectDocument,
  fetchFormulaItem,
  fetchFormulaItemVersions,
  fetchProjectItems,
  fetchProjectDocuments,
  renamePaperFile,
  restoreFormulaItemVersion,
  savePaperFile,
  saveFormulaItem,
} from "../api";
import type { FormulaItem, FormulaItemVersion, PaperDocument, PaperFile, WorkspaceEditorConfig } from "../types";
import { FormulaItemList } from "./FormulaItemList";
import { FormulaSourceEditor } from "./FormulaSourceEditor";
import { PaperWorkspace } from "./PaperWorkspace";
import { VersionTimeline } from "./VersionTimeline";

type LoadState = "idle" | "loading" | "ready" | "error";
type SaveState = "idle" | "saving" | "saved" | "error";

type EditorIslandProps = {
  config: WorkspaceEditorConfig;
};

export function EditorIsland({ config }: EditorIslandProps) {
  const [activeItem, setActiveItem] = useState<FormulaItem | null>(null);
  const [activePaperFile, setActivePaperFile] = useState<PaperFile | null>(null);
  const [draftLatex, setDraftLatex] = useState("");
  const [draftPaperContent, setDraftPaperContent] = useState("");
  const [documents, setDocuments] = useState<PaperDocument[]>([]);
  const [fileMutationState, setFileMutationState] = useState<SaveState>("idle");
  const [items, setItems] = useState<FormulaItem[]>([]);
  const [restoringVersionId, setRestoringVersionId] = useState<number | null>(null);
  const [paperSaveState, setPaperSaveState] = useState<SaveState>("idle");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [state, setState] = useState<LoadState>("idle");
  const [versions, setVersions] = useState<FormulaItemVersion[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    setState("loading");

    Promise.all([
      fetchProjectItems(config.projectItemsUrl, controller.signal),
      fetchProjectDocuments(config.projectId, controller.signal),
    ])
      .then(async ([itemPayload, documentPayload]) => {
        setItems(itemPayload.items);
        const selectedItem =
          itemPayload.items.find((item) => item.id === config.initialItemId) ?? itemPayload.items[0] ?? null;
        setActiveItem(selectedItem);
        setDraftLatex(selectedItem?.latex_current ?? "");
        const hydratedDocuments = documentPayload.documents.length
          ? documentPayload.documents
          : [await createDefaultPaperDocument(config.projectId, itemPayload.project.name)];
        setDocuments(hydratedDocuments);
        const initialFile = firstRootFile(hydratedDocuments);
        setActivePaperFile(initialFile);
        setDraftPaperContent(initialFile?.content ?? "");
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
  const paperHasChanges = Boolean(activePaperFile && draftPaperContent !== activePaperFile.content);

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

  async function savePaperDraft() {
    if (!activePaperFile || !paperHasChanges) {
      return;
    }

    setPaperSaveState("saving");
    try {
      const savedFile = await savePaperFile(activePaperFile.id, draftPaperContent, readCsrfToken());
      applyPaperFileUpdate(savedFile);
      setPaperSaveState("saved");
    } catch {
      setPaperSaveState("error");
    }
  }

  async function createPaperFileFromPrompt(document: PaperDocument) {
    const path = window.prompt("New file path", suggestedFilePath(document));
    if (!path) {
      return;
    }

    setFileMutationState("saving");
    try {
      const file = await createPaperFile(document.id, path.trim(), defaultPaperFileContent(path.trim()), readCsrfToken());
      setDocuments((currentDocuments) =>
        currentDocuments.map((candidate) =>
          candidate.id === document.id ? { ...candidate, files: [...candidate.files, file] } : candidate,
        ),
      );
      setActivePaperFile(file);
      setDraftPaperContent(file.content);
      setPaperSaveState("idle");
      setFileMutationState("saved");
    } catch {
      setFileMutationState("error");
    }
  }

  async function renamePaperFileFromPrompt(file: PaperFile) {
    const path = window.prompt("Rename file path", file.path);
    if (!path || path.trim() === file.path) {
      return;
    }

    setFileMutationState("saving");
    try {
      const renamedFile = await renamePaperFile(file.id, path.trim(), readCsrfToken());
      applyPaperFileUpdate(renamedFile);
      setFileMutationState("saved");
    } catch {
      setFileMutationState("error");
    }
  }

  function selectPaperFile(file: PaperFile) {
    setActivePaperFile(file);
    setDraftPaperContent(file.content);
    setPaperSaveState("idle");
  }

  function applyPaperFileUpdate(updatedFile: PaperFile) {
    setActivePaperFile(updatedFile);
    setDraftPaperContent(updatedFile.content);
    setDocuments((currentDocuments) =>
      currentDocuments.map((document) => ({
        ...document,
        files: document.files.map((file) => (file.id === updatedFile.id ? updatedFile : file)),
      })),
    );
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
      setItems((currentItems) =>
        currentItems.map((item) => {
          if (item.id === payload.item.id) {
            return payload.item;
          }
          return item;
        }),
      );
      const versionPayload = await fetchFormulaItemVersions(payload.item.id);
      setVersions(versionPayload.versions);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    } finally {
      setRestoringVersionId(null);
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
      <section className="workspace-editor-panel workspace-panel" aria-label="Formula editor island">
        <header className="workspace-editor-header panel-heading">
          <div>
            <p>PROJECT PAPER WORKSPACE</p>
            <h2>{activePaperFile?.path ?? "No Paper File Selected"}</h2>
          </div>
          <div className="workspace-editor-status" data-save-state={paperSaveState}>
            {paperSaveState.toUpperCase()}
          </div>
        </header>

        <PaperWorkspace
          activeFile={activePaperFile}
          documents={documents}
          draftContent={draftPaperContent}
          hasChanges={paperHasChanges}
          isFileMutating={fileMutationState === "saving"}
          isSaving={paperSaveState === "saving"}
          onCreateFile={createPaperFileFromPrompt}
          onDraftChange={(content) => {
            setDraftPaperContent(content);
            setPaperSaveState("idle");
          }}
          onRenameFile={renamePaperFileFromPrompt}
          onSave={savePaperDraft}
          onSelectFile={selectPaperFile}
        />

        <header className="workspace-editor-header workspace-formula-header panel-heading">
          <div>
            <p>FORMULA MATERIALS</p>
            <h2>{activeItem?.formula_code ?? "No Formula Selected"}</h2>
          </div>
          <div className="workspace-editor-status" data-save-state={saveState}>
            {saveState.toUpperCase()}
          </div>
        </header>

        <div className="workspace-editor-grid">
          <FormulaItemList activeItemId={activeItem?.id} items={items} onSelect={selectItem} />

          <FormulaSourceEditor
            draftLatex={draftLatex}
            hasChanges={hasChanges}
            isSaving={saveState === "saving"}
            onDraftChange={(latex) => {
              setDraftLatex(latex);
              setSaveState("idle");
            }}
            onSave={saveDraft}
          />

          <VersionTimeline onRestore={restoreVersion} restoringVersionId={restoringVersionId} versions={versions} />
        </div>
      </section>
    </div>
  );
}

function readCsrfToken(): string {
  const tokenInput = document.querySelector<HTMLInputElement>("input[name='csrfmiddlewaretoken']");
  return tokenInput?.value ?? "";
}

async function createDefaultPaperDocument(projectId: string, projectName: string): Promise<PaperDocument> {
  const payload = await createProjectDocument(projectId, `${projectName} manuscript`, readCsrfToken());
  return {
    ...payload.document,
    files: payload.files,
  };
}

function firstRootFile(documents: PaperDocument[]): PaperFile | null {
  const document = documents[0];
  if (!document) {
    return null;
  }
  return document.files.find((file) => file.path === document.root_file_path) ?? document.files[0] ?? null;
}

function suggestedFilePath(document: PaperDocument): string {
  return `sections/section-${document.files.length + 1}.tex`;
}

function defaultPaperFileContent(path: string): string {
  if (path.endsWith(".bib")) {
    return "";
  }
  return "% New manuscript file\n";
}
