(function () {
    const system = window.FormulaSystem || {};

    function modelStatusClass(payload) {
        return `is-${payload.model?.state || "unknown"}`;
    }

    function modelMessage(payload) {
        if (payload.model?.state === "ready") {
            return "";
        }
        return payload.model?.message || payload.model?.last_error || "Recognition model status pending";
    }

    function serviceEntries(payload) {
        return [
            {
                name: "WEB",
                value: system.label(payload.web?.ok),
                ok: Boolean(payload.web?.ok),
                detail: "Django request path",
            },
            {
                name: "DATABASE",
                value: system.label(payload.database?.ok),
                ok: Boolean(payload.database?.ok),
                detail: system.renderDetail(payload.database?.error, "Primary relational store"),
            },
            {
                name: "REDIS",
                value: system.label(payload.redis?.ok),
                ok: Boolean(payload.redis?.ok),
                detail: system.renderDetail(payload.redis?.error, "Broker and telemetry cache"),
            },
            {
                name: "WORKER",
                value: system.label(payload.worker?.ok),
                ok: Boolean(payload.worker?.ok),
                detail: system.renderDetail(payload.worker?.heartbeat_at, payload.worker?.error || "Celery recognition executor"),
            },
            {
                name: "MODEL",
                value: String(payload.model?.status || "UNKNOWN").toUpperCase(),
                ok: Boolean(payload.model?.ok),
                className: modelStatusClass(payload),
                detail: system.renderDetail(payload.model?.message, payload.model?.last_error || "Recognition model status pending"),
            },
            {
                name: "MEDIA",
                value: system.label(payload.media?.ok),
                ok: Boolean(payload.media?.ok),
                detail: system.renderDetail(payload.media?.error, payload.media?.root || "Upload and output storage"),
            },
        ];
    }

    system.modelStatusClass = modelStatusClass;
    system.modelMessage = modelMessage;
    system.serviceEntries = serviceEntries;
    window.FormulaSystem = system;
})();
