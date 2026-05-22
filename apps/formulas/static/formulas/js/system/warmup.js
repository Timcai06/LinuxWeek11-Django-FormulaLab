(function () {
    const system = window.FormulaSystem || {};

    function setupWarmupForm() {
        const dom = system.nodes();
        if (!dom.form) {
            return;
        }
        dom.form.addEventListener("submit", async (event) => {
            event.preventDefault();
            if (dom.statusText) {
                dom.statusText.textContent = "Warmup command queued...";
            }
            try {
                const response = await fetch(dom.root.dataset.warmupUrl, {
                    method: "POST",
                    headers: {
                        "Accept": "application/json",
                        "X-CSRFToken": system.getCookie("csrftoken"),
                    },
                });
                const payload = await response.json();
                if (dom.statusText) {
                    dom.statusText.textContent = payload.status === "queued" ? "Warmup command queued" : payload.error;
                }
            } catch (error) {
                if (dom.statusText) {
                    dom.statusText.textContent = "Warmup request failed";
                }
            }
            window.setTimeout(system.refreshHealth, 900);
        });
    }

    system.setupWarmupForm = setupWarmupForm;
    window.FormulaSystem = system;
})();
