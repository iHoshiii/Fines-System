from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List
from supabase import create_client, Client
from dotenv import load_dotenv
import os

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

app = FastAPI(
    title="NVSU Fines System API",
    description="Backend API for the Nueva Vizcaya State University Fines Management System",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

# ─── Auth Helper ─────────────────────────────────────────────

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

# ─── Pydantic Models ─────────────────────────────────────────

class FineCreate(BaseModel):
    student_id: str
    amount: float
    description: str
    status: str = "unpaid"

class FineUpdate(BaseModel):
    student_id: Optional[str] = None
    amount: Optional[float] = None
    description: Optional[str] = None
    status: Optional[str] = None

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    student_id_number: Optional[str] = None
    organization_id: Optional[str] = None

class OrgCreate(BaseModel):
    name: str
    type: str  # ncssc | college | sub

class OrgUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None

# ─── Health Check ─────────────────────────────────────────────

@app.get("/", tags=["Health"])
def read_root():
    return {"status": "ok", "message": "NVSU Fines System API is running."}

# ─── Fines Endpoints ─────────────────────────────────────────

@app.get("/fines", tags=["Fines"])
def list_fines(profile=Depends(get_profile)):
    """List fines. Students see only their own; managers see all."""
    query = supabase.table("fines").select(
        "*, student:profiles!student_id(id, full_name, student_id_number), issuer:profiles!issued_by(full_name)"
    ).order("created_at", desc=True)

    if profile["role"] == "student":
        query = query.eq("student_id", profile["id"])

    resp = query.execute()
    return resp.data or []

@app.post("/fines", tags=["Fines"], status_code=201)
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

@app.put("/fines/{fine_id}", tags=["Fines"])
def update_fine(fine_id: str, data: FineUpdate, profile=Depends(require_manager)):
    update_data = data.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update.")
    resp = supabase.table("fines").update(update_data).eq("id", fine_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Fine not found.")
    return resp.data[0]

@app.delete("/fines/{fine_id}", tags=["Fines"], status_code=204)
def delete_fine(fine_id: str, profile=Depends(require_manager)):
    supabase.table("fines").delete().eq("id", fine_id).execute()
    return None

# ─── Students Endpoints ───────────────────────────────────────

@app.get("/students", tags=["Students"])
def list_students(profile=Depends(require_manager)):
    resp = supabase.table("profiles").select(
        "*, organization:organizations(name)"
    ).eq("role", "student").order("full_name").execute()
    return resp.data or []

# ─── Organizations Endpoints ──────────────────────────────────

@app.get("/organizations", tags=["Organizations"])
def list_orgs(profile=Depends(get_profile)):
    resp = supabase.table("organizations").select("*").order("name").execute()
    return resp.data or []

@app.post("/organizations", tags=["Organizations"], status_code=201)
def create_org(data: OrgCreate, profile=Depends(require_manager)):
    if profile["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can manage organizations.")
    resp = supabase.table("organizations").insert({"name": data.name, "type": data.type}).execute()
    return resp.data[0]

@app.put("/organizations/{org_id}", tags=["Organizations"])
def update_org(org_id: str, data: OrgUpdate, profile=Depends(require_manager)):
    if profile["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can manage organizations.")
    update_data = data.model_dump(exclude_none=True)
    resp = supabase.table("organizations").update(update_data).eq("id", org_id).execute()
    return resp.data[0]

@app.delete("/organizations/{org_id}", tags=["Organizations"], status_code=204)
def delete_org(org_id: str, profile=Depends(require_manager)):
    if profile["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can manage organizations.")
    supabase.table("organizations").delete().eq("id", org_id).execute()
    return None

# ─── Users/Profiles Endpoints ─────────────────────────────────

@app.get("/users", tags=["Users"])
def list_users(profile=Depends(require_manager)):
    if profile["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can list all users.")
    resp = supabase.table("profiles").select("*, organization:organizations(name)").order("full_name").execute()
    return resp.data or []

@app.put("/users/{user_id}", tags=["Users"])
def update_user(user_id: str, data: ProfileUpdate, profile=Depends(require_manager)):
    if profile["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can edit users.")
    update_data = data.model_dump(exclude_none=True)
    resp = supabase.table("profiles").update(update_data).eq("id", user_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="User not found.")
    return resp.data[0]

# ─── Reports ──────────────────────────────────────────────────

@app.get("/reports/summary", tags=["Reports"])
def get_summary(profile=Depends(require_manager)):
    fines_resp = supabase.table("fines").select("amount, status, student_id").execute()
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
