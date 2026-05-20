from threading import Lock

from PIL import Image


_CACHED_MODEL = None
_MODEL_LOCK = Lock()


class Pix2TexEngine:
    name = "pix2tex"

    def warmup(self) -> None:
        self._load_model()

    def recognize(self, image_path: str) -> str:
        model = self._load_model()
        with Image.open(image_path) as image:
            return model(image.copy())

    def _load_model(self):
        global _CACHED_MODEL

        if _CACHED_MODEL is not None:
            return _CACHED_MODEL

        with _MODEL_LOCK:
            if _CACHED_MODEL is None:
                from pix2tex.cli import LatexOCR

                _CACHED_MODEL = LatexOCR()
        return _CACHED_MODEL
