(function () {
    const dataNode = document.getElementById("latex-formats");
    const output = document.querySelector("[data-latex-output]");
    const preview = document.querySelector("[data-katex-preview]");
    const copyButton = document.querySelector("[data-copy-current]");
    const tabs = Array.from(document.querySelectorAll("[data-format-tab]"));
    const paperFitPanel = document.querySelector("[data-paper-fit-preview]");
    const paperFitRisk = document.querySelector("[data-paper-fit-risk]");
    const paperFitWidth = document.querySelector("[data-paper-fit-width]");
    const paperFitLines = document.querySelector("[data-paper-fit-lines]");
    const paperFitTight = document.querySelector("[data-paper-fit-tight]");
    const paperFitMessage = document.querySelector("[data-paper-fit-message]");

    if (!dataNode || !output || !preview) {
        return;
    }

    const formats = JSON.parse(dataNode.textContent);
    let current = "block";
    let renderSequence = 0;
    const maxKatexAttempts = 80;

    function previewSource(value) {
        if (formats.render) {
            return formats.render;
        }
        return value.replace(/\$\$/g, "").replace(/\$/g, "").trim();
    }

    function renderPreview(value, attempt = 0, sequence = null) {
        const activeSequence = sequence === null ? ++renderSequence : sequence;
        if (activeSequence !== renderSequence) {
            return;
        }

        const source = previewSource(value);
        if (!source) {
            preview.textContent = "No LaTeX output recorded.";
            return;
        }

        if (!window.katex) {
            preview.textContent = "Loading formula renderer...";
            if (attempt < maxKatexAttempts) {
                window.setTimeout(() => renderPreview(output.value, attempt + 1, activeSequence), 50);
            }
            return;
        }

        try {
            window.katex.render(source, preview, {throwOnError: false, displayMode: true});
        } catch (error) {
            preview.textContent = source;
        }
    }

    const consoleTabs = document.querySelector(".console-tabs");
    const tabIndices = { "raw": 0, "block": 1, "inline": 2 };

    function metricNumber(value, fallback = 0) {
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    }

    function tightWidthValue(result) {
        if (typeof result === "number") {
            return result;
        }
        if (!result || typeof result !== "object") {
            return 0;
        }
        return metricNumber(result.tightWidth || result.width || result.targetWidth);
    }

    function updatePaperFit(value) {
        if (!paperFitPanel || !window.FormulaLayout) {
            return;
        }

        const layout = window.FormulaLayout;
        if (typeof layout.measureLatexSummary !== "function" || typeof layout.findTightWidth !== "function") {
            return;
        }

        const targetWidth = current === "inline" ? 360 : 520;
        const font = "13px JetBrains Mono, ui-monospace, monospace";
        const measureConfig = {
            targetWidth,
            width: targetWidth,
            lineHeight: 18,
            font,
        };
        const tightConfig = {
            targetWidth,
            minWidth: 180,
            maxWidth: targetWidth,
            lineHeight: 18,
            font,
        };

        try {
            const summary = layout.measureLatexSummary(value || "", measureConfig) || {};
            const tightResult = layout.findTightWidth(value || "", tightConfig);
            const lineCount = metricNumber(summary.lineCount || summary.lines);
            const maxLineWidth = metricNumber(summary.maxLineWidth || summary.maxWidth || summary.width);
            const tightWidth = tightWidthValue(tightResult);
            const hasRisk = lineCount > 4 || maxLineWidth > targetWidth * 0.96;

            if (paperFitRisk) {
                paperFitRisk.textContent = hasRisk ? "CHECK WIDTH" : "READY";
            }
            if (paperFitWidth) {
                paperFitWidth.textContent = `${Math.round(maxLineWidth)} / ${targetWidth}px`;
            }
            if (paperFitLines) {
                paperFitLines.textContent = lineCount ? String(lineCount) : "--";
            }
            if (paperFitTight) {
                paperFitTight.textContent = tightWidth ? `${Math.round(tightWidth)}px` : "--";
            }
            if (paperFitMessage) {
                paperFitMessage.textContent = hasRisk
                    ? "Formula may exceed the current paper lane. Consider block display or manual line breaks."
                    : "Formula fits the current paper lane with measured width reserve.";
            }
            paperFitPanel.dataset.fitRisk = hasRisk ? "warning" : "ready";
        } catch (error) {
            if (paperFitRisk) {
                paperFitRisk.textContent = "CHECK WIDTH";
            }
            if (paperFitMessage) {
                paperFitMessage.textContent = "Paper fit telemetry could not be calculated for this source.";
            }
            paperFitPanel.dataset.fitRisk = "warning";
        }
    }

    function selectFormat(name) {
        current = name;
        output.value = formats[name] || "";
        tabs.forEach((tab) => {
            tab.setAttribute("aria-selected", tab.dataset.formatTab === name ? "true" : "false");
        });
        if (consoleTabs) {
            consoleTabs.style.setProperty("--active-index", tabIndices[name] !== undefined ? tabIndices[name] : 1);
        }
        renderPreview(output.value);
        updatePaperFit(output.value);
    }

    tabs.forEach((tab) => {
        tab.addEventListener("click", () => selectFormat(tab.dataset.formatTab));
    });

    output.addEventListener("input", () => {
        renderPreview(output.value);
        updatePaperFit(output.value);
    });

    if (copyButton) {
        copyButton.addEventListener("click", async () => {
            await navigator.clipboard.writeText(output.value);
            copyButton.textContent = "COPIED";
            window.setTimeout(() => {
                copyButton.textContent = "COPY";
            }, 1100);
        });
    }

    selectFormat("block");
})();
