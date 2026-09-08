import logging
from typing import Dict, Any, List, Tuple, Optional
from app.schemas.arena import AgentDecision
from app.negotiation.rules.deadlock_rules import DeadlockRules

logger = logging.getLogger("backend.decision_engine")


class DecisionEngine:
    @staticmethod
    def evaluate_agreement(
        scenario_id: str,
        latest_decision: AgentDecision,
        previous_messages: List[Any],
        safety_ceiling_reached: bool = False,
        current_round: int = 1,
        max_rounds: int = 20,
        zopa_info: Optional[Dict[str, Any]] = None,
    ) -> Tuple[bool, Optional[Dict[str, Any]], str]:
        """
        Evaluates whether an agreement or terminal state has been reached using Phase 3 rules.
        Returns (is_terminal, final_terms, outcome_status_string).
        """
        if latest_decision.action == "accept":
            final_terms = latest_decision.offer or {}
            if not final_terms and previous_messages:
                for msg in reversed(previous_messages):
                    msg_offer = msg.get("offer_data") if isinstance(msg, dict) else getattr(msg, "offer_data", None)
                    if msg_offer:
                        final_terms = msg_offer
                        break
            return True, final_terms, "Agreement Reached", None

        # Case 2 & 3 & 4: Evaluate Deadlock via DeadlockRules
        is_deadlock, reason = DeadlockRules.evaluate_deadlock(
            scenario_id=scenario_id,
            latest_decision_action=latest_decision.action,
            current_round=current_round,
            max_rounds=max_rounds,
            previous_messages=previous_messages,
            zopa_info=zopa_info,
        )

        if is_deadlock:
            logger.info(f"Deadlock condition triggered: {reason}")
            outcome = "Unresolved / Terminated" if safety_ceiling_reached else "Deadlock"
            return True, latest_decision.offer if safety_ceiling_reached else None, outcome, reason

        return False, None, "running", None
