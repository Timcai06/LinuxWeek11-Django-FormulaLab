(function () {
    function getLayoutApi() {
        if (!window.FormulaLayout || typeof window.FormulaLayout.measureTextBlock !== "function") {
            return null;
        }
        return window.FormulaLayout;
    }

    function applyMeasuredSummaries() {
        const layout = getLayoutApi();
        if (!layout) {
            return;
        }

        document.querySelectorAll("[data-layout-summary]").forEach((node) => {
            const badgeReserve = 82;
            const width = Math.max(220, Math.floor(node.getBoundingClientRect().width) - badgeReserve);
            const metrics = layout.measureTextBlock(node.textContent, {
                width,
                lineHeight: 20,
                font: "13px Outfit, D-DIN, Arial Narrow, sans-serif",
            });

            if (!metrics || !Number.isFinite(metrics.height)) {
                return;
            }

            node.style.minHeight = `${Math.ceil(metrics.height)}px`;
            node.dataset.layoutLines = String(metrics.lineCount || Math.max(1, Math.ceil(metrics.height / 20)));
        });
    }

    window.addEventListener("load", applyMeasuredSummaries);
    window.addEventListener("resize", applyMeasuredSummaries);
})();
