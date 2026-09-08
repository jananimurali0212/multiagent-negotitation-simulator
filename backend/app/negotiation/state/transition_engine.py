import logging
from typing import Dict, Any, Optional
from app.schemas.arena import AgentDecision
from app.negotiation.models.negotiation_state import NormalizedNegotiationState
from app.negotiation.validation.validation_result import ValidationResult, ValidationErrorCategory
from app.negotiation.state.state_machine import StateMachine

logger = logging.getLogger("backend.state.transition")


class StateTransitionEngine:
    """Controls deterministic state transitions and prevents unauthorized direct state mutations."""

    @classmethod
    def apply_decision(
        cls,
        state: NormalizedNegotiationState,
        decision: AgentDecision,
        validation_result: ValidationResult,
        concession_info: Optional[Dict[str, Any]] = None,
    ) -> NormalizedNegotiationState:
        """Applies a validated AgentDecision to the NormalizedNegotiationState."""
        # 1. Reject invalid decision execution
        if not validation_result.is_valid:
            logger.warning(f"StateTransitionEngine blocked invalid decision: {validation_result.internal_reason}")
            state.record_telemetry(
                "decision_rejected",
                {
                    "error_code": validation_result.error_code,
                    "error_category": str(validation_result.error_category),
                    "reason": validation_result.internal_reason,
                },
            )
            return state

        active_agent = state.get_active_agent()
        sender_name = active_agent.name if active_agent else state.current_turn_speaker or "Agent"
        sender_role = active_agent.role if active_agent else "Participant"
        sender_avatar = active_agent.avatar if active_agent else "AG"

        # Determine target status
        target_status = state.status
        termination_reason = state.termination_reason

        if decision.action == "accept":
            from app.negotiation.decision_engine import DecisionEngine
            is_term, _, _, _ = DecisionEngine.evaluate_agreement(
                scenario_id=state.scenario_id,
                latest_decision=decision,
                previous_messages=state.messages,
                current_round=state.current_round,
                max_rounds=state.max_rounds,
            )
            if is_term:
                target_status = "finished"
                termination_reason = "Agreement Reached"
            else:
                target_status = state.status
                termination_reason = None
        elif decision.action == "deadlock":
            target_status = "deadlock"
            termination_reason = "Deadlock"

        # Verify state transition legality
        if not StateMachine.can_transition(state.status, target_status):
            logger.error(f"Illegal state transition blocked: {state.status} -> {target_status}")
            state.record_telemetry(
                "illegal_transition_blocked",
                {"from_status": state.status, "to_status": target_status},
            )
            return state

        # 2. Increment turn
        state.current_turn += 1

        # 3. Update Message History
        msg_payload = {
            "sender": sender_name,
            "role": sender_role,
            "avatar": sender_avatar,
            "content": decision.message,
            "rationale_summary": decision.rationale_summary,
            "offer_data": decision.offer or {},
            "round": state.current_round,
            "turn_index": len(state.messages),
            "is_user": False,
        }
        state.messages.append(msg_payload)

        # 4. Update Offer History & Current Offer
        if decision.offer:
            state.previous_offer = state.current_offer
            state.current_offer = decision.offer
            state.offer_history.append(
                {
                    "round": state.current_round,
                    "turn": state.current_turn,
                    "sender": sender_name,
                    "offer": decision.offer,
                }
            )

        # 5. Update Concession History
        if concession_info and concession_info.get("is_concession"):
            state.concession_history.append(
                {
                    "round": state.current_round,
                    "turn": state.current_turn,
                    "sender": sender_name,
                    "role": sender_role,
                    "concession_amount": concession_info.get("concession_amount", 0.0),
                    "percentage": concession_info.get("normalized_percentage", 0.0),
                }
            )

        # 6. Apply Terminal State Updates
        state.status = target_status
        state.termination_reason = termination_reason

        if target_status == "finished":
            state.accepted_terms = decision.offer or state.current_offer or {}
            state.record_telemetry("negotiation_finished", {"accepted_terms": state.accepted_terms})
        elif target_status == "deadlock":
            state.record_telemetry("deadlock_detected", {"reason": termination_reason})

        # 7. Advance Speaker Index & Round Math (if still running)
        if state.status == "running" and state.agents:
            next_speaker_idx = (state.current_speaker_index + 1) % len(state.agents)
            state.current_speaker_index = next_speaker_idx
            state.current_turn_speaker = state.agents[next_speaker_idx].name

            # If rotation completes a full cycle back to speaker 0, increment round
            if next_speaker_idx == 0:
                state.current_round += 1

        state.record_telemetry("state_transition_success", {"new_status": state.status, "round": state.current_round})
        return state
