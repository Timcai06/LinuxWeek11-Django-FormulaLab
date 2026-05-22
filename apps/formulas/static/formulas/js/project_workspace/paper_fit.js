(function () {
    const workspace = window.FormulaProjectWorkspace || {};

    function updateInspectorFit(latex) {
        const panel = document.querySelector(".inspector-fit-panel");
        const status = document.querySelector("[data-inspector-fit-status]");
        const width = document.querySelector("[data-inspector-fit-width]");
        const lines = document.querySelector("[data-inspector-fit-lines]");
        const tight = document.querySelector("[data-inspector-fit-tight]");
        const layout = window.FormulaLayout;
        if (!panel || !status || !width || !lines || !tight) {
            return;
        }
        panel.classList.remove("is-ready", "is-warning");
        if (!workspace.cleanLatex(latex)) {
            status.textContent = "STANDBY";
            width.textContent = "--";
            lines.textContent = "--";
            tight.textContent = "--";
            return;
        }
        if (!layout || typeof layout.measureLatexSummary !== "function" || typeof layout.collectLineWidths !== "function") {
            status.textContent = "STANDBY";
            width.textContent = "--";
            lines.textContent = "--";
            tight.textContent = "--";
            return;
        }

        const paperColumnWidth = 520;
        const stats = layout.measureLatexSummary(latex, {
            width: paperColumnWidth,
            lineHeight: 18,
            font: "13px JetBrains Mono, ui-monospace, monospace",
        });
        const lineWidths = layout.collectLineWidths(latex, {
            width: paperColumnWidth,
            font: "13px JetBrains Mono, ui-monospace, monospace",
        });
        const estimatedWidth = Math.min(paperColumnWidth, Math.max(24, workspace.cleanLatex(latex).length * 7));
        const maxLineWidth = Number(stats.maxLineWidth) || Math.max(0, ...lineWidths) || estimatedWidth;
        const tightness = Math.round((maxLineWidth / paperColumnWidth) * 100);
        const risky = tightness > 88 || Number(stats.lineCount || 0) > 3;

        panel.classList.add(risky ? "is-warning" : "is-ready");
        status.textContent = risky ? "REVIEW" : "READY";
        width.textContent = `${Math.round(maxLineWidth)} / ${paperColumnWidth}px`;
        lines.textContent = String(stats.lineCount || lineWidths.length || 1);
        tight.textContent = `${Number.isFinite(tightness) ? tightness : 0}%`;
    }

    workspace.updateInspectorFit = updateInspectorFit;
    window.FormulaProjectWorkspace = workspace;
})();
