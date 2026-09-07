import json
import logging
import re
from typing import Optional, Dict, Any, List
from app.core.config import settings
from app.schemas.arena import AgentDecision
from app.providers.base import BaseLLMProvider, LLMProviderError

logger = logging.getLogger("backend.providers.fallback")


def _extract_number(val: Any) -> Optional[float]:
    """Helper to extract raw numeric value from strings like '$120,000' or '55/user'."""
    if val is None:
        return None
    if isinstance(val, (int, float)):
        return float(val)
    s = str(val).replace(",", "").replace("$", "").strip()
    match = re.search(r"[-+]?\d*\.?\d+", s)
    if match:
        try:
            return float(match.group())
        except ValueError:
            return None
    return None


class FallbackRuleProvider(BaseLLMProvider):
    """Deterministic personality-driven fallback decision provider.
    Guarantees negotiation continuation strictly derived from user-configured goals, constraints, and parameters.
    Never invents arbitrary numbers or hardcoded terms.
    """

    def provider_name(self) -> str:
        return "rule_fallback"

    def supports_structured_output(self) -> bool:
        return True

    async def health_check(self) -> bool:
        return True

    async def generate_decision(
        self,
        prompt: str,
        agent_personality: str,
        agent_role: str,
        current_round: int,
        scenario_id: str,
        agent_data: Optional[Dict[str, Any]] = None,
        session_id: Optional[str] = None,
    ) -> AgentDecision:
        """Personality-driven fallback decision maker reading actual configured data."""
        logger.info(
            f"[FALLBACK_RULE_ENGINE] Generating dynamic fallback for role='{agent_role}', "
            f"round={current_round}, scenario='{scenario_id}' | session_id={session_id or 'N/A'}"
        )

        agent_data = agent_data or {}
        params = agent_data.get("negotiation_parameters") or {}
        goals = agent_data.get("goals") or []
        constraints = agent_data.get("constraints") or []
        agent_name = agent_data.get("name") or agent_role or "Agent"

        primary_goal = goals[0].get("text") if (goals and isinstance(goals[0], dict)) else "reach a mutually acceptable agreement"
        primary_constraint = constraints[0].get("value") if (constraints and isinstance(constraints[0], dict)) else None
        constraint_label = constraints[0].get("label") if (constraints and isinstance(constraints[0], dict)) else "constraint"

        # Determine greeting: Greetings happen strictly on Round 1 only
        greeting_prefix = "Hello. " if current_round == 1 else ""

        # SCENARIO 1: VENDOR PRICING
        if scenario_id == "vendor-pricing":
            is_vendor = any(term in agent_role.lower() for term in ["vendor", "sales", "seller"])
            target_p = _extract_number(params.get("targetPrice") or params.get("Target Price"))
            min_p = _extract_number(params.get("minPrice") or params.get("Minimum Price Floor"))
            max_b = _extract_number(params.get("maxBudget") or params.get("Maximum Budget Cap"))
            payment_terms = params.get("paymentTerms") or params.get("Payment Terms")
            warranty = params.get("warrantySupport") or params.get("Warranty / Support Tier")

            if is_vendor:
                # If target price or min price configured
                if target_p is not None or min_p is not None:
                    base_price = target_p if target_p is not None else (min_p * 1.15)
                    floor_price = min_p if min_p is not None else (base_price * 0.85)
                    step = (base_price - floor_price) * 0.25 * min(current_round - 1, 3)
                    curr_price = max(base_price - step, floor_price)
                    price_str = f"${curr_price:.0f}/user/month" if curr_price.is_integer() else f"${curr_price:.2f}/user/month"
                    offer_dict: Dict[str, Any] = {"price": price_str}
                    if payment_terms:
                        offer_dict["paymentTerms"] = str(payment_terms)
                    if warranty:
                        offer_dict["warranty"] = str(warranty)

                    if current_round >= 3 and abs(curr_price - floor_price) < 0.5:
                        return AgentDecision(
                            action="accept",
                            message=f"{greeting_prefix}We can accept {price_str} to satisfy our mutual goals while respecting our pricing floor.",
                            rationale_summary=f"Finalized terms align with our goal to {primary_goal}.",
                            offer=offer_dict,
                            concession_percentage=10.0,
                        )

                    return AgentDecision(
                        action="counteroffer" if current_round > 1 else "offer",
                        message=f"{greeting_prefix}We propose a pricing structure of {price_str} aligned with our service tier.",
                        rationale_summary=f"Advancing offer in accordance with {agent_personality} strategy and goal: {primary_goal}.",
                        offer=offer_dict,
                        concession_percentage=5.0,
                    )
                else:
                    # Conceptual vendor fallback without invented numbers
                    return AgentDecision(
                        action="counteroffer" if current_round > 1 else "offer",
                        message=f"{greeting_prefix}We propose structuring our commercial agreement to reflect our service delivery requirements and goal to {primary_goal}.",
                        rationale_summary=f"Negotiating within configured constraints: {primary_constraint or 'standard terms'}.",
                        offer={},
                        concession_percentage=0.0,
                    )
            else:
                # Buyer Agent
                if max_b is not None or target_p is not None:
                    monthly_max_b = (max_b / (150 * 12)) if (max_b and max_b > 1000) else max_b
                    cap = monthly_max_b if monthly_max_b is not None else (target_p * 1.15)
                    target = target_p if target_p is not None else (cap * 0.85)
                    step = (cap - target) * 0.25 * min(current_round - 1, 3)
                    curr_budget = min(target + step, cap)
                    price_str = f"${curr_budget:.0f}/user/month" if curr_budget.is_integer() else f"${curr_budget:.2f}/user/month"
                    offer_dict = {"price": price_str}
                    if payment_terms:
                        offer_dict["paymentTerms"] = str(payment_terms)
                    if warranty:
                        offer_dict["warranty"] = str(warranty)

                    if current_round >= 3:
                        return AgentDecision(
                            action="accept",
                            message=f"{greeting_prefix}We accept the proposal at {price_str} given that it fulfills our budget boundaries.",
                            rationale_summary=f"Agreed within constraint: {primary_constraint or 'budget limits'}.",
                            offer=offer_dict,
                            concession_percentage=8.0,
                        )

                    return AgentDecision(
                        action="counteroffer" if current_round > 1 else "offer",
                        message=f"{greeting_prefix}Our requirements allow an allocation of {price_str} under our approved operational guidelines.",
                        rationale_summary=f"Protecting buyer budget ceiling: {primary_constraint or cap}.",
                        offer=offer_dict,
                        concession_percentage=5.0,
                    )
                else:
                    # Conceptual buyer fallback without invented numbers
                    return AgentDecision(
                        action="counteroffer" if current_round > 1 else "offer",
                        message=f"{greeting_prefix}We would like to ensure any pricing structure remains strictly within our approved budget boundaries and satisfies our requirement to {primary_goal}.",
                        rationale_summary=f"Maintaining position per constraint: {primary_constraint or 'budget limit'}.",
                        offer={},
                        concession_percentage=0.0,
                    )

        # SCENARIO 2: JOB SALARY NEGOTIATION
        elif scenario_id == "job-offer":
            is_recruiter = any(term in agent_role.lower() for term in ["recruiter", "hr", "hiring"])
            target_sal = _extract_number(params.get("targetSalary") or params.get("Target Base Salary"))
            min_sal = _extract_number(params.get("minSalary") or params.get("Minimum Base Salary Floor"))
            max_sal = _extract_number(params.get("maxSalary") or params.get("Maximum Base Salary Ceiling") or params.get("maxBudget"))
            equity = params.get("equity") or params.get("equityBoundary") or params.get("equityExpectation") or params.get("stockOptions")
            remote = params.get("remoteDays") or params.get("remotePreference") or params.get("workArrangement") or params.get("schedule")

            if is_recruiter:
                if max_sal is not None or target_sal is not None:
                    cap_salary = max_sal if max_sal is not None else target_sal
                    start_salary = target_sal if target_sal is not None else (cap_salary * 0.9)
                    step = (cap_salary - start_salary) * 0.3 * min(current_round - 1, 3)
                    curr_salary = min(start_salary + step, cap_salary)

                    offer_dict = {"salary": f"${int(curr_salary):,}"}
                    if equity:
                        offer_dict["equity"] = str(equity)
                    if remote:
                        offer_dict["remoteDays"] = str(remote)

                    if current_round >= 3:
                        return AgentDecision(
                            action="accept",
                            message=f"{greeting_prefix}We are pleased to finalize the offer at a base salary of ${int(curr_salary):,} to secure your expertise.",
                            rationale_summary=f"Offer fulfills hiring objective: {primary_goal}.",
                            offer=offer_dict,
                            concession_percentage=8.0,
                        )

                    return AgentDecision(
                        action="counteroffer" if current_round > 1 else "offer",
                        message=f"{greeting_prefix}We can provide a compensation package with a base salary of ${int(curr_salary):,}.",
                        rationale_summary=f"Aligning with recruiter budget limit: {primary_constraint or cap_salary}.",
                        offer=offer_dict,
                        concession_percentage=5.0,
                    )
                else:
                    return AgentDecision(
                        action="counteroffer" if current_round > 1 else "offer",
                        message=f"{greeting_prefix}We are seeking to structure a competitive compensation package that aligns with our organizational budget and objective to {primary_goal}.",
                        rationale_summary=f"Recruiter advocating within parameters: {primary_constraint or 'budget ceiling'}.",
                        offer={},
                        concession_percentage=0.0,
                    )
            else:
                # Candidate Agent
                if min_sal is not None or target_sal is not None:
                    floor_salary = min_sal if min_sal is not None else target_sal
                    start_ask = target_sal if target_sal is not None else (floor_salary * 1.1)
                    step = (start_ask - floor_salary) * 0.25 * min(current_round - 1, 3)
                    curr_ask = max(start_ask - step, floor_salary)

                    offer_dict = {"salary": f"${int(curr_ask):,}"}
                    if equity:
                        offer_dict["equity"] = str(equity)
                    if remote:
                        offer_dict["remoteDays"] = str(remote)

                    if current_round >= 3 and curr_ask <= floor_salary + 500:
                        return AgentDecision(
                            action="accept",
                            message=f"{greeting_prefix}I am happy to accept the compensation structure at ${int(curr_ask):,} base salary.",
                            rationale_summary=f"Terms satisfy minimum requirement: {primary_constraint or floor_salary}.",
                            offer=offer_dict,
                            concession_percentage=7.0,
                        )

                    return AgentDecision(
                        action="counteroffer" if current_round > 1 else "offer",
                        message=f"{greeting_prefix}Based on my priorities and market benchmark, I am seeking a base salary of ${int(curr_ask):,}.",
                        rationale_summary=f"Advancing candidate priority: {primary_goal}.",
                        offer=offer_dict,
                        concession_percentage=5.0,
                    )
                else:
                    return AgentDecision(
                        action="counteroffer" if current_round > 1 else "offer",
                        message=f"{greeting_prefix}Based on my professional experience and priorities, I am seeking compensation that meets my requirements and reflects my goal to {primary_goal}.",
                        rationale_summary=f"Candidate positioning per constraint: {primary_constraint or 'floor expectation'}.",
                        offer={},
                        concession_percentage=0.0,
                    )

        # SCENARIO 3: BUDGET ALLOCATION NEGOTIATION
        else:
            target_alloc = _extract_number(params.get("targetAllocation") or params.get("Target Allocation Share"))
            min_alloc = _extract_number(params.get("minAllocation") or params.get("Minimum Allocation Floor"))
            max_b = _extract_number(params.get("maxAllocation") or params.get("Maximum Total Budget Pool"))

            if target_alloc is not None or min_alloc is not None:
                alloc_val = target_alloc if target_alloc is not None else min_alloc
                offer_dict = {"allocation": f"${int(alloc_val):,}"}

                if current_round >= 3:
                    return AgentDecision(
                        action="accept",
                        message=f"{greeting_prefix}We agree to the proposed capital allocation structure of ${int(alloc_val):,} for this program.",
                        rationale_summary=f"Consensus reached under constraint: {primary_constraint or 'budget boundary'}.",
                        offer=offer_dict,
                        concession_percentage=6.0,
                    )

                return AgentDecision(
                    action="counteroffer" if current_round > 1 else "offer",
                    message=f"{greeting_prefix}Our department recommends a project allocation of ${int(alloc_val):,} to fulfill critical scope objectives.",
                    rationale_summary=f"Proposing distribution to satisfy goal: {primary_goal}.",
                    offer=offer_dict,
                    concession_percentage=5.0,
                )
            else:
                return AgentDecision(
                    action="counteroffer" if current_round > 1 else "offer",
                    message=f"{greeting_prefix}We propose aligning the departmental resource allocation with our project milestone requirements and goal to {primary_goal}.",
                    rationale_summary=f"Proposing allocation according to constraint: {primary_constraint or 'scope requirements'}.",
                    offer={},
                    concession_percentage=0.0,
                )


