# MVP 06 — GenAI Brand-Voice Content Generator

## Problem
Clients often spend hours adapting marketing copy across multiple distribution channels and tone requirements (e.g. formal press release vs. casual Instagram caption vs. playful newsletter).

## What it does
- Accepts a product or campaign topic along with a target content format (Social Post, Product Description, Email).
- Generates **3 parallel variations** across distinct brand tones (*Professional*, *Casual*, and *Playful*).
- Provides instant copy-to-clipboard functionality for seamless workflow integration.

## Tech Used
- **Model**: OpenAI `gpt-4o-mini` (via ChatCompletions API)
- **Backend**: FastAPI + Python 3.11 + Pydantic
- **Frontend**: React (Vite) + Vanilla CSS + Lucide Icons

## Demo Hook
Multi-tone parallel generation: a single click triggers parallel requests, populating three side-by-side brand voice variations simultaneously.

## Run Locally

```bash
# 1. Backend
cd 06-genai-content-generator/backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # Add your OPENAI_API_KEY if testing live API calls
uvicorn main:app --reload --port 8000

# 2. Frontend (in a new terminal)
cd 06-genai-content-generator/frontend
npm install
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) in your browser.
