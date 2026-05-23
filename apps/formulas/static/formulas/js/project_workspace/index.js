(function () {
    const workspace = window.FormulaProjectWorkspace;

    if (!workspace) {
        return;
    }

    workspace.renderWhenReady(() => {
        if (typeof workspace.renderFormulaItems === "function") {
            workspace.renderFormulaItems();
        }
        if (typeof workspace.renderPaperPreview === "function") {
            workspace.renderPaperPreview();
        }
    }, 0);
})();
