"""
protocol.py
Communication schema for agent turn outputs in the Negotiation Simulator.
"""

from dataclasses import dataclass
from typing import Dict, Any, Optional

@dataclass
class AgentTurnResponse:
    action: str              # "ACCEPT", "COUNTER", or "REJECT"
    strategic_reasoning: str # Internal chain-of-thought (for UI debugging/analytics)
    public_message: str      # Dialogue text spoken in the chat window
    proposed_terms: Dict[str, Any]  # Key-value terms (e.g., {"price": 95000, "term_months": 12})
    concession_made: bool    # True if agent reduced demands compared to last turn

# Example JSON structure expected from LLM calls:
EXPECTED_LLM_OUTPUT_FORMAT = {
    "action": "COUNTER",
    "strategic_reasoning": "The buyer's offer of $85,000 is below our reservation point. I will counter at $105,000 while offering flexible payment terms to maintain collaborative goodwill.",
    "public_message": "We appreciate your offer of $85,000. However, given our enterprise feature set, we can adjust our proposal to $105,000 if we structure this on net-60 terms.",
    "proposed_terms": {
        "price": 105000,
        "payment_terms": "net-60"
    },
    "concession_made": True
}