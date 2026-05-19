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
    let renderSequence = 0;
    const maxKatexAttempts = 80;

    function previewSource(value) {
        if (formats.render) {
            return formats.render;
        }
        return value.replace(/\$\$/g, "").replace(/\$/g, "").trim();
    }

    function renderPreview(value, attempt = 0, sequence = null) {
        const activeSequence = sequence === null ? ++renderSequence : sequence;
        if (activeSequence !== renderSequence) {
            return;
        }

        const source = previewSource(value);
        if (!source) {
            preview.textContent = "No LaTeX output recorded.";
            return;
        }

        if (!window.katex) {
            preview.textContent = "Loading formula renderer...";
            if (attempt < maxKatexAttempts) {
                window.setTimeout(() => renderPreview(output.value, attempt + 1, activeSequence), 50);
            }
            return;
        }

        try {
            window.katex.render(source, preview, {throwOnError: false, displayMode: current !== "inline"});
        } catch (error) {
            preview.textContent = source;
        }
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
