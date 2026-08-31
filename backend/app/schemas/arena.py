from typing import Dict, Any, Optional
from pydantic import BaseModel, ConfigDict


class AgentDecision(BaseModel):
    action: str  # 'offer', 'counteroffer', 'accept', 'reject', 'deadlock'
    message: str
    rationale_summary: Optional[str] = None
    offer: Optional[Dict[str, Any]] = None
    concession_percentage: Optional[float] = 0.0
    confidence_score: Optional[float] = 1.0


class UserTurnPayload(BaseModel):
    message: str
    offer: Optional[Dict[str, Any]] = None


class TurnResultResponse(BaseModel):
    status: str  # 'running', 'finished', 'deadlock', 'terminated'
    round: int
    current_turn_speaker: Optional[str] = ""
    message: Optional[Dict[str, Any]] = None
    agreement_reached: bool = False
    final_terms: Optional[Dict[str, Any]] = None
    validation_error: Optional[str] = None
    report_id: Optional[str] = None
    report_status: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
