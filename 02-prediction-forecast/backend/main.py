import os
import io
import pandas as pd
import numpy as np
from datetime import datetime
from dateutil.relativedelta import relativedelta
from fastapi import FastAPI, UploadFile, File, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sklearn.linear_model import Ridge

app = FastAPI(
    title="MVP 02 - Sales & Demand Forecaster",
    description="Time-Series Forecasting Engine for Enterprise Sales Data",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SAMPLE_PATH = os.path.join(os.path.dirname(__file__), "sample_data", "monthly_sales.csv")

def perform_forecast(df: pd.DataFrame, periods: int = 6):
    """
    Fit time-series regression model on historical date/sales dataframe
    and project forward for `periods` months with lower/upper confidence bounds.
    """
    df = df.copy()
    # Normalize column names
    col_map = {c.lower(): c for c in df.columns}
    date_col = next((c for c in df.columns if c.lower() in ["date", "ds", "month", "timestamp"]), None)
    sales_col = next((c for c in df.columns if c.lower() in ["sales", "y", "value", "revenue", "demand"]), None)

    if not date_col or not sales_col:
        raise ValueError("CSV must contain 'date' and 'sales' columns.")

    df['ds'] = pd.to_datetime(df[date_col])
    df['y'] = df[sales_col].astype(float)
    df = df.sort_values('ds').reset_index(drop=True)

    # Feature engineering for regression: time step t, month of year seasonality
    df['t'] = np.arange(len(df))
    df['month'] = df['ds'].dt.month

    # Create month dummies for seasonal adjustment
    month_dummies = pd.get_dummies(df['month'], prefix='m', drop_first=True)
    X_train = pd.concat([df[['t']], month_dummies], axis=1)
    y_train = df['y']

    model = Ridge(alpha=1.0)
    model.fit(X_train, y_train)

    # Generate future dates
    last_date = df['ds'].max()
    future_dates = [last_date + relativedelta(months=i+1) for i in range(periods)]
    future_t = np.arange(len(df), len(df) + periods)
    future_months = [d.month for d in future_dates]

    future_df = pd.DataFrame({'t': future_t, 'month': future_months})
    future_dummies = pd.get_dummies(future_df['month'], prefix='m')
    
    # Align columns with training features
    for col in month_dummies.columns:
        if col not in future_dummies.columns:
            future_dummies[col] = 0
    future_dummies = future_dummies[month_dummies.columns]

    X_future = pd.concat([future_df[['t']], future_dummies], axis=1)
    predictions = model.predict(X_future)

    # Calculate historical residual standard deviation for confidence intervals
    train_preds = model.predict(X_train)
    std_residual = np.std(y_train - train_preds)

    history = [
        {"ds": row['ds'].strftime("%Y-%m-%d"), "sales": round(float(row['y']), 2)}
        for _, row in df.iterrows()
    ]

    forecast = []
    for d, pred, i in zip(future_dates, predictions, range(1, periods + 1)):
        # Confidence bound expands slightly into the future
        margin = std_residual * (1.0 + 0.1 * i)
        val = max(0, float(pred))
        forecast.append({
            "ds": d.strftime("%Y-%m-%d"),
            "yhat": round(val, 2),
            "yhat_lower": round(max(0, val - margin), 2),
            "yhat_upper": round(val + margin, 2)
        })

    return {
        "history": history,
        "forecast": forecast,
        "summary": {
            "historical_months": len(df),
            "forecast_months": periods,
            "trend": "Positive" if predictions[-1] > predictions[0] else "Negative",
            "projected_total": round(float(np.sum(predictions)), 2)
        }
    }

@app.get("/")
def health():
    return {"status": "ok", "mvp": "02-prediction-forecast"}

@app.get("/api/forecast/sample")
def get_sample_forecast(periods: int = Query(6, ge=1, le=24)):
    df = pd.read_csv(SAMPLE_PATH)
    return perform_forecast(df, periods=periods)

@app.post("/api/forecast")
async def forecast_file(file: UploadFile = File(...), periods: int = Query(6, ge=1, le=24)):
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        return perform_forecast(df, periods=periods)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process CSV file: {str(e)}")
