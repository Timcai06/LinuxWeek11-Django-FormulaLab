import { useEffect, useState } from "react";

import {
  createPaperFile,
  createProjectDocument,
  deletePaperFile,
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
import { FormulaReviewInbox } from "./FormulaReviewInbox";
import { FormulaSourceEditor } from "./FormulaSourceEditor";
import { PaperDeleteDialog } from "./PaperDeleteDialog";
import { PaperFileDialog, type PaperFileTemplateKey } from "./PaperFileDialog";
import { PaperWorkspace } from "./PaperWorkspace";
import { VersionTimeline } from "./VersionTimeline";

type LoadState = "idle" | "loading" | "ready" | "error";
type SaveState = "idle" | "saving" | "saved" | "error";

type EditorIslandProps = {
  config: WorkspaceEditorConfig;
};

type PaperFileDialogState =
  | {
      document: PaperDocument;
      initialPath: string;
      mode: "create";
    }
  | {
      file: PaperFile;
      initialPath: string;
      mode: "rename";
    };

export function EditorIsland({ config }: EditorIslandProps) {
  const [activeItem, setActiveItem] = useState<FormulaItem | null>(null);
  const [activePaperFile, setActivePaperFile] = useState<PaperFile | null>(null);
  const [draftLatex, setDraftLatex] = useState("");
  const [draftPaperContent, setDraftPaperContent] = useState("");
  const [documents, setDocuments] = useState<PaperDocument[]>([]);
  const [deleteDialogFile, setDeleteDialogFile] = useState<PaperFile | null>(null);
  const [deleteDialogError, setDeleteDialogError] = useState("");
  const [fileDialog, setFileDialog] = useState<PaperFileDialogState | null>(null);
  const [fileDialogError, setFileDialogError] = useState("");
  const [fileMutationState, setFileMutationState] = useState<SaveState>("idle");
  const [formulaTransferMessage, setFormulaTransferMessage] = useState("");
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
  const canInsertFormulaIntoPaper = Boolean(activePaperFile && draftLatex.trim());

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

  function openCreatePaperFileDialog(document: PaperDocument) {
    setFileDialog({ document, initialPath: suggestedFilePath(document), mode: "create" });
    setFileDialogError("");
    setFileMutationState("idle");
  }

  function openRenamePaperFileDialog(file: PaperFile) {
    setFileDialog({ file, initialPath: file.path, mode: "rename" });
    setFileDialogError("");
    setFileMutationState("idle");
  }

  async function submitPaperFileDialog(path: string, template: PaperFileTemplateKey) {
    if (!fileDialog) {
      return;
    }

    const normalizedPath = path.trim();
    if (!normalizedPath) {
      setFileDialogError("Path is required.");
      return;
    }

    setFileMutationState("saving");
    try {
      if (fileDialog.mode === "create") {
        const file = await createPaperFile(
          fileDialog.document.id,
          normalizedPath,
          defaultPaperFileContent(normalizedPath, template),
          readCsrfToken(),
        );
        setDocuments((currentDocuments) =>
          currentDocuments.map((candidate) =>
            candidate.id === fileDialog.document.id ? { ...candidate, files: [...candidate.files, file] } : candidate,
          ),
        );
        setActivePaperFile(file);
        setDraftPaperContent(file.content);
        setPaperSaveState("idle");
        setFormulaTransferMessage("");
      } else if (normalizedPath !== fileDialog.file.path) {
        const renamedFile = await renamePaperFile(fileDialog.file.id, normalizedPath, readCsrfToken());
        applyPaperFileUpdate(renamedFile);
      }
      setFileDialog(null);
      setFileDialogError("");
      setFileMutationState("saved");
    } catch {
      setFileMutationState("error");
      setFileDialogError("Unable to save this file path. Check for duplicates or unsafe path segments.");
    }
  }

  function openDeletePaperFileDialog(file: PaperFile) {
    setDeleteDialogFile(file);
    setDeleteDialogError("");
    setFileMutationState("idle");
  }

  async function confirmDeletePaperFile() {
    if (!deleteDialogFile) {
      return;
    }

    setFileMutationState("saving");
    try {
      await deletePaperFile(deleteDialogFile.id, readCsrfToken());
      removePaperFile(deleteDialogFile);
      setDeleteDialogFile(null);
      setDeleteDialogError("");
      setFileMutationState("saved");
    } catch {
      setFileMutationState("error");
      setDeleteDialogError("Unable to delete this file. Root files are protected.");
    }
  }

  function selectPaperFile(file: PaperFile) {
    setActivePaperFile(file);
    setDraftPaperContent(file.content);
    setPaperSaveState("idle");
    setFormulaTransferMessage("");
  }

  function applyPaperFileUpdate(updatedFile: PaperFile) {
    setActivePaperFile(updatedFile);
    setDraftPaperContent(updatedFile.content);
    setFormulaTransferMessage("");
    setDocuments((currentDocuments) =>
      currentDocuments.map((document) => ({
        ...document,
        files: document.files.map((file) => (file.id === updatedFile.id ? updatedFile : file)),
      })),
    );
  }

  function removePaperFile(deletedFile: PaperFile) {
    const sourceDocument = documents.find((document) => document.id === deletedFile.document_id);
    const remainingFiles = sourceDocument?.files.filter((file) => file.id !== deletedFile.id) ?? [];
    const fallbackFile =
      remainingFiles.find((file) => file.path === sourceDocument?.root_file_path) ?? remainingFiles[0] ?? null;

    setDocuments((currentDocuments) =>
      currentDocuments.map((document) => {
        const files = document.files.filter((file) => file.id !== deletedFile.id);
        return { ...document, files };
      }),
    );

    if (activePaperFile?.id === deletedFile.id) {
      setActivePaperFile(fallbackFile);
      setDraftPaperContent(fallbackFile?.content ?? "");
      setPaperSaveState("idle");
      setFormulaTransferMessage("");
    }
  }

  function handleInsertFormulaIntoPaper() {
    if (!activePaperFile || !draftLatex.trim()) {
      return;
    }

    setDraftPaperContent((currentContent) => insertFormulaIntoPaper(currentContent, draftLatex));
    setPaperSaveState("idle");
    setFormulaTransferMessage(`Inserted into ${activePaperFile.path}. Save the paper file to persist it.`);
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
          onCreateFile={openCreatePaperFileDialog}
          onDeleteFile={openDeletePaperFileDialog}
          onDraftChange={(content) => {
            setDraftPaperContent(content);
            setPaperSaveState("idle");
          }}
          onRenameFile={openRenamePaperFileDialog}
          onSave={savePaperDraft}
          onSelectFile={selectPaperFile}
        />

        {fileDialog ? (
          <PaperFileDialog
            error={fileDialogError}
            initialPath={fileDialog.initialPath}
            isSaving={fileMutationState === "saving"}
            mode={fileDialog.mode}
            onClose={() => {
              setFileDialog(null);
              setFileDialogError("");
            }}
            onSubmit={submitPaperFileDialog}
          />
        ) : null}

        {deleteDialogFile ? (
          <PaperDeleteDialog
            error={deleteDialogError}
            file={deleteDialogFile}
            isDeleting={fileMutationState === "saving"}
            onClose={() => {
              setDeleteDialogFile(null);
              setDeleteDialogError("");
            }}
            onConfirm={confirmDeletePaperFile}
          />
        ) : null}

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
          <FormulaReviewInbox activeItemId={activeItem?.id} items={items} onSelect={selectItem} />

          <FormulaSourceEditor
            canInsertIntoPaper={canInsertFormulaIntoPaper}
            draftLatex={draftLatex}
            hasChanges={hasChanges}
            insertTargetPath={activePaperFile?.path}
            isSaving={saveState === "saving"}
            onDraftChange={(latex) => {
              setDraftLatex(latex);
              setSaveState("idle");
              setFormulaTransferMessage("");
            }}
            onInsertIntoPaper={handleInsertFormulaIntoPaper}
            onSave={saveDraft}
            transferMessage={formulaTransferMessage}
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

function defaultPaperFileContent(path: string, template: PaperFileTemplateKey): string {
  if (template === "bibliography" || path.endsWith(".bib")) {
    return "% Bibliography entries\n";
  }
  if (template === "blank") {
    return "";
  }
  const title = path
    .split("/")
    .pop()
    ?.replace(/\.[^.]+$/, "")
    .replace(/[-_]/g, " ");
  return `\\section{${title || "New Section"}}\n\n`;
}

function insertFormulaIntoPaper(content: string, latex: string): string {
  const source = latex.trim();
  if (!source) {
    return content;
  }

  const equationBlock = `\\begin{equation}\n${source}\n\\end{equation}`;
  const endDocumentToken = "\\end{document}";
  const endDocumentIndex = content.lastIndexOf(endDocumentToken);

  if (endDocumentIndex >= 0) {
    const beforeEndDocument = content.slice(0, endDocumentIndex).trimEnd();
    const afterEndDocument = content.slice(endDocumentIndex).trimStart();
    return `${beforeEndDocument}\n\n${equationBlock}\n\n${afterEndDocument}`;
  }

  const existingContent = content.trimEnd();
  if (!existingContent) {
    return `${equationBlock}\n`;
  }
  return `${existingContent}\n\n${equationBlock}\n`;
}
