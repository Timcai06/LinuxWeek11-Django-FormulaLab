import { useEffect, useState } from "react";

import {
  createPaperFile,
  createProjectDocument,
  deletePaperFile,
  fetchProjectDocuments,
  renamePaperFile,
  savePaperFile,
} from "../api";
import type { PaperDocument, PaperFile } from "../types";
import type { PaperFileTemplateKey } from "../components/PaperFileDialog";
import { readCsrfToken } from "./csrf";

type LoadState = "idle" | "loading" | "ready" | "error";
type SaveState = "idle" | "saving" | "saved" | "error";

export type PaperFileDialogState =
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

type UsePaperDocumentsOptions = {
  onPaperContextChange?: () => void;
};

export function usePaperDocuments(projectId: string, projectName: string, options: UsePaperDocumentsOptions = {}) {
  const [activePaperFile, setActivePaperFile] = useState<PaperFile | null>(null);
  const [deleteDialogFile, setDeleteDialogFile] = useState<PaperFile | null>(null);
  const [deleteDialogError, setDeleteDialogError] = useState("");
  const [documents, setDocuments] = useState<PaperDocument[]>([]);
  const [draftPaperContent, setDraftPaperContent] = useState("");
  const [fileDialog, setFileDialog] = useState<PaperFileDialogState | null>(null);
  const [fileDialogError, setFileDialogError] = useState("");
  const [fileMutationState, setFileMutationState] = useState<SaveState>("idle");
  const [paperSaveState, setPaperSaveState] = useState<SaveState>("idle");
  const [state, setState] = useState<LoadState>("idle");

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
        options.onPaperContextChange?.();
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
    options.onPaperContextChange?.();
  }

  function updateDraftPaperContent(content: string) {
    setDraftPaperContent(content);
    setPaperSaveState("idle");
  }

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
      options.onPaperContextChange?.();
    }
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
    confirmDeletePaperFile,
    deleteDialogError,
    deleteDialogFile,
    documents,
    draftPaperContent,
    fileDialog,
    fileDialogError,
    fileMutationState,
    hasChanges,
    insertFormulaIntoPaper,
    openCreatePaperFileDialog,
    openDeletePaperFileDialog,
    openRenamePaperFileDialog,
    paperSaveState,
    savePaperDraft,
    selectPaperFile,
    setDeleteDialogError,
    setDeleteDialogFile,
    setFileDialog,
    setFileDialogError,
    state,
    submitPaperFileDialog,
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

function insertEquationBlock(content: string, latex: string): string {
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
