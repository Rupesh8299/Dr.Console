
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Header, BackgroundTasks
import io
import json
from config import settings
from database.supabase_client import supabase
from modules.thinking_brain.deep_reasoning import process_chat, generate_title
from modules.image_analysis.vision_agent import VisionAgent

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("")
async def chat_endpoint(
    background_tasks: BackgroundTasks,
    message: str = Form(...), 
    session_id: str = Form(None),
    file: UploadFile = File(None),
    authorization: str = Header(None)
):
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured")
    
    user_id = "guest"
    user_metadata = {}
    
    # --- Auth & Profile Fetching ---
    if authorization:
        try:
            token = authorization.split(" ")[1]
            user = supabase.auth.get_user(token)
            user_id = user.user.id
            
            # Fetch full profile from DB
            profile_response = supabase.table("profiles").select("*").eq("id", user_id).execute()
            if profile_response.data:
                user_metadata = profile_response.data[0]
            else:
                user_metadata = user.user.user_metadata
        except Exception as e:
            print(f"Auth Error: {e}")
            pass

    try:
        # --- Session Management ---
        is_new_session = False
        if not session_id and user_id != "guest":
            is_new_session = True
            new_session = supabase.table("chat_sessions").insert({
                "user_id": user_id,
                "title": "New Consultation..." 
            }).execute()
            session_id = new_session.data[0]['id']

        # --- Context Preparation ---
        context_instruction = None
        if user_metadata:
             context_instruction = (
                f"\n\n[User Profile Context]\n"
                f"Name: {user_metadata.get('full_name', 'Unknown')}\n"
                f"Age: {user_metadata.get('age', 'Unknown')}\n"
                f"Gender: {user_metadata.get('gender', 'Unknown')}\n"
                f"Region: {user_metadata.get('region', 'Unknown')}\n"
                f"Medical History (Static): {user_metadata.get('medical_history', 'None')}\n"
                f"Medical Memory (Long-term): {user_metadata.get('medical_summary', 'None')}\n"
            )

        # --- Media Processing (Vision Module) ---
        media_object = None
        media_path = None
        
        if file:
             if file.content_type.startswith("image/"):
                 # Auto-detect specialist from user's message (seamless — no UI needed)
                 analysis_result = await VisionAgent.analyze_image(file, user_message=message)
                 
                 specialist = analysis_result.get("specialist", "skin")
                 diagnosis = analysis_result.get("condition", "Unknown")
                 confidence = analysis_result.get("confidence", 0)
                 warning = analysis_result.get("warning")
                 is_high_risk = analysis_result.get("is_high_risk", False)
                 
                 media_path = f"local_analysis_{specialist}"
                 
                 # Inject analysis context into the message for the LLM
                 message += (
                     f"\n\n[SYSTEM: {specialist.upper()} Image Analysis Result]\n"
                     f"Body Part Detected: {specialist.capitalize()}\n"
                     f"Diagnosis: {diagnosis} (Confidence: {confidence}%)\n"
                 )
                 if is_high_risk:
                     message += "ALERT: High-risk condition detected. Urgently advise medical consultation.\n"
                 if warning:
                     message += f"Note: {warning}\n"
                 
                 print(f"[AUTO] [{specialist.upper()}] → {diagnosis} ({confidence}%)")
                 
             else:
                 print(f"Skipping unsupported media type: {file.content_type}")
                 message += f"\n\n[SYSTEM: Unsupported Media Attached - {file.content_type}]"

        # --- Core Logic (LangGraph Coordinator) ---
        from langgraph_coordinator.graph import graph_app
        from langchain_core.messages import HumanMessage, AIMessage
        
        # --- Fetch Chat History ---
        history_messages = []
        if session_id and user_id != "guest":
            try:
                # Fetch last 10 messages
                history_data = supabase.table("conversations")\
                    .select("role, content")\
                    .eq("session_id", session_id)\
                    .order("created_at", desc=True)\
                    .limit(10)\
                    .execute()
                
                rows = history_data.data[::-1] # Reverse to chronological order
                for row in rows:
                    if row['role'] == 'user':
                        history_messages.append(HumanMessage(content=row['content']))
                    elif row['role'] == 'assistant':
                        history_messages.append(AIMessage(content=row['content']))
            except Exception as e:
                print(f"History Fetch Error: {e}")

        # Build Initial State
        initial_state = {
            "messages": history_messages + [HumanMessage(content=message)],
            "user_profile": user_metadata,
            "session_id": session_id or "guest_session",
            "is_emergency": False, 
            "needs_medical_memory_update": None
        }
        
        # Invoke Graph
        graph_result = await graph_app.ainvoke(initial_state)
        
        # Extract Results
        # graph_result['messages'][-1] is the AI message
        ai_response_content = graph_result['messages'][-1].content
        
        response_data = {
            "response": ai_response_content,
            "is_emergency": graph_result.get("is_emergency", False),
            "medical_summary_update": graph_result.get("needs_medical_memory_update"),
            "session_id": session_id
        }
        
        # --- Database Persistence ---
        if user_id != "guest" and supabase and session_id:
            try:
                # Save User Message
                supabase.table("conversations").insert({
                    "user_id": user_id,
                    "session_id": session_id,
                    "role": "user",
                    "content": message, 
                    "media_path": media_path
                }).execute()
                
                # Save AI Message
                supabase.table("conversations").insert({
                    "user_id": user_id,
                    "session_id": session_id,
                    "role": "assistant",
                    "content": response_data["response"],
                    "is_emergency": response_data.get("is_emergency", False)
                }).execute()

                # Update Medical Memory
                new_summary = response_data.get("medical_summary_update")
                if new_summary:
                    current_summary = user_metadata.get('medical_summary', '') or ''
                    updated_summary = (current_summary + "\n" + new_summary).strip()
                    supabase.table("profiles").update({"medical_summary": updated_summary}).eq("id", user_id).execute()
                    print(f"Updated Medical Memory: {new_summary}")

            except Exception as db_error:
                print(f"Database Error: {db_error}")

        # --- Background Tasks ---
        if is_new_session and user_id != "guest" and session_id:
            full_context = f"User: {message}\nAI: {response_data['response']}"
            background_tasks.add_task(generate_title, session_id, full_context)

        response_data["session_id"] = session_id
        return response_data

    except Exception as e:
        print(f"Gemini Error: {e}")
        
        # RATE LIMIT FALLBACK -> JUST ERROR
        if "429" in str(e) or "ResourceExhausted" in str(e):
             print("⚠️ Gemini Rate Limit Hit!")
             return {
                 "response": "System Overload (Rate Limit). Please try again in 60s.",
                 "is_emergency": False,
                 "medical_summary_update": None
             }

        return {
            "response": f"System Error: {str(e)}",
            "is_emergency": False,
            "medical_summary_update": None
        }
