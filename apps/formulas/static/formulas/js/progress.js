(function () {
    const root = document.querySelector("[data-status-url]");
    if (!root) {
        return;
    }

    const statusUrl = root.dataset.statusUrl;
    const statusEl = document.querySelector("[data-status]");
    const stageEl = document.querySelector("[data-stage]");
    const messageEl = document.querySelector("[data-message]");
    const barEl = document.querySelector("[data-progress-bar]");
    const progressValueEl = document.querySelector("[data-progress-value]");
    const progressStateEl = document.querySelector("[data-progress-state]");
    const reportLink = document.querySelector("[data-report-link]");
    const failureBox = document.querySelector("[data-failure]");
    const errorEl = document.querySelector("[data-error]");
    const stageItems = Array.from(document.querySelectorAll("[data-stage-item]"));
    const stageOrder = stageItems.map((item) => item.dataset.stageItem);

    function renderStages(stageCode) {
        const currentIndex = Math.max(stageOrder.indexOf(stageCode), 0);
        stageItems.forEach((item, index) => {
            item.classList.toggle("is-active", index === currentIndex);
            item.classList.toggle("is-complete", index < currentIndex);
        });
    }

    function applyStatus(payload) {
        statusEl.textContent = String(payload.status || "unknown").toUpperCase();
        if (progressStateEl) {
            progressStateEl.textContent = String(payload.status || "unknown").toUpperCase();
        }
        stageEl.textContent = payload.stage_label || "UNKNOWN";
        messageEl.textContent = payload.stage_message || "";
        const progress = Number(payload.progress || 0);
        barEl.style.width = `${progress}%`;
        if (progressValueEl) {
            progressValueEl.textContent = `${progress}%`;
        }
        renderStages(payload.stage_code);

        if (payload.status === "succeeded" && payload.result_url) {
            reportLink.hidden = false;
            reportLink.href = payload.result_url;
            return true;
        }

        if (payload.status === "failed") {
            failureBox.hidden = false;
            errorEl.textContent = payload.error_message || "Mission failed without error telemetry.";
            return true;
        }

        return false;
    }

    async function poll() {
        try {
            const response = await fetch(statusUrl, {headers: {"Accept": "application/json"}});
            if (!response.ok) {
                return;
            }
            const payload = await response.json();
            if (!applyStatus(payload)) {
                window.setTimeout(poll, 1800);
            }
        } catch (error) {
            window.setTimeout(poll, 3200);
        }
    }

    renderStages(root.dataset.currentStageCode || document.querySelector("[data-stage-item].is-active")?.dataset.stageItem || "UPLOAD_LOCKED");
    window.setTimeout(poll, 800);
})();
