from fastapi import APIRouter, Depends
from utils.auth import get_profile
from utils.supabase import supabase

router = APIRouter(prefix="/students", tags=["Students"])

@router.get("")
def list_students(profile=Depends(get_profile)):
    resp = supabase.table("profiles").select(
        "*, organization:organizations(name)"
    ).eq("role", "student").order("full_name").execute()
    return resp.data or []
