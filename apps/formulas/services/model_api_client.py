import httpx

from apps.formulas.services.recognition_types import RecognitionResult


class ModelApiError(RuntimeError):
    def __init__(self, message: str, *, status_code: int | None = None, code: str | None = None) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.code = code


class ModelApiRecognitionClient:
    name = "http"
    engine_name = "model-api"

    def __init__(self, base_url: str, timeout_seconds: int, transport=None) -> None:
        self.base_url = base_url.rstrip("/")
        self.timeout_seconds = timeout_seconds
        self.transport = transport

    def recognize(self, image_path: str) -> RecognitionResult:
        try:
            with httpx.Client(timeout=self.timeout_seconds, transport=self.transport) as client:
                with open(image_path, "rb") as image_file:
                    response = client.post(
                        f"{self.base_url}/v1/formula/recognize",
                        files={"image": (image_path, image_file, "application/octet-stream")},
                    )
        except httpx.HTTPError as exc:
            raise ModelApiError(str(exc)) from exc

        if response.status_code >= 400:
            _raise_model_api_error(response)

        payload = response.json()
        return RecognitionResult(
            latex=payload["latex"],
            engine=payload["engine"],
            model=payload["model"],
            duration_ms=payload.get("duration_ms"),
            confidence=payload.get("confidence"),
        )

    def warmup(self) -> dict:
        try:
            with httpx.Client(timeout=self.timeout_seconds, transport=self.transport) as client:
                response = client.post(f"{self.base_url}/warmup")
        except httpx.HTTPError as exc:
            raise ModelApiError(str(exc)) from exc

        if response.status_code >= 400:
            _raise_model_api_error(response)
        return response.json()


def _raise_model_api_error(response: httpx.Response) -> None:
    try:
        payload = response.json()
    except ValueError:
        raise ModelApiError(response.text, status_code=response.status_code) from None
    message = payload.get("error") or payload.get("detail") or response.text
    raise ModelApiError(message, status_code=response.status_code, code=payload.get("code"))
