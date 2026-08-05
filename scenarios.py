from dataclasses import dataclass, field
from typing import Optional, Dict, Any

@dataclass
class NegotiationScenario:
    """Represents a negotiation scenario."""
    scenario_id: str
    title: str
    description: str
    user_role: str
    agent_role: str
    starting_offer: float
    target_price: float
    reservation_price: float

PRESET_SCENARIOS: Dict[str, NegotiationScenario] = {
    "job_offer": NegotiationScenario(
        scenario_id="job_offer",
        title="Job Offer Negotiation",
        description="Negotiating base salary, signing bonus, and equity for a Senior Engineer position.",
        user_role="Job Candidate",
        agent_role="Hiring Manager",
        starting_offer=110000.0,
        target_price=135000.0,
        reservation_price=120000.0
    ),
    "project_budget": NegotiationScenario(
        scenario_id="project_budget",
        title="Project Budget Allocation Negotiation",
        description="Negotiating internal quarterly budget allocation between departments for upcoming engineering projects.",
        user_role="Engineering Lead",
        agent_role="VP of Finance",
        starting_offer=50000.0,
        target_price=85000.0,
        reservation_price=65000.0
    ),
    "vendor_pricing": NegotiationScenario(
        scenario_id="vendor_pricing",
        title="Vendor Pricing Negotiation",
        description="Negotiating annual contract pricing for enterprise SaaS software subscriptions.",
        user_role="Procurement Manager",
        agent_role="Vendor Sales Director",
        starting_offer=40000.0,
        target_price=28000.0,
        reservation_price=33000.0
    )
}

def get_scenario(scenario_id: str) -> Optional[NegotiationScenario]:
    """Retrieves one of the predefined negotiation scenarios."""
    return PRESET_SCENARIOS.get(scenario_id)