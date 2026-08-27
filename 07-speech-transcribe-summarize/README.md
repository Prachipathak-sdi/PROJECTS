# MVP 07 — Speech AI Transcribe & Summarize

## Problem
Executives and team leads spend hours re-listening to meeting recordings or manually writing recap emails and action item checklists.

## What it does
- Accepts uploaded audio recordings (`.mp3`, `.wav`, `.m4a`).
- Converts speech to text using OpenAI Whisper / STT pipelines.
- Passes the full transcript to `gpt-4o-mini` to extract structured executive summaries, bulleted key takeaways, and action item checklists.
- Enables one-click download of the complete transcript & summary as a `.txt` report.

## Tech Used
- **Models**: OpenAI Whisper (Audio Transcription) + `gpt-4o-mini` (Summarization)
- **Backend**: FastAPI + Python 3.11
- **Frontend**: React (Vite) + Lucide Icons

## Demo Hook
Scrolling transcript paired side-by-side with structured action item checklists and downloadable `.txt` report export.

## Run Locally

```bash
# 1. Backend
cd 07-speech-transcribe-summarize/backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # Add your OPENAI_API_KEY
uvicorn main:app --reload --port 8005

# 2. Frontend (in a new terminal)
cd 07-speech-transcribe-summarize/frontend
npm install
npm run dev
```

Visit [http://localhost:5178](http://localhost:5178) in your browser.
