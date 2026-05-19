(function () {
    const dropZone = document.querySelector("[data-drop-zone]");
    const input = dropZone ? dropZone.querySelector("input[type='file']") : null;
    const previewWrap = document.querySelector("[data-preview-wrap]");
    const previewImage = document.querySelector("[data-preview-image]");
    const previewName = document.querySelector("[data-preview-name]");
    const previewMeta = document.querySelector("[data-preview-meta]");
    const dropStatus = document.querySelector("[data-drop-status]");
    const launchButton = document.querySelector("[data-launch-button]");

    if (!dropZone || !input || !previewWrap || !previewImage || !previewName || !previewMeta || !dropStatus || !launchButton) {
        return;
    }

    let previewUrl = null;

    function formatBytes(bytes) {
        if (!bytes) {
            return "0 KB";
        }
        const units = ["B", "KB", "MB"];
        let value = bytes;
        let unitIndex = 0;
        while (value >= 1024 && unitIndex < units.length - 1) {
            value /= 1024;
            unitIndex += 1;
        }
        return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
    }

    function updatePreview(file) {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            previewUrl = null;
        }

        if (!file) {
            previewWrap.hidden = true;
            dropZone.classList.remove("has-file");
            dropStatus.textContent = "AWAITING IMAGE INPUT";
            launchButton.disabled = true;
            return;
        }

        previewUrl = URL.createObjectURL(file);
        previewImage.src = previewUrl;
        previewName.textContent = file.name;
        previewMeta.textContent = `${file.type || "image"} / ${formatBytes(file.size)}`;
        dropZone.classList.add("has-file");
        dropStatus.textContent = "IMAGE LOCKED";
        launchButton.disabled = false;
        previewWrap.hidden = false;

        previewImage.onload = () => {
            previewMeta.textContent = `${file.type || "image"} / ${formatBytes(file.size)} / ${previewImage.naturalWidth}x${previewImage.naturalHeight}`;
        };
    }

    launchButton.disabled = !input.files[0];
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
