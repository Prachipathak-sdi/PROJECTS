# AI MVP Portfolio  IMPLEMENTATION.md

Companion to `context.md`. Where context.md defines *what* to build, this file
defines *how*  exact setup commands, folder scaffolding, and starter code for
each of the 9 MVPs, in build order. Follow this top to bottom.

---

## 0. One-Time Global Setup

```bash
mkdir ai-mvp-portfolio && cd ai-mvp-portfolio
git init
echo "node_modules/
__pycache__/
*.pyc
.env
venv/
*.db
uploads/" > .gitignore
```

Each MVP folder gets its own Python virtual env (keeps dependencies isolated
per-demo, so a client can run just one without installing everything):

```bash
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
```

**Standard `backend/main.py` skeleton** (copy into every MVP, then extend):

```python
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="MVP Name")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health():
    return {"status": "ok"}

# MVP-specific routes go below
```

**Standard React scaffold** (run once per MVP):

```bash
npm create vite@latest frontend -- --template react
cd frontend && npm install axios
```

---

## 1. MVP 06  GenAI Content Generator (build first)

```bash
mkdir -p 06-genai-content-generator/backend/templates
cd 06-genai-content-generator/backend
pip install fastapi uvicorn openai python-dotenv jinja2
pip freeze > requirements.txt
```

`.env`:
```
OPENAI_API_KEY=sk-...
```

`main.py`  key endpoint:
```python
from openai import OpenAI
from pydantic import BaseModel
import os
from dotenv import load_dotenv

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class GenRequest(BaseModel):
    topic: str
    content_type: str   # "social_post" | "product_description" | "email"
    tone: str            # "Professional" | "Casual" | "Playful"

@app.post("/api/genai/generate")
def generate(req: GenRequest):
    prompt = f"Write a {req.tone.lower()} {req.content_type.replace('_',' ')} about: {req.topic}"
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
    )
    return {"result": resp.choices[0].message.content}
```

**Frontend:** one form (topic input + content type dropdown + tone selector) �
POST to `/api/genai/generate` � render result in a card with a copy button.
Run 3 requests in parallel (one per tone) for the "side-by-side" demo hook.

**Test:** `uvicorn main:app --reload` � visit `/docs` � try the endpoint before wiring the frontend.

---

## 2. MVP 08  Recommendation Engine

```bash
mkdir -p 08-recommendation-engine/backend/sample_data
cd 08-recommendation-engine/backend
pip install fastapi uvicorn scikit-learn pandas
pip freeze > requirements.txt
```

Get dataset: download a small product/movie CSV (title + description columns)
into `sample_data/items.csv`.

`main.py`  key logic:
```python
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

df = pd.read_csv("sample_data/items.csv")
tfidf = TfidfVectorizer(stop_words="english")
matrix = tfidf.fit_transform(df["description"])
similarity = cosine_similarity(matrix)

@app.get("/api/recommend/{item_id}")
def recommend(item_id: int, top_n: int = 5):
    scores = list(enumerate(similarity[item_id]))
    scores = sorted(scores, key=lambda x: x[1], reverse=True)[1:top_n+1]
    return [{"item": df.iloc[i]["title"], "score": round(s, 3)} for i, s in scores]

@app.get("/api/items")
def list_items():
    return df[["title"]].reset_index().rename(columns={"index": "id"}).to_dict("records")
```

**Frontend:** grid of item cards � click one � fetch recommendations � render
a second row of cards � clicking any of those re-centers (chain-clicking).

---

## 3. MVP 04  Sentiment Classifier

```bash
mkdir -p 04-sentiment-classifier/backend/sample_data
cd 04-sentiment-classifier/backend
pip install fastapi uvicorn scikit-learn pandas joblib
pip freeze > requirements.txt
```

Get dataset: download IMDB or Sentiment140 CSV into `sample_data/reviews.csv`
(columns: `text`, `label`).

