# MVP 03 — OCR Invoice Reader

## Problem
Accounting and finance departments waste hundreds of hours manually entering data from vendor invoice PDFs and paper receipts into ERP systems.

## What it does
- Extracts raw text from uploaded invoice images or PDFs using `pytesseract` and Pillow.
- Applies regex pattern matching to convert raw unstructured text into structured database fields (*Vendor Name*, *Invoice Number*, *Date*, *Total Amount*).
- Logs every parsed invoice into an audit table powered by **SQLite**.

## Tech Used
- **OCR Engine**: `pytesseract` (Tesseract OCR), `Pillow`
- **Database**: SQLite3
- **Backend**: FastAPI + Python 3.11
- **Frontend**: React (Vite) + Lucide Icons

## Demo Hook
Dual-pane side-by-side verification: original invoice document on the left, editable structured form fields on the right alongside SQLite historical audit logs.

## Run Locally

```bash
# System dependency (if not installed):
# Ubuntu/Debian: sudo apt install tesseract-ocr
# macOS: brew install tesseract

# 1. Backend
cd 03-ocr-invoice-reader/backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8004

# 2. Frontend (in a new terminal)
cd 03-ocr-invoice-reader/frontend
npm install
npm run dev
```

Visit [http://localhost:5177](http://localhost:5177) in your browser.
