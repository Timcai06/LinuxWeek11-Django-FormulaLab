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
    const pulseDot = document.querySelector(".mission-tag .pulse-dot");
    const logFeed = document.querySelector("[data-log-feed]");
    const scanline = document.querySelector("[data-scanline]");
    const stageItems = Array.from(document.querySelectorAll("[data-stage-item]"));
    const stageOrder = stageItems.map((item) => item.dataset.stageItem);

    const stageLogs = {
        "UPLOAD_LOCKED": ["[SYS] Handshake complete", "[INF] Target acquired: local upload"],
        "QUEUED": ["[SYS] Added to task queue...", "[INF] Awaiting available worker..."],
        "MODEL_WARMUP": ["[SYS] Allocating Tensor cores...", "[INF] Loading model weights into VRAM...", "[SYS] Engine warmed up"],
        "IMAGE_PREPROCESS": ["[INF] Extracting image features...", "[SYS] Applying grayscale filter...", "[INF] Bounding box detection running..."],
        "INFERENCE": ["[INF] Forward pass started...", "[SYS] Executing OCR decoder...", "[INF] Generating tokens...", "[SYS] Attention maps stable"],
        "LATEX_POSTPROCESS": ["[SYS] Parsing raw output...", "[INF] Formatting LaTeX nodes...", "[SYS] Applying syntax highlights"],
        "RESULT_READY": ["[SYS] Recognition finalized", "[INF] Report generated successfully"]
    };

    let currentLogIndex = 0;
    let lastStage = "";

    function updateLogsAndScanline(stageCode) {
        if (scanline) {
            scanline.classList.toggle("is-active", ["IMAGE_PREPROCESS", "INFERENCE", "LATEX_POSTPROCESS"].includes(stageCode));
        }
        if (logFeed && stageCode !== lastStage && stageLogs[stageCode]) {
            lastStage = stageCode;
            logFeed.innerHTML = "";
            currentLogIndex = 0;
            const logs = stageLogs[stageCode];

            function printNextLog() {
                if (currentLogIndex < logs.length && stageCode === lastStage) {
                    const span = document.createElement("span");
                    span.textContent = logs[currentLogIndex];
                    logFeed.appendChild(span);
                    logFeed.scrollTop = logFeed.scrollHeight;
                    currentLogIndex++;
                    window.setTimeout(printNextLog, Math.random() * 600 + 400);
                }
            }
            printNextLog();
        }
    }

    function renderStages(stageCode) {
        const currentIndex = Math.max(stageOrder.indexOf(stageCode), 0);
        stageItems.forEach((item, index) => {
            item.classList.toggle("is-active", index === currentIndex);
            item.classList.toggle("is-complete", index < currentIndex);
        });
    }

    function applyStatus(payload) {
        if (pulseDot) {
            pulseDot.className = `pulse-dot status-${String(payload.status || "").toLowerCase()}`;
        }
        if (statusEl) {
            statusEl.textContent = String(payload.status || "unknown").toUpperCase();
        }
        if (progressStateEl) {
            progressStateEl.textContent = String(payload.status || "unknown").toUpperCase();
        }
        stageEl.textContent = payload.stage_label || "UNKNOWN";
        if (payload.stage_code === "RESULT_READY" || payload.status === "succeeded") {
            messageEl.style.display = "none";
        } else {
            messageEl.style.display = "";
            messageEl.textContent = payload.stage_message || "";
        }
        const progress = Number(payload.progress || 0);
        barEl.style.width = `${progress}%`;
        if (progressValueEl) {
            progressValueEl.textContent = `${progress}%`;
        }
        renderStages(payload.stage_code);
        updateLogsAndScanline(payload.stage_code);

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

    if (barEl) {
        const initialProgress = Number(barEl.dataset.initialProgress || 0);
        barEl.style.width = `${initialProgress}%`;
    }
    const initialStage = root.dataset.currentStageCode || document.querySelector("[data-stage-item].is-active")?.dataset.stageItem || "UPLOAD_LOCKED";
    renderStages(initialStage);
    updateLogsAndScanline(initialStage);
    window.setTimeout(poll, 800);
})();
