# MVP 02 — Sales & Demand Forecaster

## Problem
Businesses struggle to plan inventory, staffing, and budget allocations without accurate time-series forecasting of future demand trends.

## What it does
- Accepts historical monthly sales CSV data or uses a synthetic benchmark dataset.
- Fits mathematical regression trend and seasonality models.
- Generates forward-looking demand projections with lower and upper confidence bounds.
- Provides interactive slider controls to dynamically adjust the forecast horizon (1 to 12 months ahead).

## Tech Used
- **Model**: Mathematical Time-Series Regression (`scikit-learn` Ridge with polynomial seasonal trend decomposition)
- **Backend**: FastAPI + Python 3.11 + Pandas + Numpy
- **Frontend**: React (Vite) + Lucide Icons + SVG Trend Chart

## Demo Hook
Interactive period slider: slide from 1 to 12 months to watch the trend lines, confidence intervals, and summary projections update dynamically.

## Run Locally

```bash
# 1. Backend
cd 02-prediction-forecast/backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8003

# 2. Frontend (in a new terminal)
cd 02-prediction-forecast/frontend
npm install
npm run dev
```

Visit [http://localhost:5176](http://localhost:5176) in your browser.
