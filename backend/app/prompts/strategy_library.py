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
        purpose="Establish an initial pricing benchmark aligned with configured budget and target goals.",
        suitable_scenarios=["vendor-pricing"],
        suitable_roles=["Procurement Director", "Buyer", "Purchasing Manager", "Buyer Agent"],
        suitable_personalities=["Aggressive", "Collaborative", "Risk-Averse"],
        guidance="Open with your configured target price or favorable terms. Require justification for higher vendor proposals.",
        min_round=1,
        max_round=2,
    ),
    NegotiationTechnique(
        name="Cost Comparison & Alternatives",
        purpose="Leverage commercial discipline and market standards to maintain pricing discipline.",
        suitable_scenarios=["vendor-pricing"],
        suitable_roles=["Procurement Director", "Buyer", "Purchasing Manager", "Buyer Agent"],
        suitable_personalities=["Aggressive", "Collaborative"],
        guidance="Reference configured budget limitations and commercial standards to negotiate favorable rates.",
        min_round=2,
        max_round=10,
    ),
    NegotiationTechnique(
        name="Payment-Term Tradeoff",
        purpose="Trade favorable payment schedules or service commitments in exchange for price adjustments.",
        suitable_scenarios=["vendor-pricing"],
        suitable_roles=["Procurement Director", "Buyer", "Purchasing Manager", "Buyer Agent"],
        suitable_personalities=["Collaborative", "Risk-Averse"],
        guidance="Offer tradeoffs on payment terms or support tiers if the vendor moves closer to your target price.",
        min_round=2,
        max_round=15,
    ),

    # Vendor Pricing - Vendor Techniques
    NegotiationTechnique(
        name="Value-Based Justification",
        purpose="Defend pricing by tying costs directly to support tier, service quality, and product ROI.",
        suitable_scenarios=["vendor-pricing"],
        suitable_roles=["Enterprise Sales VP", "Vendor", "Account Executive", "Sales", "Vendor Agent"],
        suitable_personalities=["Aggressive", "Collaborative", "Risk-Averse"],
        guidance="Highlight configured support level, deployment requirements, and solution quality to defend your proposed pricing.",
        min_round=1,
        max_round=15,
    ),
    NegotiationTechnique(
        name="Minimum-Margin Protection & Volume Commitment",
        purpose="Protect margins and respect minimum price floor while seeking mutual commercial concessions.",
        suitable_scenarios=["vendor-pricing"],
        suitable_roles=["Enterprise Sales VP", "Vendor", "Account Executive", "Sales", "Vendor Agent"],
        suitable_personalities=["Aggressive", "Risk-Averse"],
        guidance="Make concessions only in exchange for favorable volume, term duration, or payment conditions.",
        min_round=2,
        max_round=15,
    ),

    # Job Salary - Recruiter Techniques
    NegotiationTechnique(
        name="Total-Compensation Framing",
        purpose="Emphasize overall package value including equity, bonus structure, and flexibility.",
        suitable_scenarios=["job-offer"],
        suitable_roles=["Lead HR Partner", "Recruiter", "Hiring Manager", "HR", "Recruiter Agent"],
        suitable_personalities=["Aggressive", "Collaborative", "Risk-Averse"],
        guidance="Frame the overall package value by highlighting configured equity, benefits, and schedule flexibility.",
        min_round=1,
        max_round=15,
    ),
    NegotiationTechnique(
        name="Budget-Constraint Management",
        purpose="Firmly communicate organizational salary ceiling while offering non-monetary perks.",
        suitable_scenarios=["job-offer"],
        suitable_roles=["Lead HR Partner", "Recruiter", "Hiring Manager", "HR", "Recruiter Agent"],
        suitable_personalities=["Risk-Averse", "Collaborative"],
        guidance="Cite internal salary grade boundaries and explore alternative configured dimensions to reach agreement.",
        min_round=2,
        max_round=15,
    ),

    # Job Salary - Candidate Techniques
    NegotiationTechnique(
        name="Salary Anchoring & Market Justification",
        purpose="Establish initial compensation target based on experience and career priorities.",
        suitable_scenarios=["job-offer"],
        suitable_roles=["Senior Developer Candidate", "Candidate", "Software Engineer", "Candidate Agent"],
        suitable_personalities=["Aggressive", "Collaborative", "Risk-Averse"],
        guidance="Anchor near your configured target salary citing your background and primary career goals.",
        min_round=1,
        max_round=2,
    ),
    NegotiationTechnique(
        name="Role-Scope & Flexibility Tradeoff",
        purpose="Trade remote work flexibility, equity options, or role scope for compensation adjustments.",
        suitable_scenarios=["job-offer"],
        suitable_roles=["Senior Developer Candidate", "Candidate", "Software Engineer", "Candidate Agent"],
        suitable_personalities=["Collaborative", "Risk-Averse"],
        guidance="Explore package tradeoffs between base salary, remote work arrangement, and equity within your configured parameters.",
        min_round=2,
        max_round=15,
    ),

    # Budget Allocation - Finance Manager Techniques
    NegotiationTechnique(
        name="Budget-Cap Enforcement & ROI Reasoning",
        purpose="Strictly enforce the total budget pool ceiling and require justification for all allocations.",
        suitable_scenarios=["budget-allocation"],
        suitable_roles=["VP of Finance", "Finance Manager", "CFO", "Finance Manager Agent"],
        suitable_personalities=["Risk-Averse", "Collaborative"],
        guidance="Enforce total pool ceiling, require clear milestone outcomes, and ensure balanced resource distribution.",
        min_round=1,
        max_round=15,
    ),

    # Budget Allocation - Engineering Techniques
    NegotiationTechnique(
        name="Technical Scope & Delivery-Risk Framing",
        purpose="Justify platform re-architecture budget by linking funding directly to system security and delivery.",
        suitable_scenarios=["budget-allocation"],
        suitable_roles=["Engineering Director", "Project Manager", "VP of Engineering", "Project Manager Agent"],
        suitable_personalities=["Aggressive", "Collaborative"],
        guidance="Advocate for your configured allocation floor to ensure platform scalability, delivery timelines, and risk mitigation.",
        min_round=1,
        max_round=15,
    ),

    # Budget Allocation - Marketing Techniques
    NegotiationTechnique(
        name="Campaign Business-Impact & Acquisition Framing",
        purpose="Justify project allocation based on business impact and program objectives.",
        suitable_scenarios=["budget-allocation"],
        suitable_roles=["CMO / Marketing Lead", "Department Head", "Marketing Director", "Department Head Agent"],
        suitable_personalities=["Collaborative", "Aggressive"],
        guidance="Request funding aligned with your configured goals and minimum requirements to deliver key business initiatives.",
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
