import { FormulaPreview } from "./FormulaPreview";

type FormulaSourceEditorProps = {
  draftLatex: string;
  hasChanges: boolean;
  isSaving: boolean;
  onDraftChange: (latex: string) => void;
  onSave: () => void;
};

export function FormulaSourceEditor({
  draftLatex,
  hasChanges,
  isSaving,
  onDraftChange,
  onSave,
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
        <button disabled={!hasChanges || isSaving} onClick={onSave} type="button">
          SAVE
        </button>
      </div>
    </form>
  );
}
