from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from enum import Enum


class ProjectStatus(str, Enum):
    active = "active"
    completed = "completed"
    on_hold = "on_hold"
    archived = "archived"


class ProjectBase(BaseModel):
    title: str
    description: str
    status: ProjectStatus = ProjectStatus.active


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ProjectStatus] = None


class ProjectResponse(ProjectBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