`train.py`  run **once, offline**:
```python
import pandas as pd, joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split

df = pd.read_csv("sample_data/reviews.csv")
X_train, X_test, y_train, y_test = train_test_split(df["text"], df["label"], test_size=0.2)

vectorizer = TfidfVectorizer(max_features=5000, stop_words="english")
X_train_vec = vectorizer.fit_transform(X_train)

model = LogisticRegression(max_iter=1000)
model.fit(X_train_vec, y_train)

print("Accuracy:", model.score(vectorizer.transform(X_test), y_test))

joblib.dump(model, "model.pkl")
joblib.dump(vectorizer, "vectorizer.pkl")
```

Run it once:
```bash
python train.py
```

`main.py`  loads saved model, instant inference:
```python
import joblib
from pydantic import BaseModel

model = joblib.load("model.pkl")
vectorizer = joblib.load("vectorizer.pkl")

class TextIn(BaseModel):
    text: str

@app.post("/api/sentiment/predict")
def predict(payload: TextIn):
    vec = vectorizer.transform([payload.text])
    pred = model.predict(vec)[0]
    proba = max(model.predict_proba(vec)[0])
    return {"label": pred, "confidence": round(float(proba), 3)}
```

Commit `model.pkl` and `vectorizer.pkl` to the repo so no one needs to retrain.

**Frontend:** textarea � submit � animated confidence bar (green/red/gray by label).

---

## 4. MVP 02  Prediction (Sales Forecaster)

```bash
mkdir -p 02-prediction-forecast/backend/sample_data
cd 02-prediction-forecast/backend
pip install fastapi uvicorn prophet pandas python-multipart
pip freeze > requirements.txt
```

Generate `sample_data/monthly_sales.csv` (columns: `date`, `sales`) with a
trend + seasonal pattern (1224 months of synthetic data is enough).

`main.py`:
```python
import pandas as pd
from prophet import Prophet
from fastapi import UploadFile, File

@app.post("/api/forecast")
async def forecast(file: UploadFile = File(...), periods: int = 3):
    df = pd.read_csv(file.file)
    df = df.rename(columns={"date": "ds", "sales": "y"})

    model = Prophet()
    model.fit(df)

    future = model.make_future_dataframe(periods=periods, freq="MS")
    fc = model.predict(future)

    return {
        "history": df.to_dict("records"),
        "forecast": fc[["ds", "yhat", "yhat_lower", "yhat_upper"]].tail(periods).to_dict("records"),
    }
```

**Frontend:** CSV upload + slider (predict next X months) � `recharts` line
chart with historical (solid) vs. forecast (dashed) lines.

---

## 5. MVP 03  OCR Invoice Reader

```bash
mkdir -p 03-ocr-invoice-reader/backend/sample_data
cd 03-ocr-invoice-reader/backend
pip install fastapi uvicorn pytesseract pillow pdf2image python-multipart sqlalchemy
pip freeze > requirements.txt
```

System dependency (not pip): install Tesseract binary 
`brew install tesseract` (Mac) / `apt install tesseract-ocr` (Linux) /
download installer (Windows).

`main.py`:
```python
import pytesseract
from PIL import Image
import io, re

@app.post("/api/ocr/extract")
async def extract(file: UploadFile = File(...)):
    image = Image.open(io.BytesIO(await file.read()))
    raw_text = pytesseract.image_to_string(image)

    # simple regex-based structuring (swap for LLM post-processing if desired)
    total_match = re.search(r"total[:\s]*\$?(\d+\.\d{2})", raw_text, re.I)
    date_match = re.search(r"\d{1,2}[/-]\d{1,2}[/-]\d{2,4}", raw_text)

    return {
        "raw_text": raw_text,
        "extracted": {
            "total": total_match.group(1) if total_match else None,
            "date": date_match.group(0) if date_match else None,
        },
    }
```

