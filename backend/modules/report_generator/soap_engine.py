import google.generativeai as genai
from config import settings
import json
from typing import List, Dict

class ReportGenerator:
    """
    Generates structured medical reports (SOAP Notes) from conversation history.
    """
    
    @staticmethod
    def generate_soap_report(conversation_history: List[Dict], user_profile: Dict = None) -> Dict:
        """
        Analyzes the conversation and profile to produce a JSON-structured SOAP note.
        """
        
        # 1. Prepare Prompt
        messages_text = ""
        for msg in conversation_history:
            role = msg.get("role", "unknown")
            content = msg.get("content", "")
            messages_text += f"{role.upper()}: {content}\n"
            
        profile_text = f"Age: {user_profile.get('age', 'N/A')}, Gender: {user_profile.get('gender', 'N/A')}" if user_profile else "N/A"

        prompt = f"""
        You are an expert Medical Scribe. Your task is to generate a professional SOAP Note based on the following patient consultation transcript.
        
        PATIENT PROFILE: {profile_text}
        
        TRANSCRIPT:
        {messages_text}
        
        INSTRUCTIONS:
        1. Analyze the conversation carefully.
        2. Categorize the findings into S.O.A.P format.
        3. Determine the Triage Level (Green/Yellow/Red).
        4. Output STRICT JSON format.
        
        JSON SCHEMA:
        {{
            "patient_summary": "One line summary of patient and chief complaint",
            "subjective": "Patient's stated symptoms, history, and feelings.",
            "objective": "Observed signs, data from images/files (if mentioned), and vital signs.",
            "assessment": "Likely diagnosis or differential diagnoses.",
            "plan": "Recommended steps, treatments, or referrals.",
            "triage_level": "Green" | "Yellow" | "Red",
            "triage_reason": "Brief explanation for the triage level."
        }}
        
        Ensure the tone is clinical and professional. If information is missing, state 'Not reported'.
        """
        
        try:
            model = genai.GenerativeModel("models/gemini-1.5-flash") # Use Flash for speed/cost
            response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
            
            return json.loads(response.text)
            
        except Exception as e:
            print(f"Report Generation Failed: {e}")
            return {
                "error": "Failed to generate report",
                "details": str(e)
            }
