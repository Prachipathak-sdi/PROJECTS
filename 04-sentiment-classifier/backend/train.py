import os
import pandas as pd
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

BASE_DIR = os.path.dirname(__file__)
DATA_PATH = os.path.join(BASE_DIR, "sample_data", "reviews.csv")

def train_model():
    print("Loading dataset from:", DATA_PATH)
    df = pd.read_csv(DATA_PATH)
    
    X = df["text"]
    y = df["label"]
    
    vectorizer = TfidfVectorizer(max_features=5000, stop_words="english", ngram_range=(1, 2))
    X_vec = vectorizer.fit_transform(X)
    
    model = LogisticRegression(max_iter=1000, C=1.5)
    model.fit(X_vec, y)
    
    acc = model.score(X_vec, y)
    print(f"Training Complete! Model Accuracy on Training Set: {acc * 100:.2f}%")
    
    model_path = os.path.join(BASE_DIR, "model.pkl")
    vectorizer_path = os.path.join(BASE_DIR, "vectorizer.pkl")
    
    joblib.dump(model, model_path)
    joblib.dump(vectorizer, vectorizer_path)
    print(f"Model saved to {model_path}")
    print(f"Vectorizer saved to {vectorizer_path}")

if __name__ == "__main__":
    train_model()
