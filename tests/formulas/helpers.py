from io import BytesIO

from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image


def image_bytes(format_name: str = "PNG") -> bytes:
    buffer = BytesIO()
    Image.new("RGB", (10, 5), (255, 255, 255)).save(buffer, format=format_name)
    return buffer.getvalue()


def upload_file(name: str = "formula.png", content: bytes | None = None) -> SimpleUploadedFile:
    if content is None:
        content = image_bytes("JPEG" if name.lower().endswith((".jpg", ".jpeg")) else "PNG")
    return SimpleUploadedFile(name, content, content_type="image/png")