Save extracted records to SQLite for a "history" table (use `sqlite3` directly
or `SQLAlchemy`  simple `CREATE TABLE invoices (id, vendor, date, total, raw_text)`).

**Frontend:** image upload � left panel shows original image, right panel
shows editable extracted fields.

---

## 6. MVP 07  Speech Transcribe + Summarize

```bash
mkdir -p 07-speech-transcribe-summarize/backend/sample_data
cd 07-speech-transcribe-summarize/backend
pip install fastapi uvicorn faster-whisper openai python-dotenv python-multipart
pip freeze > requirements.txt
```

System dependency: `ffmpeg` (`brew install ffmpeg` / `apt install ffmpeg`).

`main.py`:
```python
from faster_whisper import WhisperModel
from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()
whisper_model = WhisperModel("base", compute_type="int8")
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@app.post("/api/speech/process")
async def process(file: UploadFile = File(...)):
    path = f"/tmp/{file.filename}"
    with open(path, "wb") as f:
        f.write(await file.read())

    segments, _ = whisper_model.transcribe(path)
    transcript = " ".join(s.text for s in segments)

    summary_resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content":
            f"Summarize this meeting transcript into 3 bullets and list action items:\n\n{transcript}"}],
    )

    return {"transcript": transcript, "summary": summary_resp.choices[0].message.content}
```

**Frontend:** audio upload/record � transcript displayed � summary card below,
with a "Download .txt" button.

---

## 7. MVP 05  Computer Vision (Object Detector)

```bash
mkdir -p 05-cv-object-defect-detector/backend/sample_data
cd 05-cv-object-defect-detector/backend
pip install fastapi uvicorn ultralytics opencv-python-headless python-multipart
pip freeze > requirements.txt
```

`main.py`:
```python
from ultralytics import YOLO
import cv2, numpy as np
from fastapi.responses import StreamingResponse
import io

yolo = YOLO("yolov8n.pt")  # auto-downloads pretrained weights on first run

@app.post("/api/cv/detect")
async def detect(file: UploadFile = File(...)):
    contents = await file.read()
    npimg = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

    results = yolo(img)
    annotated = results[0].plot()  # draws boxes + labels

    _, encoded = cv2.imencode(".jpg", annotated)
    return StreamingResponse(io.BytesIO(encoded.tobytes()), media_type="image/jpeg")
```

