
import json
import asyncio
from openai import AsyncOpenAI
from config import settings
from database.supabase_client import supabase

# Initialize OpenRouter Client
aclient = None
if settings.OPENROUTER_API_KEY:
    aclient = AsyncOpenAI(
        api_key=settings.OPENROUTER_API_KEY,
        base_url=settings.OPENROUTER_BASE_URL,
    )

SYSTEM_PROMPT = """
You are Dr. Console, an advanced AI Medical Assistant.
Your goal is to provide helpful, accurate, and safe health guidance.

OUTPUT FORMAT:
You must ALWAYS return a valid JSON object with the following structure:
{
    "response": "Your conversational response here...",
    "is_emergency": boolean, // true if the user describes a life-threatening situation
    "medical_summary_update": "Optional string. If the user provides NEW, PERMANENT medical info (e.g., 'I have diabetes', 'I am allergic to nuts'), summarize it here to update their long-term medical memory. Otherwise null."
}

PROTOCOL:
1. TRIAGE FIRST: If the user presents symptoms, assess the situation.
2. EMERGENCY DETECTION: If symptoms suggest a life-threatening emergency, set "is_emergency": true and IMMEDIATELY advise calling emergency services (112).
3. VISUAL DATA INTEGRATION: You may receive "[SYSTEM: Image Analysis Result]" in the input. This is trustworthy data from a specialized local AI model. Use this diagnosis (and its confidence score) to inform your advice. If confidence is high (>80%), treat it as a strong indicator. If low, advise the user to retake the photo or consult a doctor for a physical check.
4. MEMORY: You have access to the user's "Medical Memory". Use it to provide context-aware advice (e.g., avoiding allergens known in memory).
5. EMPATHY & CLARITY: Be empathetic but professional. Use clear, simple language.
6. DISCLAIMER: Always remind the user you are an AI and this is not a substitute for professional medical advice.

Start every interaction with a warm, professional greeting if it's the start of a conversation.
"""

async def process_chat(session_id: str, messages: list, context_instruction=None):
    """
    Sends the full conversation history to OpenRouter.
    messages: List of LangChain Message objects (HumanMessage, AIMessage, SystemMessage)
    """
    if not aclient:
        return {"response": "System Error: OpenRouter API Key not configured.", "is_emergency": False}

    # Construct messages payload
    api_messages = [
        {"role": "system", "content": SYSTEM_PROMPT}
    ]
    
    if context_instruction:
        api_messages.append({"role": "system", "content": context_instruction})
        
    # Appending history
    for msg in messages:
        role = "user"
        if msg.type == "ai":
            role = "assistant"
        elif msg.type == "system":
            role = "system"
            
        api_messages.append({"role": role, "content": msg.content})

    try:
        completion = await aclient.chat.completions.create(
            model=settings.MODEL_NAME,
            messages=api_messages,
            response_format={"type": "json_object"} 
        )
        
        response_text = completion.choices[0].message.content
        
        # Parse JSON
        try:
            return json.loads(response_text)
        except json.JSONDecodeError:
            return {
                "response": response_text,
                "is_emergency": False,
                "medical_summary_update": None
            }
            
    except Exception as e:
        print(f"OpenRouter/Gemini Error: {e}")
        return {
            "response": f"I apologize, but I encountered an error: {str(e)}",
            "is_emergency": False,
            "medical_summary_update": None
        }

async def generate_title(session_id: str, conversation_context: str):
    """Generates a short, relevant title for the chat session."""
    try:
        if not aclient:
            return

        prompt = f"""
        Generate a very short, concise title (max 4-5 words) for a medical consultation based on this initial exchange.
        Do not use quotes. Just the title.
        
        Context:
        {conversation_context}
        """
        
        completion = await aclient.chat.completions.create(
            model=settings.MODEL_NAME,
            messages=[{"role": "user", "content": prompt}]
        )
        title = completion.choices[0].message.content.strip()
        
        # Update title in DB
        if supabase:
            supabase.table("chat_sessions").update({"title": title}).eq("id", session_id).execute()
        print(f"Generated title for session {session_id}: {title}")
    except Exception as e:
        print(f"Error generating title: {e}")
