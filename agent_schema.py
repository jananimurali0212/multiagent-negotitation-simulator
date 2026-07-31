"""
agent_schema.py
Data structures for Multi-Agent Negotiation Simulator.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional

@dataclass
class PersonalityTraits:
    aggression: float       # 0.0 to 1.0
    flexibility: float      # 0.0 to 1.0
    patience: float         # 0.0 to 1.0

@dataclass
class NegotiationObjectives:
    primary_goal: str
    target_value: float
    reservation_value: float  # Walk-away point
    secondary_goals: List[str] = field(default_factory=list)

@dataclass
class AgentPersona:
    agent_id: str
    name: str
    role: str
    personality_type: str    # "aggressive", "collaborative", or "risk-averse"
    traits: PersonalityTraits
    objectives: NegotiationObjectives
    constraints: List[str]

@dataclass
class NegotiationScenario:
    scenario_id: str
    title: str
    description: str
    agents: List[AgentPersona]