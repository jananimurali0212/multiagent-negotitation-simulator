import json
import logging
from typing import Dict, Any, List
from app.core.config import settings
from app.schemas.arena import AgentDecision

logger = logging.getLogger("backend.gemini_client")

try:
    from google import genai
    from google.genai import types
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False


class GeminiAgentClient:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL or "gemini-1.5-pro"
        self.client = None

        if GENAI_AVAILABLE and self.api_key:
            try:
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.warning(f"Failed to initialize Google GenAI client: {e}")

    async def generate_decision(
        self,
        prompt: str,
        agent_personality: str,
        agent_role: str,
        current_round: int,
        scenario_id: str,
    ) -> AgentDecision:
        """Generates structured decision from Gemini LLM or controlled fallback."""
        if self.client:
            try:
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.7,
                    ),
                )
                if response and response.text:
                    data = json.loads(response.text)
                    return AgentDecision(
                        action=data.get("action", "counteroffer"),
                        message=data.get("message", "I present our current proposal."),
                        rationale_summary=data.get("rationale_summary", "Evaluating trade-offs."),
                        offer=data.get("offer", {}),
                        concession_percentage=float(data.get("concession_percentage", 5.0)),
                        confidence_score=float(data.get("confidence_score", 0.9)),
                    )
            except Exception as e:
                logger.error(f"Gemini API execution error: {e}. Falling back to rule-based fallback.")

        # Controlled Fallback Decision Generator based on scenario & personality
        return self._generate_fallback_decision(agent_personality, agent_role, current_round, scenario_id)

    def _generate_fallback_decision(
        self, personality: str, role: str, current_round: int, scenario_id: str
    ) -> AgentDecision:
        """Personality-driven fallback decision maker when LLM API is offline/unreachable."""
        if scenario_id == "vendor-pricing":
            if "Sales" in role or "Vendor" in role or "Seller" in role:
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
                    rationale_summary=f"Applying {personality} pricing strategy for round {current_round}.",
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
                    rationale_summary=f"Countering with {personality} procurement strategy.",
                    offer={"price": f"${price}/user/month", "paymentTerms": "Net-45"},
                    concession_percentage=6.0,
                )

        elif scenario_id == "job-offer":
            if "Recruiter" in role or "HR" in role:
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
                message=f"We propose allocating $200k to Engineering, $160k to Marketing, and $140k to Operations.",
                rationale_summary="Balancing departmental priorities under $500k ceiling.",
                offer={"marketingAllocation": "$160,000", "engineeringAllocation": "$200,000", "allocation": "$140,000"},
                concession_percentage=7.0,
            )
