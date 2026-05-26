import { useEffect, useRef } from "react";

type MiniFormulaPreviewProps = {
  latex: string;
};

export function MiniFormulaPreview({ latex }: MiniFormulaPreviewProps) {
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
        target.textContent = "No preview";
        return;
      }
      if (!window.katex) {
        if (attempt < 5) {
          window.setTimeout(() => render(attempt + 1), 80);
          return;
        }
        target.textContent = source;
        return;
      }
      window.katex.render(source, target, {
        displayMode: false,
        throwOnError: false,
      });
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [latex]);

  return <span className="workspace-review-inbox-katex" ref={previewRef} />;
}
