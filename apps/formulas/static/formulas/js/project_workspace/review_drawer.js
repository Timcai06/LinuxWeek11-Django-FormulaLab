(function () {
    const workspace = window.FormulaProjectWorkspace || {};

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
        const byId = new Map(workspace.reviewData().map((item) => [String(item.id), item]));

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
            workspace.renderLatex(textarea.value, preview, true);
            textarea.focus();
        }

        document.querySelectorAll("[data-review-trigger], [data-inspector-review]").forEach((button) => {
            button.addEventListener("click", () => openDrawer(byId.get(String(button.dataset.reviewItemId))));
        });

        textarea.addEventListener("input", () => workspace.renderLatex(textarea.value, preview, true));

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

    workspace.setupReviewDrawer = setupReviewDrawer;
    window.FormulaProjectWorkspace = workspace;
})();
