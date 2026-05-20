(function () {
    const maxKatexAttempts = 80;

    function cleanLatex(source) {
        return (source || "").replace(/\$\$/g, "").replace(/\$/g, "").trim();
    }

    function renderLatex(source, target, displayMode) {
        const latex = cleanLatex(source);
        if (!target) {
            return;
        }
        if (!latex || latex === "No LaTeX captured") {
            target.textContent = "No LaTeX captured.";
            return;
        }
        if (!window.katex) {
            target.textContent = "Loading formula renderer...";
            return;
        }
        try {
            window.katex.render(latex, target, { throwOnError: false, displayMode });
        } catch (error) {
            target.textContent = latex;
        }
    }

    function renderWhenReady(callback, attempt) {
        if (window.katex || attempt >= maxKatexAttempts) {
            callback();
            return;
        }
        window.setTimeout(() => renderWhenReady(callback, attempt + 1), 50);
    }

    function renderFormulaItems() {
        document.querySelectorAll(".formula-item-row").forEach((row) => {
            const sourceNode = row.querySelector("[data-latex-source-text]");
            const previewNode = row.querySelector("[data-project-katex-preview]");
            if (!sourceNode || !previewNode) {
                return;
            }
            renderLatex(sourceNode.textContent, previewNode, true);
        });
    }

    function previewData() {
        const dataNode = document.getElementById("paper-preview-data");
        if (!dataNode) {
            return [];
        }
        try {
            return JSON.parse(dataNode.textContent);
        } catch (error) {
            return [];
        }
    }

    function renderPaperPreview() {
        const byCode = new Map(previewData().map((item) => [item.code, item]));
        document.querySelectorAll("[data-paper-preview-slot]").forEach((slot) => {
            const item = byCode.get(slot.dataset.previewCode);
            renderLatex(item ? item.latex : slot.textContent, slot, true);
        });
    }

    renderWhenReady(() => {
        renderFormulaItems();
        renderPaperPreview();
    }, 0);
})();
