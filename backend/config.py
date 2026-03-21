
import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # Project Info
    PROJECT_NAME: str = "Dr. Console API"
    VERSION: str = "1.0.0"

    # API Keys
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY") # Deprecated for Chat, kept for legacy
    NVIDIA_API_KEY: str = os.getenv("NVIDIA_API_KEY")
    NVIDIA_BASE_URL: str = "https://integrate.api.nvidia.com/v1"    
    # Database
    SUPABASE_URL: str = os.getenv("SUPABASE_URL")
    SUPABASE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    # Model Configuration
    MODEL_NAME: str = "openai/gpt-oss-120b" # NVIDIA Model ID
    # FALLBACK_MODELS not applicable for native SDK switch currently

settings = Settings()
