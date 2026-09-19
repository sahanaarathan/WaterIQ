from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np
import os

# =========================================================
# APP
# =========================================================

app = FastAPI(
    title="WaterIQ AI API",
    description="AI-powered water quality and leak detection platform",
    version="1.0.0"
)

# Allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================================================
# LOAD MODELS
# =========================================================

quality_model = joblib.load(
    "models/water_quality_model.pkl"
)

leak_model = joblib.load(
    "models/leak_detection_model.pkl"
)


# =========================================================
# REQUEST MODELS
# =========================================================

class WaterReading(BaseModel):
    ph: float
    turbidity: float
    tds: float
    temperature: float
    conductivity: float
    flow_rate: float
    pressure: float


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/")
def root():
    return {
        "system": "WaterIQ",
        "status": "online",
        "message": "AI Water Intelligence API is running"
    }


# =========================================================
# WATER QUALITY PREDICTION
# =========================================================

@app.post("/predict")
def predict_water(data: WaterReading):

    quality_input = np.array([[
        data.ph,
        data.turbidity,
        data.tds,
        data.temperature,
        data.conductivity
    ]])

    leak_input = np.array([[
        data.flow_rate,
        data.pressure
    ]])

    # Water quality
    quality_prediction = quality_model.predict(
        quality_input
    )[0]

    quality_probabilities = quality_model.predict_proba(
        quality_input
    )[0]

    quality_confidence = float(
        max(quality_probabilities) * 100
    )

    # Leak
    leak_prediction = leak_model.predict(
        leak_input
    )[0]

    leak_probabilities = leak_model.predict_proba(
        leak_input
    )[0]

    leak_confidence = float(
        max(leak_probabilities) * 100
    )

    # Water safety score
    if quality_prediction == "SAFE":
        safety_score = 90
    elif quality_prediction == "WARNING":
        safety_score = 60
    else:
        safety_score = 25

    # Leak risk
    if leak_prediction == "LEAK":
        leak_risk = 85
    else:
        leak_risk = 10

    return {
        "water_quality": quality_prediction,
        "quality_confidence": round(
            quality_confidence, 2
        ),
        "safety_score": safety_score,

        "leak_status": leak_prediction,
        "leak_confidence": round(
            leak_confidence, 2
        ),
        "leak_risk": leak_risk,

        "sensor_data": {
            "ph": data.ph,
            "turbidity": data.turbidity,
            "tds": data.tds,
            "temperature": data.temperature,
            "conductivity": data.conductivity,
            "flow_rate": data.flow_rate,
            "pressure": data.pressure
        }
    }