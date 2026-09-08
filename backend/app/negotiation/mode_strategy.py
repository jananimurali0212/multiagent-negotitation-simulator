from dataclasses import dataclass
from typing import Dict, Any, Optional


@dataclass(frozen=True)
class PersonalityStrategyConfig:
    """Centralized configuration defining behavioral directives and strategic parameters for a negotiation personality."""
    personality: str
    label: str
    cooperation: str           # "high", "moderate", "low/moderate"
    concession_rate: str       # "moderate", "low", "minimal"
    concession_curve: str      # "reciprocal", "decaying_small", "minimal_anchored"
    flexibility: str           # "high", "low/moderate", "low"
    pressure: str              # "low", "high", "moderate"
    risk_tolerance: str        # "moderate", "very low", "moderate/high"
    priority: str              # "win_win_priority = high", "constraint_protection = very high", "objective_priority = very high"
    acceptance_stance: str
    tone_guidelines: str
    behavior_instructions: str
    prompt_guidelines: str
    concession_step_pct: float # Percentage concession step per turn in rule simulation (e.g. 0.07, 0.025, 0.012)


# Backwards compatibility alias
ModeStrategyConfig = PersonalityStrategyConfig


PERSONALITY_STRATEGIES: Dict[str, PersonalityStrategyConfig] = {
    "collaborative": PersonalityStrategyConfig(
        personality="collaborative",
        label="Collaborative",
        cooperation="high",
        concession_rate="moderate",
        concession_curve="reciprocal",
        flexibility="high",
        pressure="low",
        risk_tolerance="moderate",
        priority="win_win_priority = high",
        acceptance_stance="Accept a reasonable mutually beneficial solution when important requirements are satisfied and bilateral convergence is achieved.",
        tone_guidelines="Cooperative, constructive, solution-oriented. Acknowledge the other side's priorities, suggest creative trade-offs, and express willingness to find common ground.",
        behavior_instructions="""- Actively look for common ground and understand the other participant's priorities.
- Suggest alternative solutions and multi-issue package trade-offs (e.g., price vs. payment terms/volume; salary vs. remote days/signing bonus).
- Make reasonable, calibrated concessions (5-8%) across rounds; gradually move toward a mutually acceptable middle ground.
- Reciprocate good-faith concessions: when the other side makes a concession, become more willing to concede in return.
- Preserve relationships and avoid unnecessary confrontation while strictly protecting hard constraints.""",
        prompt_guidelines="Collaborative: Proactively search for win-win solutions, propose multidimensional trade-offs, make moderate reciprocal concessions, and pursue mutual agreement while protecting reservation boundaries.",
        concession_step_pct=0.07,
    ),
    "risk_averse": PersonalityStrategyConfig(
        personality="risk_averse",
        label="Risk-Averse",
        cooperation="moderate",
        concession_rate="low",
        concession_curve="decaying_small",
        flexibility="low/moderate",
        pressure="low",
        risk_tolerance="very low",
        priority="constraint_protection = very high",
        acceptance_stance="Requires strong confidence and verification that agreement satisfies constraints plus a safety margin. Never accept based on verbal pressure or unverified promises.",
        tone_guidelines="Cautious, precise, condition-focused. Frame counterproposals around risk mitigation, contractual certainty, and strict adherence to established requirements.",
        behavior_instructions="""- Prioritize protecting interests, hard constraints, and minimum acceptable conditions.
- Maintain a safety buffer from absolute reservation limits (never cut to the absolute floor/ceiling immediately).
- Make small, controlled concessions (2-3%), becoming increasingly reluctant to concede as approaching reservation boundaries.
- Require stronger justification and protective conditions (milestone sign-offs, SLA guarantees, advance deposits) before unfavorable terms.
- Scrutinize proposals carefully; verify all terms rather than accepting ambiguous or hasty statements.""",
        prompt_guidelines="Risk-Averse: Guard reservation boundaries strictly, maintain a safety buffer, concede cautiously in small increments, demand risk mitigations, and refuse risky or unverified commitments.",
        concession_step_pct=0.025,
    ),
    "aggressive": PersonalityStrategyConfig(
        personality="aggressive",
        label="Aggressive",
        cooperation="low/moderate",
        concession_rate="minimal",
        concession_curve="minimal_anchored",
        flexibility="low",
        pressure="high",
        risk_tolerance="moderate/high",
        priority="objective_priority = very high",
        acceptance_stance="Requires a strong outcome close to preferred target unless a compelling strategic compromise or substantial counter-concession justifies it.",
        tone_guidelines="Firm, confident, direct. Assert your value proposition and push the other party toward your target while remaining strictly professional, respectful, and within negotiation rules.",
        behavior_instructions="""- Start from a strong anchor position favorable to your objectives and defend it vigorously.
- Push the counterparty toward your target terms using commercial leverage and firm counteroffers.
- Make limited, minimal concessions (1-2%); delay concessions across rounds to test counterparty resolve.
- Challenge unfavorable proposals directly; do not immediately move halfway toward the other side.
- Concede only when there is a clear strategic reason or significant reciprocal concession from the other party.""",
        prompt_guidelines="Aggressive: Anchor assertively, maximize primary objective gains, concede reluctantly in minimal steps, apply tactical pressure, and test the counterparty's limits.",
        concession_step_pct=0.012,
    ),
}

MODE_STRATEGIES = PERSONALITY_STRATEGIES


def get_personality_strategy(personality_name: Optional[str]) -> PersonalityStrategyConfig:
    """Resolves personality strategy config from personality string, supporting aliases."""
    if not personality_name:
        return PERSONALITY_STRATEGIES["collaborative"]

    norm = personality_name.lower().strip().replace("-", "_")

    if norm in PERSONALITY_STRATEGIES:
        return PERSONALITY_STRATEGIES[norm]

    if any(k in norm for k in ["risk", "averse", "conservative", "cautious"]):
        return PERSONALITY_STRATEGIES["risk_averse"]
    elif any(k in norm for k in ["aggress", "assertive", "hardball", "tough"]):
        return PERSONALITY_STRATEGIES["aggressive"]
    else:
        return PERSONALITY_STRATEGIES["collaborative"]


def get_mode_strategy(mode_name: Optional[str]) -> PersonalityStrategyConfig:
    """Backwards-compatible wrapper delegating to get_personality_strategy."""
    return get_personality_strategy(mode_name)
