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
            from app.negotiation.state_tracker import NegotiationStateTracker
            from app.reports.report_generator import ReportGenerator

            # 1. Verification of mutual dialogue: cannot agree with fewer than 2 previous messages
            if not previous_messages or len(previous_messages) < 2:
                logger.info(f"Acceptance rejected: Insufficient conversation history ({len(previous_messages) if previous_messages else 0} messages) for mutual agreement.")
                return False, None, "running", None

            # 2. Multi-round exchange requirement: Round 1 must never be final round for agreement
            if current_round is not None and current_round < 2:
                logger.info(f"Acceptance rejected: Round {current_round} cannot conclude agreement; multi-round exchange required.")
                return False, None, "running", None

            # 2. Check latest decision message for conditional / non-committal markers
            msg_text = (latest_decision.message or "").strip().lower()
            intent = NegotiationStateTracker.detect_intent(msg_text)
            if intent.get("is_counteroffer") or not intent.get("is_acceptance"):
                # If message contains conditional or counteroffer language, treat as running
                logger.info(f"Acceptance rejected: Message text conveys counteroffer/conditional intent: '{latest_decision.message[:60]}'")
                return False, None, "running", None

            # 3. Locate counterparty's prior offer in transcript
            counterparty_offer: Dict[str, Any] = {}
            for msg in reversed(previous_messages):
                msg_offer = msg.get("offer_data") if isinstance(msg, dict) else getattr(msg, "offer_data", None)
                if msg_offer and any(v for v in msg_offer.values()):
                    counterparty_offer = dict(msg_offer)
                    break
                content = msg.get("content") if isinstance(msg, dict) else getattr(msg, "content", "")
                if content:
                    extracted = NegotiationStateTracker.extract_terms_from_text(scenario_id, content)
                    if extracted:
                        counterparty_offer = dict(extracted)
                        break

            if not counterparty_offer:
                logger.info("Acceptance rejected: No prior counterparty offer found to accept.")
                return False, None, "running", None

            # 4. Resolve accepted terms: current decision offer or accepted counterparty offer
            accepted_offer = dict(latest_decision.offer or {})
            if not accepted_offer:
                accepted_offer = dict(counterparty_offer)

            # 5. Validate compatibility on core mandatory dimensions
            # For vendor pricing: price must match within 1% or be identical
            if "vendor" in scenario_id or "pricing" in scenario_id:
                cp_price = NegotiationStateTracker.parse_numeric(str(counterparty_offer.get("price") or ""))
                my_price = NegotiationStateTracker.parse_numeric(str(accepted_offer.get("price") or ""))
                if cp_price is not None and my_price is not None:
                    # If the accepting party is proposing a substantially different price, it's a counteroffer!
                    if abs(cp_price - my_price) > max(1.0, cp_price * 0.01):
                        logger.info(f"Acceptance rejected: Price mismatch (counterparty={cp_price}, accepted={my_price}).")
                        return False, None, "running", None

            # For job offer: salary must match
            elif "job" in scenario_id or "offer" in scenario_id or "salary" in scenario_id:
                cp_sal = NegotiationStateTracker.parse_numeric(str(counterparty_offer.get("salary") or ""))
                my_sal = NegotiationStateTracker.parse_numeric(str(accepted_offer.get("salary") or ""))
                if cp_sal is not None and my_sal is not None:
                    if abs(cp_sal - my_sal) > max(10.0, cp_sal * 0.01):
                        logger.info(f"Acceptance rejected: Salary mismatch (counterparty={cp_sal}, accepted={my_sal}).")
                        return False, None, "running", None

            # For budget allocation: total_budget or allocations must match
            elif "budget" in scenario_id or "allocation" in scenario_id:
                cp_b = NegotiationStateTracker.parse_numeric(str(counterparty_offer.get("total_budget") or ""))
                my_b = NegotiationStateTracker.parse_numeric(str(accepted_offer.get("total_budget") or ""))
                if cp_b is not None and my_b is not None:
                    if abs(cp_b - my_b) > max(100.0, cp_b * 0.01):
                        logger.info(f"Acceptance rejected: Budget mismatch (counterparty={cp_b}, accepted={my_b}).")
                        return False, None, "running", None

            # 6. Reconcile final agreed terms combining both parties' agreed dimensions
            final_terms = dict(counterparty_offer)
            for k, v in accepted_offer.items():
                final_terms[k] = v

            for msg in reversed(previous_messages):
                msg_offer = msg.get("offer_data") if isinstance(msg, dict) else getattr(msg, "offer_data", None)
                if msg_offer:
                    for k, v in msg_offer.items():
                        if k not in final_terms:
                            final_terms[k] = v
                content = msg.get("content") if isinstance(msg, dict) else getattr(msg, "content", "")
                if content:
                    extracted = NegotiationStateTracker.extract_terms_from_text(scenario_id, content)
                    for k, v in extracted.items():
                        if k not in final_terms:
                            final_terms[k] = v

            if latest_decision.message:
                extracted = NegotiationStateTracker.extract_terms_from_text(scenario_id, latest_decision.message)
                for k, v in extracted.items():
                    if k not in final_terms:
                        final_terms[k] = v

            logger.info(f"Mutual agreement verified on terms: {final_terms}")
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
