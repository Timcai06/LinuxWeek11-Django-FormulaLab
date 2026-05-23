import type { PaperDocument, PaperFile } from "../types";
import { PaperFileTree } from "./PaperFileTree";
import { PaperPreview } from "./PaperPreview";
import { PaperSourceEditor } from "./PaperSourceEditor";

type PaperWorkspaceProps = {
  activeFile: PaperFile | null;
  draftContent: string;
  documents: PaperDocument[];
  hasChanges: boolean;
  isFileMutating: boolean;
  isSaving: boolean;
  onDraftChange: (content: string) => void;
  onCreateFile: (document: PaperDocument) => void;
  onDeleteFile: (file: PaperFile) => void;
  onRenameFile: (file: PaperFile) => void;
  onSave: () => void;
  onSelectFile: (file: PaperFile) => void;
};

export function PaperWorkspace({
  activeFile,
  draftContent,
  documents,
  hasChanges,
  isFileMutating,
  isSaving,
  onDraftChange,
  onCreateFile,
  onDeleteFile,
  onRenameFile,
  onSave,
  onSelectFile,
}: PaperWorkspaceProps) {
  return (
    <div className="workspace-paper-shell">
      <PaperFileTree
        activeFileId={activeFile?.id}
        documents={documents}
        isMutating={isFileMutating}
        onCreateFile={onCreateFile}
        onDeleteFile={onDeleteFile}
        onRenameFile={onRenameFile}
        onSelectFile={onSelectFile}
      />
      <PaperSourceEditor
        content={draftContent}
        hasChanges={hasChanges}
        isSaving={isSaving}
        onChange={onDraftChange}
        onSave={onSave}
        path={activeFile?.path}
      />
      <PaperPreview content={draftContent} path={activeFile?.path} />
    </div>
  );
}
