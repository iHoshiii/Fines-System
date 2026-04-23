from fastapi import APIRouter, Depends
from utils.auth import require_manager
from utils.supabase import supabase

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/summary")
def get_summary(profile=Depends(require_manager)):
    query = supabase.table("fines").select("amount, status, student_id, issued_by")

    if profile["role"] != "admin":
        query = query.eq("issued_by", profile["id"])

    fines_resp = query.execute()
    fines = fines_resp.data or []

    total = len(fines)
    paid = sum(1 for f in fines if f["status"] == "paid")
    unpaid = total - paid
    total_amount = sum(f["amount"] for f in fines)
    unpaid_amount = sum(f["amount"] for f in fines if f["status"] == "unpaid")

    return {
        "total_fines": total,
        "paid": paid,
        "unpaid": unpaid,
        "total_amount": total_amount,
        "unpaid_amount": unpaid_amount,
    }
