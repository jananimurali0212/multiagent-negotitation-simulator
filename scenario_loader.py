import json
from typing import List, Dict, Any
from agent_schema import AgentPersona, PersonalityTraits, NegotiationObjectives

def load_scenario(file_path: str, scenario_id: str) -> List[AgentPersona]:
    """Loads a specific scenario by ID and converts agents into dataclass instances."""
    with open(file_path, "r") as f:
        data = json.load(f)
    
    for sc in data["scenarios"]:
        if sc["scenario_id"] == scenario_id:
            agents = []
            for a in sc["agents"]:
                agent = AgentPersona(
                    agent_id=a["agent_id"],
                    name=a["name"],
                    role=a["role"],
                    personality_type=a["personality_type"],
                    traits=PersonalityTraits(**a["traits"]),
                    objectives=NegotiationObjectives(**a["objectives"]),
                    constraints=a["constraints"]
                )
                agents.append(agent)
            return agents
            
    raise ValueError(f"Scenario '{scenario_id}' not found.")