
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from routers import sessions_router, chat_router

app = FastAPI(title="Dr. Console API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
