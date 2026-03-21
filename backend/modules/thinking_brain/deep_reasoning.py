
import json
import asyncio
from openai import AsyncOpenAI
from config import settings
from database.supabase_client import supabase

# Initialize NVIDIA Client
aclient = None
if settings.NVIDIA_API_KEY:
    aclient = AsyncOpenAI(
        api_key=settings.NVIDIA_API_KEY,
        base_url=settings.NVIDIA_BASE_URL,
    )

SYSTEM_PROMPT = """
You are Dr. Console, an advanced AI Medical Assistant.
Your goal is to provide helpful, accurate, and safe health guidance.

OUTPUT FORMAT:
You must ALWAYS return a valid JSON object wrapped inside a ```json ... ``` codeblock with the following structure:
```json
{
    "response": "Your conversational response here...",
    "triage_level": "Green", // Must be one of: "Green", "Yellow", "Red", or "Pending"
    "medical_summary_update": "Optional string. If the user provides NEW, PERMANENT medical info (e.g., 'I have diabetes', 'I am allergic to nuts'), summarize it here to update their long-term medical memory. Otherwise null."
}
```

TRIAGE PROTOCOL & OTC GUIDANCE:
Analyze the patient context over the conversation and assign a `triage_level`:
- "Pending": If the conversation just started and symptoms aren't completely clear. You MUST ask 1-2 clarifying questions to understand the severity, duration, or related symptoms before jumping to a diagnosis.
- "Green": Mild symptoms or self-care appropriate. You MUST explicitly provide generic OTC (Over-The-Counter) drug recommendations and home-care steps in your `response`.
- "Yellow": Doctor consultation is recommended / routine issue. You MUST provide symptom-relief OTC recommendations to help them until they see a doctor.
- "Red": Life-threatening emergency. Immediately advise calling emergency services (112).

ADDITIONAL RULES:
1. MANDATORY DEMOGRAPHICS: If the patient has not yet provided basic demographic details (AGE and GENDER), you MUST ask for them before giving any diagnosis or detailed advice. This is crucial for vulnerable group analysis.
2. CLINICAL INTERVIEW FIRST: DO NOT instantly diagnose or suggest treatments on the first vague message (e.g. "I have a headache"). You must act like a real doctor and gather context first. Keep triage_level as "Pending" while gathering info.
3. VISUAL DATA INTEGRATION: You may receive "[SYSTEM: Image Analysis Result]" in the input. Use this diagnosis and confidence score to inform your advice. If confidence is low, advise physical check.
4. MEMORY: You have access to "Medical Memory". Use it to avoid dangerous drug interactions.
5. EMPATHY & CLARITY: Be empathetic but professional. 
6. DISCLAIMER: Always remind the user you are an AI.
"""

async def process_chat(session_id: str, messages: list, context_instruction=None):
    """
    Sends the full conversation history to OpenRouter.
    messages: List of LangChain Message objects (HumanMessage, AIMessage, SystemMessage)
    """
    if not aclient:
        return {"response": "System Error: NVIDIA API Key not configured.", "is_emergency": False}

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
            stream=True
        )
        
        response_text = ""
        async for chunk in completion:
            if chunk.choices and len(chunk.choices) > 0:
                reasoning = getattr(chunk.choices[0].delta, "reasoning_content", None)
                content = getattr(chunk.choices[0].delta, "content", None)
                if reasoning:
                    response_text += reasoning
                if content:
                    response_text += content
                
        print(f"DEBUG: NVIDIA Response text extracted via stream: {response_text[:100]}...")
        
        # Parse JSON
        import re
        try:
            # Look for a markdown JSON block explicitly since the model talks out loud first
            match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', response_text, re.DOTALL)
            if match:
                return json.loads(match.group(1))
            
            # Fallback heuristic: find the last occurrence of the "response" key to anchor start
            idx = response_text.rfind('"response"')
            if idx != -1:
                start_idx = response_text.rfind("{", 0, idx)
                end_idx = response_text.rfind("}") + 1
                if start_idx != -1 and end_idx != -1:
                    json_part = response_text[start_idx:end_idx]
                    return json.loads(json_part)
                
            # Final fallback
            if "{" in response_text and "}" in response_text:
                json_part = response_text[response_text.find("{"):response_text.rfind("}")+1]
                return json.loads(json_part)
                
            return json.loads(response_text)
            
        except json.JSONDecodeError as e:
            print(f"DEBUG EXCEPTION parsing JSON: {e}")
            import re
            try:
                # Regex fallback to extract the response if JSON parsing completely fails due to unescaped characters/newlines
                resp_match = re.search(r'"response"\s*:\s*"([\s\S]*?)"\s*(?:,\s*"triage_level"|,\s*"medical_summary_update"|})', response_text)
                if resp_match:
                    clean_resp = resp_match.group(1).replace('\\n', '\n').replace('\\"', '"')
                    
                    triage_match = re.search(r'"triage_level"\s*:\s*"([^"]+)"', response_text)
                    t_val = triage_match.group(1) if triage_match else "Pending"
                    return {
                        "response": clean_resp,
                        "triage_level": t_val,
                        "medical_summary_update": None
                    }
                else:
                    raise Exception("Regex fallback failed to extract response")
            except Exception as e2:
                print(f"Fallback extraction failed: {e2}")
                # Brutal final fallback: just strip syntax
                clean_response = response_text.replace('```json', '').replace('```', '').replace('{', '').replace('}', '').replace('"response":', '').strip()
                return {
                    "response": clean_response,
                    "triage_level": "Pending",
                    "medical_summary_update": None
                }
            
    except Exception as e:
        print(f"NVIDIA API Error: {e}")
        return {
            "response": f"I apologize, but I encountered an error: {str(e)}",
            "triage_level": "Pending",
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
