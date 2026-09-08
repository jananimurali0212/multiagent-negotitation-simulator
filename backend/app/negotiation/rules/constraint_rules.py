import re
import logging
from typing import Dict, Any, Optional, List
from app.schemas.agent import AgentConfigSchema
from app.negotiation.validation.validation_result import ValidationResult, ValidationErrorCategory
from app.negotiation.rules.offer_rules import OfferRules

logger = logging.getLogger("backend.rules.constraints")


class ConstraintRules:
    """Programmatically evaluates proposed offers against configured hard agent constraints and targets."""

    @classmethod
    def validate_agent_constraints(
        cls,
        agent: AgentConfigSchema,
        scenario_id: str,
        offer: Optional[Dict[str, Any]],
        action: str = "offer",
    ) -> ValidationResult:
        """Validates that proposed action & offer strictly respect active agent's hard constraints."""
        # Reject/deadlock actions do not violate financial constraints
        if action in ["reject", "deadlock"] or not offer:
            return ValidationResult.valid_result("hard_constraint_rule")

        # 1. Vendor Pricing Scenario Validation
        if scenario_id == "vendor-pricing":
            return cls._validate_vendor_pricing(agent, offer, action)

        # 2. Job Salary Scenario Validation
        elif scenario_id == "job-offer":
            return cls._validate_job_offer(agent, offer, action)

        # 3. Budget Allocation Scenario Validation
        elif scenario_id == "budget-allocation":
            return cls._validate_budget_allocation(agent, offer, action)

        return ValidationResult.valid_result("hard_constraint_rule")

    @classmethod
    def _validate_vendor_pricing(cls, agent: AgentConfigSchema, offer: Dict[str, Any], action: str) -> ValidationResult:
        proposed_price = OfferRules.parse_numeric_value(offer.get("price"))
        if proposed_price is None:
            return ValidationResult.valid_result("hard_constraint_rule")

        role_clean = agent.role.lower()

        # Vendor/Seller Side: Must not offer or accept below minimum price floor
        if any(w in role_clean for w in ["sales", "vendor", "seller"]):
            min_price = cls._extract_param_value(agent, ["minprice", "min_price", "minimum price", "price floor"])
            if min_price is not None and proposed_price < min_price:
                return ValidationResult.invalid_result(
                    error_code="PRICE_BELOW_MINIMUM_FLOOR",
                    error_category=ValidationErrorCategory.HARD_CONSTRAINT_VIOLATION,
                    human_safe_message="Proposed price is below vendor minimum commercial threshold.",
                    internal_reason=f"Vendor agent '{agent.name}' proposed/accepted price ${proposed_price} which is below min floor ${min_price}.",
                    rule_name="vendor_min_price_floor_rule",
                )

        # Buyer Side: Must not offer or accept above maximum budget cap
        elif any(w in role_clean for w in ["procurement", "buyer", "purchasing"]):
            max_budget = cls._extract_param_value(agent, ["maxbudget", "max_budget", "budget cap", "maximum budget"])
            raw_str = cls._extract_param_raw_str(agent, ["maxbudget", "max_budget", "budget cap", "maximum budget"])
            if max_budget is not None:
                eff_budget = max_budget
                if (raw_str and any(y in raw_str.lower() for y in ["/ year", "/yr", "per year", "annual", "/year"])) or (max_budget > 1000 and proposed_price < 500):
                    eff_budget = round(max_budget / (150 * 12), 2)

                if proposed_price > eff_budget:
                    return ValidationResult.invalid_result(
                        error_code="PRICE_EXCEEDS_BUDGET_CAP",
                        error_category=ValidationErrorCategory.HARD_CONSTRAINT_VIOLATION,
                        human_safe_message="Proposed price exceeds buyer budget ceiling.",
                        internal_reason=f"Buyer agent '{agent.name}' proposed/accepted price {proposed_price} exceeding max budget cap {eff_budget}.",
                        rule_name="buyer_max_budget_cap_rule",
                    )

        return ValidationResult.valid_result("hard_constraint_rule")

    @classmethod
    def _validate_job_offer(cls, agent: AgentConfigSchema, offer: Dict[str, Any], action: str) -> ValidationResult:
        proposed_salary = OfferRules.parse_numeric_value(offer.get("salary"))
        if proposed_salary is None:
            return ValidationResult.valid_result("hard_constraint_rule")

        role_clean = agent.role.lower()

        # Recruiter / HR: Salary must not exceed internal grade cap
        if any(w in role_clean for w in ["recruiter", "hr", "hiring"]):
            grade_cap = cls._extract_param_value(agent, ["maxsalary", "max_salary", "grade cap", "grade_cap", "ceiling"])
            if grade_cap is not None and proposed_salary > grade_cap:
                return ValidationResult.invalid_result(
                    error_code="SALARY_EXCEEDS_GRADE_CAP",
                    error_category=ValidationErrorCategory.HARD_CONSTRAINT_VIOLATION,
                    human_safe_message="Salary proposal exceeds maximum approved role grade ceiling.",
                    internal_reason=f"Recruiter agent '{agent.name}' proposed salary {proposed_salary:,} exceeding grade cap {grade_cap:,}.",
                    rule_name="recruiter_grade_cap_rule",
                )

        # Candidate / Developer: Salary must satisfy minimum compensation floor
        elif any(w in role_clean for w in ["candidate", "developer", "engineer"]):
            min_salary = cls._extract_param_value(agent, ["minsalary", "min_salary", "competing offer", "competing_offer", "floor"])
            if min_salary is not None and proposed_salary < min_salary:
                return ValidationResult.invalid_result(
                    error_code="SALARY_BELOW_CANDIDATE_FLOOR",
                    error_category=ValidationErrorCategory.HARD_CONSTRAINT_VIOLATION,
                    human_safe_message="Salary offer is below candidate minimum floor expectation.",
                    internal_reason=f"Candidate agent '{agent.name}' proposed/accepted salary {proposed_salary:,} below min floor {min_salary:,}.",
                    rule_name="candidate_salary_floor_rule",
                )

        return ValidationResult.valid_result("hard_constraint_rule")

    @classmethod
    def _validate_budget_allocation(cls, agent: AgentConfigSchema, offer: Dict[str, Any], action: str) -> ValidationResult:
        total_proposed = 0.0
        # If explicit totalBudget or budget is in offer
        if "totalBudget" in offer or "budget" in offer or "total" in offer:
            total_proposed = OfferRules.parse_numeric_value(offer.get("totalBudget") or offer.get("budget") or offer.get("total")) or 0.0
        else:
            for k, v in offer.items():
                parsed = OfferRules.parse_numeric_value(v)
                if parsed is not None:
                    total_proposed += parsed

        eng = OfferRules.parse_numeric_value(offer.get("engineeringAllocation") or offer.get("engineering") or offer.get("engineering_budget") or offer.get("pm")) or 0.0
        mkt = OfferRules.parse_numeric_value(offer.get("marketingAllocation") or offer.get("marketing") or offer.get("marketing_budget") or offer.get("cmo")) or 0.0

        role_clean = agent.role.lower()

        # Finance Director / CFO: Total pool must not exceed configured total pool ceiling
        if any(w in role_clean for w in ["finance", "cfo"]):
            max_pool = cls._extract_param_value(agent, ["totalpool", "total_pool", "totalbudget", "total_budget", "maxallocation", "max_allocation", "ceiling"])
            if max_pool is not None and total_proposed > max_pool:
                return ValidationResult.invalid_result(
                    error_code="BUDGET_POOL_EXCEEDED",
                    error_category=ValidationErrorCategory.HARD_CONSTRAINT_VIOLATION,
                    human_safe_message=f"Total allocation proposal exceeds budget ceiling of {max_pool:,.2f}.",
                    internal_reason=f"Finance agent '{agent.name}' proposed total pool allocation {total_proposed:,.2f} exceeding ceiling {max_pool:,.2f}.",
                    rule_name="finance_total_pool_ceiling_rule",
                )

        # Department Head / Engineering: Department allocation must meet minimum floor
        elif any(w in role_clean for w in ["engineering", "pm"]):
            min_eng = cls._extract_param_value(agent, ["minallocation", "min_allocation", "floor"])
            if min_eng is not None and eng > 0 and eng < min_eng:
                return ValidationResult.invalid_result(
                    error_code="ENGINEERING_ALLOCATION_BELOW_FLOOR",
                    error_category=ValidationErrorCategory.HARD_CONSTRAINT_VIOLATION,
                    human_safe_message="Engineering budget allocation is below minimum viable threshold.",
                    internal_reason=f"Engineering agent '{agent.name}' proposed engineering allocation ${eng:,.2f} below min floor ${min_eng:,.2f}.",
                    rule_name="engineering_min_allocation_rule",
                )

        elif any(w in role_clean for w in ["marketing", "cmo"]):
            min_mkt = cls._extract_param_value(agent, ["minallocation", "min_allocation", "floor"])
            if min_mkt is not None and mkt > 0 and mkt < min_mkt:
                return ValidationResult.invalid_result(
                    error_code="MARKETING_ALLOCATION_BELOW_FLOOR",
                    error_category=ValidationErrorCategory.HARD_CONSTRAINT_VIOLATION,
                    human_safe_message="Marketing budget allocation is below minimum campaign commit floor.",
                    internal_reason=f"Marketing agent '{agent.name}' proposed marketing allocation ${mkt:,.2f} below min floor ${min_mkt:,.2f}.",
                    rule_name="marketing_min_allocation_rule",
                )

        return ValidationResult.valid_result("hard_constraint_rule")

    @classmethod
    def _extract_param_value(cls, agent: AgentConfigSchema, keywords: List[str]) -> Optional[float]:
        """Extracts numeric boundary value from negotiation_parameters or constraints list."""
        params = agent.negotiation_parameters or {}
        for k, v in params.items():
            k_lower = str(k).lower().strip()
            if any(kw in k_lower for kw in keywords):
                parsed = OfferRules.parse_numeric_value(v)
                if parsed is not None:
                    return parsed

        for c in agent.constraints:
            lbl_lower = c.label.lower().strip()
            if any(kw in lbl_lower for kw in keywords):
                parsed = OfferRules.parse_numeric_value(c.value)
                if parsed is not None:
                    return parsed

        return None

    @classmethod
    def _extract_param_raw_str(cls, agent: AgentConfigSchema, keywords: List[str]) -> Optional[str]:
        """Extracts raw string value from negotiation_parameters or constraints list."""
        params = agent.negotiation_parameters or {}
        for k, v in params.items():
            k_lower = str(k).lower().strip()
            if any(kw in k_lower for kw in keywords):
                return str(v)

        for c in agent.constraints:
            lbl_lower = c.label.lower().strip()
            if any(kw in lbl_lower for kw in keywords):
                return str(c.value)

        return None
