import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("backend.strategy_library")


class NegotiationTechnique:
    def __init__(
        self,
        name: str,
        purpose: str,
        suitable_scenarios: List[str],
        suitable_roles: List[str],
        suitable_personalities: List[str],
        guidance: str,
        min_round: int = 1,
        max_round: int = 20,
    ):
        self.name = name
        self.purpose = purpose
        self.suitable_scenarios = suitable_scenarios
        self.suitable_roles = suitable_roles
        self.suitable_personalities = suitable_personalities
        self.guidance = guidance
        self.min_round = min_round
        self.max_round = max_round


TECHNIQUE_CATALOG: List[NegotiationTechnique] = [
    # Vendor Pricing - Buyer Techniques
    NegotiationTechnique(
        name="Price Anchoring (Buyer)",
        purpose="Establish an aggressive initial pricing benchmark low enough to pull the vendor down.",
        suitable_scenarios=["vendor-pricing"],
        suitable_roles=["Procurement Director", "Buyer", "Purchasing Manager"],
        suitable_personalities=["Aggressive", "Collaborative", "Risk-Averse"],
        guidance="Open with a low price target (e.g. near $40-$45/user/month). Require justification for higher list rates.",
        min_round=1,
        max_round=2,
    ),
    NegotiationTechnique(
        name="Cost Comparison & Alternatives",
        purpose="Leverage competing software solutions to pressure vendor on price.",
        suitable_scenarios=["vendor-pricing"],
        suitable_roles=["Procurement Director", "Buyer", "Purchasing Manager"],
        suitable_personalities=["Aggressive", "Collaborative"],
        guidance="Mention market benchmarks or alternate vendors offering lower user rates.",
        min_round=2,
        max_round=10,
    ),
    NegotiationTechnique(
        name="Payment-Term Tradeoff",
        purpose="Trade favorable payment schedules (Net-45/Net-60) in exchange for modest price adjustments.",
        suitable_scenarios=["vendor-pricing"],
        suitable_roles=["Procurement Director", "Buyer", "Purchasing Manager"],
        suitable_personalities=["Collaborative", "Risk-Averse"],
        guidance="Offer flexible payment terms (e.g. Net-30 or annual upfront) if the vendor reduces per-user monthly price.",
        min_round=2,
        max_round=15,
    ),

    # Vendor Pricing - Vendor Techniques
    NegotiationTechnique(
        name="Value-Based Justification",
        purpose="Defend pricing by tying costs directly to premium support, SLA, and software ROI.",
        suitable_scenarios=["vendor-pricing"],
        suitable_roles=["Enterprise Sales VP", "Vendor", "Account Executive", "Sales"],
        suitable_personalities=["Aggressive", "Collaborative", "Risk-Averse"],
        guidance="Highlight Gold Support tier, guaranteed uptime SLAs, and seamless integration value to defend price points.",
        min_round=1,
        max_round=15,
    ),
    NegotiationTechnique(
        name="Minimum-Margin Protection & Volume Commitment",
        purpose="Protect per-unit margins by requiring higher seat volume or multi-year terms for discounts.",
        suitable_scenarios=["vendor-pricing"],
        suitable_roles=["Enterprise Sales VP", "Vendor", "Account Executive", "Sales"],
        suitable_personalities=["Aggressive", "Risk-Averse"],
        guidance="Offer price reductions only if the buyer commits to a minimum seat count (e.g. 150 seats) or a 3-year term.",
        min_round=2,
        max_round=15,
    ),

    # Job Salary - Recruiter Techniques
    NegotiationTechnique(
        name="Total-Compensation Framing",
        purpose="Emphasize equity options, bonuses, and hybrid flexibility when base salary is near grade caps.",
        suitable_scenarios=["job-offer"],
        suitable_roles=["Lead HR Partner", "Recruiter", "Hiring Manager", "HR"],
        suitable_personalities=["Aggressive", "Collaborative", "Risk-Averse"],
        guidance="Frame the overall package value by highlighting equity shares, sign-on bonuses, and remote work flexibility.",
        min_round=1,
        max_round=15,
    ),
    NegotiationTechnique(
        name="Budget-Constraint Management",
        purpose="Firmly communicate organizational salary ceiling while offering non-monetary perks.",
        suitable_scenarios=["job-offer"],
        suitable_roles=["Lead HR Partner", "Recruiter", "Hiring Manager", "HR"],
        suitable_personalities=["Risk-Averse", "Collaborative"],
        guidance="Cite internal salary band limits ($170k ceiling) and offer additional remote days or stock grants instead.",
        min_round=2,
        max_round=15,
    ),

    # Job Salary - Candidate Techniques
    NegotiationTechnique(
        name="Salary Anchoring & Market Justification",
        purpose="Establish high initial target based on Senior Engineer market benchmarks and competing offers.",
        suitable_scenarios=["job-offer"],
        suitable_roles=["Senior Developer Candidate", "Candidate", "Software Engineer"],
        suitable_personalities=["Aggressive", "Collaborative", "Risk-Averse"],
        guidance="Anchor near $175,000 base salary citing specialized experience and competing market offers.",
        min_round=1,
        max_round=2,
    ),
    NegotiationTechnique(
        name="Role-Scope & Flexibility Tradeoff",
        purpose="Trade remote work flexibility or title scope for compensation adjustments.",
        suitable_scenarios=["job-offer"],
        suitable_roles=["Senior Developer Candidate", "Candidate", "Software Engineer"],
        suitable_personalities=["Collaborative", "Risk-Averse"],
        guidance="Express willingness to compromise slightly on base salary if granted 4 remote days per week or higher stock grant.",
        min_round=2,
        max_round=15,
    ),

    # Budget Allocation - Finance Manager Techniques
    NegotiationTechnique(
        name="Budget-Cap Enforcement & ROI Reasoning",
        purpose="Strictly enforce the $500k total pool ceiling and require ROI metrics for all allocations.",
        suitable_scenarios=["budget-allocation"],
        suitable_roles=["VP of Finance", "Finance Manager", "CFO"],
        suitable_personalities=["Risk-Averse", "Collaborative"],
        guidance="Enforce $500,000 total pool cap. Require quarterly ROI tracking and maintain emergency reserve buffer.",
        min_round=1,
        max_round=15,
    ),

    # Budget Allocation - Engineering Techniques
    NegotiationTechnique(
        name="Technical Scope & Delivery-Risk Framing",
        purpose="Justify platform re-architecture budget by linking funding directly to system security and uptime.",
        suitable_scenarios=["budget-allocation"],
        suitable_roles=["Engineering Director", "Project Manager", "VP of Engineering"],
        suitable_personalities=["Aggressive", "Collaborative"],
        guidance="Advocate for $200k-$250k allocation to ensure platform scalability, security compliance, and zero downtime.",
        min_round=1,
        max_round=15,
    ),

    # Budget Allocation - Marketing Techniques
    NegotiationTechnique(
        name="Campaign Business-Impact & Acquisition Framing",
        purpose="Justify user acquisition budget based on expected revenue growth and customer conversion.",
        suitable_scenarios=["budget-allocation"],
        suitable_roles=["CMO / Marketing Lead", "Department Head", "Marketing Director"],
        suitable_personalities=["Collaborative", "Aggressive"],
        guidance="Request $130k-$180k allocation to launch user acquisition campaigns that generate top-line growth for the business.",
        min_round=1,
        max_round=15,
    ),
]


