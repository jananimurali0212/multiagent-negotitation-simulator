from typing import Dict, Any, Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class ReportResponse(BaseModel):
    id: str
    session_id: str
    scenario_id: str
    scenario_title: str
    mode: str
    outcome: str
    rounds_completed: int
    final_terms: Optional[Dict[str, Any]] = None
    initial_data: Optional[Dict[str, Any]] = None
    participants: Optional[List[Dict[str, Any]]] = None
    key_events: Optional[List[Dict[str, Any]]] = None
    unresolved_terms: Optional[Dict[str, Any]] = None
    agent_analysis: Optional[Dict[str, Any]] = None
    overall_score: int = 85
    duration_seconds: int = 0
    metrics: Dict[str, Any]
    scenario_analysis: Optional[Dict[str, Any]] = None
    summary: str
    final_assessment: Optional[str] = None
    recommendations: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
