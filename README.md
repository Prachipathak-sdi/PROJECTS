# AI MVP Portfolio

A showcase monorepo containing **9 standalone AI MVPs**, each designed to demonstrate specific artificial intelligence and machine learning capabilities for enterprise and client demonstrations.

Each MVP is a self-contained folder with its own isolated backend (FastAPI), frontend (React), dataset, and setup instructions.

---

## Portfolio Catalog

| # | MVP Name | Tech Stack | Port (BE / FE) | Primary Demo Hook |
|---|---|---|---|---|
| **01** | [Enterprise Knowledge Base RAG](./01-enterprise-rag-qa) | TF-IDF + Cosine Vector + GPT-4o-mini | `8007` / `5180` | Grounded doc Q&A with expandable source citations |
| **02** | [Sales/Demand Forecaster](./02-prediction-forecast) | Time-Series Ridge Regression + Pandas | `8003` / `5176` | CSV upload + interactive period forecast slider & SVG chart |
| **03** | [OCR Invoice Reader](./03-ocr-invoice-reader) | Tesseract OCR + FastAPI + SQLite | `8004` / `5177` | Dual-pane: original invoice beside editable fields & audit trail |
| **04** | [Sentiment Analysis Classifier](./04-sentiment-classifier) | Scikit-Learn (TF-IDF + Logistic Reg) | `8002` / `5175` | Sub-10ms offline inference with animated confidence gauge |
| **05** | [Vision Object Detection](./05-vision-object-detection) | YOLOv8 Computer Vision + OpenCV | `8006` / `5179` | Annotated bounding box canvas with class count breakdown |
| **06** | [GenAI Content Generator](./06-genai-content-generator) | FastAPI + OpenAI GPT-4o-mini | `8000` / `5173` | Parallel multi-tone brand voice marketing copy generation |
| **07** | [Speech Transcribe & Summarize](./07-speech-transcribe-summarize) | OpenAI Whisper + GPT-4o-mini | `8005` / `5178` | Audio transcription + executive summary & `.txt` export |
| **08** | [Recommendation Engine](./08-recommendation-engine) | Cosine Similarity + TF-IDF Vectorizer | `8001` / `5174` | Real-time content-based recommendations + chain-clicking |
| **09** | [Autonomous Support Agent](./09-agentic-support-bot) | Function Calling Agent Loop + SQLite | `8008` / `5181` | Real-time agent thought process & tool telemetry drawer |

---

## Global Architecture Standard

- **Backend**: FastAPI (Python 3.11+) with Swagger interactive documentation at `http://localhost:<PORT>/docs`.
- **Frontend**: React (Vite, single-page, Plus Jakarta Sans typography, modern dark glassmorphism styling).
- **Database**: SQLite (for invoice history, order database, tool calling logs).
- **Isolation**: Standardized `.gitignore`, isolated `venv` per backend, isolated `node_modules` per frontend, and `.env.example`.

---

## Quick Start Guide

To run any single MVP:

```bash
# 1. Navigate to specific MVP directory (e.g. 06-genai-content-generator)
cd 06-genai-content-generator

# 2. Start Backend
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env     # Add your OPENAI_API_KEY if required
uvicorn main:app --reload --port 8000

# 3. Start Frontend (in a new terminal tab)
cd 06-genai-content-generator/frontend
npm install
npm run dev
```

For detailed specifications, see [context.md](./context.md) and [implementation.md](./implementation.md).
