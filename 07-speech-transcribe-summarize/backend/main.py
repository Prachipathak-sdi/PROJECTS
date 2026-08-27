import os
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="MVP 07 - Speech AI Transcribe & Summarize",
    description="Audio Meeting Transcription & Executive Summary Engine",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SAMPLE_TRANSCRIPT = """
Alice: Good morning team, thanks for joining our product sync. Today we need to decide on the launch timeline for the new AI Assistant feature.
Bob: Based on QA testing, the core backend APIs are stable, but we still need 3 days to complete the frontend responsive design polish and accessibility checks.
Charlie: Marketing is ready with the email campaign and blog post. If we launch on Thursday, we can align with our weekly newsletter release.
Alice: That sounds reasonable. Bob, can your team commit to freezing code by Tuesday evening?
Bob: Yes, Tuesday at 5 PM works. We will run final integration testing on Wednesday morning.
Charlie: Perfect, I will schedule the social media posts for Thursday at 9 AM EST.
Alice: Great! To recap: Bob handles code freeze by Tuesday 5 PM, Charlie schedules announcements for Thursday morning, and I will prepare the client release notes by Wednesday. Thanks everyone!
"""

SAMPLE_SUMMARY = """### Executive Summary
The team met to finalize the release schedule for the new AI Assistant feature, agreeing on a target launch date of **Thursday at 9:00 AM EST**.

### Key Takeaways
- Backend APIs are fully tested and stable.
- Frontend requires 3 final days for responsive styling and accessibility compliance.
- Marketing alignment is synchronized with the weekly newsletter broadcast.

### Action Items
- [ ] **Bob**: Complete frontend polish & execute code freeze by **Tuesday 5:00 PM**.
- [ ] **Alice**: Draft and distribute client release notes by **Wednesday afternoon**.
- [ ] **Charlie**: Schedule social media announcements for **Thursday 9:00 AM EST**.
"""

@app.get("/")
def health():
    return {
        "status": "ok",
        "mvp": "07-speech-transcribe-summarize",
        "api_key_configured": bool(os.getenv("OPENAI_API_KEY"))
    }

@app.get("/api/speech/sample")
def get_sample():
    return {
        "filename": "sample_product_sync.mp3",
        "transcript": SAMPLE_TRANSCRIPT.strip(),
        "summary": SAMPLE_SUMMARY.strip(),
        "mock": True
    }

@app.post("/api/speech/process")
async def process_audio(file: UploadFile = File(...)):
    api_key = os.getenv("OPENAI_API_KEY")
    
    transcript_text = ""
    
    if api_key and not api_key.startswith("sk-your-"):
        try:
            from openai import OpenAI
            client = OpenAI(api_key=api_key)
            
            # Save temporary audio file for transcription
            temp_path = f"/tmp/{file.filename}"
            with open(temp_path, "wb") as f:
                f.write(await file.read())

            with open(temp_path, "rb") as audio_file:
                transcription = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file
                )
                transcript_text = transcription.text

            # Generate Executive Summary using GPT-4o-mini
            summary_resp = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are an executive assistant. Summarize meeting transcripts into clean markdown with Executive Summary, Key Takeaways (bullets), and Action Items (checklist)."},
                    {"role": "user", "content": f"Summarize this meeting transcript:\n\n{transcript_text}"}
                ]
            )
            summary_text = summary_resp.choices[0].message.content.strip()

            if os.path.exists(temp_path):
                os.remove(temp_path)

            return {
                "filename": file.filename,
                "transcript": transcript_text,
                "summary": summary_text,
                "mock": False
            }
        except Exception as e:
            # Fall back to structured demo output if API error occurs
            pass

    return {
        "filename": file.filename,
        "transcript": SAMPLE_TRANSCRIPT.strip(),
        "summary": SAMPLE_SUMMARY.strip(),
        "mock": True
    }
