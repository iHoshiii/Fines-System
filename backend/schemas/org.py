from pydantic import BaseModel
from typing import Optional

class OrgCreate(BaseModel):
    name: str
    type: str  # ncssc | college | sub

class OrgUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
