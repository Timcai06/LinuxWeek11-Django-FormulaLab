(function () {
    const result = window.FormulaResult || {};

    function nodes() {
        return {
            dataNode: document.getElementById("latex-formats"),
            output: document.querySelector("[data-latex-output]"),
            preview: document.querySelector("[data-katex-preview]"),
            tabs: Array.from(document.querySelectorAll("[data-format-tab]")),
            consoleTabs: document.querySelector(".console-tabs"),
        };
    }

    function formulaLab() {
        return window.FormulaLab || {};
    }

    function formats() {
        const dataNode = nodes().dataNode;
        if (!dataNode) {
            return {};
        }
        try {
            return JSON.parse(dataNode.textContent);
        } catch (error) {
            return {};
        }
    }

    function ready() {
        const dom = nodes();
        const lab = formulaLab();
        return Boolean(
            dom.dataNode &&
            dom.output &&
            dom.preview &&
            typeof lab.previewSource === "function" &&
            typeof lab.renderKatexPreview === "function" &&
            typeof lab.bindFormatTabs === "function"
        );
    }

    function metricNumber(value, fallback = 0) {
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    }

    function tightWidthValue(value) {
        if (typeof value === "number") {
            return value;
        }
        if (!value || typeof value !== "object") {
            return 0;
        }
        return metricNumber(value.tightWidth || value.width || value.targetWidth);
    }

    result.state = result.state || { current: "block", renderSequence: 0 };
    result.maxKatexAttempts = 80;
    result.tabIndices = { raw: 0, block: 1, inline: 2 };
    result.nodes = nodes;
    result.formulaLab = formulaLab;
    result.formats = formats;
    result.ready = ready;
    result.metricNumber = metricNumber;
    result.tightWidthValue = tightWidthValue;

    window.FormulaResult = result;
})();
