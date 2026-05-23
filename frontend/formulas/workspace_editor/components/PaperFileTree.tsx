import type { PaperDocument, PaperFile } from "../types";

type PaperFileTreeProps = {
  activeFileId?: string;
  documents: PaperDocument[];
  onSelectFile: (file: PaperFile) => void;
};

export function PaperFileTree({ activeFileId, documents, onSelectFile }: PaperFileTreeProps) {
  return (
    <aside className="workspace-paper-file-tree" aria-label="Paper file tree">
      <span>PAPER FILES</span>
      {documents.map((document) => (
        <section key={document.id}>
          <strong>{document.title}</strong>
          <small>{document.document_code}</small>
          <div>
            {document.files.map((file) => (
              <button
                className={file.id === activeFileId ? "is-active" : ""}
                key={file.id}
                onClick={() => onSelectFile(file)}
                type="button"
              >
                <span>{file.path}</span>
                <small>{file.file_type.toUpperCase()}</small>
              </button>
            ))}
          </div>
        </section>
      ))}
    </aside>
  );
}
