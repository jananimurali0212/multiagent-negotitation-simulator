from pydantic import BaseModel, Field
from typing import Optional, List

class UserInput(BaseModel):
    stt_transcript: str
    scenario_id: Optional[str] = "job_offer"
    mode: Optional[str] = "collaborative"

class AgentActionResponse(BaseModel):
    action: str = Field(description="Action type: ACCEPT, REJECT, COUNTER, ASK_INFO")
    proposed_price: Optional[float] = Field(description="Numerical offer amount if applicable")
    spoken_dialogue: str = Field(description="Natural language dialogue spoken by agent")

class TurnDetail(BaseModel):
    round: int
    user_speech: str
    agent_speech: str
    proposed_price: Optional[float] = None

class SessionSummaryResponse(BaseModel):
    session_id: str
    status: str
    efficiency_score: int
    collaboration_score: int
    key_takeaways: str
    turns: List[TurnDetail] = []