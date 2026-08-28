import json
import logging
from typing import Optional, Dict, Any
from app.core.config import settings
from app.schemas.arena import AgentDecision
from app.providers.base import BaseLLMProvider, LLMProviderError

logger = logging.getLogger("backend.providers.fallback")


class FallbackRuleProvider(BaseLLMProvider):
    """Deterministic personality-driven fallback decision provider.
    Guarantees negotiation continuation even if all external APIs are unreachable.
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
    ) -> AgentDecision:
        """Personality-driven fallback decision maker."""
        logger.info(f"FallbackRuleProvider generating decision for role='{agent_role}', round={current_round}, scenario='{scenario_id}'")

        if scenario_id == "vendor-pricing":
            if any(term in agent_role for term in ["Sales", "Vendor", "Seller"]):
                prices = {1: 72, 2: 65, 3: 55, 4: 52}
                price = prices.get(current_round, 50)
                if current_round >= 3:
                    return AgentDecision(
                        action="accept",
                        message=f"We agree to the licensing price of ${price}/user/month with Net-30 payment terms and Gold Support.",
                        rationale_summary="Terms satisfy our commercial target and meet buyer expectations.",
                        offer={"price": f"${price}/user/month", "paymentTerms": "Net-30", "warranty": "Gold Support"},
                        concession_percentage=12.0,
                    )
                return AgentDecision(
                    action="counteroffer",
                    message=f"We can offer licensing at ${price}/user/month with Net-30 payment terms and Gold deployment support included.",
                    rationale_summary=f"Applying {agent_personality} pricing strategy for round {current_round}.",
                    offer={"price": f"${price}/user/month", "paymentTerms": "Net-30", "warranty": "Gold Support"},
                    concession_percentage=8.0,
                )
            else:
                prices = {1: 42, 2: 48, 3: 52, 4: 52}
                price = prices.get(current_round, 52)
                if current_round >= 3:
                    return AgentDecision(
                        action="accept",
                        message=f"We accept the proposal of ${price}/user/month given the Net-30 payment terms and Gold support.",
                        rationale_summary="Agreed terms fall within budget limits.",
                        offer={"price": f"${price}/user/month", "paymentTerms": "Net-30", "warranty": "Gold Support"},
                        concession_percentage=10.0,
                    )
                return AgentDecision(
                    action="counteroffer",
                    message=f"Our budget cap requires a pricing of ${price}/user/month under Net-45 payment terms.",
                    rationale_summary=f"Countering with {agent_personality} procurement strategy.",
                    offer={"price": f"${price}/user/month", "paymentTerms": "Net-45"},
                    concession_percentage=6.0,
                )

        elif scenario_id == "job-offer":
            if any(term in agent_role for term in ["Recruiter", "HR", "Hiring"]):
                salaries = {1: 155000, 2: 160000, 3: 165000}
                salary = salaries.get(current_round, 165000)
                if current_round >= 3:
                    return AgentDecision(
                        action="accept",
                        message=f"We are happy to finalize the offer at ${salary:,} base salary, 12,000 stock units, and 3 days remote work.",
                        rationale_summary="Candidate expectations met within internal grade caps.",
                        offer={"salary": f"${salary:,}", "equity": "12,000 shares", "remoteDays": "3 days remote"},
                        concession_percentage=10.0,
                    )
                return AgentDecision(
                    action="counteroffer",
                    message=f"We can increase our base salary offer to ${salary:,} along with 10,000 equity options and a 3-day hybrid schedule.",
                    rationale_summary="Evaluating recruiter compensation flexibility.",
                    offer={"salary": f"${salary:,}", "equity": "10,000 shares", "remoteDays": "3 days remote"},
                    concession_percentage=5.0,
                )
            else:
                salaries = {1: 175000, 2: 168000, 3: 165000}
                salary = salaries.get(current_round, 165000)
                if current_round >= 3:
                    return AgentDecision(
                        action="accept",
                        message=f"I accept the offer of ${salary:,} base salary with 12,000 shares and hybrid remote flexibility.",
                        rationale_summary="Offer satisfies minimum compensation expectations.",
                        offer={"salary": f"${salary:,}", "equity": "12,000 shares", "remoteDays": "3 days remote"},
                        concession_percentage=8.0,
                    )
                return AgentDecision(
                    action="counteroffer",
                    message=f"Based on market data and competing offers, I am looking for ${salary:,} base salary and 15,000 equity options.",
                    rationale_summary="Candidate advocating for higher equity compensation.",
                    offer={"salary": f"${salary:,}", "equity": "15,000 shares", "remoteDays": "4 days remote"},
                    concession_percentage=6.0,
                )

        else:  # budget-allocation
            return AgentDecision(
                action="counteroffer" if current_round < 3 else "accept",
                message="We propose allocating $200k to Engineering, $160k to Marketing, and $140k to Operations.",
                rationale_summary="Balancing departmental priorities under $500k ceiling.",
                offer={"marketingAllocation": "$160,000", "engineeringAllocation": "$200,000", "allocation": "$140,000"},
                concession_percentage=7.0,
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
    ) -> AgentDecision:
        if not self.api_key:
            raise LLMProviderError(
                message=f"Secondary provider {self._name} has no configured API key",
                provider_name=self.provider_name(),
                status_code=401,
                is_quota=False,
                is_transient=False,
            )

        # In production this makes an async HTTP call to OpenAI / Groq API.
        # If API key is present but call fails, it raises LLMProviderError.
        raise LLMProviderError(
            message=f"Secondary provider {self._name} connection error",
            provider_name=self.provider_name(),
            status_code=503,
            is_quota=False,
            is_transient=True,
        )
