(function () {
    const system = window.FormulaSystem || {};

    function setupQueueControlForm() {
        const dom = system.nodes();
        if (!dom.queueControlForm || !dom.root) {
            return;
        }
        dom.queueControlForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const paused = dom.queueControlState?.textContent === "PAUSED";
            const url = paused ? dom.root.dataset.queueResumeUrl : dom.root.dataset.queuePauseUrl;
            if (dom.queueControlStatus) {
                dom.queueControlStatus.textContent = paused
                    ? "Resuming queued recognition missions..."
                    : "Pausing new recognition dispatch...";
            }
            try {
                const response = await fetch(url, {
                    method: "POST",
                    headers: {
                        "Accept": "application/json",
                        "X-CSRFToken": system.getCookie("csrftoken"),
                    },
                });
                const payload = await response.json();
                if (dom.queueControlStatus) {
                    dom.queueControlStatus.textContent = response.ok
                        ? (payload.status === "resumed" ? `Resumed ${payload.dispatched || 0} queued missions.` : "Recognition queue paused.")
                        : payload.error;
                }
            } catch (error) {
                if (dom.queueControlStatus) {
                    dom.queueControlStatus.textContent = "Queue control request failed";
                }
            }
            window.setTimeout(system.refreshHealth, 500);
        });
    }

    system.setupQueueControlForm = setupQueueControlForm;
    window.FormulaSystem = system;
})();
