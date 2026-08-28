from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.agent import AgentConfigSchema, AgentUpdatePayload


class SessionCreatePayload(BaseModel):
    scenario_id: str = Field(..., description="ID of selected scenario (vendor-pricing, job-offer, budget-allocation)")
    mode: str = Field(..., description="Execution mode ('ai-ai' or 'human-ai')")
    human_role: Optional[str] = Field(None, description="Role of the human participant ('buyer' or 'vendor')")


class UpdateAgentsPayload(BaseModel):
    agents: List[Dict[str, Any]]


class ConfirmReviewPayload(BaseModel):
    confirm: bool = True


class MessageSchema(BaseModel):
    id: str
    sender: str
    role: str
    avatar: str
    content: str
    round: int
    turn_index: int
    is_user: bool
    timestamp: datetime
    offer_data: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)


class SessionResponse(BaseModel):
    id: str
    scenario_id: str
    mode: str
    human_role: Optional[str] = None
    current_step: str
    review_confirmed: bool
    status: str
    current_round: int
    max_rounds: int
    agreement_reached: bool
    final_terms: Optional[Dict[str, Any]] = None
    agents: List[AgentConfigSchema] = []
    messages: List[MessageSchema] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
