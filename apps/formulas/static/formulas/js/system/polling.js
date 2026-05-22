(function () {
    const system = window.FormulaSystem || {};

    async function refreshHealth() {
        const root = system.nodes().root;
        if (!root) {
            return;
        }
        try {
            const response = await fetch(root.dataset.healthUrl, { headers: { "Accept": "application/json" } });
            if (response.ok) {
                system.renderHealth(await response.json());
            }
        } catch (error) {
            const statusText = system.nodes().statusText;
            if (statusText) {
                statusText.textContent = "Health telemetry unavailable";
            }
        }
    }

    function renderInitialHealth() {
        try {
            const initialHealth = JSON.parse(document.getElementById("initial-health")?.textContent || "null");
            system.renderHealth(initialHealth);
        } catch (error) {
            const statusText = system.nodes().statusText;
            if (statusText) {
                statusText.textContent = "Initial health telemetry unavailable";
            }
        }
    }

    system.refreshHealth = refreshHealth;
    system.renderInitialHealth = renderInitialHealth;
    window.FormulaSystem = system;
})();
