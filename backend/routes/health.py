from fastapi import APIRouter

router = APIRouter()

@router.get("/", tags=["Health"])
def read_root():
    return {"status": "ok", "message": "NVSU Fines System API is running."}
