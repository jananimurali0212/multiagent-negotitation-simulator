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

        payload = {
            "model": self.model_name,
            "messages": [
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            "temperature": 0.7,
            "response_format": {"type": "json_object"},
        }

        timeout = getattr(settings, "LLM_TIMEOUT_SECONDS", 15)

        try:
            async with httpx.AsyncClient(timeout=float(timeout)) as client:
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

            # Strip markdown fence if present
            clean_text = content_text.strip()
            if clean_text.startswith("```json"):
                clean_text = clean_text[7:]
            if clean_text.startswith("```"):
                clean_text = clean_text[3:]
            if clean_text.endswith("```"):
                clean_text = clean_text[:-3]
            clean_text = clean_text.strip()

            data = json.loads(clean_text)
            return AgentDecision(
                action=data.get("action", "counteroffer"),
                message=data.get("message", "I present our revised proposal."),
                rationale_summary=data.get("rationale_summary", "Evaluating trade-offs."),
                offer=data.get("offer", {}),
                concession_percentage=float(data.get("concession_percentage", 5.0)),
                confidence_score=float(data.get("confidence_score", 0.9)),
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
            model_name=model_name or settings.GROQ_MODEL or "llama-3.3-70b-versatile",
            default_model="llama-3.3-70b-versatile",
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
