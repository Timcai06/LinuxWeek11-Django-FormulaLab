from io import BytesIO

from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image

CONTENT_TYPES_BY_SUFFIX = {
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".png": "image/png",
}


def image_bytes(format_name: str = "PNG") -> bytes:
    buffer = BytesIO()
    Image.new("RGB", (10, 5), (255, 255, 255)).save(buffer, format=format_name)
    return buffer.getvalue()


def upload_file(name: str = "formula.png", content: bytes | None = None) -> SimpleUploadedFile:
    if content is None:
        content = image_bytes("JPEG" if name.lower().endswith((".jpg", ".jpeg")) else "PNG")
    suffix = "." + name.rsplit(".", 1)[-1].lower() if "." in name else ""
    content_type = CONTENT_TYPES_BY_SUFFIX.get(suffix, "application/octet-stream")
    return SimpleUploadedFile(name, content, content_type=content_type)
