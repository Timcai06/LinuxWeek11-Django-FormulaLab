import type { PaperFile } from "../types";

type PaperDeleteDialogProps = {
  error: string;
  file: PaperFile;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function PaperDeleteDialog({ error, file, isDeleting, onClose, onConfirm }: PaperDeleteDialogProps) {
  return (
    <div className="workspace-paper-dialog-backdrop">
      <section
        aria-labelledby="workspace-paper-delete-dialog-title"
        aria-modal="true"
        className="workspace-paper-dialog workspace-paper-delete-dialog"
        role="dialog"
      >
        <div className="workspace-paper-dialog-heading">
          <p>DELETE FILE</p>
          <h2 id="workspace-paper-delete-dialog-title">{file.path}</h2>
        </div>
        <p className="workspace-paper-delete-copy">
          This removes the paper file from the manuscript workspace. Root files are protected.
        </p>
        {error ? <p className="workspace-paper-dialog-error">{error}</p> : null}
        <div className="workspace-paper-dialog-actions">
          <button disabled={isDeleting} onClick={onClose} type="button">
            CANCEL
          </button>
          <button disabled={isDeleting} onClick={onConfirm} type="button">
            {isDeleting ? "DELETING" : "DELETE FILE"}
          </button>
        </div>
      </section>
    </div>
  );
}
