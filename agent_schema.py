from dataclasses import dataclass, field
from typing import List

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

@dataclass
class AgentPersona:
    agent_id: str
    name: str
    role: str
    personality_type: str  # "collaborative", "risk-averse", "aggressive"
    traits: PersonalityTraits
    objectives: NegotiationObjectives
    voice_id: str = "alloy"  # Default TTS voice engine