from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .supabase import supabase

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        user_resp = supabase.auth.get_user(token)
        if not user_resp.user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token.")
        return user_resp.user
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token.")

async def get_profile(user=Depends(get_current_user)):
    resp = supabase.table("profiles").select("*").eq("id", user.id).single().execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Profile not found.")
    return resp.data

def require_manager(profile=Depends(get_profile)):
    if profile["role"] == "student":
        raise HTTPException(status_code=403, detail="Insufficient permissions.")
    return profile
