import json
import asyncio
import logging
from typing import Optional
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

    @staticmethod
    def _clean_and_parse_json(text: str) -> dict:
        """Cleans markdown fences, thinking tags, and parses JSON payload safely."""
        clean_text = text.strip()
        if "<think>" in clean_text:
            end_think = clean_text.rfind("</think>")
            if end_think != -1:
                clean_text = clean_text[end_think + 8:].strip()
        if clean_text.startswith("```json"):
            clean_text = clean_text[7:]
        elif clean_text.startswith("```"):
            clean_text = clean_text[3:]
        if clean_text.endswith("```"):
            clean_text = clean_text[:-3]
        clean_text = clean_text.strip()

        try:
            return json.loads(clean_text)
        except json.JSONDecodeError:
            start = clean_text.find("{")
            end = clean_text.rfind("}")
            if start != -1 and end != -1 and end > start:
                return json.loads(clean_text[start : end + 1])
            raise

    async def generate_decision(
        self,
        prompt: str,
        agent_personality: str,
        agent_role: str,
        current_round: int,
        scenario_id: str,
    ) -> AgentDecision:
        if not self.client:
            raise LLMProviderError(
                message="Gemini client not initialized or API key missing",
                provider_name=self.provider_name(),
                status_code=500,
                is_quota=False,
                is_transient=False,
            )

        models_to_try = [self.model_name]

        last_error = None
        for model in models_to_try:
            try:
                response = await asyncio.to_thread(
                    self.client.models.generate_content,
                    model=model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.7,
                    ),
                )

                if response and response.text:
                    data = self._clean_and_parse_json(response.text)

                    usage = getattr(response, "usage_metadata", None)
                    if usage:
                        try:
                            from app.negotiation.telemetry import NegotiationTelemetry
                            NegotiationTelemetry.emit(
                                event_type="token_usage",
                                session_id="llm_execution",
                                agent_name=agent_role,
                                current_round=current_round,
                                payload={
                                    "provider": self.provider_name(),
                                    "model": model,
                                    "prompt_tokens": getattr(usage, "prompt_token_count", 0),
                                    "completion_tokens": getattr(usage, "candidates_token_count", 0),
                                    "total_tokens": getattr(usage, "total_token_count", 0),
                                },
                            )
                        except Exception as telem_err:
                            logger.debug(f"Telemetry emit skipped: {telem_err}")

                    offer_val = data.get("offer", {})
                    if offer_val is None:
                        offer_val = {}
                    elif not isinstance(offer_val, dict):
                        if isinstance(offer_val, (int, float)):
                            offer_val = {"amount": offer_val}
                        elif isinstance(offer_val, str):
                            offer_val = {"value": offer_val}
                        else:
                            offer_val = {}

                    action_val = str(data.get("action", "counteroffer")).lower()
                    if action_val not in ["offer", "counteroffer", "accept", "reject", "deadlock"]:
                        action_val = "counteroffer"

                    try:
                        concession = float(data.get("concession_percentage", 5.0))
                    except (ValueError, TypeError):
                        concession = 5.0

                    try:
                        confidence = float(data.get("confidence_score", 0.9))
                    except (ValueError, TypeError):
                        confidence = 0.9

                    return AgentDecision(
                        action=action_val,
                        message=str(data.get("message", "I present our current proposal.")),
                        rationale_summary=str(data.get("rationale_summary", "Evaluating trade-offs.")),
                        offer=offer_val,
                        concession_percentage=concession,
                        confidence_score=confidence,
                    )
                else:
                    logger.warning(f"Empty response from Gemini model {model}, trying next if available")
                    continue

            except json.JSONDecodeError as e:
                logger.warning(f"Invalid JSON returned by Gemini model {model}: {e}")
                last_error = e
                continue
            except Exception as e:
                err_str = str(e).upper()
                status_code = getattr(e, "code", getattr(e, "status_code", None))
                is_quota = (
                    "429" in err_str
                    or "RESOURCE_EXHAUSTED" in err_str
                    or "QUOTA_EXCEEDED" in err_str
                    or "RATE_LIMIT" in err_str
                    or status_code == 429
                )
                logger.warning(f"Gemini model {model} failed (quota={is_quota}): {e}.")
                last_error = e
                if is_quota:
                    break
                continue

        # If all candidate models in the chain failed
        err_str = str(last_error).upper() if last_error else "EMPTY"
        status_code = getattr(last_error, "code", getattr(last_error, "status_code", None))
        is_quota = (
            "429" in err_str
            or "RESOURCE_EXHAUSTED" in err_str
            or "QUOTA_EXCEEDED" in err_str
            or "RATE_LIMIT" in err_str
            or status_code == 429
        )
        is_transient = not is_quota and (
            "TIMEOUT" in err_str
            or "500" in err_str
            or "503" in err_str
            or "UNAVAILABLE" in err_str
            or "CONNECTION" in err_str
            or "DEADLINE_EXCEEDED" in err_str
        )

        raise LLMProviderError(
            message=f"Gemini API failure across models {models_to_try}: {last_error}",
            provider_name=self.provider_name(),
            status_code=status_code or (429 if is_quota else 500),
            is_quota=is_quota,
            is_transient=is_transient,
        )
