from fastapi import APIRouter, Depends, HTTPException
from fastapi import status
from utils.auth import get_profile, require_manager
from utils.supabase import supabase
from schemas.fine import FineCreate, FineUpdate

router = APIRouter(prefix="/fines", tags=["Fines"])

@router.get("")
def list_fines(profile=Depends(get_profile)):
    """List fines. Students see only their own; managers see their issued ones; admin sees all."""
    query = supabase.table("fines").select(
        "*, student:profiles!student_id(id, full_name, student_id_number), issuer:profiles!issued_by(full_name)"
    ).order("created_at", desc=True)

    if profile["role"] == "student":
        query = query.eq("student_id", profile["id"])
    elif profile["role"] != "admin":
        query = query.eq("issued_by", profile["id"])

    resp = query.execute()
    return resp.data or []

@router.post("", status_code=201)
def create_fine(data: FineCreate, profile=Depends(require_manager)):
    resp = supabase.table("fines").insert({
        "student_id": data.student_id,
        "amount": data.amount,
        "description": data.description,
        "status": data.status,
        "issued_by": profile["id"],
    }).execute()
    if not resp.data:
        raise HTTPException(status_code=400, detail="Failed to create fine.")
    return resp.data[0]

@router.put("/{fine_id}")
def update_fine(fine_id: str, data: FineUpdate, profile=Depends(require_manager)):
    if profile["role"] != "admin":
        fine_check = supabase.table("fines").select("issued_by").eq("id", fine_id).single().execute()
        if not fine_check.data or fine_check.data["issued_by"] != profile["id"]:
            raise HTTPException(status_code=403, detail="You can only update your own fines.")

    update_data = data.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update.")
    resp = supabase.table("fines").update(update_data).eq("id", fine_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Fine not found.")
    return resp.data[0]

@router.delete("/{fine_id}", status_code=204)
def delete_fine(fine_id: str, profile=Depends(require_manager)):
    if profile["role"] != "admin":
        fine_check = supabase.table("fines").select("issued_by").eq("id", fine_id).single().execute()
        if not fine_check.data or fine_check.data["issued_by"] != profile["id"]:
            raise HTTPException(status_code=403, detail="You can only delete your own fines.")

    supabase.table("fines").delete().eq("id", fine_id).execute()
    return None
