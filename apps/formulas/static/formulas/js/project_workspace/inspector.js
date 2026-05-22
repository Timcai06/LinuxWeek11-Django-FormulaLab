(function () {
    const workspace = window.FormulaProjectWorkspace || {};

    function setupFormulaInspector() {
        const items = workspace.reviewData();
        const byId = new Map(items.map((item) => [String(item.id), item]));
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
                row.classList.toggle("is-selected", String(row.dataset.inspectorItemId) === String(item.id));
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
            workspace.renderLatex(item.latex, preview, true);
            workspace.updateInspectorFit(item.latex || "");
        }

        document.querySelectorAll("[data-inspector-select]").forEach((trigger) => {
            trigger.addEventListener("click", () => {
                const item = byId.get(String(trigger.dataset.reviewItemId));
                if (!item) {
                    return;
                }
                const queueTabTrigger = document.querySelector('.workspace-tab-trigger[data-tab="queue"]');
                if (queueTabTrigger && !queueTabTrigger.classList.contains("active")) {
                    queueTabTrigger.click();
                }
                selectItem(item);
                const correspondingRow = document.querySelector(`[data-inspector-item-id="${item.id}"]`);
                if (correspondingRow) {
                    correspondingRow.scrollIntoView({ behavior: "smooth", block: "nearest" });
                }
            });
        });

        if (items.length) {
            selectItem(items[0]);
        }

        return { selectItem, byId };
    }

    workspace.setupFormulaInspector = setupFormulaInspector;
    window.FormulaProjectWorkspace = workspace;
})();
