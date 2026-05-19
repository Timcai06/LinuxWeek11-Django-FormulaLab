(function () {
    const root = document.querySelector("[data-health-url]");
    const grid = document.querySelector("[data-system-grid]");
    const form = document.querySelector("[data-warmup-form]");
    const statusText = document.querySelector("[data-warmup-status]");
    const healthScore = document.querySelector("[data-health-score]");
    const healthSummary = document.querySelector("[data-health-summary]");
    const queueCounts = Array.from(document.querySelectorAll("[data-queue-count]"));
    const lastJobStatus = document.querySelector("[data-last-job-status]");
    const lastJobDetail = document.querySelector("[data-last-job-detail]");
    const refreshLabel = document.querySelector("[data-refresh-label]");

    if (!root) {
        return;
    }

    function getCookie(name) {
        return document.cookie
            .split(";")
            .map((value) => value.trim())
            .find((value) => value.startsWith(`${name}=`))
            ?.split("=")[1] || "";
    }

    function label(ok) {
        return ok ? "ONLINE" : "OFFLINE";
    }

    function statusClass(ok) {
        return ok ? "is-online" : "is-offline";
    }

    function renderDetail(value, fallback) {
        return value || fallback;
    }

    function escapeHtml(value) {
        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll("\"", "&quot;")
            .replaceAll("'", "&#039;");
    }

    function serviceEntries(payload) {
        return [
            {
                name: "WEB",
                value: label(payload.web?.ok),
                ok: Boolean(payload.web?.ok),
                detail: "Django request path",
            },
            {
                name: "DATABASE",
                value: label(payload.database?.ok),
                ok: Boolean(payload.database?.ok),
                detail: renderDetail(payload.database?.error, "Primary relational store"),
            },
            {
                name: "REDIS",
                value: label(payload.redis?.ok),
                ok: Boolean(payload.redis?.ok),
                detail: renderDetail(payload.redis?.error, "Broker and telemetry cache"),
            },
            {
                name: "WORKER",
                value: label(payload.worker?.ok),
                ok: Boolean(payload.worker?.ok),
                detail: renderDetail(payload.worker?.heartbeat_at, payload.worker?.error || "Celery recognition executor"),
            },
            {
                name: "MODEL",
                value: String(payload.model?.status || "UNKNOWN").toUpperCase(),
                ok: Boolean(payload.model?.ok),
                detail: renderDetail(payload.model?.message, payload.model?.last_error || "pix2tex status pending"),
            },
            {
                name: "MEDIA",
                value: label(payload.media?.ok),
                ok: Boolean(payload.media?.ok),
                detail: renderDetail(payload.media?.error, payload.media?.root || "Upload and output storage"),
            },
        ];
    }

    function renderHealth(payload) {
        if (!grid || !payload) {
            return;
        }
        const entries = serviceEntries(payload);
        const onlineCount = entries.filter((entry) => entry.ok).length;
        grid.innerHTML = entries
            .map((entry) => `
                <article class="service-card ${statusClass(entry.ok)}">
                    <span>${escapeHtml(entry.name)}</span>
                    <strong>${escapeHtml(entry.value)}</strong>
                    <p>${escapeHtml(entry.detail)}</p>
                </article>
            `)
            .join("");

        if (healthScore) {
            healthScore.textContent = `${onlineCount}/${entries.length}`;
        }
        if (healthSummary) {
            healthSummary.textContent = onlineCount === entries.length
                ? "All runtime systems are online."
                : `${entries.length - onlineCount} runtime service needs attention.`;
        }
        if (statusText) {
            statusText.textContent = payload.model?.message || "Ready to request model warmup";
        }
        queueCounts.forEach((node) => {
            node.textContent = payload.queues?.[node.dataset.queueCount] ?? 0;
        });
        if (lastJobStatus) {
            lastJobStatus.textContent = String(payload.last_job?.status || "NONE").toUpperCase();
        }
        if (lastJobDetail) {
            lastJobDetail.textContent = payload.last_job?.stage_label || payload.last_job?.error || "No mission has been recorded yet";
        }
        if (refreshLabel) {
            refreshLabel.textContent = `Updated ${new Date().toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})}`;
        }
    }

    async function refreshHealth() {
        try {
            const response = await fetch(root.dataset.healthUrl, {headers: {"Accept": "application/json"}});
            if (response.ok) {
                renderHealth(await response.json());
            }
        } catch (error) {
            if (statusText) {
                statusText.textContent = "Health telemetry unavailable";
            }
        }
    }

    if (form) {
        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            if (statusText) {
                statusText.textContent = "Warmup command queued...";
            }
            try {
                const response = await fetch(root.dataset.warmupUrl, {
                    method: "POST",
                    headers: {
                        "Accept": "application/json",
                        "X-CSRFToken": getCookie("csrftoken"),
                    },
                });
                const payload = await response.json();
                if (statusText) {
                    statusText.textContent = payload.status === "queued" ? "Warmup command queued" : payload.error;
                }
            } catch (error) {
                if (statusText) {
                    statusText.textContent = "Warmup request failed";
                }
            }
            window.setTimeout(refreshHealth, 900);
        });
    }

    try {
        const initialHealth = JSON.parse(document.getElementById("initial-health")?.textContent || "null");
        renderHealth(initialHealth);
    } catch (error) {
        if (statusText) {
            statusText.textContent = "Initial health telemetry unavailable";
        }
    }
    window.setTimeout(refreshHealth, 600);
})();
