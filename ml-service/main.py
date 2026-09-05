"""
CyberLens ML Microservice.

Internal-only service — the browser extension and React dashboard never
call this directly; the Express backend forwards scan requests here and
relays the response back. See ../server/utils/mlService.js for the caller.
"""

import logging

from fastapi import FastAPI, HTTPException

from features.extract import extract_features
from model.predict import predictor
from schemas import PredictRequest, PredictResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("cyberlens-ml")

app = FastAPI(title="CyberLens ML Service", version="1.0.0")

# No CORS middleware: this service is called server-to-server by Express
# (Node's fetch/axios, not a browser), so CORS — a browser-only
# enforcement mechanism — doesn't apply here and a wide-open "*" policy
# would only add attack surface. Keep this service off the public
# internet per the plan's hosting notes (internal network / same host as
# the Express server) rather than trying to secure it via CORS.


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": predictor.is_trained}


@app.post("/predict", response_model=PredictResponse)
def predict(payload: PredictRequest):
    try:
        features = extract_features(
            url=payload.url,
            dom_html=payload.domHtml,
            forms=payload.forms,
            scripts=payload.scripts,
        )
        result = predictor.predict(features)
        logger.info(f"Scored {payload.url} -> {result['riskScore']} ({result['verdict']})")
        return result
    except Exception as exc:
        logger.exception("Prediction failed")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
