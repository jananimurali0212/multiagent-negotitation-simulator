from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class GoalSchema(BaseModel):
    id: Optional[str] = None
    text: str
    priority: str = "Medium"  # High, Medium, Low

    model_config = ConfigDict(from_attributes=True)


class ConstraintSchema(BaseModel):
    id: Optional[str] = None
    label: str
    value: str

    model_config = ConfigDict(from_attributes=True)


class AgentConfigSchema(BaseModel):
    id: str
    agent_template_id: str
    name: str
    role: str
    avatar: str
    personality: str  # Aggressive, Collaborative, Risk-Averse
    experience: str = "Medium"  # Low, Medium, High
    goals: List[GoalSchema] = []
    constraints: List[ConstraintSchema] = []
    negotiation_parameters: dict = {}

    model_config = ConfigDict(from_attributes=True)


class AgentUpdatePayload(BaseModel):
    name: Optional[str] = None
    personality: Optional[str] = None  # Aggressive, Collaborative, Risk-Averse
    experience: Optional[str] = None  # Low, Medium, High
    negotiation_parameters: Optional[dict] = None
    goals: Optional[List[GoalSchema]] = None
    constraints: Optional[List[ConstraintSchema]] = None
