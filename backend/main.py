
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from routers import sessions_router, chat_router

app = FastAPI(title="Dr. Console API")

import os

# Allowed origins — add your Vercel frontend URL here (no trailing slash)
CORS_ORIGINS = [
    "https://drconsolefrontend.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
# Allow extra origins via env var (comma-separated) for flexibility
extra = os.getenv("CORS_ORIGINS", "")
if extra:
    CORS_ORIGINS += [o.strip() for o in extra.split(",") if o.strip()]

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(sessions_router.router)
app.include_router(chat_router.router)

@app.get("/")
def read_root():
    return {"message": "Hello from Dr. Console Brain (Refactored)!"}


@app.post("/analyze")
async def analyze_image_endpoint(
    file: UploadFile = File(...),
    message: str = Form("")
):
    """
    Standalone image analysis endpoint.
    
    Pass the user's descriptive message (e.g. "my ear hurts").
    The backend auto-detects which model to use — no manual selection needed.
    
    Returns the specialist model's diagnosis directly.
    """
    from modules.image_analysis.vision_agent import VisionAgent
    result = await VisionAgent.analyze_image(file, user_message=message)
    return result
