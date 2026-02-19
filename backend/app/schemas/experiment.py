from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ExperimentBase(BaseModel):
    title: str
    log_text: Optional[str] = None
    results_text: Optional[str] = None


class ExperimentCreate(ExperimentBase):
    pass


class ExperimentUpdate(BaseModel):
    title: Optional[str] = None
    log_text: Optional[str] = None
    results_text: Optional[str] = None


class ExperimentResponse(ExperimentBase):
    id: int
    project_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
