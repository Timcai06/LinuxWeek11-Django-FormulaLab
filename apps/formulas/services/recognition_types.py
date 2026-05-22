from dataclasses import dataclass


@dataclass(frozen=True)
class RecognitionResult:
    latex: str
    engine: str
    model: str
    duration_ms: int | None = None
    confidence: float | None = None

