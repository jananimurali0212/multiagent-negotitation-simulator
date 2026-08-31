from typing import Dict, Any, Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class ReportResponse(BaseModel):
    id: str
    session_id: str
    user_id: Optional[str] = None
    scenario_id: str
    scenario_title: str
    mode: str
    outcome: str
    rounds_completed: int
    final_terms: Optional[Dict[str, Any]] = None
    metrics: Dict[str, Any]
    summary: str
    recommendations: str
    analysis: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
