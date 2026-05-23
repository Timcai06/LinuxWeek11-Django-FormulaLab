type PaperPreviewProps = {
  content: string;
  path?: string;
};

export function PaperPreview({ content, path }: PaperPreviewProps) {
  return (
    <aside className="workspace-paper-preview" aria-label="Paper preview">
      <span>{path ? `PREVIEW / ${path}` : "PREVIEW"}</span>
      <pre>{content || "No paper file selected."}</pre>
    </aside>
  );
}
