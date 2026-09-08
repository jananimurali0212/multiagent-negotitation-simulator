import logging
from typing import Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.negotiation import NegotiationSession
from app.models.agent import AgentConfiguration, AgentGoal, AgentConstraint
from app.core.exceptions import WorkflowValidationError

logger = logging.getLogger("backend.workflow")

ALLOWED_PERSONALITIES = {"Aggressive", "Collaborative", "Risk-Averse"}
ALLOWED_MODES = {"ai-ai", "human-ai"}
ALLOWED_SCENARIOS = {"vendor-pricing", "job-offer", "budget-allocation"}


class WorkflowService:
    @staticmethod
    def validate_scenario_and_mode(scenario_id: str, mode: str) -> None:
        if scenario_id not in ALLOWED_SCENARIOS:
            raise WorkflowValidationError(
                f"Invalid scenario ID '{scenario_id}'. Supported scenarios: {', '.join(ALLOWED_SCENARIOS)}",
                missing_step="SCENARIO",
            )
        if mode not in ALLOWED_MODES:
            raise WorkflowValidationError(
                f"Invalid negotiation mode '{mode}'. Supported modes: {', '.join(ALLOWED_MODES)}",
                missing_step="MODE",
            )

    @staticmethod
    async def validate_readiness_to_start(session: NegotiationSession) -> Tuple[bool, str]:
        """
        Validates whether a negotiation session is completely setup and ready to move to STEP 06 (Start Negotiation).
        Raises WorkflowValidationError if any requirement is incomplete.
        """
        # Step 01: Scenario check
        if not session.scenario_id or session.scenario_id not in ALLOWED_SCENARIOS:
            raise WorkflowValidationError("No valid scenario selected.", missing_step="SCENARIO")

        # Step 02: Mode check
        if not session.mode or session.mode not in ALLOWED_MODES:
            raise WorkflowValidationError("No valid negotiation mode selected.", missing_step="MODE")

        # Step 03: Agents check
        agents = session.agents
        if not agents or len(agents) == 0:
            raise WorkflowValidationError("No agents configured for this negotiation session.", missing_step="AGENTS")

        # Check required agent count based on scenario
        expected_counts = {"vendor-pricing": 2, "job-offer": 2, "budget-allocation": 3}
        expected_count = expected_counts.get(session.scenario_id, 2)
        if len(agents) != expected_count:
            raise WorkflowValidationError(
                f"Scenario '{session.scenario_id}' requires exactly {expected_count} agents, but found {len(agents)}.",
                missing_step="AGENTS",
            )

        for agent in agents:
            if not agent.name or not agent.name.strip():
                raise WorkflowValidationError(f"Agent '{agent.agent_template_id}' has an empty name.", missing_step="AGENTS")
            if agent.personality not in ALLOWED_PERSONALITIES:
                raise WorkflowValidationError(
                    f"Agent '{agent.name}' has invalid personality '{agent.personality}'. Must be one of: {', '.join(ALLOWED_PERSONALITIES)}.",
                    missing_step="AGENTS",
                )

        # Step 04: Goals & Constraints check
        for agent in agents:
            if not agent.goals or len(agent.goals) == 0:
                raise WorkflowValidationError(f"Agent '{agent.name}' must have at least one defined goal.", missing_step="GOALS")
            if not agent.constraints or len(agent.constraints) == 0:
                raise WorkflowValidationError(f"Agent '{agent.name}' must have at least one defined constraint.", missing_step="GOALS")

        # Step 05: Real scenario data check
        if not session.scenario_data and not session.review_confirmed:
            raise WorkflowValidationError(
                "Scenario data must be provided before starting negotiation.",
                missing_step="SCENARIO_DATA",
            )

        return True, "Negotiation setup is fully valid and ready to start."

    @staticmethod
    def get_current_incomplete_step(session: NegotiationSession) -> str:
        """Determines the first incomplete step ID for workflow progress display."""
        if not session.scenario_id or session.scenario_id not in ALLOWED_SCENARIOS:
            return "SCENARIO"
        if not session.mode or session.mode not in ALLOWED_MODES:
            return "MODE"
        if not session.scenario_data and not session.review_confirmed:
            return "SCENARIO_DATA"
        return "NEGOTIATION"

