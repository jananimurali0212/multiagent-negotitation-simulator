import logging
import re
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

        # 5. Validate & Repair Message Content Against Configured Boundaries
        decision = cls._validate_and_repair_message_facts(state, active_agent, decision)

        NegotiationTelemetry.emit("decision_validated", state.session_id, active_agent.name, state.current_round, {
            "action": decision.action, "is_concession": concession_info.get("is_concession", False),
            "concession_pct": concession_info.get("normalized_percentage", 0.0),
        })

        return ValidationResult.valid_result("decision_validator"), decision, concession_info

    @classmethod
    def _validate_and_repair_message_facts(
        cls,
        state: NormalizedNegotiationState,
        agent: AgentConfigSchema,
        decision: AgentDecision,
    ) -> AgentDecision:
        """Validates that public message does not state unsupported factual numbers contradicting configured bounds."""
        if not decision.message:
            return decision

        msg = decision.message
        role_clean = agent.role.lower()

        # Job Offer scenario checks
        if state.scenario_id == "job-offer":
            extracted_numbers = [float(n.replace(",", "")) for n in re.findall(r"\$([0-9]{2,3}(?:,[0-9]{3})+|\b[0-9]{5,7}\b)", msg)]
            if any(w in role_clean for w in ["recruiter", "hr"]):
                max_s = ConstraintRules._extract_param_value(agent, ["maxsalary", "max_salary", "grade cap", "budget"])
                if max_s is not None:
                    # If recruiter message mentions a number higher than their approved maximum budget cap
                    for num in extracted_numbers:
                        if num > max_s * 1.05:
                            logger.warning(f"[FACT_REPAIR] Repaired recruiter message mentioning unsupported salary ${num:,.0f} > cap ${max_s:,.0f}")
                            repaired_msg = re.sub(
                                r"\$([0-9]{2,3}(?:,[0-9]{3})+|\b[0-9]{5,7}\b)",
                                f"${max_s:,.0f}",
                                msg
                            )
                            return decision.model_copy(update={"message": repaired_msg})
            elif any(w in role_clean for w in ["candidate", "developer", "engineer"]):
                min_s = ConstraintRules._extract_param_value(agent, ["minsalary", "min_salary", "competing offer", "floor"])
                if min_s is not None:
                    # If candidate message offers to accept a number lower than their hard minimum floor
                    for num in extracted_numbers:
                        if num < min_s * 0.95 and decision.action == "accept":
                            logger.warning(f"[FACT_REPAIR] Repaired candidate message mentioning salary below floor ${num:,.0f} < floor ${min_s:,.0f}")
                            repaired_msg = re.sub(
                                r"\$([0-9]{2,3}(?:,[0-9]{3})+|\b[0-9]{5,7}\b)",
                                f"${min_s:,.0f}",
                                msg
                            )
                            return decision.model_copy(update={"message": repaired_msg})

        return decision

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

        # Case B: Constraint floor/ceiling violation -> Clamp numeric value to configured boundary limit
        if failed_res.error_category == ValidationErrorCategory.HARD_CONSTRAINT_VIOLATION and decision.offer:
            repaired_offer = dict(decision.offer)
            
            if state.scenario_id == "vendor-pricing":
                if any(w in role_clean for w in ["sales", "vendor", "seller"]):
                    min_p = ConstraintRules._extract_param_value(agent, ["minprice", "min_price", "targetprice", "target_price"])
                    if min_p is not None:
                        repaired_offer["price"] = f"${min_p:.0f}/user/month"
                else:
                    max_b = ConstraintRules._extract_param_value(agent, ["maxbudget", "max_budget", "targetprice", "target_price"])
                    if max_b is not None:
                        monthly_cap = max_b / (150 * 12) if max_b > 1000 else max_b
                        repaired_offer["price"] = f"${monthly_cap:.0f}/user/month"

            elif state.scenario_id == "job-offer":
                if any(w in role_clean for w in ["recruiter", "hr"]):
                    max_s = ConstraintRules._extract_param_value(agent, ["maxsalary", "max_salary", "targetsalary", "target_salary"])
                    if max_s is not None:
                        repaired_offer["salary"] = f"${max_s:,.0f}"
                else:
                    min_s = ConstraintRules._extract_param_value(agent, ["minsalary", "min_salary", "targetsalary", "target_salary"])
                    if min_s is not None:
                        repaired_offer["salary"] = f"${min_s:,.0f}"

            repaired = AgentDecision(
                action="counteroffer",
                message=decision.message,
                rationale_summary="Adjusted offer numbers to respect hard commercial boundary limits.",
                offer=repaired_offer,
                concession_percentage=0.0,
                confidence_score=0.9,
            )
            repaired = cls._validate_and_repair_message_facts(state, agent, repaired)
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
            repaired = cls._validate_and_repair_message_facts(state, agent, repaired)
            return True, repaired

        return False, decision

    @classmethod
    def _generate_default_agent_offer(cls, scenario_id: str, agent: AgentConfigSchema) -> Dict[str, Any]:
        """Generates baseline default offer derived strictly from configured agent parameters."""
        params = agent.negotiation_parameters or {}
        if scenario_id == "vendor-pricing":
            offer: Dict[str, Any] = {}
            p = params.get("targetPrice") or params.get("minPrice") or params.get("maxBudget")
            if p:
                offer["price"] = str(p)
            if "paymentTerms" in params:
                offer["paymentTerms"] = str(params["paymentTerms"])
            return offer
        elif scenario_id == "job-offer":
            offer = {}
            s = params.get("targetSalary") or params.get("minSalary") or params.get("maxSalary")
            if s:
                offer["salary"] = str(s)
            if "equity" in params or "stockOptions" in params:
                offer["equity"] = str(params.get("equity") or params.get("stockOptions"))
            if "remoteDays" in params or "workArrangement" in params:
                offer["remoteDays"] = str(params.get("remoteDays") or params.get("workArrangement"))
            return offer
        else:
            offer = {}
            alloc = params.get("targetAllocation") or params.get("minAllocation") or params.get("maxAllocation")
            if alloc:
                offer["allocation"] = str(alloc)
            return offer
