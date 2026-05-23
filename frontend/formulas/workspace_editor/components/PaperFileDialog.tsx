import { useEffect, useState } from "react";

type PaperFileDialogProps = {
  error: string;
  initialPath: string;
  isSaving: boolean;
  mode: "create" | "rename";
  onClose: () => void;
  onSubmit: (path: string) => void;
};

export function PaperFileDialog({ error, initialPath, isSaving, mode, onClose, onSubmit }: PaperFileDialogProps) {
  const [path, setPath] = useState(initialPath);
  const title = mode === "create" ? "New Paper File" : "Rename Paper File";

  useEffect(() => {
    setPath(initialPath);
  }, [initialPath]);

  return (
    <div className="workspace-paper-dialog-backdrop">
      <section
        aria-labelledby="workspace-paper-dialog-title"
        aria-modal="true"
        className="workspace-paper-dialog"
        role="dialog"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(path);
          }}
        >
          <div className="workspace-paper-dialog-heading">
            <p>FILE OPERATION</p>
            <h2 id="workspace-paper-dialog-title">{title}</h2>
          </div>
          <label>
            <span>RELATIVE PATH</span>
            <input
              autoFocus
              onChange={(event) => setPath(event.target.value)}
              placeholder="sections/method.tex"
              value={path}
            />
          </label>
          {error ? <p className="workspace-paper-dialog-error">{error}</p> : null}
          <div className="workspace-paper-dialog-actions">
            <button disabled={isSaving} onClick={onClose} type="button">
              CANCEL
            </button>
            <button disabled={isSaving} type="submit">
              {isSaving ? "SAVING" : mode === "create" ? "CREATE FILE" : "RENAME FILE"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
