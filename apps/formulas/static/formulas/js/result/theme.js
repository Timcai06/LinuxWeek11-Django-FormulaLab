(function () {
    const result = window.FormulaResult || {};

    function setupPreviewTheme() {
        const themeToggle = document.querySelector("[data-theme-toggle]");
        const container = document.querySelector("[data-katex-preview-container]");
        if (!themeToggle || !container) {
            return;
        }
        const toggleText = themeToggle.querySelector(".toggle-text");

        function setTheme(theme) {
            const dark = theme === "dark";
            container.classList.toggle("katex-preview-paper", !dark);
            container.classList.toggle("katex-preview-dark", dark);
            if (toggleText) {
                toggleText.textContent = dark ? "CONSOLE MODE" : "PAPER MODE";
            }
            localStorage.setItem("katex-preview-theme", dark ? "dark" : "paper");
        }

        setTheme("paper");
        themeToggle.addEventListener("click", () => {
            setTheme(container.classList.contains("katex-preview-dark") ? "paper" : "dark");
        });
    }

    result.setupPreviewTheme = setupPreviewTheme;
    window.FormulaResult = result;
})();
