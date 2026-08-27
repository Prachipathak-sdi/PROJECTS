# MVP 04 — Sentiment Analysis Classifier

## Problem
Businesses receive thousands of customer feedback snippets, reviews, and support comments daily. Relying on commercial LLM APIs for high-volume basic classification creates high latency and recurring per-request API costs.

## What it does
- Trains a lightweight classical ML model (**TF-IDF + Logistic Regression**) offline on labeled review data.
- Saves trained artifacts (`model.pkl` and `vectorizer.pkl`) directly in the repository.
- Performs sub-10ms instant sentiment classification (*Positive*, *Negative*, *Neutral*) with exact confidence scores and zero external API dependencies.

## Tech Used
- **Model**: `scikit-learn` (`TfidfVectorizer`, `LogisticRegression`), `joblib`
- **Backend**: FastAPI + Python 3.11
- **Frontend**: React (Vite) + Lucide Icons + Animated Gauges

## Demo Hook
Sub-10ms instant inference speed: real-time animated confidence gauge and probability breakdown with zero API delay.

## Run Locally

```bash
# 1. Backend
cd 04-sentiment-classifier/backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python train.py            # Optional: retrain model offline (auto-runs if model.pkl is missing)
uvicorn main:app --reload --port 8002

# 2. Frontend (in a new terminal)
cd 04-sentiment-classifier/frontend
npm install
npm run dev
```

Visit [http://localhost:5175](http://localhost:5175) in your browser.
