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
    const rulerCursor = document.querySelector("[data-ruler-cursor]");

    const formulaLab = window.FormulaLab || {};

    if (
        !dataNode ||
        !output ||
        !preview ||
        typeof formulaLab.previewSource !== "function" ||
        typeof formulaLab.renderKatexPreview !== "function" ||
        typeof formulaLab.bindFormatTabs !== "function"
    ) {
        return;
    }

    const formats = JSON.parse(dataNode.textContent);
    let current = "block";
    let renderSequence = 0;
    const maxKatexAttempts = 80;

    function renderPreview(value, attempt = 0, sequence = null) {
        const activeSequence = sequence === null ? ++renderSequence : sequence;
        if (activeSequence !== renderSequence) {
            return;
        }

        const source = formulaLab.previewSource(formats, value);
        const rendered = formulaLab.renderKatexPreview(preview, source, true);
        if (!rendered && !window.katex) {
            if (attempt < maxKatexAttempts) {
                window.setTimeout(() => renderPreview(output.value, attempt + 1, activeSequence), 50);
            }
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
            if (rulerCursor) {
                const percentage = Math.min(100, Math.max(0, (maxLineWidth / targetWidth) * 100));
                rulerCursor.style.left = `${percentage}%`;
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
                    ? "Formula may exceed the paper lane. Prefer block display or manual line breaks."
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

    formulaLab.bindFormatTabs(tabs, selectFormat);

    output.addEventListener("input", () => {
        renderPreview(output.value);
        updatePaperFit(output.value);
    });

    // Theme Switcher for KaTeX Preview Pane
    const themeToggleBtn = document.querySelector("[data-theme-toggle]");
    const previewContainer = document.querySelector("[data-katex-preview-container]");

    if (themeToggleBtn && previewContainer) {
        const toggleText = themeToggleBtn.querySelector(".toggle-text");

        const setTheme = (theme) => {
            if (theme === "dark") {
                previewContainer.classList.remove("katex-preview-paper");
                previewContainer.classList.add("katex-preview-dark");
                if (toggleText) {
                    toggleText.textContent = "CONSOLE MODE";
                }
                localStorage.setItem("katex-preview-theme", "dark");
            } else {
                previewContainer.classList.remove("katex-preview-dark");
                previewContainer.classList.add("katex-preview-paper");
                if (toggleText) {
                    toggleText.textContent = "PAPER MODE";
                }
                localStorage.setItem("katex-preview-theme", "paper");
            }
        };

        setTheme("paper");

        themeToggleBtn.addEventListener("click", () => {
            const isDark = previewContainer.classList.contains("katex-preview-dark");
            setTheme(isDark ? "paper" : "dark");
        });
    }

    // Clipboard copy visual glow feedback
    if (copyButton) {
        copyButton.addEventListener("click", async () => {
            try {
                await navigator.clipboard.writeText(output.value);
                copyButton.classList.add("copied-glow");
                const textSpan = copyButton.querySelector("span");
                if (textSpan) {
                    textSpan.textContent = "COPIED";
                }
                window.setTimeout(() => {
                    copyButton.classList.remove("copied-glow");
                    if (textSpan) {
                        textSpan.textContent = "COPY";
                    }
                }, 1000);
            } catch (err) {
                console.error("Failed to copy text: ", err);
            }
        });
    }

    // Image Viewport Mode Toggle (Raw vs Binarized)
    const viewport = document.querySelector(".scope-viewport");
    const viewportImg = document.querySelector(".scope-image");
    const viewportTitle = document.querySelector("[data-viewport-title]");
    const imageToggleButtons = Array.from(document.querySelectorAll("[data-image-toggle]"));

    if (viewport && viewportImg) {
        imageToggleButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
                const mode = btn.dataset.imageToggle;
                imageToggleButtons.forEach((b) => b.classList.remove("active"));
                btn.classList.add("active");

                if (mode === "preprocessed") {
                    const prepUrl = viewport.dataset.preprocessedUrl;
                    if (prepUrl) {
                        viewportImg.src = prepUrl;
                    }
                    if (viewportTitle) {
                        viewportTitle.textContent = "BINARIZED IMAGE";
                    }
                } else {
                    const origUrl = viewport.dataset.originalUrl;
                    if (origUrl) {
                        viewportImg.src = origUrl;
                    }
                    if (viewportTitle) {
                        viewportTitle.textContent = "ORIGINAL IMAGE";
                    }
                }
            });
        });

        // Dynamic Resolution Calculator
        const resolutionLabel = document.querySelector("[data-scope-resolution]");

        function updateImageResolution() {
            if (resolutionLabel) {
                const width = viewportImg.naturalWidth;
                const height = viewportImg.naturalHeight;
                if (width && height) {
                    resolutionLabel.textContent = `${width} × ${height} PX`;
                } else {
                    resolutionLabel.textContent = "0 × 0 PX";
                }
            }
        }

        if (viewportImg.complete) {
            updateImageResolution();
        }
        viewportImg.addEventListener("load", updateImageResolution);
    }

    selectFormat("block");
})();
