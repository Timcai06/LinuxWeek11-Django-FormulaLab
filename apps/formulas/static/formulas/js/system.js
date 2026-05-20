(function () {
    const root = document.querySelector("[data-health-url]");
    const serviceFlow = document.querySelector(".service-flow");
    const form = document.querySelector("[data-warmup-form]");
    const statusText = document.querySelector("[data-warmup-status]");
    const modelStatus = document.querySelector("[data-model-status]");
    const modelSummary = document.querySelector(".model-summary");
    const warmupButton = document.querySelector("[data-warmup-button]");
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

    function modelStatusClass(payload) {
        return `is-${payload.model?.state || "unknown"}`;
    }

    function modelMessage(payload) {
        if (payload.model?.state === "ready") {
            return "";
        }
        return payload.model?.message || payload.model?.last_error || "Recognition model status pending";
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
                className: modelStatusClass(payload),
                detail: renderDetail(payload.model?.message, payload.model?.last_error || "Recognition model status pending"),
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
        if (!payload) {
            return;
        }
        const entries = serviceEntries(payload);
        const onlineCount = entries.filter((entry) => entry.ok).length;

        // Update service items in-place
        entries.forEach((entry) => {
            const row = document.querySelector(`[data-service="${entry.name}"]`);
            if (row) {
                // Remove previous status classes first
                row.classList.remove('is-online', 'is-offline', 'is-ready', 'is-warming', 'is-warning', 'is-error', 'is-unknown');
                
                // Add new status class
                if (entry.className) {
                    row.classList.add(entry.className);
                } else {
                    row.classList.add(statusClass(entry.ok));
                }
                
                const p = row.querySelector('.service-detail');
                if (p) {
                    p.textContent = entry.detail;
                }
                
                const em = row.querySelector('.service-value');
                if (em) {
                    em.textContent = entry.value;
                }
            }
        });

        if (healthScore) {
            healthScore.textContent = `${onlineCount}/${entries.length}`;
        }

        // Update SVG circular health progress ring
        const dialFg = document.querySelector('.dial-fg');
        if (dialFg) {
            const circumference = 264;
            const ratio = onlineCount / entries.length;
            const offset = circumference - ratio * circumference;
            dialFg.style.strokeDashoffset = offset;
            
            // Set dynamic glowing status colors for health dial
            if (ratio === 1) {
                dialFg.style.stroke = 'var(--status-ready)';
                dialFg.style.filter = 'drop-shadow(0 0 10px rgba(92, 255, 176, 0.7))';
            } else if (ratio >= 0.6) {
                dialFg.style.stroke = 'var(--status-warming)';
                dialFg.style.filter = 'drop-shadow(0 0 10px rgba(246, 200, 95, 0.6))';
            } else {
                dialFg.style.stroke = 'var(--status-error)';
                dialFg.style.filter = 'drop-shadow(0 0 10px rgba(255, 77, 77, 0.7))';
            }
        }

        if (healthSummary) {
            healthSummary.textContent = onlineCount === entries.length
                ? "All runtime systems are online."
                : `${entries.length - onlineCount} runtime service needs attention.`;
        }
        if (modelSummary) {
            modelSummary.className = `summary-card model-summary ${modelStatusClass(payload)}`;
        }
        if (modelStatus) {
            modelStatus.textContent = String(payload.model?.status || "UNKNOWN").toUpperCase();
        }
        if (statusText) {
            statusText.textContent = modelMessage(payload);
        }
        if (warmupButton) {
            warmupButton.textContent = payload.model?.state === "ready" ? "RE-WARM MODEL" : "WARMUP MODEL";
        }
        queueCounts.forEach((node) => {
            node.textContent = payload.queues?.[node.dataset.queueCount] ?? 0;
        });

        // Update queue stacked progress bars
        const queues = payload.queues || {};
        const queueTotal = (queues.queued || 0) + (queues.running || 0) + (queues.succeeded || 0) + (queues.failed || 0);
        ['queued', 'running', 'succeeded', 'failed'].forEach((type) => {
            const count = queues[type] || 0;
            const segment = document.querySelector(`[data-queue-segment="${type}"]`);
            if (segment) {
                const pct = queueTotal > 0 ? (count / queueTotal) * 100 : 0;
                segment.style.width = `${pct}%`;
            }
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
