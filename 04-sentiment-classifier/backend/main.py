import os
import joblib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from train import train_model

app = FastAPI(
    title="MVP 04 - Sentiment Analysis Classifier",
    description="Offline Scikit-Learn Classical ML Sentiment Classifier (Zero API Cost)",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")
VECTORIZER_PATH = os.path.join(BASE_DIR, "vectorizer.pkl")

# Train offline model if missing
if not os.path.exists(MODEL_PATH) or not os.path.exists(VECTORIZER_PATH):
    train_model()

model = joblib.load(MODEL_PATH)
vectorizer = joblib.load(VECTORIZER_PATH)

class TextIn(BaseModel):
    text: str = Field(..., example="This product exceeded all my expectations! Highly recommended.")

@app.get("/")
def health():
    return {
        "status": "ok",
        "mvp": "04-sentiment-classifier",
        "model_loaded": True,
        "classes": list(model.classes_)
    }

@app.post("/api/sentiment/predict")
def predict(payload: TextIn):
    if not payload.text.trim():
        raise HTTPException(status_code=400, detail="Text input cannot be empty.")
        
    vec = vectorizer.transform([payload.text])
    pred_label = model.predict(vec)[0]
    
    # Calculate probabilities across classes
    probs = model.predict_proba(vec)[0]
    prob_dict = {cls: round(float(prob), 4) for cls, prob in zip(model.classes_, probs)}
    confidence = round(float(max(probs)), 4)
    
    return {
        "text": payload.text,
        "label": pred_label,
        "confidence": confidence,
        "confidence_percentage": int(round(confidence * 100)),
        "probabilities": prob_dict
    }
