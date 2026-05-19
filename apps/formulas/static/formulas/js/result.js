(function () {
    const dataNode = document.getElementById("latex-formats");
    const output = document.querySelector("[data-latex-output]");
    const preview = document.querySelector("[data-katex-preview]");
    const copyButton = document.querySelector("[data-copy-current]");
    const tabs = Array.from(document.querySelectorAll("[data-format-tab]"));

    if (!dataNode || !output || !preview) {
        return;
    }

    const formats = JSON.parse(dataNode.textContent);
    let current = "block";

    function previewSource(value) {
        if (current === "block" || current === "inline") {
            return formats.render || value.replace(/\$/g, "");
        }
        return value;
    }

    function renderPreview(value) {
        const source = previewSource(value);
        if (window.katex && source) {
            try {
                window.katex.render(source, preview, {throwOnError: false, displayMode: current !== "inline"});
                return;
            } catch (error) {
                preview.textContent = source;
                return;
            }
        }
        preview.textContent = source || "No LaTeX output recorded.";
    }

    function selectFormat(name) {
        current = name;
        output.value = formats[name] || "";
        tabs.forEach((tab) => {
            tab.setAttribute("aria-selected", tab.dataset.formatTab === name ? "true" : "false");
        });
        renderPreview(output.value);
    }

    tabs.forEach((tab) => {
        tab.addEventListener("click", () => selectFormat(tab.dataset.formatTab));
    });

    output.addEventListener("input", () => renderPreview(output.value));

    if (copyButton) {
        copyButton.addEventListener("click", async () => {
            await navigator.clipboard.writeText(output.value);
            copyButton.textContent = "COPIED";
            window.setTimeout(() => {
                copyButton.textContent = "COPY CURRENT";
            }, 1100);
        });
    }

    selectFormat("block");
})();
