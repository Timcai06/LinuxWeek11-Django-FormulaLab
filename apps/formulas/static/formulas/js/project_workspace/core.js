(function () {
    const workspace = window.FormulaProjectWorkspace || {};
    const maxKatexAttempts = 80;

    function cleanLatex(source) {
        return (source || "").replace(/\$\$/g, "").replace(/\$/g, "").trim();
    }

    function renderLatex(source, target, displayMode) {
        const latex = cleanLatex(source);
        if (!target) {
            return;
        }
        if (!latex || latex === "No LaTeX captured") {
            target.textContent = "No LaTeX captured.";
            return;
        }
        if (!window.katex) {
            target.textContent = "Loading formula renderer...";
            return;
        }
        try {
            window.katex.render(latex, target, { throwOnError: false, displayMode });
        } catch (error) {
            target.textContent = latex;
        }
    }

    function renderWhenReady(callback, attempt) {
        if (window.katex || attempt >= maxKatexAttempts) {
            callback();
            return;
        }
        window.setTimeout(() => renderWhenReady(callback, attempt + 1), 50);
    }

    function readJsonScript(id) {
        const dataNode = document.getElementById(id);
        if (!dataNode) {
            return [];
        }
        try {
            return JSON.parse(dataNode.textContent);
        } catch (error) {
            return [];
        }
    }

    workspace.cleanLatex = cleanLatex;
    workspace.renderLatex = renderLatex;
    workspace.renderWhenReady = renderWhenReady;
    workspace.readJsonScript = readJsonScript;
    workspace.previewData = () => readJsonScript("paper-preview-data");

    window.FormulaProjectWorkspace = workspace;
})();
