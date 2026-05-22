(function () {
    const system = window.FormulaSystem || {};

    function renderServiceRow(entry) {
        const row = document.querySelector(`[data-service="${entry.name}"]`);
        if (!row) {
            return;
        }
        row.classList.remove("is-online", "is-offline", "is-ready", "is-warming", "is-warning", "is-error", "is-unknown");
        row.classList.add(entry.className || system.statusClass(entry.ok));
        const detail = row.querySelector(".service-detail");
        if (detail) {
            detail.textContent = entry.detail;
        }
        const value = row.querySelector(".service-value");
        if (value) {
            value.textContent = entry.value;
        }
    }

    function updateHealthDial(onlineCount, totalCount) {
        const dial = document.querySelector(".dial-fg");
        if (!dial) {
            return;
        }
        const circumference = 264;
        const ratio = onlineCount / totalCount;
        dial.style.strokeDashoffset = circumference - ratio * circumference;
        if (ratio === 1) {
            dial.style.stroke = "var(--status-ready)";
            dial.style.filter = "drop-shadow(0 0 10px rgba(92, 255, 176, 0.7))";
        } else if (ratio >= 0.6) {
            dial.style.stroke = "var(--status-warming)";
            dial.style.filter = "drop-shadow(0 0 10px rgba(246, 200, 95, 0.6))";
        } else {
            dial.style.stroke = "var(--status-error)";
            dial.style.filter = "drop-shadow(0 0 10px rgba(255, 77, 77, 0.7))";
        }
    }

    function updateQueueSegments(payload) {
        const queues = payload.queues || {};
        const total = (queues.queued || 0) + (queues.running || 0) + (queues.succeeded || 0) + (queues.failed || 0);
        ["queued", "running", "succeeded", "failed"].forEach((type) => {
            const segment = document.querySelector(`[data-queue-segment="${type}"]`);
            if (segment) {
                segment.style.width = `${total > 0 ? ((queues[type] || 0) / total) * 100 : 0}%`;
            }
        });
    }

    function renderHealth(payload) {
        if (!payload) {
            return;
        }
        const dom = system.nodes();
        const entries = system.serviceEntries(payload);
        const onlineCount = entries.filter((entry) => entry.ok).length;

        entries.forEach(renderServiceRow);
        if (dom.healthScore) {
            dom.healthScore.textContent = `${onlineCount}/${entries.length}`;
        }
        updateHealthDial(onlineCount, entries.length);
        if (dom.healthSummary) {
            dom.healthSummary.textContent = onlineCount === entries.length
                ? "All runtime systems are online."
                : `${entries.length - onlineCount} runtime service needs attention.`;
        }
        if (dom.modelSummary) {
            dom.modelSummary.className = `summary-card model-summary ${system.modelStatusClass(payload)}`;
        }
        if (dom.modelStatus) {
            dom.modelStatus.textContent = String(payload.model?.status || "UNKNOWN").toUpperCase();
        }
        if (dom.statusText) {
            dom.statusText.textContent = system.modelMessage(payload);
        }
        if (dom.warmupButton) {
            dom.warmupButton.textContent = payload.model?.state === "ready" ? "RE-WARM MODEL" : "WARMUP MODEL";
        }
        dom.queueCounts.forEach((node) => {
            node.textContent = payload.queues?.[node.dataset.queueCount] ?? 0;
        });
        updateQueueSegments(payload);
        if (dom.lastJobStatus) {
            dom.lastJobStatus.textContent = String(payload.last_job?.status || "NONE").toUpperCase();
        }
        if (dom.lastJobDetail) {
            dom.lastJobDetail.textContent = payload.last_job?.stage_label || payload.last_job?.error || "No mission has been recorded yet";
        }
        if (dom.refreshLabel) {
            dom.refreshLabel.textContent = `Updated ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
        }
    }

    system.renderHealth = renderHealth;
    window.FormulaSystem = system;
})();
