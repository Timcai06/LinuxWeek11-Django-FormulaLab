(function () {
    const result = window.FormulaResult || {};

    function renderPreview(value, attempt = 0, sequence = null) {
        const activeSequence = sequence === null ? ++result.state.renderSequence : sequence;
        if (activeSequence !== result.state.renderSequence) {
            return;
        }

        const dom = result.nodes();
        const lab = result.formulaLab();
        const source = lab.previewSource(result.formats(), value);
        const rendered = lab.renderKatexPreview(dom.preview, source, true);
        if (!rendered && !window.katex && attempt < result.maxKatexAttempts) {
            window.setTimeout(() => renderPreview(dom.output.value, attempt + 1, activeSequence), 50);
        }
    }

    result.renderPreview = renderPreview;
    window.FormulaResult = result;
})();
