(function () {
    const result = window.FormulaResult;
    if (!result || !result.ready()) {
        return;
    }

    result.setupFormatControls();
    result.setupPreviewTheme();
    result.setupCopyButton();
    result.setupImageViewport();
    result.selectFormat("block");
})();
