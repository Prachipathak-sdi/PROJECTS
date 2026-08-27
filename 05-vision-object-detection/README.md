# MVP 05 — Vision Object Detection

## Problem
Retailers, smart cities, and security operators require automated computer vision systems to count, locate, and classify physical objects in camera feeds without manual human monitoring.

## What it does
- Accepts uploaded images or uses a benchmark urban street scene.
- Performs real-time object detection and localization using **YOLOv8 Nano** (`ultralytics`).
- Draws bounding boxes with confidence labels directly onto the image canvas.
- Returns a structured breakdown of object class counts and `[x1, y1, x2, y2]` spatial bounding box coordinates.

## Tech Used
- **Model**: `ultralytics` (YOLOv8 nano), OpenCV, Pillow
- **Backend**: FastAPI + Python 3.11
- **Frontend**: React (Vite) + Lucide Icons

## Demo Hook
Visual bounding box overlay: view labeled bounding boxes painted directly onto the canvas with real-time class counts and coordinate matrices.

## Run Locally

```bash
# 1. Backend
cd 05-vision-object-detection/backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8006

# 2. Frontend (in a new terminal)
cd 05-vision-object-detection/frontend
npm install
npm run dev
```

Visit [http://localhost:5179](http://localhost:5179) in your browser.
