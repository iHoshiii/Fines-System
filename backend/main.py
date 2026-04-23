from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from utils.supabase import ALLOWED_ORIGINS
from routes.health import router as health_router
from routes.fines import router as fines_router
from routes.students import router as students_router
from routes.organizations import router as organizations_router
from routes.users import router as users_router
from routes.reports import router as reports_router

app = FastAPI(
    title="NVSU Fines System API",
    description="Backend API for the Nueva Vizcaya State University Fines System",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(fines_router)
app.include_router(students_router)
app.include_router(organizations_router)
app.include_router(users_router)
app.include_router(reports_router)
