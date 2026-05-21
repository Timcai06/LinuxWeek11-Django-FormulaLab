(function () {
    window.FormulaLab = window.FormulaLab || {};

    window.FormulaLab.bindFormatTabs = function bindFormatTabs(tabs, onSelect) {
        tabs.forEach((tab) => {
            tab.addEventListener("click", () => onSelect(tab.dataset.formatTab));
        });
    };
})();
