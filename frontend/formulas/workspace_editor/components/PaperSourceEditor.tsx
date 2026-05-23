type PaperSourceEditorProps = {
  content: string;
  hasChanges: boolean;
  isSaving: boolean;
  onChange: (content: string) => void;
  onSave: () => void;
  path?: string;
};

export function PaperSourceEditor({ content, hasChanges, isSaving, onChange, onSave, path }: PaperSourceEditorProps) {
  return (
    <form className="workspace-paper-source" onSubmit={(event) => event.preventDefault()}>
      <label>
        <span>{path ? `SOURCE / ${path}` : "SOURCE"}</span>
        <textarea onChange={(event) => onChange(event.target.value)} spellCheck={false} value={content} />
      </label>
      <div>
        <button disabled={!hasChanges || isSaving} onClick={onSave} type="button">
          SAVE FILE
        </button>
      </div>
    </form>
  );
}
