(function () {
    const result = window.FormulaResult || {};

    function setupImageViewport() {
        const viewport = document.querySelector(".scope-viewport");
        const image = document.querySelector(".scope-image");
        const title = document.querySelector("[data-viewport-title]");
        const buttons = Array.from(document.querySelectorAll("[data-image-toggle]"));
        if (!viewport || !image) {
            return;
        }

        buttons.forEach((button) => {
            button.addEventListener("click", () => {
                const mode = button.dataset.imageToggle;
                buttons.forEach((entry) => entry.classList.remove("active"));
                button.classList.add("active");

                if (mode === "preprocessed") {
                    if (viewport.dataset.preprocessedUrl) {
                        image.src = viewport.dataset.preprocessedUrl;
                    }
                    if (title) {
                        title.textContent = "BINARIZED IMAGE";
                    }
                    return;
                }

                if (viewport.dataset.originalUrl) {
                    image.src = viewport.dataset.originalUrl;
                }
                if (title) {
                    title.textContent = "ORIGINAL IMAGE";
                }
            });
        });

        const resolutionLabel = document.querySelector("[data-scope-resolution]");

        function updateImageResolution() {
            if (!resolutionLabel) {
                return;
            }
            const width = image.naturalWidth;
            const height = image.naturalHeight;
            resolutionLabel.textContent = width && height ? `${width} × ${height} PX` : "0 × 0 PX";
        }

        if (image.complete) {
            updateImageResolution();
        }
        image.addEventListener("load", updateImageResolution);
    }

    result.setupImageViewport = setupImageViewport;
    window.FormulaResult = result;
})();
