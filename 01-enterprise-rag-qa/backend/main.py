import os
import io
import re
import numpy as np
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="MVP 01 - Enterprise Knowledge Base RAG QA",
    description="Retrieval-Augmented Generation (RAG) Document Q&A Engine",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SAMPLE_DOC_PATH = os.path.join(os.path.dirname(__file__), "sample_data", "employee_handbook.txt")

class VectorStore:
    def __init__(self):
        self.chunks = []
        self.vectorizer = None
        self.matrix = None

    def ingest_text(self, text: str):
        # Split text into meaningful sections / chunks
        raw_chunks = [c.strip() for c in re.split(r'\n\s*\n', text) if len(c.strip()) > 30]
        if not raw_chunks:
            raw_chunks = [text]
            
        self.chunks = raw_chunks
        self.vectorizer = TfidfVectorizer(stop_words='english', ngram_range=(1, 2))
        self.matrix = self.vectorizer.fit_transform(self.chunks)
        return len(self.chunks)

    def search(self, query: str, top_k: int = 3):
        if not self.chunks or self.vectorizer is None:
            return []
            
        query_vec = self.vectorizer.transform([query])
        scores = cosine_similarity(query_vec, self.matrix)[0]
        top_indices = np.argsort(scores)[::-1][:top_k]
        
        results = []
        for idx in top_indices:
            score = float(scores[idx])
            if score > 0.01:
                results.append({
                    "chunk_id": int(idx + 1),
                    "text": self.chunks[idx],
                    "similarity_score": round(score, 4),
                    "similarity_percentage": int(round(score * 100))
                })
        return results

store = VectorStore()

# Load sample document on startup
if os.path.exists(SAMPLE_DOC_PATH):
    with open(SAMPLE_DOC_PATH, "r") as f:
        store.ingest_text(f.read())

class QueryReq(BaseModel):
    question: str

@app.get("/")
def health():
    return {
        "status": "ok",
        "mvp": "01-enterprise-rag-qa",
        "indexed_chunks": len(store.chunks),
        "api_key_configured": bool(os.getenv("OPENAI_API_KEY"))
    }

@app.get("/api/rag/sample")
def load_sample():
    with open(SAMPLE_DOC_PATH, "r") as f:
        content = f.read()
    count = store.ingest_text(content)
    return {
        "filename": "employee_handbook.txt",
        "chunk_count": count,
        "sample_preview": content[:300] + "..."
    }

@app.post("/api/rag/ingest")
async def ingest_document(file: UploadFile = File(...)):
    contents = await file.read()
    text = contents.decode('utf-8', errors='ignore')
    count = store.ingest_text(text)
    return {
        "filename": file.filename,
        "chunk_count": count,
        "status": "Document ingested and vector index updated!"
    }

@app.post("/api/rag/query")
def answer_query(payload: QueryReq):
    question = payload.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    cit_chunks = store.search(question, top_k=3)
    if not cit_chunks:
        return {
            "question": question,
            "answer": "I could not find relevant context in the uploaded documents to answer your question.",
            "citations": []
        }

    # Context block
    context_str = "\n\n---\n\n".join([c["text"] for c in cit_chunks])

    api_key = os.getenv("OPENAI_API_KEY")
    if api_key and not api_key.startswith("sk-your-"):
        try:
            from openai import OpenAI
            client = OpenAI(api_key=api_key)
            resp = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are an enterprise knowledge base QA assistant. Answer questions concisely using ONLY the provided context snippets. Include exact numbers, dates, and details from the context."},
                    {"role": "user", "content": f"Context:\n{context_str}\n\nQuestion: {question}"}
                ]
            )
            answer = resp.choices[0].message.content.strip()
            return {
                "question": question,
                "answer": answer,
                "citations": cit_chunks,
                "mock": False
            }
        except Exception:
            pass

    # Intelligent grounded fallback using retrieved chunk text
    top_snippet = cit_chunks[0]["text"]
    answer_text = f"Based on the enterprise knowledge base documentation:\n\n{top_snippet}"
    return {
        "question": question,
        "answer": answer_text,
        "citations": cit_chunks,
        "mock": True
    }
