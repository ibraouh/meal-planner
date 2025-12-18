from fastapi import Header, HTTPException, Depends
from supabase import Client
from db import supabase

async def get_current_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authentication Token")
    
    try:
        token = authorization.replace("Bearer ", "")
        user = supabase.auth.get_user(token)
        if not user:
             raise HTTPException(status_code=401, detail="Invalid Authentication Token")
        return user.user
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))
