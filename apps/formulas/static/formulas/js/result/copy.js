(function () {
    const result = window.FormulaResult || {};

    function setupCopyButton() {
        const copyButton = document.querySelector("[data-copy-current]");
        const output = result.nodes().output;
        if (!copyButton || !output) {
            return;
        }
        copyButton.addEventListener("click", async () => {
            try {
                await navigator.clipboard.writeText(output.value);
                copyButton.classList.add("copied-glow");
                const textSpan = copyButton.querySelector("span");
                if (textSpan) {
                    textSpan.textContent = "COPIED";
                }
                window.setTimeout(() => {
                    copyButton.classList.remove("copied-glow");
                    if (textSpan) {
                        textSpan.textContent = "COPY";
                    }
                }, 1000);
            } catch (error) {
                console.error("Failed to copy text: ", error);
            }
        });
    }

    result.setupCopyButton = setupCopyButton;
    window.FormulaResult = result;
})();
