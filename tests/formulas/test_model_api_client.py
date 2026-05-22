import httpx
from django.test import SimpleTestCase


class ModelApiRecognitionClientTests(SimpleTestCase):
    def test_model_api_client_parses_success_response(self):
        from apps.formulas.services.model_api_client import ModelApiRecognitionClient

        def handler(request: httpx.Request) -> httpx.Response:
            self.assertEqual(request.url.path, "/v1/formula/recognize")
            self.assertEqual(request.method, "POST")
            return httpx.Response(
                200,
                json={
                    "latex": r"\int_0^1 x^2 dx",
                    "engine": "paddle",
                    "model": "PP-FormulaNet_plus-S",
                    "duration_ms": 1200,
                    "confidence": None,
                },
            )

        client = ModelApiRecognitionClient(
            "http://model-api:9000/",
            30,
            transport=httpx.MockTransport(handler),
        )

        result = client.recognize(__file__)

        self.assertEqual(result.latex, r"\int_0^1 x^2 dx")
        self.assertEqual(result.engine, "paddle")
        self.assertEqual(result.model, "PP-FormulaNet_plus-S")
        self.assertEqual(result.duration_ms, 1200)
        self.assertIsNone(result.confidence)

    def test_model_api_client_raises_readable_error(self):
        from apps.formulas.services.model_api_client import ModelApiError, ModelApiRecognitionClient

        transport = httpx.MockTransport(
            lambda request: httpx.Response(
                503,
                json={"error": "model warming", "code": "MODEL_NOT_READY"},
            )
        )
        client = ModelApiRecognitionClient("http://model-api:9000", 30, transport=transport)

        with self.assertRaisesMessage(ModelApiError, "model warming") as error:
            client.recognize(__file__)

        self.assertEqual(error.exception.status_code, 503)
        self.assertEqual(error.exception.code, "MODEL_NOT_READY")

    def test_model_api_client_wraps_transport_error(self):
        from apps.formulas.services.model_api_client import ModelApiError, ModelApiRecognitionClient

        def handler(request: httpx.Request) -> httpx.Response:
            raise httpx.ConnectError("connection refused", request=request)

        client = ModelApiRecognitionClient(
            "http://model-api:9000",
            30,
            transport=httpx.MockTransport(handler),
        )

        with self.assertRaisesMessage(ModelApiError, "connection refused"):
            client.recognize(__file__)

    def test_model_api_client_warmup_calls_warmup_endpoint(self):
        from apps.formulas.services.model_api_client import ModelApiRecognitionClient

        def handler(request: httpx.Request) -> httpx.Response:
            self.assertEqual(request.url.path, "/warmup")
            self.assertEqual(request.method, "POST")
            return httpx.Response(
                200,
                json={"status": "ready", "engine": "paddle", "model": "PP-FormulaNet_plus-S"},
            )

        client = ModelApiRecognitionClient(
            "http://model-api:9000",
            30,
            transport=httpx.MockTransport(handler),
        )

        self.assertEqual(client.warmup(), {"status": "ready", "engine": "paddle", "model": "PP-FormulaNet_plus-S"})
