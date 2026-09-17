import json
import logging
import httpx
from typing import Optional, Dict, Any
from app.core.config import settings
from app.schemas.arena import AgentDecision
from app.providers.base import BaseLLMProvider, LLMProviderError

logger = logging.getLogger("backend.providers.openai_compatible")


class OpenAICompatibleProvider(BaseLLMProvider):
    """Generic OpenAI-compatible REST API client for Groq, OpenRouter, and OpenAI providers."""

    def __init__(
        self,
        name: str,
        base_url: str,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        default_model: str = "llama-3.3-70b-versatile",
    ):
        self._name = name
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key or ""
        self.model_name = model_name or default_model
        self._client: Optional[httpx.AsyncClient] = None

    def _get_client(self, timeout: float) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=timeout)
        return self._client

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
                message=f"Provider '{self._name}' has no configured API key",
                provider_name=self.provider_name(),
                status_code=401,
                is_quota=False,
                is_transient=False,
            )

        endpoint = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        # Add OpenRouter referrer headers if OpenRouter
        if "openrouter" in self._name or "openrouter" in self.base_url:
            headers["HTTP-Referer"] = "https://github.com/multi-agent-negotiation"
            headers["X-Title"] = settings.PROJECT_NAME

        formatted_prompt = prompt
        if "json" not in formatted_prompt.lower():
            formatted_prompt = f"{formatted_prompt}\n\nPlease respond with a valid JSON object matching the required AgentDecision structure."

        payload = {
            "model": self.model_name,
            "messages": [
                {
                    "role": "user",
                    "content": formatted_prompt,
                }
            ],
            "temperature": 0.7,
            "response_format": {"type": "json_object"},
        }

        timeout = getattr(settings, "LLM_TIMEOUT_SECONDS", 15)

        try:
            client = self._get_client(float(timeout))
            response = await client.post(endpoint, headers=headers, json=payload)

            if response.status_code != 200:
                err_text = response.text.upper()
                status_code = response.status_code

                is_quota = (
                    status_code == 429
                    or "429" in err_text
                    or "RATE_LIMIT" in err_text
                    or "QUOTA" in err_text
                    or "RESOURCE_EXHAUSTED" in err_text
                    or "INSUFFICIENT_QUOTA" in err_text
                )

                is_transient = not is_quota and status_code in (500, 502, 503, 504)

                raise LLMProviderError(
                    message=f"Provider '{self._name}' returned HTTP {status_code}: {response.text[:200]}",
                    provider_name=self.provider_name(),
                    status_code=status_code,
                    is_quota=is_quota,
                    is_transient=is_transient,
                )

            res_json = response.json()
            choices = res_json.get("choices", [])
            if not choices:
                raise LLMProviderError(
                    message=f"Provider '{self._name}' returned empty response choices",
                    provider_name=self.provider_name(),
                    status_code=502,
                    is_quota=False,
                    is_transient=True,
                )

            content_text = choices[0].get("message", {}).get("content", "")
            if not content_text:
                raise LLMProviderError(
                    message=f"Provider '{self._name}' returned empty content message",
                    provider_name=self.provider_name(),
                    status_code=502,
                    is_quota=False,
                    is_transient=True,
                )

            clean_text = content_text.strip()
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
                data = json.loads(clean_text)
            except json.JSONDecodeError:
                start = clean_text.find("{")
                end = clean_text.rfind("}")
                if start != -1 and end != -1 and end > start:
                    data = json.loads(clean_text[start : end + 1])
                else:
                    raise

            usage = res_json.get("usage")
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
                            "model": self.model_name,
                            "prompt_tokens": usage.get("prompt_tokens", 0),
                            "completion_tokens": usage.get("completion_tokens", 0),
                            "total_tokens": usage.get("total_tokens", 0),
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
                message=str(data.get("message", "I present our revised proposal.")),
                rationale_summary=str(data.get("rationale_summary", "Evaluating trade-offs.")),
                offer=offer_val,
                concession_percentage=concession,
                confidence_score=confidence,
            )

        except json.JSONDecodeError as e:
            raise LLMProviderError(
                message=f"Invalid JSON returned by provider '{self._name}': {e}",
                provider_name=self.provider_name(),
                status_code=422,
                is_quota=False,
                is_transient=True,
            )
        except httpx.TimeoutException as e:
            raise LLMProviderError(
                message=f"Provider '{self._name}' timed out after {timeout}s",
                provider_name=self.provider_name(),
                status_code=408,
                is_quota=False,
                is_transient=True,
            )
        except httpx.RequestError as e:
            raise LLMProviderError(
                message=f"Provider '{self._name}' network request error: {e}",
                provider_name=self.provider_name(),
                status_code=503,
                is_quota=False,
                is_transient=True,
            )
        except LLMProviderError:
            raise
        except Exception as e:
            raise LLMProviderError(
                message=f"Provider '{self._name}' unexpected error: {e}",
                provider_name=self.provider_name(),
                status_code=500,
                is_quota=False,
                is_transient=False,
            )


class GroqProvider(OpenAICompatibleProvider):
    def __init__(self, api_key: Optional[str] = None, model_name: Optional[str] = None):
        super().__init__(
            name="groq",
            base_url="https://api.groq.com/openai/v1",
            api_key=api_key or settings.GROQ_API_KEY,
            model_name=model_name or settings.GROQ_MODEL or "groq/compound",
            default_model="groq/compound",
        )


class OpenRouterProvider(OpenAICompatibleProvider):
    def __init__(self, api_key: Optional[str] = None, model_name: Optional[str] = None):
        super().__init__(
            name="openrouter",
            base_url="https://openrouter.ai/api/v1",
            api_key=api_key or settings.OPENROUTER_API_KEY,
            model_name=model_name or settings.OPENROUTER_MODEL or "openrouter/free",
            default_model="openrouter/free",
        )
