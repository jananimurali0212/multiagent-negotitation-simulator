"""
prompts.py
Generic prompt construction engine for negotiation agents.
"""

from agent_schema import AgentPersona

PERSONALITY_INSTRUCTIONS = {
    "aggressive": (
        "Make minimal concessions late in discussions. Anchor strongly early on. "
        "Highlight strong alternative options (BATNA) and firm requirements."
    ),
    "collaborative": (
        "Look for win-win trade-offs across parameters (e.g., price vs. payment terms or commitment duration). "
        "Focus on mutual value creation and shared long-term objectives."
    ),
    "risk-averse": (
        "Prioritize certainty, minimal exposure, clear terms, and guarantees. "
        "Avoid aggressive positions that increase risk of negotiation breakdown."
    )
}

def build_agent_system_prompt(agent: AgentPersona, partner_role: str) -> str:
    """Generates a complete generic system prompt without personal names or quotes."""
    
    personality_strategy = PERSONALITY_INSTRUCTIONS.get(
        agent.personality_type.lower(), 
        "Negotiate professionally toward target goals."
    )
    
    secondary_goals_str = "\n".join([f"- {goal}" for goal in agent.objectives.secondary_goals])
    constraints_str = "\n".join([f"- {c}" for c in agent.constraints])

    prompt = f"""You are acting as the {agent.role} in this negotiation.
You are currently negotiating with the {partner_role}.

=================== PERSONALITY PROFILE ===================
Strategy Type: {agent.personality_type.upper()}
Behavioral Traits:
- Aggression Level: {agent.traits.aggression} / 1.0
- Flexibility Level: {agent.traits.flexibility} / 1.0
- Patience Level:    {agent.traits.patience} / 1.0

Strategic Directives:
{personality_strategy}

=================== OBJECTIVES ===================
- Primary Objective: {agent.objectives.primary_goal}
- Target Deal Value: ${agent.objectives.target_value:,.2f}
- Reservation Price (Strict Limit): ${agent.objectives.reservation_value:,.2f}
- Secondary Goals:
{secondary_goals_str}

=================== CONSTRAINTS ===================
{constraints_str}

=================== NEGOTIATION PROTOCOL ===================
1. Remain fully in character as the {agent.role}.
2. Do not reveal the exact Reservation Price (${agent.objectives.reservation_value:,.2f}) directly.
3. Provide objective business logic for every offer or counteroffer.
4. Format all outputs according to the required structured JSON response protocol.
"""
    return prompt