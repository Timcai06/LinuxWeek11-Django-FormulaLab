(function () {
    const dropZone = document.querySelector("[data-drop-zone]");
    const input = dropZone ? dropZone.querySelector("input[type='file']") : null;
    const previewWrap = document.querySelector("[data-preview-wrap]");
    const previewImage = document.querySelector("[data-preview-image]");
    const previewName = document.querySelector("[data-preview-name]");

    if (!dropZone || !input || !previewWrap || !previewImage || !previewName) {
        return;
    }

    function updatePreview(file) {
        if (!file) {
            previewWrap.hidden = true;
            return;
        }
        previewImage.src = URL.createObjectURL(file);
        previewName.textContent = file.name;
        previewWrap.hidden = false;
    }

    input.addEventListener("change", () => updatePreview(input.files[0]));

    ["dragenter", "dragover"].forEach((eventName) => {
        dropZone.addEventListener(eventName, (event) => {
            event.preventDefault();
            dropZone.classList.add("is-dragging");
        });
    });

    ["dragleave", "drop"].forEach((eventName) => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove("is-dragging");
        });
    });

    dropZone.addEventListener("drop", (event) => {
        event.preventDefault();
        if (!event.dataTransfer.files.length) {
            return;
        }
        input.files = event.dataTransfer.files;
        updatePreview(event.dataTransfer.files[0]);
    });
})();
