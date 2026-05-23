import type { WorkspaceEditorConfig } from "../types";
import { FormulaReviewInbox } from "./FormulaReviewInbox";
import { FormulaSourceEditor } from "./FormulaSourceEditor";
import { PaperDeleteDialog } from "./PaperDeleteDialog";
import { PaperFileDialog } from "./PaperFileDialog";
import { PaperWorkspace } from "./PaperWorkspace";
import { VersionTimeline } from "./VersionTimeline";
import { useFormulaReview } from "../hooks/useFormulaReview";
import { usePaperDocuments } from "../hooks/usePaperDocuments";

type EditorIslandProps = {
  config: WorkspaceEditorConfig;
};

export function EditorIsland({ config }: EditorIslandProps) {
  const formulaReview = useFormulaReview(config);
  const paperDocuments = usePaperDocuments(config.projectId, formulaReview.projectName, {
    onPaperContextChange: () => formulaReview.setFormulaTransferMessage(""),
  });
  const state = combinedState(formulaReview.state, paperDocuments.state);
  const canInsertFormulaIntoPaper = Boolean(paperDocuments.activePaperFile && formulaReview.draftLatex.trim());

  function handleInsertFormulaIntoPaper() {
    formulaReview.setFormulaTransferMessage(paperDocuments.insertFormulaIntoPaper(formulaReview.draftLatex));
  }

  return (
    <div
      className="workspace-editor-island"
      data-editor-state={state}
      data-editor-item-count={formulaReview.items.length}
      data-initial-item-id={config.initialItemId}
      data-project-id={config.projectId}
    >
      <section className="workspace-editor-panel workspace-panel" aria-label="Formula editor island">
        <header className="workspace-editor-header panel-heading">
          <div>
            <p>PROJECT PAPER WORKSPACE</p>
            <h2>{paperDocuments.activePaperFile?.path ?? "No Paper File Selected"}</h2>
          </div>
          <div className="workspace-editor-status" data-save-state={paperDocuments.paperSaveState}>
            {paperDocuments.paperSaveState.toUpperCase()}
          </div>
        </header>

        <PaperWorkspace
          activeFile={paperDocuments.activePaperFile}
          documents={paperDocuments.documents}
          draftContent={paperDocuments.draftPaperContent}
          hasChanges={paperDocuments.hasChanges}
          isFileMutating={paperDocuments.fileMutationState === "saving"}
          isSaving={paperDocuments.paperSaveState === "saving"}
          onCreateFile={paperDocuments.openCreatePaperFileDialog}
          onDeleteFile={paperDocuments.openDeletePaperFileDialog}
          onDraftChange={paperDocuments.updateDraftPaperContent}
          onRenameFile={paperDocuments.openRenamePaperFileDialog}
          onSave={paperDocuments.savePaperDraft}
          onSelectFile={paperDocuments.selectPaperFile}
        />

        {paperDocuments.fileDialog ? (
          <PaperFileDialog
            error={paperDocuments.fileDialogError}
            initialPath={paperDocuments.fileDialog.initialPath}
            isSaving={paperDocuments.fileMutationState === "saving"}
            mode={paperDocuments.fileDialog.mode}
            onClose={() => {
              paperDocuments.setFileDialog(null);
              paperDocuments.setFileDialogError("");
            }}
            onSubmit={paperDocuments.submitPaperFileDialog}
          />
        ) : null}

        {paperDocuments.deleteDialogFile ? (
          <PaperDeleteDialog
            error={paperDocuments.deleteDialogError}
            file={paperDocuments.deleteDialogFile}
            isDeleting={paperDocuments.fileMutationState === "saving"}
            onClose={() => {
              paperDocuments.setDeleteDialogFile(null);
              paperDocuments.setDeleteDialogError("");
            }}
            onConfirm={paperDocuments.confirmDeletePaperFile}
          />
        ) : null}

        <header className="workspace-editor-header workspace-formula-header panel-heading">
          <div>
            <p>FORMULA MATERIALS</p>
            <h2>{formulaReview.activeItem?.formula_code ?? "No Formula Selected"}</h2>
          </div>
          <div className="workspace-editor-status" data-save-state={formulaReview.saveState}>
            {formulaReview.saveState.toUpperCase()}
          </div>
        </header>

        <div className="workspace-editor-grid">
          <FormulaReviewInbox
            activeItemId={formulaReview.activeItem?.id}
            items={formulaReview.items}
            onSelect={formulaReview.selectItem}
          />

          <FormulaSourceEditor
            canInsertIntoPaper={canInsertFormulaIntoPaper}
            draftLatex={formulaReview.draftLatex}
            hasChanges={formulaReview.hasChanges}
            insertTargetPath={paperDocuments.activePaperFile?.path}
            isSaving={formulaReview.saveState === "saving"}
            onDraftChange={formulaReview.updateDraftLatex}
            onInsertIntoPaper={handleInsertFormulaIntoPaper}
            onSave={formulaReview.saveDraft}
            transferMessage={formulaReview.formulaTransferMessage}
          />

          <VersionTimeline
            onRestore={formulaReview.restoreVersion}
            restoringVersionId={formulaReview.restoringVersionId}
            versions={formulaReview.versions}
          />
        </div>
      </section>
    </div>
  );
}

function combinedState(...states: string[]) {
  if (states.includes("error")) {
    return "error";
  }
  if (states.includes("loading") || states.includes("idle")) {
    return "loading";
  }
  return "ready";
}
