from pydantic import BaseModel
from typing import Optional

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
