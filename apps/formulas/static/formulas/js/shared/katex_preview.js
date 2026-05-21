(function () {
    window.FormulaLab = window.FormulaLab || {};

    window.FormulaLab.previewSource = function previewSource(formats, value) {
        if (formats && formats.render) {
            return formats.render;
        }

        return String(value || "").replace(/\$\$/g, "").replace(/\$/g, "").trim();
    };

    window.FormulaLab.renderKatexPreview = function renderKatexPreview(preview, source, displayMode) {
        if (!preview) {
            return false;
        }

        if (!source) {
            preview.textContent = "No LaTeX output recorded.";
            return true;
        }

        if (!window.katex) {
            preview.textContent = "Loading formula renderer...";
            return false;
        }

        try {
            window.katex.render(source, preview, {throwOnError: false, displayMode});
        } catch (error) {
            preview.textContent = source;
        }

        return true;
    };
})();
