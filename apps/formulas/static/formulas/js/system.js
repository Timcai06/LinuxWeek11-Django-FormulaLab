(function () {
    const root = document.querySelector("[data-health-url]");
    const grid = document.querySelector("[data-system-grid]");
    const form = document.querySelector("[data-warmup-form]");
    const statusText = document.querySelector("[data-warmup-status]");

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

    function renderHealth(payload) {
        if (!grid || !payload) {
            return;
        }
        const entries = [
            ["WEB", label(payload.web?.ok)],
            ["DATABASE", label(payload.database?.ok)],
            ["REDIS", label(payload.redis?.ok)],
            ["WORKER", label(payload.worker?.ok)],
            ["MODEL", String(payload.model?.status || "UNKNOWN").toUpperCase()],
            ["MEDIA", label(payload.media?.ok)],
        ];
        grid.innerHTML = entries
            .map(([name, value]) => `<article><span>${name}</span><strong>${value}</strong></article>`)
            .join("");
        if (statusText) {
            statusText.textContent = payload.model?.message || "Ready to request model warmup";
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

    window.setTimeout(refreshHealth, 600);
})();
