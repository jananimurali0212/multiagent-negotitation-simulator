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

        # Case 3: Stagnation - repeated identical offers or unyielding positions across consecutive turns
        if len(previous_messages) >= 4:
            recent_offers = []
            for msg in previous_messages:
                offer_data = msg.get("offer_data") if isinstance(msg, dict) else getattr(msg, "offer_data", None)
                if offer_data:
                    sender = msg.get("sender") if isinstance(msg, dict) else getattr(msg, "sender", None)
                    recent_offers.append({"sender": sender, "offer": offer_data})

            if len(recent_offers) >= 4:
                last_4 = [item["offer"] for item in recent_offers[-4:]]
                # 1) All 4 consecutive offers identical
                if all(o == last_4[0] for o in last_4):
                    return True, "Deadlock detected due to identical repeated offers across consecutive turns."
                # 2) Alternating unyielding ping-pong without concession (A, B, A, B)
                if last_4[0] == last_4[2] and last_4[1] == last_4[3] and last_4[0] != last_4[1]:
                    return True, "Deadlock detected due to alternating unyielding positions without concession."

        # Case 4: No ZOPA exists after initial negotiation rounds (round >= 3)
        if zopa_info and zopa_info.get("status") == "no_zopa" and current_round >= 3:
            return True, "Deadlock detected due to irreconcilable hard boundary conflict (No ZOPA)."

        return False, None
