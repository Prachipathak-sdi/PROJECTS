import os
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = FastAPI(
    title="MVP 08 - Recommendation Engine",
    description="Content-Based Filtering Recommendation Engine using TF-IDF & Cosine Similarity",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global dataset & model state
DATA_PATH = os.path.join(os.path.dirname(__file__), "sample_data", "items.csv")
df = pd.read_csv(DATA_PATH)

# Combine title, category, and description for vectorization
corpus = (df["category"].fillna("") + " " + df["title"].fillna("") + " " + df["description"].fillna("")).values

vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
tfidf_matrix = vectorizer.fit_transform(corpus)
similarity_matrix = cosine_similarity(tfidf_matrix)

@app.get("/")
def health():
    return {
        "status": "ok",
        "mvp": "08-recommendation-engine",
        "total_items": len(df)
    }

@app.get("/api/items")
def list_items():
    """Return all catalog items."""
    return df.to_dict("records")

@app.get("/api/items/{item_id}")
def get_item(item_id: int):
    """Return single item detail by ID."""
    if item_id < 0 or item_id >= len(df):
        raise HTTPException(status_code=404, detail="Item not found")
    return df.iloc[item_id].to_dict()

@app.get("/api/recommend/{item_id}")
def recommend(item_id: int, top_n: int = 5):
    """Return top N recommended items for the specified item_id based on cosine similarity."""
    if item_id < 0 or item_id >= len(df):
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Get similarity scores for item_id
    sim_scores = list(enumerate(similarity_matrix[item_id]))
    # Sort descending, excluding the item itself
    sorted_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
    filtered_scores = [pair for pair in sorted_scores if pair[0] != item_id][:top_n]
    
    recommendations = []
    for idx, score in filtered_scores:
        item = df.iloc[idx].to_dict()
        item["similarity_score"] = round(float(score), 4)
        item["similarity_percentage"] = int(round(float(score) * 100))
        recommendations.append(item)
        
    return {
        "source_item": df.iloc[item_id].to_dict(),
        "recommendations": recommendations
    }
