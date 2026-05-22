(function () {
    const SUMMARY_FONT = "13px Outfit, D-DIN, Arial Narrow, sans-serif";
    const SUMMARY_LINE_HEIGHT = 20;
    const SUMMARY_MIN_WIDTH = 280;
    const SUMMARY_MAX_WIDTH = 760;
    const SUMMARY_HORIZONTAL_RESERVE = 112;
    const SUMMARY_CHIP_RESERVE = 54;

    function getLayoutApi() {
        if (!window.FormulaLayout || typeof window.FormulaLayout.measureTextBlock !== "function") {
            return null;
        }
        return window.FormulaLayout;
    }

    function ensureFullText(node) {
        if (!node.dataset.fullText) {
            node.dataset.fullText = node.textContent.trim();
        }
        return node.dataset.fullText;
    }

    function renderSummary(node, text, chipLabel) {
        node.textContent = text;
        if (!chipLabel) {
            return;
        }
        const chip = document.createElement("span");
        chip.className = "summary-overflow-chip";
        chip.textContent = chipLabel;
        node.appendChild(chip);
    }

    function applyMeasuredSummaries() {
        const layout = getLayoutApi();
        if (!layout) {
            return;
        }

        document.querySelectorAll("[data-layout-summary]").forEach((node) => {
            const entry = node.closest(".timeline-entry");
            const timeline = node.closest(".timeline");
            if (!entry || !timeline) {
                return;
            }

            const fullText = ensureFullText(node);
            const availableWidth = Math.max(SUMMARY_MIN_WIDTH, timeline.getBoundingClientRect().width - 32);
            const targetMaxWidth = Math.min(SUMMARY_MAX_WIDTH, availableWidth);
            const textMaxWidth = Math.max(SUMMARY_MIN_WIDTH, targetMaxWidth - SUMMARY_HORIZONTAL_RESERVE);
            const metrics = layout.findTightWidth(fullText, {
                maxWidth: textMaxWidth,
                minWidth: Math.min(SUMMARY_MIN_WIDTH, textMaxWidth),
                lineHeight: SUMMARY_LINE_HEIGHT,
                font: SUMMARY_FONT,
            });

            if (!metrics || !Number.isFinite(metrics.width)) {
                return;
            }

            const entryWidth = Math.min(targetMaxWidth, Math.ceil(metrics.width + SUMMARY_HORIZONTAL_RESERVE));
            entry.style.setProperty("--timeline-entry-width", `${entryWidth}px`);
            node.dataset.layoutLines = String(metrics.lineCount || 1);
            node.title = fullText;

            const shouldTruncate = metrics.lineCount > 2 && typeof layout.fitTextToLines === "function";
            node.classList.toggle("is-truncated", shouldTruncate);

            if (shouldTruncate) {
                const fitted = layout.fitTextToLines(fullText, {
                    width: Math.max(180, entryWidth - SUMMARY_HORIZONTAL_RESERVE - SUMMARY_CHIP_RESERVE),
                    lineHeight: SUMMARY_LINE_HEIGHT,
                    maxLines: 2,
                    font: SUMMARY_FONT,
                    suffix: "...",
                });
                node.dataset.layoutLines = String(fitted.originalLineCount || metrics.lineCount);
                node.style.minHeight = `${SUMMARY_LINE_HEIGHT * 2}px`;
                renderSummary(node, fitted.text, "MORE");
                return;
            }

            node.style.minHeight = `${Math.max(SUMMARY_LINE_HEIGHT, metrics.lineCount * SUMMARY_LINE_HEIGHT)}px`;
            renderSummary(node, fullText, "");
        });
    }

    function setupDetailsAnimation() {
        document.querySelectorAll(".timeline-entry details").forEach((details) => {
            const summary = details.querySelector("summary");
            if (!summary || details.dataset.accordionReady === "true") {
                return;
            }
            details.dataset.accordionReady = "true";

            summary.addEventListener("click", (event) => {
                event.preventDefault();
                const isOpen = details.open;
                const startHeight = details.offsetHeight;

                details.classList.add("is-animating");

                if (isOpen) {
                    const summaryHeight = summary.offsetHeight;
                    details.style.height = `${startHeight}px`;
                    requestAnimationFrame(() => {
                        details.style.height = `${summaryHeight}px`;
                    });
                    window.setTimeout(() => {
                        details.open = false;
                        details.classList.remove("is-animating");
                        details.style.height = "";
                    }, 220);
                    return;
                }

                details.open = true;
                const targetHeight = details.scrollHeight;
                details.style.height = `${summary.offsetHeight}px`;
                requestAnimationFrame(() => {
                    details.style.height = `${targetHeight}px`;
                });
                window.setTimeout(() => {
                    details.classList.remove("is-animating");
                    details.style.height = "";
                }, 220);
            });
        });
    }

    window.addEventListener("load", () => {
        applyMeasuredSummaries();
        setupDetailsAnimation();
    });
    window.addEventListener("resize", applyMeasuredSummaries);
})();
