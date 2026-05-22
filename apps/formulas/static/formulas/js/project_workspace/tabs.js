(function () {
    const workspace = window.FormulaProjectWorkspace || {};

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

    workspace.setupTabs = setupTabs;
    window.FormulaProjectWorkspace = workspace;
})();
