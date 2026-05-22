(function () {
    const workspace = window.FormulaProjectWorkspace || {};

    function renderFormulaItems() {
        document.querySelectorAll(".formula-item-row").forEach((row) => {
            const sourceNode = row.querySelector("[data-latex-source-text]");
            const previewNode = row.querySelector("[data-project-katex-preview]");
            if (!sourceNode || !previewNode) {
                return;
            }
            workspace.renderLatex(sourceNode.textContent, previewNode, true);
        });
    }

    function renderPaperPreview() {
        const byCode = new Map(workspace.previewData().map((item) => [item.code, item]));
        document.querySelectorAll("[data-paper-preview-slot]").forEach((slot) => {
            const item = byCode.get(slot.dataset.previewCode);
            workspace.renderLatex(item ? item.latex : slot.textContent, slot, true);
        });
    }

    workspace.renderFormulaItems = renderFormulaItems;
    workspace.renderPaperPreview = renderPaperPreview;
    window.FormulaProjectWorkspace = workspace;
})();
