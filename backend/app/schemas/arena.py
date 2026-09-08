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
    message: Optional[str] = ""
    offer: Optional[Dict[str, Any]] = None
    turn_index: Optional[int] = None
    request_id: Optional[str] = None


class TurnResultResponse(BaseModel):
    status: str  # 'running', 'waiting_for_human', 'finished', 'deadlock', 'terminated'
    round: int
    current_turn_speaker: Optional[str] = ""
    message: Optional[Dict[str, Any]] = None
    agreement_reached: bool = False
    deadlock_reason: Optional[str] = None
    final_terms: Optional[Dict[str, Any]] = None
    validation_error: Optional[str] = None
    is_human_turn: Optional[bool] = False
    report: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)
