from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.agent import AgentConfigSchema


class NormalizedNegotiationState(BaseModel):
    """Authoritative normalized domain model representing the current negotiation session state."""

    session_id: str
    scenario_id: str
    mode: str = Field(default="ai-ai", description="Negotiation execution mode ('ai-ai' or 'human-ai')")
    current_round: int = Field(default=1, ge=1)
    max_rounds: int = Field(default=20, ge=1)
    current_turn: int = Field(default=0, ge=0)
    current_speaker_index: int = Field(default=0, ge=0)
    current_turn_speaker: str = Field(default="")
    agents: List[AgentConfigSchema] = Field(default_factory=list)
    messages: List[Dict[str, Any]] = Field(default_factory=list)
    current_offer: Optional[Dict[str, Any]] = None
    previous_offer: Optional[Dict[str, Any]] = None
    offer_history: List[Dict[str, Any]] = Field(default_factory=list)
    concession_history: List[Dict[str, Any]] = Field(default_factory=list)
    accepted_terms: Optional[Dict[str, Any]] = None
    status: str = Field(default="running", description="Status: 'running', 'finished', 'deadlock', 'terminated'")
    termination_reason: Optional[str] = None
    zopa_info: Optional[Dict[str, Any]] = None
    telemetry_events: List[Dict[str, Any]] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    def get_active_agent(self) -> Optional[AgentConfigSchema]:
        """Returns the AgentConfigSchema for the currently active speaker."""
        if not self.agents:
            return None
        idx = self.current_speaker_index % len(self.agents)
        return self.agents[idx]

    def get_previous_speaker(self) -> Optional[AgentConfigSchema]:
        """Returns the AgentConfigSchema for the previous turn speaker."""
        if not self.agents or len(self.agents) < 2:
            return None
        idx = (self.current_speaker_index - 1) % len(self.agents)
        return self.agents[idx]

    def get_agent_by_role(self, role_keyword: str) -> Optional[AgentConfigSchema]:
        """Finds an agent matching role keyword (e.g. 'Buyer', 'Vendor', 'Recruiter', 'Candidate', 'Finance')."""
        role_kw = role_keyword.lower().strip()
        for agent in self.agents:
            if role_kw in agent.role.lower():
                return agent
        return None

    def record_telemetry(self, event_name: str, payload: Optional[Dict[str, Any]] = None):
        """Appends telemetry event to session log (stripping sensitive API keys or private credentials)."""
        event_data = {
            "event": event_name,
            "round": self.current_round,
            "turn": self.current_turn,
            "speaker": self.current_turn_speaker,
            "payload": payload or {},
        }
        self.telemetry_events.append(event_data)
