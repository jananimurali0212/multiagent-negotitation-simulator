from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from app.schemas.arena import AgentDecision


class LLMProviderError(Exception):
    """Base exception for LLM provider failures."""
    def __init__(self, message: str, provider_name: str, status_code: Optional[int] = None, is_quota: bool = False, is_transient: bool = True):
        super().__init__(message)
        self.message = message
        self.provider_name = provider_name
        self.status_code = status_code
        self.is_quota = is_quota
        self.is_transient = is_transient


class BaseLLMProvider(ABC):
    @abstractmethod
    def provider_name(self) -> str:
        """Returns the unique name of the LLM provider."""
        pass

    @abstractmethod
    def supports_structured_output(self) -> bool:
        """Indicates if the provider natively supports JSON structured output."""
        pass

    @abstractmethod
    async def health_check(self) -> bool:
        """Performs a lightweight health check for provider API availability."""
        pass

    @abstractmethod
    async def generate_decision(
        self,
        prompt: str,
        agent_personality: str,
        agent_role: str,
        current_round: int,
        scenario_id: str,
    ) -> AgentDecision:
        """Generates a validated AgentDecision schema from the LLM provider.

        Raises:
            LLMProviderError: If provider API fails, rate limited, or quota exhausted.
        """
        pass
