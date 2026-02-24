
import os
import google.generativeai as genai
from supabase import create_client, Client
from dotenv import load_dotenv

# Load env
load_dotenv()

def check_gemini():
    print("\n--- Checking Google Gemini API ---")
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("[FAILED] GEMINI_API_KEY not found in .env")
        return False
    
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        response = model.generate_content("Hello")
        print(f"[SUCCESS] Gemini Responded: {response.text.strip()}")
        return True
    except Exception as e:
        if "429" in str(e) or "ResourceExhausted" in str(e):
            print(f"[WARNING] Gemini Connected (Authenticated), but Rate Limited: {e}")
            return True # Connection is technically good
        print(f"[FAILED] Gemini Error: {e}")
        return False

def check_supabase():
    print("\n--- Checking Supabase Connection ---")
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        print("[FAILED] Supabase credentials missing in .env")
        return False

    try:
        supabase: Client = create_client(url, key)
        response = supabase.table("profiles").select("id").limit(1).execute()
        print(f"[SUCCESS] Supabase Connected. Data: {response.data}")
        return True
    except Exception as e:
        print(f"[FAILED] Supabase Error: {e}")
        return False

if __name__ == "__main__":
    print("Starting Component Verification...")
    gemini_status = check_gemini()
    supabase_status = check_supabase()
    
    if gemini_status and supabase_status:
        print("\nALL SYSTEMS GO! Both Gemini and Supabase are working.")
    else:
        print("\nSYSTEM CHECK FAILED. See errors above.")
