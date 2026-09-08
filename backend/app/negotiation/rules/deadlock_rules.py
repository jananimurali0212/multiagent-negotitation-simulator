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
        """Evaluates whether negotiation has reached an inescapable deadlock state across all 5 conditions."""
        # Condition 1: Explicit agent deadlock declaration
        if latest_decision_action == "deadlock":
            return True, "Explicit deadlock declared by active negotiator."

        # Condition 2: Constraint Conflict & Mathematically Impossible Terms (Negative ZOPA)
        if zopa_info and not zopa_info.get("zopa_exists") and zopa_info.get("status") == "no_zopa" and len(previous_messages) >= 2:
            lower = zopa_info.get("lower_bound")
            upper = zopa_info.get("upper_bound")
            return True, f"Deadlock detected: Irreconcilable constraint conflict. Hard boundary floor ({lower}) exceeds ceiling cap ({upper}) — no feasible ZOPA exists (No ZOPA)."

        # Condition 3: Maximum round limit reached
        if current_round >= max_rounds:
            return True, f"Deadlock detected: Safety round limit reached — maximum negotiation round limit reached ({current_round}/{max_rounds} rounds) without agreement."

        # Condition 4: No Movement / Stagnation across consecutive rounds
        if len(previous_messages) >= 3:
            recent_offers = []
            for msg in reversed(previous_messages):
                offer_data = msg.get("offer_data") if isinstance(msg, dict) else getattr(msg, "offer_data", None)
                if offer_data:
                    recent_offers.append(offer_data)
                if len(recent_offers) >= 4:
                    break

            if len(recent_offers) >= 3:
                # All identical offers
                if all(o == recent_offers[0] for o in recent_offers):
                    return True, "Deadlock detected: No concession movement across consecutive negotiation rounds (stagnation with identical repeated offers)."
            if len(recent_offers) >= 4:
                # Alternating identical offers (A: X, B: Y, A: X, B: Y)
                if recent_offers[0] == recent_offers[2] and recent_offers[1] == recent_offers[3]:
                    return True, "Deadlock detected: Repeated oscillating offers between parties with zero concession movement (stagnation with identical repeated offers)."

        # Condition 5: Repeated Rejections without concession / No Feasible Terms
        if len(previous_messages) >= 3:
            recent_rejections = 0
            for msg in reversed(previous_messages[:5]):
                content = str(msg.get("content") if isinstance(msg, dict) else getattr(msg, "content", "")).lower()
                if any(w in content for w in ["reject", "cannot accept", "can't accept", "unacceptable", "walk away", "no deal", "impossible to accept"]):
                    recent_rejections += 1
            if recent_rejections >= 2 and latest_decision_action in ["reject", "deadlock"]:
                return True, "Deadlock detected: Repeated proposal rejections without reciprocal concession."

        # Condition 6: No Feasible Terms
        if zopa_info and zopa_info.get("status") == "no_zopa" and current_round >= 2:
            return True, "Deadlock detected: No ZOPA — no feasible terms satisfy all counterparty constraints."

        return False, None
