
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Header, BackgroundTasks, Depends
import io
import json
from config import settings
from database.supabase_client import supabase
from modules.thinking_brain.deep_reasoning import process_chat, generate_title
from modules.image_analysis.vision_agent import VisionAgent
from auth_module.auth_service import get_user_id

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("")
async def chat_endpoint(
    background_tasks: BackgroundTasks,
    message: str = Form(...), 
    session_id: str = Form(None),
    guest_history: str = Form(None),
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
                f"Name: {user_metadata.get('full_name') or 'Unknown'}\n"
                f"Age: {user_metadata.get('age') or 'Unknown'}\n"
                f"Gender: {user_metadata.get('gender') or 'Unknown'}\n"
                f"Region: {user_metadata.get('region') or 'Unknown'}\n"
                f"Medical History (Static): {user_metadata.get('medical_history') or 'None'}\n"
                f"Medical Memory (Long-term): {user_metadata.get('medical_summary') or 'None'}\n"
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
        elif user_id == "guest" and guest_history:
            try:
                # Load client-side state for ephemeral guest memory
                historic_msgs = json.loads(guest_history)[-10:]
                for msg in historic_msgs:
                    if msg.get('role') == 'user':
                        history_messages.append(HumanMessage(content=msg.get('content', '')))
                    elif msg.get('role') == 'assistant':
                        history_messages.append(AIMessage(content=msg.get('content', '')))
            except Exception as e:
                print(f"Guest History Parse Error: {e}")

        # Build Initial State
        initial_state = {
            "messages": history_messages + [HumanMessage(content=message)],
            "user_profile": user_metadata,
            "session_id": session_id or "guest_session",
            "triage_level": "Pending", 
            "needs_medical_memory_update": None
        }
        
        # Invoke Graph
        graph_result = await graph_app.ainvoke(initial_state)
        
        # Extract Results
        # graph_result['messages'][-1] is the AI message
        ai_response_content = graph_result['messages'][-1].content
        
        response_data = {
            "response": ai_response_content,
            "triage_level": graph_result.get("triage_level", "Pending"),
            "medical_summary_update": graph_result.get("needs_medical_memory_update"),
            "rag_sources": graph_result.get("rag_sources", []),
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
                    "is_emergency": response_data.get("triage_level") == "Red"
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
                 "triage_level": "Pending",
                 "medical_summary_update": None
             }

        return {
            "response": f"System Error: {str(e)}",
            "triage_level": "Pending",
            "medical_summary_update": None
        }

from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from modules.report_generator.soap_engine import ReportGenerator

class ReportRequest(BaseModel):
    messages: List[Dict[str, Any]]
    user_profile: Optional[Dict[str, Any]] = None

@router.post("/report")
async def generate_report_endpoint(request: ReportRequest):
    """
    Generates a structured SOAP report and Triage analysis 
    based on the provided conversation history.
    """
    try:
        report_data = ReportGenerator.generate_soap_report(
            conversation_history=request.messages,
            user_profile=request.user_profile
        )
        return report_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate report: {str(e)}")

@router.delete("/branch")
async def branch_chat(session_id: str, keep_count: int, user_id: str = Depends(get_user_id)):
    """
    Truncates a chat session to branch off a previous message.
    It fetches all messages in chronological order, and deletes all messages from index `keep_count` onwards.
    """
    if user_id == "guest" or not supabase:
        return {"status": "success", "message": "Guest session memory cleared locally."}
        
    try:
        # Fetch ordered messages to accurately determine sequence
        result = supabase.table("conversations").select("id").eq("session_id", session_id).eq("user_id", user_id).order("created_at", desc=False).execute()
        messages = result.data
        
        if len(messages) > keep_count:
            # Get IDs of messages to delete (everything at keep_count and beyond)
            ids_to_delete = [msg["id"] for msg in messages[keep_count:]]
            
            if ids_to_delete:
                supabase.table("conversations").delete().in_("id", ids_to_delete).execute()
                print(f"[Chat Router] Branched session {session_id}. Deleted {len(ids_to_delete)} trailing messages.")
                
        return {"status": "success", "deleted_count": len(messages) - keep_count if len(messages) > keep_count else 0}
    except Exception as e:
        print(f"Failed to branch chat: {e}")
        raise HTTPException(status_code=500, detail="Failed to truncate conversation history.")
