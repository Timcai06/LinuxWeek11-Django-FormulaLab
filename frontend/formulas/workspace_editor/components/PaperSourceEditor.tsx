import { PaperCodeEditor } from "./PaperCodeEditor";

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
        <PaperCodeEditor content={content} onChange={onChange} />
      </label>
      <div>
        <button disabled={!hasChanges || isSaving} onClick={onSave} type="button">
          SAVE FILE
        </button>
      </div>
    </form>
  );
}
