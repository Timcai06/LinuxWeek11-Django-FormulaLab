(function () {
    const result = window.FormulaResult || {};

    function selectFormat(name) {
        const dom = result.nodes();
        result.state.current = name;
        dom.output.value = result.formats()[name] || "";
        dom.tabs.forEach((tab) => {
            tab.setAttribute("aria-selected", tab.dataset.formatTab === name ? "true" : "false");
        });
        if (dom.consoleTabs) {
            dom.consoleTabs.style.setProperty("--active-index", result.tabIndices[name] !== undefined ? result.tabIndices[name] : 1);
        }
        result.renderPreview(dom.output.value);
        result.updatePaperFit(dom.output.value);
    }

    function setupFormatControls() {
        const dom = result.nodes();
        result.formulaLab().bindFormatTabs(dom.tabs, selectFormat);
        dom.output.addEventListener("input", () => {
            result.renderPreview(dom.output.value);
            result.updatePaperFit(dom.output.value);
        });
    }

    result.selectFormat = selectFormat;
    result.setupFormatControls = setupFormatControls;
    window.FormulaResult = result;
})();