class StrategyEngine:
    """Selects dynamic, role-aware negotiation techniques for each turn."""

    @staticmethod
    def select_techniques(
        scenario_id: str,
        role: str,
        personality: str,
        current_round: int,
        messages: Optional[List[Dict[str, Any]]] = None,
    ) -> List[NegotiationTechnique]:
        """Selects 1 to 3 relevant techniques matching scenario, role, personality, and negotiation round."""
        selected: List[NegotiationTechnique] = []
        scenario_clean = scenario_id.lower().strip()
        role_clean = role.lower().strip()

        for tech in TECHNIQUE_CATALOG:
            # Scenario match check
            if not any(s.lower() in scenario_clean for s in tech.suitable_scenarios):
                continue

            # Role match check
            role_match = any(r.lower() in role_clean for r in tech.suitable_roles)
            if not role_match:
                continue

            # Round range check
            if not (tech.min_round <= current_round <= tech.max_round):
                continue

            selected.append(tech)
            if len(selected) >= 3:
                break

        # Fallback general technique if no specific match found
        if not selected:
            selected.append(
                NegotiationTechnique(
                    name="Pragmatic Commercial Negotiation",
                    purpose="Advocate for configured goals while demonstrating professional responsiveness.",
                    suitable_scenarios=[scenario_id],
                    suitable_roles=[role],
                    suitable_personalities=[personality],
                    guidance="Make incremental counterproposals aligned with your primary goals and hard constraints.",
                    min_round=1,
                    max_round=20,
                )
            )

        return selected
