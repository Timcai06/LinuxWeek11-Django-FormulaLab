type PaperCodeEditorProps = {
  content: string;
  onChange: (content: string) => void;
};

export function PaperCodeEditor({ content, onChange }: PaperCodeEditorProps) {
  const lineCount = Math.max(content.split("\n").length, 1);
  const lineNumbers = Array.from({ length: lineCount }, (_, index) => index + 1).join("\n");

  return (
    <div className="workspace-code-editor" data-editor-engine="textarea-shell">
      <pre className="workspace-code-editor-gutter" aria-hidden="true">
        {lineNumbers}
      </pre>
      <textarea
        aria-label="Paper source editor"
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        value={content}
      />
    </div>
  );
}
