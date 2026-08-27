# MVP 01 — Enterprise Knowledge Base RAG QA

## Problem
Employees and customers waste hours searching through lengthy PDF manuals, company policies, and technical handbooks to find precise answers.

## What it does
- Ingests and chunks text documents (PDF/TXT) into an in-memory vector index.
- Computes TF-IDF vector embeddings and Cosine Similarity scores to retrieve top-k grounded context snippets.
- Synthesizes precise, hallucination-free answers using `gpt-4o-mini` backed by expandable **Retrieved Source Citations**.

## Tech Used
- **Vector Retrieval**: TF-IDF + Cosine Similarity Vector Index (`scikit-learn`, `numpy`)
- **LLM Synthesis**: OpenAI `gpt-4o-mini`
- **Backend**: FastAPI + Python 3.11
- **Frontend**: React (Vite) + Lucide Icons

## Demo Hook
Expandable Source Citations: click any citation tag to view the exact text chunk and vector similarity percentage match that informed the AI's answer.

## Run Locally

```bash
# 1. Backend
cd 01-enterprise-rag-qa/backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # Add your OPENAI_API_KEY
uvicorn main:app --reload --port 8007

# 2. Frontend (in a new terminal)
cd 01-enterprise-rag-qa/frontend
npm install
npm run dev
```

Visit [http://localhost:5180](http://localhost:5180) in your browser.
