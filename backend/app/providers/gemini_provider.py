import json
import logging
from typing import Optional, Dict, Any
from app.core.config import settings
from app.schemas.arena import AgentDecision
from app.providers.base import BaseLLMProvider, LLMProviderError

logger = logging.getLogger("backend.providers.gemini")

try:
    from google import genai
    from google.genai import types
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False


class GeminiProvider(BaseLLMProvider):
    def __init__(self, api_key: Optional[str] = None, model_name: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model_name = model_name or settings.GEMINI_MODEL or "gemini-3.6-flash"
        self.client = None

        if GENAI_AVAILABLE and self.api_key:
            try:
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.warning(f"Failed to initialize Google GenAI client for GeminiProvider: {e}")

    def provider_name(self) -> str:
        return "gemini"

    def supports_structured_output(self) -> bool:
        return True

    async def health_check(self) -> bool:
        return self.client is not None and bool(self.api_key)

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
        if not self.client:
            raise LLMProviderError(
                message="Gemini client not initialized or API key missing",
                provider_name=self.provider_name(),
                status_code=500,
                is_quota=False,
                is_transient=False,
            )

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
            else:
                raise LLMProviderError(
                    message="Empty response received from Gemini API",
                    provider_name=self.provider_name(),
                    status_code=502,
                    is_quota=False,
                    is_transient=True,
                )

        except json.JSONDecodeError as e:
            raise LLMProviderError(
                message=f"Invalid JSON returned by Gemini: {e}",
                provider_name=self.provider_name(),
                status_code=422,
                is_quota=False,
                is_transient=True,
            )
        except Exception as e:
            err_str = str(e).upper()
            status_code = getattr(e, "code", getattr(e, "status_code", None))
            
            # Detect Rate Limit / Quota Exhaustion
            is_quota = (
                "429" in err_str
                or "RESOURCE_EXHAUSTED" in err_str
                or "QUOTA_EXCEEDED" in err_str
                or "RATE_LIMIT" in err_str
                or status_code == 429
            )
            
            # Detect Timeout / Network / Temporary Server Errors
            is_transient = not is_quota and (
                "TIMEOUT" in err_str
                or "500" in err_str
                or "503" in err_str
                or "UNAVAILABLE" in err_str
                or "CONNECTION" in err_str
                or "DEADLINE_EXCEEDED" in err_str
            )

            raise LLMProviderError(
                message=f"Gemini API failure: {e}",
                provider_name=self.provider_name(),
                status_code=status_code or (429 if is_quota else 500),
                is_quota=is_quota,
                is_transient=is_transient,
            )
