import os
import json
from openai import OpenAI
from config import settings
from typing import List, Dict

# Initialize synchronous client for report generation (since it's a staticmethod blocking call)
# Using the same NVIDIA API Key config we added earlier
client = None
if settings.NVIDIA_API_KEY:
    client = OpenAI(
        api_key=settings.NVIDIA_API_KEY,
        base_url=settings.NVIDIA_BASE_URL,
    )

class ReportGenerator:
    """
    Generates structured medical reports (SOAP Notes) from conversation history.
    """
    
    @staticmethod
    def generate_soap_report(conversation_history: List[Dict], user_profile: Dict = None) -> Dict:
        """
        Analyzes the conversation and profile to produce a JSON-structured SOAP note.
        """
        if not client:
            return {"error": "Failed to generate report", "details": "NVIDIA API Key is missing or not configured."}
            
        # 1. Prepare Prompt
        messages_text = ""
        for msg in conversation_history:
            role = msg.get("role", "unknown")
            content = msg.get("content", "")
            messages_text += f"{role.upper()}: {content}\n"
            
        profile_text = f"Age: {user_profile.get('age', 'N/A')}, Gender: {user_profile.get('gender', 'N/A')}" if user_profile else "N/A"

        prompt = f"""
        You are an expert Medical AI Assistant and Scribe. Your task is to generate a professional SOAP Note and Triage Report based on the following patient consultation transcript.
        
        PATIENT PROFILE: {profile_text}
        
        TRANSCRIPT (Includes Patient inputs, AI responses, and automatic Vision Analysis results):
        {messages_text}
        
        INSTRUCTIONS:
        1. Analyze the conversation carefully, including any image analysis results or RAG medical sources mentioned by the AI.
        2. Categorize the findings into structured S.O.A.P format.
        3. Formulate a clear clinical Assumption/Conclusion based on all data gathered.
        4. Determine the Triage Level (Green/Yellow/Red).
        5. CRITICAL FORMATTING COMMAND: The value for each JSON key must use proper clear markdown formatting with lists wherever applicable. Use `\\n\\n` for paragraph breaks, and use `\\n- ` for bullet points within the JSON values to ensure readability in a UI block. Avoid dense walls of text. Be well spaced and properly separated. 
        6. Include Patient Historical Medical memory seamlessly if any is mentioned in the profile text or conversation.
        7. Output strictly in the JSON format below without markdown wrapping the entire JSON output.
        
        JSON SCHEMA:
        {{
            "patient_summary": "One line summary of patient age, gender, and chief complaint",
            "subjective": "Patient's stated symptoms, history, and feelings (S).",
            "objective": "Observed signs, vision analysis results (if any), and vital signs (O).",
            "assessment": "Likely diagnosis or differential diagnoses based on findings (A).",
            "plan": "Recommended steps, treatments, or referrals (P).",
            "ai_assumption": "The AI's final diagnostic reasoning and clinical assumption.",
            "triage_level": "Green" | "Yellow" | "Red",
            "triage_reason": "Brief explanation justifying why this triage level was assigned."
        }}
        
        Ensure the tone is highly clinical and professional. If information is missing, state 'Not reported'.
        """
        
        try:
            # We use the configured NVIDIA model. 
            # We enforce streaming to False here since we just want the final JSON output easily.
            completion = client.chat.completions.create(
                model=settings.MODEL_NAME, 
                messages=[{"role": "user", "content": prompt}],
                stream=True # Use stream=True to handle reasoning models like gpt-oss-120b cleanly
            )
            
            response_text = ""
            for chunk in completion:
                if chunk.choices and len(chunk.choices) > 0:
                    content = getattr(chunk.choices[0].delta, "content", None)
                    if content:
                        response_text += content
                        
            # Simple heuristic to find JSON if model outputs conversation along with it
            if "{" in response_text and "}" in response_text:
                start_idx = response_text.find("{")
                end_idx = response_text.rfind("}") + 1
                json_part = response_text[start_idx:end_idx]
                return json.loads(json_part)
            else:
                return json.loads(response_text)
            
        except Exception as e:
            print(f"Report Generation Failed: {e}")
            return {
                "error": "Failed to generate report",
                "details": str(e)
            }
