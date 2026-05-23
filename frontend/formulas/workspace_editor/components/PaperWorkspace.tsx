import type { PaperDocument, PaperFile } from "../types";
import { PaperFileTree } from "./PaperFileTree";
import { PaperPreview } from "./PaperPreview";
import { PaperSourceEditor } from "./PaperSourceEditor";

type PaperWorkspaceProps = {
  activeFile: PaperFile | null;
  draftContent: string;
  documents: PaperDocument[];
  hasChanges: boolean;
  isSaving: boolean;
  onDraftChange: (content: string) => void;
  onSave: () => void;
  onSelectFile: (file: PaperFile) => void;
};

export function PaperWorkspace({
  activeFile,
  draftContent,
  documents,
  hasChanges,
  isSaving,
  onDraftChange,
  onSave,
  onSelectFile,
}: PaperWorkspaceProps) {
  return (
    <div className="workspace-paper-shell">
      <PaperFileTree activeFileId={activeFile?.id} documents={documents} onSelectFile={onSelectFile} />
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
