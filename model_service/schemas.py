from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    engine: str
    model: str
    device: str


class RecognitionResponse(BaseModel):
    latex: str
    engine: str
    model: str
    duration_ms: int
    confidence: float | None = None

