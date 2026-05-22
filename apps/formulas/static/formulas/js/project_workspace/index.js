(function () {
    const workspace = window.FormulaProjectWorkspace;

    if (!workspace) {
        return;
    }

    workspace.renderWhenReady(() => {
        workspace.setupTabs();
        workspace.renderFormulaItems();
        workspace.renderPaperPreview();
        workspace.setupFormulaInspector();
        workspace.setupReviewDrawer();
    }, 0);
})();
