(function () {
    const system = window.FormulaSystem || {};

    function nodes() {
        return {
            root: document.querySelector("[data-health-url]"),
            serviceFlow: document.querySelector(".service-flow"),
            form: document.querySelector("[data-warmup-form]"),
            statusText: document.querySelector("[data-warmup-status]"),
            modelStatus: document.querySelector("[data-model-status]"),
            modelSummary: document.querySelector(".model-summary"),
            warmupButton: document.querySelector("[data-warmup-button]"),
            healthScore: document.querySelector("[data-health-score]"),
            healthSummary: document.querySelector("[data-health-summary]"),
            queueCounts: Array.from(document.querySelectorAll("[data-queue-count]")),
            lastJobStatus: document.querySelector("[data-last-job-status]"),
            lastJobDetail: document.querySelector("[data-last-job-detail]"),
            refreshLabel: document.querySelector("[data-refresh-label]"),
        };
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

    system.nodes = nodes;
    system.getCookie = getCookie;
    system.label = label;
    system.statusClass = statusClass;
    system.renderDetail = renderDetail;

    window.FormulaSystem = system;
})();
