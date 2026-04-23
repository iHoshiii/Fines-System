from pydantic import BaseModel
from typing import Optional

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    student_id_number: Optional[str] = None
    organization_id: Optional[str] = None