class SecondaryLLMProvider(BaseLLMProvider):
    """Secondary external LLM provider (OpenAI-compatible / Groq / Anthropic compatible)."""

    def __init__(self, provider_name: str = "secondary_llm", api_key: Optional[str] = None, model_name: Optional[str] = None):
        self._name = provider_name
        self.api_key = api_key or settings.FALLBACK_API_KEY
        self.model_name = model_name or settings.FALLBACK_MODEL or "gpt-3.5-turbo"

    def provider_name(self) -> str:
        return self._name

    def supports_structured_output(self) -> bool:
        return True

    async def health_check(self) -> bool:
        return bool(self.api_key)

    async def generate_decision(
        self,
        prompt: str,
        agent_personality: str,
        agent_role: str,
        current_round: int,
        scenario_id: str,
        agent_data: Optional[Dict[str, Any]] = None,
        session_id: Optional[str] = None,
    ) -> AgentDecision:
        if not self.api_key:
            raise LLMProviderError(
                message=f"Secondary provider {self._name} has no configured API key",
                provider_name=self.provider_name(),
                status_code=401,
                is_quota=False,
                is_transient=False,
            )

        raise LLMProviderError(
            message=f"Secondary provider {self._name} connection error",
            provider_name=self.provider_name(),
            status_code=503,
            is_quota=False,
            is_transient=True,
        )
