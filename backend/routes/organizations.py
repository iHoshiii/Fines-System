from fastapi import APIRouter, Depends, HTTPException
from utils.auth import get_profile, require_manager
from utils.supabase import supabase
from schemas.org import OrgCreate, OrgUpdate

router = APIRouter(prefix="/organizations", tags=["Organizations"])

@router.get("")
def list_orgs(profile=Depends(get_profile)):
    resp = supabase.table("organizations").select("*").order("name").execute()
    return resp.data or []

@router.post("", status_code=201)
def create_org(data: OrgCreate, profile=Depends(require_manager)):
    if profile["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can manage organizations.")
    resp = supabase.table("organizations").insert({"name": data.name, "type": data.type}).execute()
    return resp.data[0]

@router.put("/{org_id}")
def update_org(org_id: str, data: OrgUpdate, profile=Depends(require_manager)):
    if profile["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can manage organizations.")
    update_data = data.model_dump(exclude_none=True)
    resp = supabase.table("organizations").update(update_data).eq("id", org_id).execute()
    return resp.data[0]

@router.delete("/{org_id}", status_code=204)
def delete_org(org_id: str, profile=Depends(require_manager)):
    if profile["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can manage organizations.")
    supabase.table("organizations").delete().eq("id", org_id).execute()
    return None