**Frontend:** drag-and-drop image � show returned annotated image directly
(no need to re-render boxes client-side, YOLO's `.plot()` already burns them in).

---

## 8. MVP 01  RAG: Chat with Your Docs

```bash
mkdir -p 01-rag-doc-qa/backend/sample_data
cd 01-rag-doc-qa/backend
pip install fastapi uvicorn langchain langchain-openai langchain-chroma chromadb pypdf python-dotenv python-multipart
pip freeze > requirements.txt
```

`ingest.py`:
```python
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_chroma import Chroma

def ingest(pdf_path: str):
    loader = PyPDFLoader(pdf_path)
    docs = loader.load()
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunks = splitter.split_documents(docs)

    vectordb = Chroma.from_documents(chunks, OpenAIEmbeddings(), persist_directory="./chroma_db")
    return len(chunks)
```

`main.py`  query endpoint:
```python
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain.chains import RetrievalQA

vectordb = Chroma(persist_directory="./chroma_db", embedding_function=OpenAIEmbeddings())
llm = ChatOpenAI(model="gpt-4o-mini")
qa_chain = RetrievalQA.from_chain_type(llm=llm, retriever=vectordb.as_retriever(search_kwargs={"k": 3}), return_source_documents=True)

class Query(BaseModel):
    question: str

@app.post("/api/rag/ask")
def ask(q: Query):
    result = qa_chain.invoke({"query": q.question})
    return {
        "answer": result["result"],
        "sources": [doc.page_content[:200] for doc in result["source_documents"]],
    }
```

**Frontend:** PDF upload (� triggers `/api/rag/ingest`) � chat-style Q&A box �
each answer shows the cited source snippet below it.

---

## 9. MVP 09  Agentic Support Assistant (build last)

```bash
mkdir -p 09-agentic-support-assistant/backend/{tools,sample_data}
cd 09-agentic-support-assistant/backend
pip install fastapi uvicorn openai python-dotenv
pip freeze > requirements.txt
```

Reuse the RAG ingestion pattern from MVP 01 for `retrieve_policy`, or keep it
simple with keyword search on a short `sample_data/policy.txt` for MVP speed.

`tools/definitions.py`  tool schemas for function-calling:
```python
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "retrieve_policy",
            "description": "Look up the relevant company policy for a customer query",
            "parameters": {"type": "object", "properties": {"query": {"type": "string"}}, "required": ["query"]},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "flag_for_review",
            "description": "Flag this ticket for human review instead of auto-sending",
            "parameters": {"type": "object", "properties": {"reason": {"type": "string"}}, "required": ["reason"]},
        },
    },
]
```

`agent.py`  the agent loop:
```python
from openai import OpenAI
import os, json
from dotenv import load_dotenv
from tools.definitions import TOOLS

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def retrieve_policy(query: str) -> str:
    with open("sample_data/policy.txt") as f:
        return f.read()[:800]  # MVP: return whole doc snippet; upgrade to RAG retrieval later

def run_agent(ticket_text: str):
    trail = []
    messages = [
        {"role": "system", "content": "You are a support assistant. Use tools to check policy before drafting a reply. If refund amount is unclear or high-risk, flag for review instead of replying."},
        {"role": "user", "content": ticket_text},
    ]

    response = client.chat.completions.create(model="gpt-4o-mini", messages=messages, tools=TOOLS)
    msg = response.choices[0].message

    if msg.tool_calls:
        for call in msg.tool_calls:
            args = json.loads(call.function.arguments)
            if call.function.name == "retrieve_policy":
                result = retrieve_policy(args["query"])
                trail.append({"step": "retrieve_policy", "input": args, "output": result[:150]})
            elif call.function.name == "flag_for_review":
                trail.append({"step": "flag_for_review", "reason": args["reason"]})
                return {"status": "flagged", "reason": args["reason"], "trail": trail}

    # final draft step
    draft_resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages + [{"role": "user", "content": "Now draft the customer reply based on the policy found."}],
    )
    trail.append({"step": "draft_reply"})
    return {"status": "ready", "reply": draft_resp.choices[0].message.content, "trail": trail}
```

`main.py`:
```python
from agent import run_agent
from pydantic import BaseModel

class Ticket(BaseModel):
    text: str

@app.post("/api/agent/process")
def process_ticket(ticket: Ticket):
    return run_agent(ticket.text)
```

**Frontend:** pick a sample ticket (or paste one) � submit � show the step-by-
step trail as a vertical timeline (retrieve � draft/flag � done), then the
final reply or flagged-reason card below it.

---

## 10. Final Checklist (per MVP, before calling it "done")

- [ ] `requirements.txt` generated (`pip freeze > requirements.txt`)
- [ ] `.env.example` committed (real `.env` gitignored)
- [ ] `sample_data/` populated with realistic demo content
- [ ] Backend tested via `/docs` (Swagger) before wiring frontend
- [ ] Frontend has a loading state + basic error handling (no blank screens on failure)
- [ ] README filled in from the template in `context.md` �5
- [ ] 1015 second demo GIF recorded (use free tool like ScreenToGif/Kap) and added to README
- [ ] Folder runs standalone  test in a fresh clone/terminal, not just your dev environment

## 11. Recording Demo GIFs (quick method)

```bash
# Mac: Kap (free)  record � export as GIF, keep under 5MB for GitHub README
# Windows: ScreenToGif (free)
# Linux: Peek (free)
```

Keep each GIF to the core interaction only (upload � result), 1015 seconds,
no dead time  this is what a client actually watches before reading anything else. 