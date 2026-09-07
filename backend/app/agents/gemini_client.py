import json
import logging
from typing import Dict, Any, List, Optional
from app.core.config import settings
from app.schemas.arena import AgentDecision
from app.providers.fallback_provider import FallbackRuleProvider

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
        self._fallback_provider = FallbackRuleProvider()

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
        agent_data: Optional[Dict[str, Any]] = None,
        session_id: Optional[str] = None,
    ) -> AgentDecision:
        """Generates structured decision from Gemini LLM or dynamic parameter-driven fallback."""
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
                logger.error(f"Gemini API execution error: {e}. Falling back to dynamic rule fallback.")

        # Dynamic Fallback Decision Generator strictly derived from configured data
        return await self._fallback_provider.generate_decision(
            prompt=prompt,
            agent_personality=agent_personality,
            agent_role=agent_role,
            current_round=current_round,
            scenario_id=scenario_id,
            agent_data=agent_data,
            session_id=session_id,
        )
