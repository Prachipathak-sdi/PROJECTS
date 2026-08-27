import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="MVP 06 - GenAI Content Generator",
    description="Brand-Voice Marketing Copy Generator powered by OpenAI",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GenRequest(BaseModel):
    topic: str = Field(..., example="Eco-friendly insulated coffee mug")
    content_type: str = Field(..., example="social_post")  # "social_post", "product_description", "email"
    tone: str = Field(..., example="Professional")         # "Professional", "Casual", "Playful"

@app.get("/")
def health():
    return {
        "status": "ok",
        "mvp": "06-genai-content-generator",
        "api_key_configured": bool(os.getenv("OPENAI_API_KEY"))
    }

@app.post("/api/genai/generate")
def generate(req: GenRequest):
    api_key = os.getenv("OPENAI_API_KEY")
    
    formatted_type = req.content_type.replace("_", " ").title()
    prompt = (
        f"Write a creative, compelling, and engaging {req.tone.lower()} {formatted_type} "
        f"about the following topic:\n\n'{req.topic}'\n\n"
        f"Format the output cleanly. Keep it concise, high-converting, and ready for publication."
    )
    
    if api_key and not api_key.startswith("sk-your-"):
        try:
            from openai import OpenAI
            client = OpenAI(api_key=api_key)
            resp = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": f"You are an expert copywriter specialized in creating top-tier {req.tone.lower()} brand content."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=500
            )
            content = resp.choices[0].message.content.strip()
            return {
                "result": content,
                "topic": req.topic,
                "content_type": req.content_type,
                "tone": req.tone,
                "mock": False
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"OpenAI API Error: {str(e)}")

    # High quality demonstration copy fallback if API key is not yet set
    mock_responses = {
        "Professional": f"Introducing our premium solution for {req.topic}. Designed for professionals who demand efficiency and reliability, our state-of-the-art approach delivers measurable impact and seamless integration. Discover how we elevate standards across your workflow.",
        "Casual": f"Hey everyone! Check out what we've been working on for {req.topic}. It's super simple to use, looks great, and makes life way easier. Give it a try and let us know what you think!",
        "Playful": f"Ready to revolutionize your {req.topic} game? 🚀 We've baked in extra magic, zero hassle, and maximum fun so you can supercharge your day. Click below and let's get this party started! ✨"
    }

    content = mock_responses.get(
        req.tone, 
        f"Custom {req.tone} {formatted_type} generated for: '{req.topic}'. Add your OPENAI_API_KEY in backend/.env for live AI generations."
    )

    return {
        "result": content,
        "topic": req.topic,
        "content_type": req.content_type,
        "tone": req.tone,
        "mock": True
    }
