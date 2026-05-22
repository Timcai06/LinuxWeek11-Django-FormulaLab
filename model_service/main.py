import tempfile
from pathlib import Path

from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse

from model_service import engine
from model_service.schemas import HealthResponse, RecognitionResponse


def create_app() -> FastAPI:
    app = FastAPI(title="Formula Lab Model API")

    @app.get("/health", response_model=HealthResponse)
    def health():
        snapshot = engine.health_snapshot()
        status_code = 200 if snapshot["status"] == "ready" else 503
        return JSONResponse(status_code=status_code, content=snapshot)

    @app.get("/models/current")
    def models_current():
        return engine.current_model_info()

    @app.post("/warmup", response_model=HealthResponse)
    def warmup():
        try:
            return HealthResponse(**engine.warmup_model())
        except Exception as exc:
            return JSONResponse(
                status_code=503,
                content={"error": str(exc) or exc.__class__.__name__, "code": "MODEL_WARMUP_FAILED"},
            )

    @app.post("/v1/formula/recognize", response_model=RecognitionResponse)
    async def recognize_formula(image: UploadFile = File(...)):
        suffix = Path(image.filename or "formula.png").suffix or ".png"
        try:
            with tempfile.NamedTemporaryFile(suffix=suffix, delete=True) as temp_file:
                temp_file.write(await image.read())
                temp_file.flush()
                result = engine.recognize_image(temp_file.name)
        except Exception as exc:
            return JSONResponse(
                status_code=503,
                content={"error": str(exc) or exc.__class__.__name__, "code": "MODEL_INFERENCE_FAILED"},
            )
        return RecognitionResponse(**result)

    return app


app = create_app()
