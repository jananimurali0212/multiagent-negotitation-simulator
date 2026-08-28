import logging
from typing import Dict, Any, List, Optional, TypedDict
from app.providers.manager import LLMProviderManager
from app.negotiation.decision_engine import DecisionEngine
from app.prompts.scenario_prompts import build_system_prompt
from app.schemas.arena import AgentDecision
from app.schemas.agent import AgentConfigSchema
from app.negotiation.models.negotiation_state import NormalizedNegotiationState
from app.negotiation.validation.decision_validator import DecisionValidator
from app.negotiation.state.transition_engine import StateTransitionEngine
from app.negotiation.rules.zopa import ZOPAService

logger = logging.getLogger("backend.langgraph_nodes")


class NegotiationState(TypedDict):
    session_id: str
    scenario_id: str
    mode: str
    current_round: int
    max_rounds: int
    current_speaker_index: int
    current_turn_speaker: str
    agents: List[Dict[str, Any]]
    messages: List[Dict[str, Any]]
    current_offer: Optional[Dict[str, Any]]
    agreement_reached: bool
    deadlock_detected: bool
    status: str
    latest_decision: Optional[Dict[str, Any]]


class LangGraphNegotiationEngine:
    def __init__(self, provider_manager: Optional[LLMProviderManager] = None):
        self.provider_manager = provider_manager or LLMProviderManager()

    async def agent_reasoning_node(self, state: NegotiationState) -> Dict[str, Any]:
        """Node for executing AI agent reasoning using multi-LLM provider failover & Phase 3 validation engine."""
        agents = state["agents"]
        speaker_idx = state["current_speaker_index"] % len(agents)
        active_agent_dict = agents[speaker_idx]

        # Construct system prompt
        prompt = build_system_prompt(
            scenario_title=state["scenario_id"].replace("-", " ").title(),
            scenario_objective="Reach mutual commercial agreement.",
            agent_name=active_agent_dict["name"],
            agent_role=active_agent_dict["role"],
            personality=active_agent_dict["personality"],
            experience=active_agent_dict.get("experience", "Medium"),
            goals=active_agent_dict.get("goals", []),
            constraints=active_agent_dict.get("constraints", []),
            negotiation_parameters=active_agent_dict.get("negotiation_parameters", {}),
            public_transcript=state["messages"],
            scenario_id=state["scenario_id"],
            current_round=state["current_round"],
            session_id=state.get("session_id"),
        )

        # Generate LLM decision
        raw_decision = await self.provider_manager.generate_decision(
            prompt=prompt,
            agent_personality=active_agent_dict["personality"],
            agent_role=active_agent_dict["role"],
            current_round=state["current_round"],
            scenario_id=state["scenario_id"],
            session_id=state.get("session_id"),
        )

        # Create NormalizedNegotiationState for validation engine
        parsed_agents = []
        for a in agents:
            agent_data = dict(a)
            agent_data.setdefault("agent_template_id", "unknown")
            parsed_agents.append(AgentConfigSchema(**agent_data))
        norm_state = NormalizedNegotiationState(
            session_id=state["session_id"],
            scenario_id=state["scenario_id"],
            mode=state.get("mode", "ai-ai"),
            current_round=state["current_round"],
            max_rounds=state.get("max_rounds", 20),
            current_speaker_index=speaker_idx,
            current_turn_speaker=active_agent_dict["name"],
            agents=parsed_agents,
            messages=state["messages"],
            current_offer=state.get("current_offer"),
            status=state.get("status", "running"),
        )

        # Run Phase 3 DecisionValidator
        val_res, validated_decision, concession_info = DecisionValidator.validate_decision(norm_state, raw_decision)

        # Apply validated state transition
        updated_norm_state = StateTransitionEngine.apply_decision(
            norm_state, validated_decision, val_res, concession_info=concession_info
        )

        return {
            "current_speaker_index": updated_norm_state.current_speaker_index,
            "current_turn_speaker": updated_norm_state.current_turn_speaker,
            "current_round": updated_norm_state.current_round,
            "messages": updated_norm_state.messages,
            "current_offer": updated_norm_state.current_offer,
            "status": updated_norm_state.status,
            "latest_decision": validated_decision.model_dump(),
        }

    def offer_evaluator_node(self, state: NegotiationState) -> Dict[str, Any]:
        """Node for evaluating offers and agreement state via DecisionEngine pipeline."""
        latest_decision_dict = state.get("latest_decision") or {}
        latest_decision = AgentDecision(**latest_decision_dict) if latest_decision_dict else AgentDecision(
            action="counteroffer", message=""
        )

        safety_limit_hit = (state["current_round"] >= state["max_rounds"])

        # Compute ZOPA info for terminal evaluation
        parsed_agents = []
        for a in state["agents"]:
            agent_data = dict(a)
            agent_data.setdefault("agent_template_id", "unknown")
            parsed_agents.append(AgentConfigSchema(**agent_data))
        zopa_info = ZOPAService.calculate_zopa(state["scenario_id"], parsed_agents)

        is_terminal, final_terms, outcome_status = DecisionEngine.evaluate_agreement(
            scenario_id=state["scenario_id"],
            latest_decision=latest_decision,
            previous_messages=state["messages"],
            safety_ceiling_reached=safety_limit_hit,
            current_round=state["current_round"],
            max_rounds=state["max_rounds"],
            zopa_info=zopa_info,
        )

        if is_terminal:
            status = "finished" if outcome_status == "Agreement Reached" else "deadlock"
            return {
                "status": status,
                "agreement_reached": (outcome_status == "Agreement Reached"),
                "deadlock_detected": (outcome_status == "Deadlock"),
                "current_offer": final_terms,
            }

        return {"status": "running"}

    def routing_condition(self, state: NegotiationState) -> str:
        """Conditional routing edge deciding next graph step."""
        if state.get("status") in ["finished", "deadlock", "terminated"]:
            return "end"
        return "continue"
