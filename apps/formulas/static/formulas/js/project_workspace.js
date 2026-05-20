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

    function setupReviewDrawer() {
        const drawer = document.querySelector("[data-review-drawer]");
        const form = document.querySelector("[data-review-form]");
        const codeNode = document.querySelector("[data-review-code]");
        const batchNode = document.querySelector("[data-review-batch]");
        const statusNode = document.querySelector("[data-review-status]");
        const qualityNode = document.querySelector("[data-review-quality]");
        const textarea = document.querySelector("[data-review-latex]");
        const preview = document.querySelector("[data-review-preview]");
        const closeButton = document.querySelector("[data-review-close]");
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
            renderLatex(textarea.value, preview, true);
            textarea.focus();
        }

        document.querySelectorAll("[data-review-trigger]").forEach((button) => {
            button.addEventListener("click", () => openDrawer(byId.get(button.dataset.reviewItemId)));
        });

        textarea.addEventListener("input", () => renderLatex(textarea.value, preview, true));

        if (closeButton) {
            closeButton.addEventListener("click", () => {
                drawer.classList.remove("is-open");
                drawer.setAttribute("aria-hidden", "true");
            });
        }
    }

    renderWhenReady(() => {
        renderFormulaItems();
        renderPaperPreview();
        setupReviewDrawer();
    }, 0);
})();
