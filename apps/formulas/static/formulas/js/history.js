(function () {
    const SUMMARY_FONT = "13px Outfit, D-DIN, Arial Narrow, sans-serif";
    const SUMMARY_LINE_HEIGHT = 20;
    const SUMMARY_MIN_WIDTH = 180;
    const SUMMARY_MAX_WIDTH = 760;
    const SUMMARY_HORIZONTAL_RESERVE = 96;
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
            const summaryWidth = node.getBoundingClientRect().width || timeline.getBoundingClientRect().width;
            const textMaxWidth = Math.min(
                SUMMARY_MAX_WIDTH,
                Math.max(SUMMARY_MIN_WIDTH, summaryWidth - SUMMARY_HORIZONTAL_RESERVE),
            );
            const metrics = layout.findTightWidth(fullText, {
                maxWidth: textMaxWidth,
                minWidth: Math.min(SUMMARY_MIN_WIDTH, textMaxWidth),
                lineHeight: SUMMARY_LINE_HEIGHT,
                font: SUMMARY_FONT,
            });

            if (!metrics || !Number.isFinite(metrics.width)) {
                return;
            }

            node.dataset.layoutLines = String(metrics.lineCount || 1);
            node.title = fullText;

            const shouldTruncate = metrics.lineCount > 2 && typeof layout.fitTextToLines === "function";
            node.classList.toggle("is-truncated", shouldTruncate);

            if (shouldTruncate) {
                const fitted = layout.fitTextToLines(fullText, {
                    width: Math.max(SUMMARY_MIN_WIDTH, textMaxWidth - SUMMARY_CHIP_RESERVE),
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

            node.style.minHeight = `${SUMMARY_LINE_HEIGHT * 2}px`;
            renderSummary(node, fullText, "");
        });
    }

    function terminalGlitch(element) {
        if (!element || element.dataset.glitching) return;
        
        const originalText = element.textContent;
        element.dataset.glitching = "true";
        
        const chars = "01<>#@*+=-_/\\[]~^";
        let iterations = 0;
        const maxIterations = 12;
        
        const interval = setInterval(() => {
            element.textContent = originalText.split('').map((char, index) => {
                if (char === '\n' || char === ' ') return char;
                if (index < (originalText.length / maxIterations) * iterations) {
                    return originalText[index];
                }
                return chars[Math.floor(Math.random() * chars.length)];
            }).join('');
            
            iterations++;
            if (iterations > maxIterations) {
                clearInterval(interval);
                element.textContent = originalText;
                element.dataset.glitching = "";
            }
        }, 30);
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

                if (!isOpen) {
                    const pre = details.querySelector("pre");
                    if (pre) terminalGlitch(pre);
                }

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

    function setupScrollObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: "0px 0px -50px 0px"
        });

        document.querySelectorAll(".timeline-entry").forEach(el => {
            observer.observe(el);
        });
    }

    function setupSpotlightHover() {
        document.querySelectorAll(".timeline-entry").forEach(card => {
            card.addEventListener("mousemove", (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                card.style.setProperty("--mouse-x", `${x}px`);
                card.style.setProperty("--mouse-y", `${y}px`);
            });
        });
    }

    window.addEventListener("load", () => {
        applyMeasuredSummaries();
        setupDetailsAnimation();
        setupScrollObserver();
        setupSpotlightHover();
    });
    window.addEventListener("resize", applyMeasuredSummaries);
})();
