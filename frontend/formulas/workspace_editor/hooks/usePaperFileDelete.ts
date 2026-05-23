import { useState } from "react";

import { deletePaperFile } from "../api";
import type { PaperFile } from "../types";
import { readCsrfToken } from "./csrf";

type SaveState = "idle" | "saving" | "saved" | "error";

type UsePaperFileDeleteOptions = {
  onDeleted: (file: PaperFile) => void;
};

export function usePaperFileDelete({ onDeleted }: UsePaperFileDeleteOptions) {
  const [deleteDialogFile, setDeleteDialogFile] = useState<PaperFile | null>(null);
  const [deleteDialogError, setDeleteDialogError] = useState("");
  const [deleteMutationState, setDeleteMutationState] = useState<SaveState>("idle");

  function openDeletePaperFileDialog(file: PaperFile) {
    setDeleteDialogFile(file);
    setDeleteDialogError("");
    setDeleteMutationState("idle");
  }

  async function confirmDeletePaperFile() {
    if (!deleteDialogFile) {
      return;
    }

    setDeleteMutationState("saving");
    try {
      await deletePaperFile(deleteDialogFile.id, readCsrfToken());
      onDeleted(deleteDialogFile);
      setDeleteDialogFile(null);
      setDeleteDialogError("");
      setDeleteMutationState("saved");
    } catch {
      setDeleteMutationState("error");
      setDeleteDialogError("Unable to delete this file. Root files are protected.");
    }
  }

  return {
    confirmDeletePaperFile,
    deleteDialogError,
    deleteDialogFile,
    deleteMutationState,
    openDeletePaperFileDialog,
    setDeleteDialogError,
    setDeleteDialogFile,
  };
}
