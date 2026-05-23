import { useEffect, useRef } from "react";

type FormulaPreviewProps = {
  latex: string;
};

const MAX_RENDER_ATTEMPTS = 5;

export function FormulaPreview({ latex }: FormulaPreviewProps) {
  const previewRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const target = previewRef.current;
    if (!target) {
      return undefined;
    }

    function render(attempt = 0) {
      if (!target || cancelled) {
        return;
      }

      const source = latex.trim();
      target.replaceChildren();

      if (!source) {
        target.textContent = "No formula selected.";
        return;
      }

      if (!window.katex) {
        if (attempt < MAX_RENDER_ATTEMPTS) {
          window.setTimeout(() => render(attempt + 1), 80);
          return;
        }
        target.textContent = source;
        return;
      }

      window.katex.render(source, target, {
        displayMode: true,
        throwOnError: false,
      });
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [latex]);

  return (
    <section className="workspace-editor-preview" aria-label="KaTeX preview">
      <span>KATEX PREVIEW</span>
      <div className="workspace-editor-preview-surface" ref={previewRef} />
    </section>
  );
}
