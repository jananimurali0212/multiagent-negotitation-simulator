from dataclasses import dataclass, field
from typing import Optional, Dict, Any

@dataclass
class CustomNegotiationScenario:
    """Represents any user-defined negotiation scenario."""
    title: str
    description: str
    user_role: str
    agent_role: str
    starting_offer: Optional[float] = None
    target_price: Optional[float] = None
    reservation_price: Optional[float] = None
    context_details: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "title": self.title,
            "description": self.description,
            "user_role": self.user_role,
            "agent_role": self.agent_role,
            "starting_offer": self.starting_offer,
            "target_price": self.target_price,
            "reservation_price": self.reservation_price,
            "context_details": self.context_details
        }

def create_user_scenario(
    title: str,
    description: str,
    user_role: str,
    agent_role: str,
    starting_offer: Optional[float] = None,
    target_price: Optional[float] = None,
    reservation_price: Optional[float] = None,
    **kwargs
) -> CustomNegotiationScenario:
    """Utility to build a custom scenario instance directly from user inputs."""
    return CustomNegotiationScenario(
        title=title,
        description=description,
        user_role=user_role,
        agent_role=agent_role,
        starting_offer=starting_offer,
        target_price=target_price,
        reservation_price=reservation_price,
        context_details=kwargs
    )