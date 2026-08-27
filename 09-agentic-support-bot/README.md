# MVP 09 — Autonomous Customer Support Agent

## Problem
Standard chatbots rely on rigid static rule trees and cannot access databases or take real-world actions like looking up live order status, issuing refunds, or escalating tickets.

## What it does
- Leverages **OpenAI Function Calling** (`gpt-4o-mini`) in a reasoning loop.
- Automatically selects and executes Python tools:
  - `lookup_order(order_id)`: Fetches real-time status and delivery dates from SQLite.
  - `process_refund(order_id, reason)`: Performs automated refund processing.
  - `escalate_to_human(order_id, note)`: Hands off complex issues to Tier 2 support.
- Provides real-time tool telemetry in the side drawer showing tool names, input arguments, and execution result JSON payloads.

## Tech Used
- **Agent Framework**: OpenAI Function Calling & Tool Loop
- **Database**: SQLite3
- **Backend**: FastAPI + Python 3.11
- **Frontend**: React (Vite) + Lucide Icons + Real-Time Telemetry Drawer

## Demo Hook
Live Tool Telemetry: watch the side drawer update in real-time with function name, input arguments, and execution JSON as the agent makes autonomous tool decisions.

## Run Locally

```bash
# 1. Backend
cd 09-agentic-support-bot/backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # Add your OPENAI_API_KEY
uvicorn main:app --reload --port 8008

# 2. Frontend (in a new terminal)
cd 09-agentic-support-bot/frontend
npm install
npm run dev
```

Visit [http://localhost:5181](http://localhost:5181) in your browser.
