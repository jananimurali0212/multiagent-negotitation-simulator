import logging
from typing import List, Dict, Any, Tuple, Optional

logger = logging.getLogger("backend.rules.deadlock")


class DeadlockRules:
    """Programmatically evaluates deterministic deadlock conditions and termination triggers."""

    @classmethod
    def evaluate_deadlock(
        cls,
        scenario_id: str,
        latest_decision_action: str,
        current_round: int,
        max_rounds: int,
        previous_messages: List[Dict[str, Any]],
        zopa_info: Optional[Dict[str, Any]] = None,
    ) -> Tuple[bool, Optional[str]]:
        """Evaluates whether negotiation has reached an inescapable deadlock state."""
        # Case 1: Explicit agent deadlock declaration
        if latest_decision_action == "deadlock":
            return True, "Explicit deadlock declared by active agent."

        # Case 2: Maximum round limit reached
        if current_round >= max_rounds:
            return True, f"Safety round limit reached ({current_round}/{max_rounds} rounds)."

        # Case 3: Stagnation - repeated identical offers across 4 consecutive turns
        if len(previous_messages) >= 6:
            recent_offers = []
            for msg in reversed(previous_messages[-6:]):
                offer_data = msg.get("offer_data") if isinstance(msg, dict) else getattr(msg, "offer_data", None)
                if offer_data:
                    recent_offers.append(offer_data)

            if len(recent_offers) >= 4 and all(o == recent_offers[0] for o in recent_offers):
                return True, "Deadlock detected due to identical repeated offers across consecutive turns."

        # Case 4: No ZOPA exists after initial negotiation rounds (round >= 3)
        if zopa_info and zopa_info.get("status") == "no_zopa" and current_round >= 3:
            return True, "Deadlock detected due to irreconcilable hard boundary conflict (No ZOPA)."

        return False, None
