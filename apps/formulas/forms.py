from pathlib import Path

from django import forms
from django.conf import settings


class FormulaUploadForm(forms.Form):
    image = forms.FileField()

    allowed_extensions = {".png", ".jpg", ".jpeg"}

    def clean_image(self):
        uploaded_file = self.cleaned_data["image"]
        max_mb = getattr(settings, "FORMULA_LAB_MAX_UPLOAD_MB", 10)
        max_bytes = max_mb * 1024 * 1024

        if uploaded_file.size > max_bytes:
            raise forms.ValidationError(f"PAYLOAD EXCEEDS {max_mb}MB LIMIT")

        extension = Path(uploaded_file.name).suffix.lower()
        if extension not in self.allowed_extensions:
            raise forms.ValidationError("Only PNG, JPG, and JPEG formula images are supported.")

        return uploaded_file
