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

    function reviewData() {
        const dataNode = document.getElementById("review-drawer-data");
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
        if (!cleanLatex(latex)) {
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
        const estimatedWidth = Math.min(paperColumnWidth, Math.max(24, cleanLatex(latex).length * 7));
        const maxLineWidth = Number(stats.maxLineWidth) || Math.max(0, ...lineWidths) || estimatedWidth;
        const tightness = Math.round((maxLineWidth / paperColumnWidth) * 100);
        const risky = tightness > 88 || Number(stats.lineCount || 0) > 3;

        panel.classList.add(risky ? "is-warning" : "is-ready");
        status.textContent = risky ? "REVIEW" : "READY";
        width.textContent = `${Math.round(maxLineWidth)} / ${paperColumnWidth}px`;
        lines.textContent = String(stats.lineCount || lineWidths.length || 1);
        tight.textContent = `${Number.isFinite(tightness) ? tightness : 0}%`;
    }

    function setupFormulaInspector() {
        const items = reviewData();
        const byId = new Map(items.map((item) => [Number(item.id), item]));
        const rows = Array.from(document.querySelectorAll("[data-workspace-item]"));
        const codeNode = document.querySelector("[data-inspector-code]");
        const batchNode = document.querySelector("[data-inspector-batch]");
        const statusNode = document.querySelector("[data-inspector-status]");
        const qualityNode = document.querySelector("[data-inspector-quality]");
        const latexNode = document.querySelector("[data-inspector-latex]");
        const preview = document.querySelector("[data-inspector-preview]");
        const reviewButton = document.querySelector("[data-inspector-review]");

        if (!codeNode || !latexNode || !preview || !reviewButton) {
            return null;
        }

        function selectItem(item) {
            if (!item) {
                return;
            }
            rows.forEach((row) => {
                row.classList.toggle("is-selected", Number(row.dataset.inspectorItemId) === Number(item.id));
            });
            codeNode.textContent = item.code || "Formula";
            if (batchNode) {
                batchNode.textContent = item.batch_title || "Untitled batch";
            }
            if (statusNode) {
                statusNode.textContent = String(item.status || "unknown").toUpperCase();
            }
            if (qualityNode) {
                qualityNode.textContent = `Q ${item.quality_score || 0}`;
            }
            latexNode.textContent = item.latex || "No LaTeX captured.";
            reviewButton.dataset.reviewItemId = item.id;
            reviewButton.disabled = false;
            renderLatex(item.latex, preview, true);
            updateInspectorFit(item.latex || "");
        }

        document.querySelectorAll("[data-inspector-select]").forEach((trigger) => {
            trigger.addEventListener("click", () => {
                const itemId = Number(trigger.dataset.reviewItemId);
                const item = byId.get(itemId);
                if (item) {
                    const queueTabTrigger = document.querySelector('.workspace-tab-trigger[data-tab="queue"]');
                    if (queueTabTrigger && !queueTabTrigger.classList.contains('active')) {
                        queueTabTrigger.click();
                    }
                    selectItem(item);
                    const correspondingRow = document.querySelector(`[data-inspector-item-id="${item.id}"]`);
                    if (correspondingRow) {
                        correspondingRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                }
            });
        });

        if (items.length) {
            selectItem(items[0]);
        }

        return { selectItem, byId };
    }

    function setupTabs() {
        const triggers = Array.from(document.querySelectorAll(".workspace-tab-trigger"));
        const contents = Array.from(document.querySelectorAll(".workspace-tab-content"));
        if (!triggers.length || !contents.length) {
            return;
        }

        function selectTab(name) {
            triggers.forEach((trigger) => {
                const active = trigger.dataset.tab === name;
                trigger.classList.toggle("active", active);
                trigger.setAttribute("aria-selected", active ? "true" : "false");
            });
            contents.forEach((content) => {
                content.classList.toggle("active", content.dataset.tabContent === name);
            });
        }

        triggers.forEach((trigger) => {
            trigger.addEventListener("click", () => selectTab(trigger.dataset.tab));
        });
    }

    function setupReviewDrawer() {
        const drawer = document.querySelector("[data-review-drawer]");
        const backdrop = document.querySelector("[data-drawer-backdrop]");
        const form = document.querySelector("[data-review-form]");
        const codeNode = document.querySelector("[data-review-code]");
        const batchNode = document.querySelector("[data-review-batch]");
        const statusNode = document.querySelector("[data-review-status]");
        const qualityNode = document.querySelector("[data-review-quality]");
        const textarea = document.querySelector("[data-review-latex]");
        const preview = document.querySelector("[data-review-preview]");
        const closeButton = document.querySelector("[data-review-close]");
        const shell = document.querySelector(".workspace-shell");
        const byId = new Map(reviewData().map((item) => [item.id, item]));

        if (!drawer || !form || !textarea || !preview) {
            return;
        }

        function openDrawer(item) {
            if (!item) {
                return;
            }
            form.action = item.review_url;
            if (codeNode) {
                codeNode.textContent = item.code;
            }
            if (batchNode) {
                batchNode.textContent = item.batch_title || "Untitled batch";
            }
            if (statusNode) {
                statusNode.textContent = String(item.status || "unknown").toUpperCase();
            }
            if (qualityNode) {
                qualityNode.textContent = `Q ${item.quality_score || 0}`;
            }
            textarea.value = item.latex || "";
            drawer.setAttribute("aria-hidden", "false");
            drawer.classList.add("is-open");
            if (backdrop) {
                backdrop.classList.add("is-open");
            }
            if (shell) {
                shell.classList.add("shell-blurred");
            }
            renderLatex(textarea.value, preview, true);
            textarea.focus();
        }

        document.querySelectorAll("[data-review-trigger], [data-inspector-review]").forEach((button) => {
            button.addEventListener("click", () => openDrawer(byId.get(button.dataset.reviewItemId)));
        });

        textarea.addEventListener("input", () => renderLatex(textarea.value, preview, true));

        function closeDrawer() {
            drawer.classList.remove("is-open");
            if (backdrop) {
                backdrop.classList.remove("is-open");
            }
            if (shell) {
                shell.classList.remove("shell-blurred");
            }
            drawer.setAttribute("aria-hidden", "true");
        }

        if (closeButton) {
            closeButton.addEventListener("click", closeDrawer);
        }

        if (backdrop) {
            backdrop.addEventListener("click", closeDrawer);
        }
    }

    renderWhenReady(() => {
        setupTabs();
        renderFormulaItems();
        renderPaperPreview();
        setupFormulaInspector();
        setupReviewDrawer();
    }, 0);
})();
