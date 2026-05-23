import { useEffect, useState } from "react";

import { createProjectDocument, fetchProjectDocuments, savePaperFile } from "../api";
import type { PaperDocument, PaperFile } from "../types";
import { firstRootFile, insertEquationBlock } from "../lib/paperFileContent";
import { readCsrfToken } from "./csrf";
import { usePaperFileDelete } from "./usePaperFileDelete";
import { usePaperFileDialog } from "./usePaperFileDialog";

type LoadState = "idle" | "loading" | "ready" | "error";
type SaveState = "idle" | "saving" | "saved" | "error";

type UsePaperDocumentsOptions = {
  onPaperContextChange?: () => void;
};

export function usePaperDocuments(projectId: string, projectName: string, options: UsePaperDocumentsOptions = {}) {
  const [activePaperFile, setActivePaperFile] = useState<PaperFile | null>(null);
  const [documents, setDocuments] = useState<PaperDocument[]>([]);
  const [draftPaperContent, setDraftPaperContent] = useState("");
  const [paperSaveState, setPaperSaveState] = useState<SaveState>("idle");
  const [state, setState] = useState<LoadState>("idle");

  function applyPaperFileUpdate(updatedFile: PaperFile) {
    setActivePaperFile(updatedFile);
    setDraftPaperContent(updatedFile.content);
    options.onPaperContextChange?.();
    setDocuments((currentDocuments) =>
      currentDocuments.map((document) => ({
        ...document,
        files: document.files.map((file) => (file.id === updatedFile.id ? updatedFile : file)),
      })),
    );
  }

  function handleCreatedPaperFile(documentId: string, file: PaperFile) {
    setDocuments((currentDocuments) =>
      currentDocuments.map((candidate) =>
        candidate.id === documentId ? { ...candidate, files: [...candidate.files, file] } : candidate,
      ),
    );
    setActivePaperFile(file);
    setDraftPaperContent(file.content);
    setPaperSaveState("idle");
    options.onPaperContextChange?.();
  }

  function removePaperFile(deletedFile: PaperFile) {
    const sourceDocument = documents.find((document) => document.id === deletedFile.document_id);
    const remainingFiles = sourceDocument?.files.filter((file) => file.id !== deletedFile.id) ?? [];
    const fallbackFile =
      remainingFiles.find((file) => file.path === sourceDocument?.root_file_path) ?? remainingFiles[0] ?? null;

    setDocuments((currentDocuments) =>
      currentDocuments.map((document) => ({
        ...document,
        files: document.files.filter((file) => file.id !== deletedFile.id),
      })),
    );

    if (activePaperFile?.id === deletedFile.id) {
      setActivePaperFile(fallbackFile);
      setDraftPaperContent(fallbackFile?.content ?? "");
      setPaperSaveState("idle");
      options.onPaperContextChange?.();
    }
  }

  const fileDialogControls = usePaperFileDialog({
    onCreated: handleCreatedPaperFile,
    onRenamed: applyPaperFileUpdate,
  });
  const deleteDialogControls = usePaperFileDelete({ onDeleted: removePaperFile });

  useEffect(() => {
    if (!projectName) {
      return undefined;
    }

    const controller = new AbortController();
    setState("loading");

    fetchProjectDocuments(projectId, controller.signal)
      .then(async (documentPayload) => {
        const hydratedDocuments = documentPayload.documents.length
          ? documentPayload.documents
          : [await createDefaultPaperDocument(projectId, projectName)];
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
  }, [projectId, projectName]);

  const hasChanges = Boolean(activePaperFile && draftPaperContent !== activePaperFile.content);
  const fileMutationState = deleteDialogControls.deleteDialogFile
    ? deleteDialogControls.deleteMutationState
    : fileDialogControls.fileDialogMutationState;

  async function savePaperDraft() {
    if (!activePaperFile || !hasChanges) {
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

  function selectPaperFile(file: PaperFile) {
    setActivePaperFile(file);
    setDraftPaperContent(file.content);
    setPaperSaveState("idle");
    options.onPaperContextChange?.();
  }

  function updateDraftPaperContent(content: string) {
    setDraftPaperContent(content);
    setPaperSaveState("idle");
  }

  function insertFormulaIntoPaper(latex: string): string {
    if (!activePaperFile || !latex.trim()) {
      return "";
    }

    setDraftPaperContent((currentContent) => insertEquationBlock(currentContent, latex));
    setPaperSaveState("idle");
    return `Inserted into ${activePaperFile.path}. Save the paper file to persist it.`;
  }

  return {
    activePaperFile,
    confirmDeletePaperFile: deleteDialogControls.confirmDeletePaperFile,
    deleteDialogError: deleteDialogControls.deleteDialogError,
    deleteDialogFile: deleteDialogControls.deleteDialogFile,
    documents,
    draftPaperContent,
    fileDialog: fileDialogControls.fileDialog,
    fileDialogError: fileDialogControls.fileDialogError,
    fileMutationState,
    hasChanges,
    insertFormulaIntoPaper,
    openCreatePaperFileDialog: fileDialogControls.openCreatePaperFileDialog,
    openDeletePaperFileDialog: deleteDialogControls.openDeletePaperFileDialog,
    openRenamePaperFileDialog: fileDialogControls.openRenamePaperFileDialog,
    paperSaveState,
    savePaperDraft,
    selectPaperFile,
    setDeleteDialogError: deleteDialogControls.setDeleteDialogError,
    setDeleteDialogFile: deleteDialogControls.setDeleteDialogFile,
    setFileDialog: fileDialogControls.setFileDialog,
    setFileDialogError: fileDialogControls.setFileDialogError,
    state,
    submitPaperFileDialog: fileDialogControls.submitPaperFileDialog,
    updateDraftPaperContent,
  };
}

async function createDefaultPaperDocument(projectId: string, projectName: string): Promise<PaperDocument> {
  const payload = await createProjectDocument(projectId, `${projectName} manuscript`, readCsrfToken());
  return {
    ...payload.document,
    files: payload.files,
  };
}
