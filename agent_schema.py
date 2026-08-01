from dataclasses import dataclass, field
from typing import List, Optional

@dataclass
class PersonalityTraits:
    aggression: float
    flexibility: float
    patience: float

@dataclass
class NegotiationObjectives:
    primary_goal: str
    target_value: float
    reservation_value: float
    secondary_goals: List[str] = field(default_factory=list)

@dataclass
class AgentPersona:
    agent_id: str
    name: str
    role: str
    personality_type: str  # e.g., "collaborative", "risk-averse", "aggressive"
    traits: PersonalityTraits
    objectives: NegotiationObjectives
    constraints: List[str] = field(default_factory=list)
    voice_id: str = "alloy"  # Voice selection for Text-to-Speech (TTS)