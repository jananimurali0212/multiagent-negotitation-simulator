import logging
from typing import Dict, Any, Optional, List
from app.schemas.agent import AgentConfigSchema
from app.negotiation.validation.validation_result import ValidationResult, ValidationErrorCategory
from app.negotiation.rules.offer_rules import OfferRules
from app.negotiation.rules.constraint_rules import ConstraintRules

logger = logging.getLogger("backend.rules.acceptance")


class AcceptanceRules:
    """Validates that acceptance actions satisfy offer existence, structural completeness, and hard agent constraints."""

    @classmethod
    def validate_acceptance(
        cls,
        agent: AgentConfigSchema,
        scenario_id: str,
        offer: Optional[Dict[str, Any]],
        previous_messages: List[Dict[str, Any]],
        status: str = "running",
    ) -> ValidationResult:
        """Programmatically evaluates whether an acceptance action is valid."""
        if status not in ["running", "waiting_for_human"]:
            return ValidationResult.invalid_result(
                error_code="SESSION_NOT_RUNNING",
                error_category=ValidationErrorCategory.INVALID_STATE_TRANSITION,
                human_safe_message="Negotiation session is no longer active.",
                internal_reason=f"Acceptance attempted on session with non-active status '{status}'.",
                rule_name="acceptance_active_status_rule",
            )

        # 1. Resolve offer terms to accept
        terms_to_accept = dict(offer or {})
        if not terms_to_accept and previous_messages:
            for msg in reversed(previous_messages):
                msg_offer = msg.get("offer_data") if isinstance(msg, dict) else getattr(msg, "offer_data", None)
                if msg_offer:
                    terms_to_accept = dict(msg_offer)
                    break
                content = msg.get("content") if isinstance(msg, dict) else getattr(msg, "content", "")
                if content:
                    from app.negotiation.state_tracker import NegotiationStateTracker
                    extracted = NegotiationStateTracker.extract_terms_from_text(scenario_id, content)
                    if extracted:
                        terms_to_accept = dict(extracted)
                        break

        if not terms_to_accept:
            return ValidationResult.invalid_result(
                error_code="ACCEPTANCE_NO_OFFER_FOUND",
                error_category=ValidationErrorCategory.ACCEPTANCE_INVALID,
                human_safe_message="Cannot accept because no proposal terms exist to accept.",
                internal_reason=f"Agent '{agent.name}' attempted 'accept' action, but no valid offer was found in decision or transcript history.",
                rule_name="acceptance_offer_exists_rule",
            )

        # 2. Structural validation of terms
        struct_res = OfferRules.validate_offer_structure(scenario_id, terms_to_accept, action="accept")
        if not struct_res.is_valid:
            return ValidationResult.invalid_result(
                error_code="ACCEPTANCE_INVALID_OFFER_STRUCTURE",
                error_category=ValidationErrorCategory.ACCEPTANCE_INVALID,
                human_safe_message="Accepted proposal terms are structurally incomplete.",
                internal_reason=f"Accepted terms {terms_to_accept} failed offer structure validation: {struct_res.internal_reason}",
                rule_name="acceptance_structure_rule",
            )

        # 3. Hard constraint validation of terms for accepting agent
        constraint_res = ConstraintRules.validate_agent_constraints(agent, scenario_id, terms_to_accept, action="accept")
        if not constraint_res.is_valid:
            return ValidationResult.invalid_result(
                error_code="ACCEPTANCE_VIOLATES_HARD_CONSTRAINT",
                error_category=ValidationErrorCategory.HARD_CONSTRAINT_VIOLATION,
                human_safe_message="Cannot accept proposal because terms violate your hard commercial constraints.",
                internal_reason=f"Agent '{agent.name}' attempted to accept terms {terms_to_accept} which violate hard constraints: {constraint_res.internal_reason}",
                rule_name="acceptance_hard_constraint_rule",
            )

        return ValidationResult.valid_result("acceptance_rule")
