
from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel
from database.supabase_client import supabase
from auth_module.auth_service import get_user_id

router = APIRouter(prefix="/sessions", tags=["sessions"])

class SessionCreate(BaseModel):
    title: str = "New Consultation"

@router.post("")
async def create_session(session_data: SessionCreate, user_id: str = Depends(get_user_id)):
    try:
        # Create new session in DB
        result = supabase.table("chat_sessions").insert({
            "user_id": user_id,
            "title": session_data.title
        }).execute()
        
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("")
async def get_sessions(user_id: str = Depends(get_user_id)):
    try:
        # Fetch sessions
        result = supabase.table("chat_sessions").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{session_id}")
async def delete_session(session_id: str, user_id: str = Depends(get_user_id)):
    try:
        # Verify ownership and delete
        result = supabase.table("chat_sessions").delete().eq("id", session_id).eq("user_id", user_id).execute()
        
        return {"message": "Session deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
