import type { PaperDocument, PaperFile } from "../types";

type PaperFileTreeProps = {
  activeFileId?: string;
  documents: PaperDocument[];
  isMutating: boolean;
  onCreateFile: (document: PaperDocument) => void;
  onRenameFile: (file: PaperFile) => void;
  onSelectFile: (file: PaperFile) => void;
};

export function PaperFileTree({
  activeFileId,
  documents,
  isMutating,
  onCreateFile,
  onRenameFile,
  onSelectFile,
}: PaperFileTreeProps) {
  return (
    <aside className="workspace-paper-file-tree" aria-label="Paper file tree">
      <span>PAPER FILES</span>
      {documents.map((document) => (
        <section key={document.id}>
          <div className="workspace-paper-document-heading">
            <strong>{document.title}</strong>
            <button disabled={isMutating} onClick={() => onCreateFile(document)} type="button">
              NEW FILE
            </button>
          </div>
          <small>{document.document_code}</small>
          <div>
            {document.files.map((file) => (
              <div className="workspace-paper-file-row" key={file.id}>
                <button
                  className={file.id === activeFileId ? "is-active" : ""}
                  onClick={() => onSelectFile(file)}
                  type="button"
                >
                  <span>{file.path}</span>
                  <small>{file.file_type.toUpperCase()}</small>
                </button>
                {file.id === activeFileId ? (
                  <span className="workspace-paper-file-actions">
                    <button disabled={isMutating} onClick={() => onRenameFile(file)} type="button">
                      RENAME
                    </button>
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ))}
    </aside>
  );
}
