import { useEffect, useState } from "react";

export type PaperFileTemplateKey = "bibliography" | "blank" | "section";

type PaperFileDialogProps = {
  error: string;
  initialPath: string;
  isSaving: boolean;
  mode: "create" | "rename";
  onClose: () => void;
  onSubmit: (path: string, template: PaperFileTemplateKey) => void;
};

export function PaperFileDialog({ error, initialPath, isSaving, mode, onClose, onSubmit }: PaperFileDialogProps) {
  const [path, setPath] = useState(initialPath);
  const [template, setTemplate] = useState<PaperFileTemplateKey>("section");
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
            onSubmit(path, template);
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
          {mode === "create" ? (
            <fieldset className="workspace-paper-template-options">
              <legend>TEMPLATE</legend>
              {FILE_TEMPLATES.map((option) => (
                <label key={option.key}>
                  <input
                    checked={template === option.key}
                    name="paper-file-template"
                    onChange={() => setTemplate(option.key)}
                    type="radio"
                  />
                  <span>
                    <strong>{option.label}</strong>
                    <small>{option.description}</small>
                  </span>
                </label>
              ))}
            </fieldset>
          ) : null}
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

const FILE_TEMPLATES: Array<{
  description: string;
  key: PaperFileTemplateKey;
  label: string;
}> = [
  {
    description: "A lightweight TeX section scaffold.",
    key: "section",
    label: "Section",
  },
  {
    description: "Empty file for custom LaTeX or notes.",
    key: "blank",
    label: "Blank",
  },
  {
    description: "BibTeX database starter.",
    key: "bibliography",
    label: "Bibliography",
  },
];
