# MVP 08 — Recommendation Engine

## Problem
E-commerce platforms and content sites need to show users personalized "You Might Also Like" suggestions without requiring heavy user tracking history or expensive real-time API queries.

## What it does
- Computes content-based recommendations using TF-IDF vectorization and Cosine Similarity on product metadata (title, category, description).
- Instantly returns top-N matching items ordered by similarity percentage.
- Supports **chain-clicking**: selecting any recommended item immediately re-centers the recommendation engine.

## Tech Used
- **Model / Math**: `scikit-learn` (`TfidfVectorizer`, `cosine_similarity`), `pandas`
- **Backend**: FastAPI + Python 3.11
- **Frontend**: React (Vite) + Lucide Icons + Custom CSS

## Demo Hook
Chain-clicking navigation: click any recommended product card to visually shift focus and generate a new set of related recommendations dynamically.

## Run Locally

```bash
# 1. Backend
cd 08-recommendation-engine/backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8001

# 2. Frontend (in a new terminal)
cd 08-recommendation-engine/frontend
npm install
npm run dev
```

Visit [http://localhost:5174](http://localhost:5174) in your browser.
