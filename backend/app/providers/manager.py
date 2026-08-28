import asyncio
import logging
from typing import List, Dict, Any, Optional, Set
from app.core.config import settings
from app.schemas.arena import AgentDecision
from app.providers.base import BaseLLMProvider, LLMProviderError
from app.providers.gemini_provider import GeminiProvider
from app.providers.openai_compatible import GroqProvider, OpenRouterProvider
from app.providers.fallback_provider import FallbackRuleProvider, SecondaryLLMProvider

logger = logging.getLogger("backend.providers.manager")


class LLMProviderManager:
    """Orchestrates multi-LLM providers with failure detection, backoff, and transparent fallback:
    Gemini -> Groq -> OpenRouter -> RuleFallback
    """

    def __init__(self, providers: Optional[List[BaseLLMProvider]] = None):
        if providers:
            self.providers = providers
        else:
            self.providers = self._initialize_default_providers()

    def _initialize_default_providers(self) -> List[BaseLLMProvider]:
        provider_list: List[BaseLLMProvider] = []
        added_names: Set[str] = set()

        # Primary provider selection (Default: Gemini)
        primary_name = (settings.PRIMARY_LLM_PROVIDER or "gemini").lower()
        if primary_name == "gemini":
            provider_list.append(GeminiProvider())
            added_names.add("gemini")
        elif primary_name == "groq":
            provider_list.append(GroqProvider())
            added_names.add("groq")
        elif primary_name == "openrouter":
            provider_list.append(OpenRouterProvider())
            added_names.add("openrouter")
        else:
            provider_list.append(GeminiProvider())
            added_names.add("gemini")

        # Standard Failover Chain: Gemini -> Groq -> OpenRouter -> RuleFallback
        default_chain = [
            ("gemini", GeminiProvider),
            ("groq", GroqProvider),
            ("openrouter", OpenRouterProvider),
        ]

        for p_name, p_class in default_chain:
            if p_name not in added_names:
                provider_list.append(p_class())
                added_names.add(p_name)

        # Always append RuleFallback as ultimate failsafe to prevent total negotiation lockup
        if "rule_fallback" not in added_names:
            provider_list.append(FallbackRuleProvider())

        return provider_list

    async def generate_decision(
        self,
        prompt: str,
        agent_personality: str,
        agent_role: str,
        current_round: int,
        scenario_id: str,
        session_id: Optional[str] = None,
    ) -> AgentDecision:
        """Executes LLM decision generation with transparent multi-provider failover."""
        attempted_providers: Set[str] = set()
        primary_provider = self.providers[0] if self.providers else None

        for idx, provider in enumerate(self.providers):
            p_name = provider.provider_name()

            # Prevent infinite provider switching loops
            if p_name in attempted_providers:
                continue
            attempted_providers.add(p_name)

            # Log provider selected
            logger.info(
                f"[PROVIDER_EVENT] provider_selected: {p_name} | session_id={session_id or 'N/A'} | round={current_round}"
            )

            if idx > 0 and primary_provider:
                logger.warning(
                    f"[PROVIDER_EVENT] fallback_started: from={primary_provider.provider_name()} to={p_name} | session_id={session_id or 'N/A'}"
                )

            max_retries = settings.LLM_MAX_RETRIES if hasattr(settings, "LLM_MAX_RETRIES") else 2
            retry_count = 0

            while retry_count <= max_retries:
                try:
                    decision = await provider.generate_decision(
                        prompt=prompt,
                        agent_personality=agent_personality,
                        agent_role=agent_role,
                        current_round=current_round,
                        scenario_id=scenario_id,
                    )

                    if idx > 0:
                        logger.info(
                            f"[PROVIDER_EVENT] fallback_success: provider={p_name} | session_id={session_id or 'N/A'}"
                        )

                    return decision

                except LLMProviderError as err:
                    logger.warning(
                        f"[PROVIDER_EVENT] provider_failed: provider={p_name} | failure_reason={err.message} | "
                        f"status_code={err.status_code} | is_quota={err.is_quota} | is_transient={err.is_transient}"
                    )

                    # Do NOT retry quota/rate limit error on the same provider in the same turn
                    if err.is_quota:
                        logger.info(f"Quota/Rate limit detected for provider '{p_name}'. Switching immediately to next provider.")
                        break

                    # If error is transient and retries remain, retry with exponential backoff
                    if err.is_transient and retry_count < max_retries:
                        retry_count += 1
                        backoff = 2 ** (retry_count - 1)
                        logger.info(f"Transient error on '{p_name}'. Retrying attempt {retry_count}/{max_retries} in {backoff}s...")
                        await asyncio.sleep(backoff)
                        continue
                    else:
                        break

                except Exception as unhandled_err:
                    logger.error(
                        f"[PROVIDER_EVENT] provider_failed: provider={p_name} | failure_reason=Unhandled: {unhandled_err}"
                    )
                    break

            if idx > 0:
                logger.error(f"[PROVIDER_EVENT] fallback_failed: provider={p_name} | session_id={session_id or 'N/A'}")

        # Final fallback safety net (should never be reached if FallbackRuleProvider is present)
        logger.critical("All configured LLM providers failed. Executing safety rule decision.")
        rule_fallback = FallbackRuleProvider()
        return await rule_fallback.generate_decision(prompt, agent_personality, agent_role, current_round, scenario_id)
