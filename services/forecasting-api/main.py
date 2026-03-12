"""
HuntLogic Forecasting API — FastAPI service for ML-powered draw odds predictions.
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(
    title="HuntLogic Forecasting API",
    description="ML-powered draw odds forecasting for western big game hunting",
    version="0.1.0",
)


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str


class ForecastRequest(BaseModel):
    state_code: str
    species: str
    hunt_unit: str | None = None
    weapon_type: str = "rifle"
    residency: str = "nonresident"
    years_ahead: int = 3


class ForecastResponse(BaseModel):
    state_code: str
    species: str
    hunt_unit: str | None
    predictions: list[dict]
    model_version: str
    confidence: float


@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="healthy",
        service="forecasting-api",
        version="0.1.0",
    )


@app.post("/api/v1/forecast", response_model=ForecastResponse)
async def generate_forecast(request: ForecastRequest):
    """Generate draw odds forecast for a given state/species/unit combination."""
    # TODO: Load trained model and generate predictions
    # For now, return placeholder response
    return ForecastResponse(
        state_code=request.state_code,
        species=request.species,
        hunt_unit=request.hunt_unit,
        predictions=[],
        model_version="0.0.0-placeholder",
        confidence=0.0,
    )


@app.get("/api/v1/models")
async def list_models():
    """List available forecasting models and their metadata."""
    # TODO: Return list of trained models
    return {"models": [], "message": "No models trained yet"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
