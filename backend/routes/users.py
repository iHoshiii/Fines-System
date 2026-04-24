from fastapi import APIRouter, Depends, HTTPException
from utils.auth import get_profile, require_manager
from utils.supabase import supabase
from schemas.profile import ProfileUpdate

router = APIRouter(tags=["Users"])

@router.get("/users")
def list_users(profile=Depends(get_profile)):
    if profile["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can list all users.")
    resp = supabase.table("profiles").select("*, organization:organizations(name)").order("full_name").execute()
    return resp.data or []

@router.put("/users/{user_id}")
def update_user(user_id: str, data: ProfileUpdate, profile=Depends(require_manager)):
    if profile["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can edit users.")
    update_data = data.model_dump(exclude_none=True)
    resp = supabase.table("profiles").update(update_data).eq("id", user_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="User not found.")
    return resp.data[0]

@router.put("/profile")
def update_own_profile(data: ProfileUpdate, profile=Depends(get_profile)):
    """Allows users to update their own profile information."""
    update_data = data.model_dump(exclude_none=True)

    safe_data = {}
    if "full_name" in update_data:
        safe_data["full_name"] = update_data["full_name"]

    if "student_id_number" in update_data and profile["role"] == "student":
        safe_data["student_id_number"] = update_data["student_id_number"]

    if not safe_data:
        raise HTTPException(status_code=400, detail="No update provided or field not allowed.")

    resp = supabase.table("profiles").update(safe_data).eq("id", profile["id"]).execute()
    if not resp.data:
        raise HTTPException(status_code=400, detail="Failed to update profile.")
    return resp.data[0]
