import logging
from typing import Dict, Any, Tuple, Optional
from app.schemas.agent import AgentConfigSchema
from app.schemas.arena import AgentDecision
from app.negotiation.models.negotiation_state import NormalizedNegotiationState
from app.negotiation.validation.validation_result import ValidationResult, ValidationErrorCategory
from app.negotiation.rules.offer_rules import OfferRules
from app.negotiation.rules.constraint_rules import ConstraintRules
from app.negotiation.rules.acceptance_rules import AcceptanceRules
from app.negotiation.rules.concession_rules import ConcessionRules
from app.negotiation.telemetry import NegotiationTelemetry

logger = logging.getLogger("backend.validation.decision_validator")


class DecisionValidator:
    """Unified validation & decision repair engine for proposed agent negotiation decisions."""

    @classmethod
    def validate_decision(
        cls,
        state: NormalizedNegotiationState,
        decision: AgentDecision,
    ) -> Tuple[ValidationResult, AgentDecision, Dict[str, Any]]:
        """Validates decision structure, hard constraints, acceptance, and concession calculations."""
        active_agent = state.get_active_agent()
        if not active_agent:
            res = ValidationResult.invalid_result(
                error_code="NO_ACTIVE_AGENT",
                error_category=ValidationErrorCategory.INVALID_STATE_TRANSITION,
                human_safe_message="No active agent found for decision execution.",
                internal_reason=f"Current speaker index {state.current_speaker_index} out of bounds for agents list.",
            )
            return res, decision, {}

        # Normalize key aliases on decision offer
        if decision.offer and isinstance(decision.offer, dict):
            norm_offer = OfferRules.normalize_offer(decision.offer)
            if norm_offer != decision.offer:
                decision = decision.model_copy(update={"offer": norm_offer})

        # 1. Structural Validation
        struct_res = OfferRules.validate_offer_structure(state.scenario_id, decision.offer, action=decision.action)
        if not struct_res.is_valid:
            logger.warning(f"Decision structural error: {struct_res.internal_reason}")
            # Attempt safe correction if offer is missing key for 'offer'/'counteroffer'
            repaired, repaired_dec = cls._attempt_safe_correction(state, active_agent, decision, struct_res)
            if repaired:
                NegotiationTelemetry.emit("decision_repaired", state.session_id, active_agent.name, state.current_round, {"repair_type": "structure", "action": repaired_dec.action})
                concession_info = ConcessionRules.calculate_concession(
                    state.scenario_id, active_agent.role, state.current_offer, repaired_dec.offer, repaired_dec.concession_percentage
                )
                return ValidationResult.valid_result("safe_correction_structure"), repaired_dec, concession_info
            NegotiationTelemetry.emit("decision_rejected", state.session_id, active_agent.name, state.current_round, {"reason": "structure", "error_code": struct_res.error_code})
            return struct_res, decision, {}

        # 2. Hard Constraint Validation
        constraint_res = ConstraintRules.validate_agent_constraints(active_agent, state.scenario_id, decision.offer, action=decision.action)
        if not constraint_res.is_valid:
            logger.warning(f"Decision constraint violation: {constraint_res.internal_reason}")
            repaired, repaired_dec = cls._attempt_safe_correction(state, active_agent, decision, constraint_res)
            if repaired:
                NegotiationTelemetry.emit("decision_repaired", state.session_id, active_agent.name, state.current_round, {"repair_type": "constraint", "action": repaired_dec.action})
                concession_info = ConcessionRules.calculate_concession(
                    state.scenario_id, active_agent.role, state.current_offer, repaired_dec.offer, repaired_dec.concession_percentage
                )
                return ValidationResult.valid_result("safe_correction_constraint"), repaired_dec, concession_info
            NegotiationTelemetry.emit("decision_rejected", state.session_id, active_agent.name, state.current_round, {"reason": "constraint", "error_code": constraint_res.error_code})
            return constraint_res, decision, {}

        # 3. Acceptance Validation
        if decision.action == "accept":
            acc_res = AcceptanceRules.validate_acceptance(active_agent, state.scenario_id, decision.offer, state.messages, status=state.status)
            if not acc_res.is_valid:
                logger.warning(f"Decision acceptance violation: {acc_res.internal_reason}")
                repaired, repaired_dec = cls._attempt_safe_correction(state, active_agent, decision, acc_res)
                if repaired:
                    concession_info = ConcessionRules.calculate_concession(
                        state.scenario_id, active_agent.role, state.current_offer, repaired_dec.offer, repaired_dec.concession_percentage
                    )
                    return ValidationResult.valid_result("safe_correction_acceptance"), repaired_dec, concession_info
                return acc_res, decision, {}

        # 4. Calculate Concession & Discrepancy
        concession_info = ConcessionRules.calculate_concession(
            state.scenario_id, active_agent.role, state.current_offer, decision.offer, reported_percentage=decision.concession_percentage
        )
        decision.concession_percentage = concession_info["normalized_percentage"]

        NegotiationTelemetry.emit("decision_validated", state.session_id, active_agent.name, state.current_round, {
            "action": decision.action, "is_concession": concession_info.get("is_concession", False),
            "concession_pct": concession_info.get("normalized_percentage", 0.0),
        })

        return ValidationResult.valid_result("decision_validator"), decision, concession_info

    @classmethod
    def _attempt_safe_correction(
        cls,
        state: NormalizedNegotiationState,
        agent: AgentConfigSchema,
        decision: AgentDecision,
        failed_res: ValidationResult,
    ) -> Tuple[bool, AgentDecision]:
        """Attempts deterministic correction of a decision to preserve session flow."""
        role_clean = agent.role.lower()

        # Case A: Invalid Acceptance -> Convert to Counteroffer with agent's target or last offer
        if failed_res.error_category == ValidationErrorCategory.ACCEPTANCE_INVALID or failed_res.error_code == "ACCEPTANCE_VIOLATES_HARD_CONSTRAINT":
            fallback_offer = state.current_offer or cls._generate_default_agent_offer(state.scenario_id, agent)
            repaired = AgentDecision(
                action="counteroffer",
                message=f"I cannot accept those terms as proposed. I counter with a revised proposal.",
                rationale_summary="Adjusted invalid acceptance to counteroffer aligned with hard bounds.",
                offer=fallback_offer,
                concession_percentage=0.0,
                confidence_score=0.85,
            )
            return True, repaired

        # Case B: Constraint floor/ceiling violation -> Clamp numeric value to boundary limit
        if failed_res.error_category == ValidationErrorCategory.HARD_CONSTRAINT_VIOLATION and decision.offer:
            repaired_offer = dict(decision.offer)
            
            if state.scenario_id == "vendor-pricing":
                if any(w in role_clean for w in ["sales", "vendor", "seller"]):
                    min_p = ConstraintRules._extract_param_value(agent, ["minprice", "min_price"]) or 55.0
                    repaired_offer["price"] = f"${min_p:.0f}/user/month"
                else:
                    max_b = ConstraintRules._extract_param_value(agent, ["maxbudget", "max_budget"]) or 120000.0
                    monthly_cap = max_b / (150 * 12) if max_b > 1000 else max_b
                    repaired_offer["price"] = f"${monthly_cap:.0f}/user/month"

            elif state.scenario_id == "job-offer":
                if any(w in role_clean for w in ["recruiter", "hr"]):
                    max_s = ConstraintRules._extract_param_value(agent, ["maxsalary", "max_salary"]) or 170000.0
                    repaired_offer["salary"] = f"${max_s:,.0f}"
                else:
                    min_s = ConstraintRules._extract_param_value(agent, ["minsalary", "min_salary"]) or 165000.0
                    repaired_offer["salary"] = f"${min_s:,.0f}"

            repaired = AgentDecision(
                action="counteroffer",
                message=decision.message,
                rationale_summary="Adjusted offer numbers to respect hard commercial boundary limits.",
                offer=repaired_offer,
                concession_percentage=0.0,
                confidence_score=0.9,
            )
            return True, repaired

        # Case C: Missing required dimensions or structural key alias mismatch -> Inject normalized defaults
        if failed_res.error_category in [ValidationErrorCategory.MISSING_REQUIRED_TERM, ValidationErrorCategory.INVALID_OFFER] or failed_res.error_code in ["MISSING_REQUIRED_DIMENSION", "MISSING_OFFER_DATA"]:
            repaired_offer = OfferRules.normalize_offer(decision.offer or {}) or {}
            default_offer = cls._generate_default_agent_offer(state.scenario_id, agent)
            for req_key, req_val in default_offer.items():
                if req_key not in repaired_offer:
                    repaired_offer[req_key] = req_val

            repaired = AgentDecision(
                action=decision.action if decision.action in ["offer", "counteroffer", "accept"] else "counteroffer",
                message=decision.message or "I present our updated proposal.",
                rationale_summary="Repaired offer structure by attaching mandatory commercial dimensions.",
                offer=repaired_offer,
                concession_percentage=decision.concession_percentage or 0.0,
                confidence_score=decision.confidence_score or 0.85,
            )
            return True, repaired

        return False, decision

    @classmethod
    def _generate_default_agent_offer(cls, scenario_id: str, agent: AgentConfigSchema) -> Dict[str, Any]:
        """Generates baseline default offer based on agent target parameters."""
        params = agent.negotiation_parameters or {}
        if scenario_id == "vendor-pricing":
            return {"price": str(params.get("targetPrice", "$55/user/month")), "paymentTerms": "Net-30"}
        elif scenario_id == "job-offer":
            return {"salary": str(params.get("targetSalary", "$165,000"))}
        else:
            return {"engineeringAllocation": "$200,000", "marketingAllocation": "$160,000", "allocation": "$140,000"}
