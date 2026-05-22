(function () {
    const result = window.FormulaResult || {};

    function updatePaperFit(value) {
        const panel = document.querySelector("[data-paper-fit-preview]");
        const risk = document.querySelector("[data-paper-fit-risk]");
        const width = document.querySelector("[data-paper-fit-width]");
        const lines = document.querySelector("[data-paper-fit-lines]");
        const tight = document.querySelector("[data-paper-fit-tight]");
        const message = document.querySelector("[data-paper-fit-message]");
        const rulerCursor = document.querySelector("[data-ruler-cursor]");
        if (!panel || !window.FormulaLayout) {
            return;
        }

        const layout = window.FormulaLayout;
        if (typeof layout.measureLatexSummary !== "function" || typeof layout.findTightWidth !== "function") {
            return;
        }

        const targetWidth = result.state.current === "inline" ? 360 : 520;
        const font = "13px JetBrains Mono, ui-monospace, monospace";
        const measureConfig = { targetWidth, width: targetWidth, lineHeight: 18, font };
        const tightConfig = { targetWidth, minWidth: 180, maxWidth: targetWidth, lineHeight: 18, font };

        try {
            const summary = layout.measureLatexSummary(value || "", measureConfig) || {};
            const tightResult = layout.findTightWidth(value || "", tightConfig);
            const lineCount = result.metricNumber(summary.lineCount || summary.lines);
            const maxLineWidth = result.metricNumber(summary.maxLineWidth || summary.maxWidth || summary.width);
            const tightWidth = result.tightWidthValue(tightResult);
            const hasRisk = lineCount > 4 || maxLineWidth > targetWidth * 0.96;

            if (risk) {
                risk.textContent = hasRisk ? "CHECK WIDTH" : "READY";
            }
            if (rulerCursor) {
                const percentage = Math.min(100, Math.max(0, (maxLineWidth / targetWidth) * 100));
                rulerCursor.style.left = `${percentage}%`;
            }
            if (width) {
                width.textContent = `${Math.round(maxLineWidth)} / ${targetWidth}px`;
            }
            if (lines) {
                lines.textContent = lineCount ? String(lineCount) : "--";
            }
            if (tight) {
                tight.textContent = tightWidth ? `${Math.round(tightWidth)}px` : "--";
            }
            if (message) {
                message.textContent = hasRisk
                    ? "Formula may exceed the paper lane. Prefer block display or manual line breaks."
                    : "Formula fits the current paper lane with measured width reserve.";
            }
            panel.dataset.fitRisk = hasRisk ? "warning" : "ready";
        } catch (error) {
            if (risk) {
                risk.textContent = "CHECK WIDTH";
            }
            if (message) {
                message.textContent = "Paper fit telemetry could not be calculated for this source.";
            }
            panel.dataset.fitRisk = "warning";
        }
    }

    result.updatePaperFit = updatePaperFit;
    window.FormulaResult = result;
})();
