import { useState } from "react";

import { createPaperFile, renamePaperFile } from "../api";
import type { PaperDocument, PaperFile } from "../types";
import type { PaperFileTemplateKey } from "../components/PaperFileDialog";
import { defaultPaperFileContent, suggestedFilePath } from "../lib/paperFileContent";
import { readCsrfToken } from "./csrf";

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

type UsePaperFileDialogOptions = {
  onCreated: (documentId: string, file: PaperFile) => void;
  onRenamed: (file: PaperFile) => void;
};

export function usePaperFileDialog({ onCreated, onRenamed }: UsePaperFileDialogOptions) {
  const [fileDialog, setFileDialog] = useState<PaperFileDialogState | null>(null);
  const [fileDialogError, setFileDialogError] = useState("");
  const [fileDialogMutationState, setFileDialogMutationState] = useState<SaveState>("idle");

  function openCreatePaperFileDialog(document: PaperDocument) {
    setFileDialog({ document, initialPath: suggestedFilePath(document), mode: "create" });
    setFileDialogError("");
    setFileDialogMutationState("idle");
  }

  function openRenamePaperFileDialog(file: PaperFile) {
    setFileDialog({ file, initialPath: file.path, mode: "rename" });
    setFileDialogError("");
    setFileDialogMutationState("idle");
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

    setFileDialogMutationState("saving");
    try {
      if (fileDialog.mode === "create") {
        const file = await createPaperFile(
          fileDialog.document.id,
          normalizedPath,
          defaultPaperFileContent(normalizedPath, template),
          readCsrfToken(),
        );
        onCreated(fileDialog.document.id, file);
      } else if (normalizedPath !== fileDialog.file.path) {
        const renamedFile = await renamePaperFile(fileDialog.file.id, normalizedPath, readCsrfToken());
        onRenamed(renamedFile);
      }
      setFileDialog(null);
      setFileDialogError("");
      setFileDialogMutationState("saved");
    } catch {
      setFileDialogMutationState("error");
      setFileDialogError("Unable to save this file path. Check for duplicates or unsafe path segments.");
    }
  }

  return {
    fileDialog,
    fileDialogError,
    fileDialogMutationState,
    openCreatePaperFileDialog,
    openRenamePaperFileDialog,
    setFileDialog,
    setFileDialogError,
    submitPaperFileDialog,
  };
}
