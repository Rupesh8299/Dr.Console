
from supabase import create_client, Client
from config import settings

def get_supabase_client() -> Client:
    if settings.SUPABASE_URL and settings.SUPABASE_KEY:
        return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    return None

supabase: Client = get_supabase_client()
