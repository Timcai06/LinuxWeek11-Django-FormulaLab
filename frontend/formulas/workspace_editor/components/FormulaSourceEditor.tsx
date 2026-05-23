import { FormulaPreview } from "./FormulaPreview";

type FormulaSourceEditorProps = {
  canInsertIntoPaper: boolean;
  draftLatex: string;
  hasChanges: boolean;
  insertTargetPath?: string;
  isSaving: boolean;
  onDraftChange: (latex: string) => void;
  onInsertIntoPaper: () => void;
  onSave: () => void;
  transferMessage: string;
};

export function FormulaSourceEditor({
  canInsertIntoPaper,
  draftLatex,
  hasChanges,
  insertTargetPath,
  isSaving,
  onDraftChange,
  onInsertIntoPaper,
  onSave,
  transferMessage,
}: FormulaSourceEditorProps) {
  return (
    <form className="workspace-editor-form" onSubmit={(event) => event.preventDefault()}>
      <div className="workspace-editor-edit-grid">
        <label>
          <span>LATEX SOURCE</span>
          <textarea
            onChange={(event) => onDraftChange(event.target.value)}
            spellCheck={false}
            value={draftLatex}
          />
        </label>
        <FormulaPreview latex={draftLatex} />
      </div>
      <div className="workspace-editor-actions">
        <div className="workspace-formula-transfer" aria-live="polite">
          {transferMessage || (insertTargetPath ? `Target: ${insertTargetPath}` : "Select a paper file to insert.")}
        </div>
        <button disabled={!canInsertIntoPaper} onClick={onInsertIntoPaper} type="button">
          INSERT INTO PAPER
        </button>
        <button disabled={!hasChanges || isSaving} onClick={onSave} type="button">
          SAVE
        </button>
      </div>
    </form>
  );
}
