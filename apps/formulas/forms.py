from pathlib import Path

from django import forms
from django.conf import settings
from PIL import Image, UnidentifiedImageError

from apps.formulas.models import PaperProject


class FormulaUploadForm(forms.Form):
    image = forms.FileField()
    project = forms.ModelChoiceField(
        queryset=PaperProject.objects.none(),
        required=False,
        empty_label="No project routing",
    )
    project_name = forms.CharField(max_length=120, required=False)

    allowed_extensions = {".png", ".jpg", ".jpeg"}
    allowed_image_formats = {"PNG", "JPEG"}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["project"].queryset = PaperProject.objects.all()

    def clean_image(self):
        uploaded_file = self.cleaned_data["image"]
        max_mb = getattr(settings, "FORMULA_LAB_MAX_UPLOAD_MB", 10)
        max_bytes = max_mb * 1024 * 1024

        if uploaded_file.size > max_bytes:
            raise forms.ValidationError(f"PAYLOAD EXCEEDS {max_mb}MB LIMIT")

        extension = Path(uploaded_file.name).suffix.lower()
        if extension not in self.allowed_extensions:
            raise forms.ValidationError("Only PNG, JPG, and JPEG formula images are supported.")

        try:
            image = Image.open(uploaded_file)
            image.verify()
        except (UnidentifiedImageError, OSError):
            raise forms.ValidationError("Only valid PNG, JPG, and JPEG formula images are supported.")
        finally:
            uploaded_file.seek(0)

        image_format = (image.format or "").upper()
        if image_format not in self.allowed_image_formats:
            raise forms.ValidationError("Only valid PNG, JPG, and JPEG formula images are supported.")

        return uploaded_file
