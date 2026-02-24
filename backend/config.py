
import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # Project Info
    PROJECT_NAME: str = "Dr. Console API"
    VERSION: str = "1.0.0"

    # API Keys
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY") # Deprecated for Chat, kept for legacy
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY")
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    
    # Database
    SUPABASE_URL: str = os.getenv("SUPABASE_URL")
    SUPABASE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    # Model Configuration
    # Model Configuration
    MODEL_NAME: str = "google/gemini-2.0-flash-001" # OpenRouter Model ID
    # FALLBACK_MODELS not applicable for native SDK switch currently

settings = Settings()
