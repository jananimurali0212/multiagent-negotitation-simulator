import logging
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.negotiation import NegotiationSession, NegotiationMessage
from app.models.agent import AgentConfiguration
from app.orchestration.graph_nodes import LangGraphNegotiationEngine, NegotiationState
from app.reports.report_generator import ReportGenerator
from app.schemas.agent import AgentConfigSchema
from app.negotiation.rules.offer_rules import OfferRules
from app.negotiation.rules.constraint_rules import ConstraintRules
from app.negotiation.rules.acceptance_rules import AcceptanceRules

logger = logging.getLogger("backend.orchestrator")

try:
    from langgraph.graph import StateGraph, END
    LANGGRAPH_INSTALLED = True
except ImportError:
    LANGGRAPH_INSTALLED = False
    END = "__end__"


class OrchestratorService:
    def __init__(self):
        self.engine = LangGraphNegotiationEngine()
        self.workflow = None

        if LANGGRAPH_INSTALLED:
            try:
                builder = StateGraph(NegotiationState)
                builder.add_node("agent_reasoning", self.engine.agent_reasoning_node)
                builder.add_node("offer_evaluator", self.engine.offer_evaluator_node)
                builder.set_entry_point("agent_reasoning")
                builder.add_edge("agent_reasoning", "offer_evaluator")
                builder.add_conditional_edges(
                    "offer_evaluator",
                    self.engine.routing_condition,
                    {"continue": END, "end": END},
                )
                self.workflow = builder.compile()
            except Exception as e:
                logger.warning(f"LangGraph compilation note: {e}")

    async def execute_turn(
        self,
        session_id: str,
        db: AsyncSession,
        user_message: Optional[str] = None,
        user_offer: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Executes a negotiation turn using LangGraph StateGraph engine."""
        stmt = (
            select(NegotiationSession)
            .where(NegotiationSession.id == session_id)
            .options(
                selectinload(NegotiationSession.agents).selectinload(AgentConfiguration.goals),
                selectinload(NegotiationSession.agents).selectinload(AgentConfiguration.constraints),
                selectinload(NegotiationSession.messages),
            )
        )
        result = await db.execute(stmt)
        session = result.scalar_one_or_none()

        if not session:
            raise ValueError(f"Session {session_id} not found")

        if session.status in ["finished", "deadlock", "terminated"]:
            return {
                "status": session.status,
                "round": session.current_round,
                "message": None,
                "agreement_reached": session.agreement_reached,
                "final_terms": session.final_terms,
            }

        agents = session.agents
        messages = session.messages or []
        turn_count = len(messages)

        # Handle Human vs AI mode user input with Phase 3 validation
        if session.mode == "human-ai" and user_message:
            human_role_clean = (getattr(session, "human_role", "") or "").lower()
            is_agent_1_human = human_role_clean in ["vendor", "recruiter", "finance-lead"] or (
                len(agents) > 1 and human_role_clean == (agents[1].role or "").lower()
            )
            human_agent = agents[1] if (is_agent_1_human and len(agents) > 1) else agents[0]

            # Build AgentConfigSchema for validation
            human_schema = AgentConfigSchema(
                id=human_agent.id,
                agent_template_id=human_agent.agent_template_id or "unknown",
                name=human_agent.name or "You (User)",
                role=human_agent.role or "Participant",
                avatar=human_agent.avatar or "US",
                personality=human_agent.personality or "Collaborative",
                experience=human_agent.experience or "Medium",
                goals=[{"priority": g.priority, "text": g.text} for g in human_agent.goals] if human_agent.goals else [],
                constraints=[{"label": c.label, "value": c.value} for c in human_agent.constraints] if human_agent.constraints else [],
                negotiation_parameters=human_agent.negotiation_parameters or {},
            )

            # Validate user offer structure and constraints
            if user_offer:
                struct_res = OfferRules.validate_offer_structure(session.scenario_id, user_offer, action="counteroffer")
                if not struct_res.is_valid:
                    return {
                        "status": session.status,
                        "round": session.current_round,
                        "current_turn_speaker": human_agent.name if human_agent else "",
                        "message": None,
                        "agreement_reached": False,
                        "final_terms": None,
                        "validation_error": struct_res.human_safe_message,
                    }

                constraint_res = ConstraintRules.validate_agent_constraints(human_schema, session.scenario_id, user_offer, action="counteroffer")
                if not constraint_res.is_valid:
                    return {
                        "status": session.status,
                        "round": session.current_round,
                        "current_turn_speaker": human_agent.name if human_agent else "",
                        "message": None,
                        "agreement_reached": False,
                        "final_terms": None,
                        "validation_error": constraint_res.human_safe_message,
                    }

            # Validate user acceptance
            if user_message.strip().lower() == "accept":
                existing_msgs = [
                    {
                        "sender": m.sender, "role": m.role, "content": m.content,
                        "offer_data": m.offer_data, "round": m.round,
                    }
                    for m in messages
                ]
                acc_res = AcceptanceRules.validate_acceptance(
                    human_schema, session.scenario_id, user_offer, existing_msgs, status=session.status
                )
                if not acc_res.is_valid:
                    return {
                        "status": session.status,
                        "round": session.current_round,
                        "current_turn_speaker": human_agent.name if human_agent else "",
                        "message": None,
                        "agreement_reached": False,
                        "final_terms": None,
                        "validation_error": acc_res.human_safe_message,
                    }

            user_msg = NegotiationMessage(
                session_id=session.id,
                sender=human_agent.name if (human_agent and human_agent.name) else "You (User)",
                role=human_agent.role if (human_agent and human_agent.role) else "Participant",
                avatar=human_agent.avatar if (human_agent and human_agent.avatar) else "US",
                content=user_message,
                offer_data=user_offer or {},
                round=session.current_round,
                turn_index=turn_count,
                is_user=True,
            )
            db.add(user_msg)
            await db.flush()
            messages.append(user_msg)
            turn_count += 1

        speaker_idx = turn_count % len(agents)

        logger.info(
            f"[NEGOTIATION TURN ENTRY] session_id={session.id} | mode={session.mode} | "
            f"round={session.current_round} | speaker={agents[speaker_idx].name} | "
            f"message_count={len(messages)} | user_message_present={bool(user_message)}"
        )

        # Construct LangGraph State
        initial_state: NegotiationState = {
            "session_id": session.id,
            "scenario_id": session.scenario_id,
            "mode": session.mode,
            "current_round": session.current_round,
            "max_rounds": session.max_rounds,
            "current_speaker_index": speaker_idx,
            "current_turn_speaker": agents[speaker_idx].name,
            "agents": [
                {
                    "id": a.id,
                    "agent_template_id": a.agent_template_id,
                    "name": a.name,
                    "role": a.role,
                    "avatar": a.avatar,
                    "personality": a.personality,
                    "experience": a.experience,
                    "negotiation_parameters": a.negotiation_parameters or {},
                    "goals": [{"priority": g.priority, "text": g.text} for g in a.goals],
                    "constraints": [{"label": c.label, "value": c.value} for c in a.constraints],
                }
                for a in agents
            ],
            "messages": [
                {
                    "sender": m.sender,
                    "role": m.role,
                    "avatar": m.avatar,
                    "content": m.content,
                    "offer_data": m.offer_data,
                    "round": m.round,
                    "turn_index": m.turn_index,
                    "is_user": m.is_user,
                }
                for m in messages
            ],
            "current_offer": session.final_terms,
            "agreement_reached": session.agreement_reached,
            "deadlock_detected": False,
            "status": session.status,
            "latest_decision": None,
        }

        # Run compiled LangGraph workflow if available, otherwise execute nodes
        if self.workflow:
            final_graph_state = await self.workflow.ainvoke(initial_state)
            initial_state.update(final_graph_state)
        else:
            reasoning_res = await self.engine.agent_reasoning_node(initial_state)
            initial_state.update(reasoning_res)
            eval_res = self.engine.offer_evaluator_node(initial_state)
            initial_state.update(eval_res)

        # Persist new message (guard against blocked decisions with no new messages)
        new_messages = initial_state["messages"]
        if not new_messages or len(new_messages) <= turn_count:
            logger.warning(f"[NEGOTIATION TURN BLOCKED] session_id={session.id} | decision blocked by validation")
            return {
                "status": session.status,
                "round": session.current_round,
                "current_turn_speaker": agents[speaker_idx].name,
                "message": None,
                "agreement_reached": session.agreement_reached,
                "final_terms": session.final_terms,
                "validation_blocked": True,
            }

        latest_msg_data = new_messages[-1]
        ai_msg = NegotiationMessage(
            session_id=session.id,
            sender=latest_msg_data["sender"],
            role=latest_msg_data["role"],
            avatar=latest_msg_data["avatar"],
            content=latest_msg_data["content"],
            rationale_summary=latest_msg_data.get("rationale_summary"),
            offer_data=latest_msg_data.get("offer_data", {}),
            round=latest_msg_data["round"],
            turn_index=latest_msg_data["turn_index"],
            is_user=False,
        )
        db.add(ai_msg)

        session.current_round = initial_state["current_round"]

        if initial_state["status"] in ["finished", "deadlock"]:
            session.status = initial_state["status"]
            session.agreement_reached = initial_state.get("agreement_reached", False)
            session.final_terms = initial_state.get("current_offer") or {}
            await db.commit()

            outcome_str = "Agreement Reached" if session.agreement_reached else "Deadlock"
            await ReportGenerator.generate_and_save_report(session, outcome_str, db)
        else:
            await db.commit()

        logger.info(
            f"[NEGOTIATION TURN EXIT] session_id={session.id} | mode={session.mode} | "
            f"round={session.current_round} | status={session.status} | "
            f"agreement={session.agreement_reached}"
        )

        return {
            "status": session.status,
            "round": session.current_round,
            "current_turn_speaker": ai_msg.sender,
            "message": {
                "id": ai_msg.id,
                "sender": ai_msg.sender,
                "role": ai_msg.role,
                "avatar": ai_msg.avatar,
                "content": ai_msg.content,
                "round": ai_msg.round,
                "turn_index": ai_msg.turn_index,
                "is_user": False,
                "timestamp": ai_msg.timestamp.isoformat(),
                "offer_data": ai_msg.offer_data,
            },
            "agreement_reached": session.agreement_reached,
            "final_terms": session.final_terms,
        }

