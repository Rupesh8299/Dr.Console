
from fastapi import Header, HTTPException
from database.supabase_client import supabase

def get_current_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        token = authorization.split(" ")[1]
        user = supabase.auth.get_user(token)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user.user
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

def get_user_id(authorization: str = Header(None)):
    user = get_current_user(authorization)
    return user.id
