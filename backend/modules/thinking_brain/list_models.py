
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("Error: GEMINI_API_KEY not found in .env")
    exit(1)

genai.configure(api_key=api_key)

print("\nFetching available Google Gemini models...")
try:
    models = genai.list_models()
    print("Available 'generateContent' models:")
    for m in models:
        if 'generateContent' in m.supported_generation_methods:
            print(f"- {m.name}")

except Exception as e:
    print(f"Error: {e}")
