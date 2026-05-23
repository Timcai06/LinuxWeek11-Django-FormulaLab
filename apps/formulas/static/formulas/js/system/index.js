(function () {
    const system = window.FormulaSystem;
    if (!system || !system.nodes().root) {
        return;
    }

    system.setupWarmupForm();
    system.setupQueueControlForm();
    system.renderInitialHealth();
    window.setTimeout(system.refreshHealth, 600);
})();
