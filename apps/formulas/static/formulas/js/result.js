(function () {
    const dataNode = document.getElementById("latex-formats");
    const output = document.querySelector("[data-latex-output]");
    const preview = document.querySelector("[data-katex-preview]");
    const copyButton = document.querySelector("[data-copy-current]");
    const tabs = Array.from(document.querySelectorAll("[data-format-tab]"));

    const formulaLab = window.FormulaLab || {};

    if (
        !dataNode ||
        !output ||
        !preview ||
        typeof formulaLab.previewSource !== "function" ||
        typeof formulaLab.renderKatexPreview !== "function" ||
        typeof formulaLab.bindFormatTabs !== "function"
    ) {
        return;
    }

    const formats = JSON.parse(dataNode.textContent);
    let current = "block";
    let renderSequence = 0;
    const maxKatexAttempts = 80;

    function renderPreview(value, attempt = 0, sequence = null) {
        const activeSequence = sequence === null ? ++renderSequence : sequence;
        if (activeSequence !== renderSequence) {
            return;
        }

        const source = formulaLab.previewSource(formats, value);
        const rendered = formulaLab.renderKatexPreview(preview, source, true);
        if (!rendered && !window.katex) {
            if (attempt < maxKatexAttempts) {
                window.setTimeout(() => renderPreview(output.value, attempt + 1, activeSequence), 50);
            }
        }
    }

    const consoleTabs = document.querySelector(".console-tabs");
    const tabIndices = { "raw": 0, "block": 1, "inline": 2 };



    function selectFormat(name) {
        current = name;
        output.value = formats[name] || "";
        tabs.forEach((tab) => {
            tab.setAttribute("aria-selected", tab.dataset.formatTab === name ? "true" : "false");
        });
        if (consoleTabs) {
            consoleTabs.style.setProperty("--active-index", tabIndices[name] !== undefined ? tabIndices[name] : 1);
        }
        renderPreview(output.value);
    }

    formulaLab.bindFormatTabs(tabs, selectFormat);

    output.addEventListener("input", () => {
        renderPreview(output.value);
    });

    if (copyButton) {
        copyButton.addEventListener("click", async () => {
            await navigator.clipboard.writeText(output.value);
            copyButton.textContent = "COPIED";
            window.setTimeout(() => {
                copyButton.textContent = "COPY";
            }, 1100);
        });
    }

    selectFormat("block");
})();
