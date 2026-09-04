import logging
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.negotiation import NegotiationSession, NegotiationMessage
from app.models.agent import AgentConfiguration
from app.models.report import OutcomeReport
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
        """Executes a negotiation turn with strict concurrency locking, turn order, and state persistence."""
        from app.orchestration.runner import get_session_lock, stop_background_simulation

        lock = get_session_lock(session_id)
        async with lock:
            stmt = (
                select(NegotiationSession)
                .where(NegotiationSession.id == session_id)
                .options(
                    selectinload(NegotiationSession.agents).selectinload(AgentConfiguration.goals),
                    selectinload(NegotiationSession.agents).selectinload(AgentConfiguration.constraints),
                    selectinload(NegotiationSession.messages),
                )
            )
            if db.bind and getattr(getattr(db, "bind", None), "dialect", None) and getattr(db.bind.dialect, "name", "") != "sqlite":
                stmt = stmt.with_for_update()
            result = await db.execute(stmt)
            session = result.scalar_one_or_none()

            if not session:
                raise ValueError(f"Session {session_id} not found")

            # Terminal state guard - no steps allowed from terminal states
            if session.status in ["finished", "deadlock", "terminated"]:
                stop_background_simulation(session.id)
                return {
                    "status": session.status,
                    "round": session.current_round,
                    "current_turn_speaker": session.current_speaker or "",
                    "next_speaker": session.current_speaker or "",
                    "message": None,
                    "agreement_reached": session.agreement_reached,
                    "final_terms": session.final_terms,
                }

            agents = list(session.agents or [])
            if not agents:
                raise ValueError(f"Session {session_id} has no configured agents")

            # Sort messages strictly by round, turn_index, timestamp
            raw_messages = list(session.messages or [])
            raw_messages.sort(key=lambda m: (m.round or 1, m.turn_index or 0, getattr(m, "timestamp", None) or getattr(m, "created_at", None)))
            messages = raw_messages
            turn_count = len(messages)

            # Determine human agent position in human-ai mode
            human_agent = None
            if session.mode == "human-ai":
                human_role_clean = (getattr(session, "human_role", "") or "").lower()
                # If human_role is vendor/candidate/project-manager, human is agent 1 (index 1), else agent 0 (index 0)
                is_agent_1_human = any(k in human_role_clean for k in ["vendor", "candidate", "project", "pm"]) or (
                    len(agents) > 1 and human_role_clean == (agents[1].role or "").lower()
                )
                human_agent = agents[1] if (is_agent_1_human and len(agents) > 1) else agents[0]

            # Deterministic current turn speaker calculation
            current_speaker_idx = turn_count % len(agents)
            is_human_turn = session.mode == "human-ai" and human_agent and (agents[current_speaker_idx].id == human_agent.id)

            # If it's the human's turn but no user_message is provided, DO NOT generate AI turn for human
            if is_human_turn and user_message is None:
                session.status = "waiting_for_human"
                session.current_speaker = human_agent.name
                await db.commit()
                return {
                    "status": "waiting_for_human",
                    "round": (turn_count // len(agents)) + 1,
                    "current_turn_speaker": human_agent.name,
                    "next_speaker": human_agent.name,
                    "message": None,
                    "agreement_reached": session.agreement_reached,
                    "final_terms": session.final_terms,
                }

            # Handle Human Turn input
            if session.mode == "human-ai" and user_message is not None:
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

                # Idempotency / duplicate check for human message
                user_msg_content = user_message.strip()
                if messages and messages[-1].is_user and messages[-1].content == user_msg_content:
                    logger.warning(f"[IDEMPOTENCY] Duplicate human message detected for session {session.id}. Skipping duplicate persistence.")
                    user_msg = messages[-1]
                else:
                    user_msg = NegotiationMessage(
                        session_id=session.id,
                        sender=human_agent.name if (human_agent and human_agent.name) else "You (User)",
                        role=human_agent.role if (human_agent and human_agent.role) else "Participant",
                        avatar=human_agent.avatar if (human_agent and human_agent.avatar) else "US",
                        content=user_msg_content,
                        offer_data=user_offer or {},
                        round=(turn_count // len(agents)) + 1,
                        turn_index=turn_count,
                        is_user=True,
                    )
                    db.add(user_msg)
                    await db.flush()
                    messages.append(user_msg)
                    turn_count += 1

                    if user_offer:
                        session.latest_offer = user_offer
                        session.latest_offer_sender = user_msg.sender

            # Deterministic turn order calculation for active AI speaker
            speaker_idx = turn_count % len(agents)
            calculated_round = (turn_count // len(agents)) + 1
            active_speaker_name = agents[speaker_idx].name

            session.current_round = calculated_round
            session.current_turn_index = turn_count
            session.current_speaker = active_speaker_name

            logger.info(
                f"[NEGOTIATION TURN ENTRY] session_id={session.id} | mode={session.mode} | "
                f"round={session.current_round} | turn_index={turn_count} | speaker={active_speaker_name} | "
                f"message_count={len(messages)}"
            )

            # Construct LangGraph State
            initial_state: NegotiationState = {
                "session_id": session.id,
                "scenario_id": session.scenario_id,
                "mode": session.mode,
                "current_round": session.current_round,
                "max_rounds": session.max_rounds,
                "current_speaker_index": speaker_idx,
                "current_turn_speaker": active_speaker_name,
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
                "current_offer": session.latest_offer or session.final_terms,
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
                    "current_turn_speaker": active_speaker_name,
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
                round=calculated_round,
                turn_index=turn_count,
                is_user=False,
            )
            db.add(ai_msg)

            # Record authoritative LLM token usage telemetry for this turn
            from app.services.llm_usage_service import LLMUsageService
            latest_decision_dict = initial_state.get("latest_decision") or {}
            dec_provider = latest_decision_dict.get("provider") or "rule_fallback"
            dec_model = latest_decision_dict.get("model") or "unknown"
            dec_usage = latest_decision_dict.get("token_usage") or {
                "input_tokens": None,
                "output_tokens": None,
                "total_tokens": None,
                "usage_available": False,
            }
            active_speaker_agent = agents[speaker_idx] if speaker_idx < len(agents) else None
            await LLMUsageService.record_usage(
                db=db,
                session_id=session.id,
                message_id=ai_msg.id,
                agent_id=active_speaker_agent.id if active_speaker_agent else None,
                agent_name=ai_msg.sender,
                agent_role=ai_msg.role,
                round_number=calculated_round,
                turn_index=turn_count,
                provider=dec_provider,
                model=dec_model,
                usage_data=dec_usage,
                operation_type="negotiation_turn",
                status="success",
            )

            # Update latest offer tracking on session
            if ai_msg.offer_data and isinstance(ai_msg.offer_data, dict) and len(ai_msg.offer_data) > 0:
                session.latest_offer = ai_msg.offer_data
                session.latest_offer_sender = ai_msg.sender

            session.current_turn_index = turn_count + 1
            next_speaker_idx = (turn_count + 1) % len(agents)
            next_round = ((turn_count + 1) // len(agents)) + 1
            session.current_round = next_round
            session.current_speaker = agents[next_speaker_idx].name
            report_id = None
            report_status = "not_generated"
            if initial_state["status"] in ["finished", "deadlock"]:
                agreement_flag = initial_state.get("agreement_reached", False)
                terms = initial_state.get("current_offer") if agreement_flag else None
                report = await self.finalize_negotiation_session(
                    session=session,
                    terminal_status=initial_state["status"],
                    db=db,
                    agreement_reached=agreement_flag,
                    final_terms=terms,
                )
                report_id = report.id if report else session.id
                report_status = "generated" if report else "failed"
            else:
                # In human-ai mode, if next turn is for the human, set status to waiting_for_human
                if session.mode == "human-ai" and human_agent and (agents[next_speaker_idx].id == human_agent.id):
                    session.status = "waiting_for_human"
                else:
                    session.status = "running"
                await db.commit()

            logger.info(
                f"[NEGOTIATION TURN EXIT] session_id={session.id} | mode={session.mode} | "
                f"round={session.current_round} | status={session.status} | "
                f"agreement={session.agreement_reached} | next_speaker={session.current_speaker} | "
                f"report_id={report_id} | report_status={report_status}"
            )

            return {
                "status": session.status,
                "round": session.current_round,
                "current_turn_speaker": ai_msg.sender,
                "next_speaker": session.current_speaker,
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
                "report_id": report_id,
                "report_status": report_status,
                "token_usage": dec_usage,
            }

    @classmethod
    async def finalize_negotiation_session(
        cls,
        session: NegotiationSession,
        terminal_status: str,
        db: AsyncSession,
        agreement_reached: bool = False,
        final_terms: Optional[Dict[str, Any]] = None,
        outcome_str: Optional[str] = None,
    ) -> OutcomeReport:
        """Authoritative single terminal completion handler: transitions state, halts simulation runner, and generates/persists outcome report."""
        session.status = terminal_status
        session.agreement_reached = agreement_reached
        session.final_terms = final_terms if agreement_reached else (final_terms or {})
        await db.commit()
        await db.refresh(session)

        # Halt background task if running
        try:
            from app.orchestration.runner import stop_background_simulation
            stop_background_simulation(session.id)
        except Exception:
            pass

        # Determine outcome descriptor
        if not outcome_str:
            if terminal_status == "finished" or agreement_reached:
                outcome_str = "Agreement Reached"
            elif terminal_status == "deadlock":
                outcome_str = "Deadlock"
            elif terminal_status == "terminated":
                outcome_str = "Stopped by User"
            else:
                outcome_str = "Concluded"

        report = await ReportGenerator.generate_and_save_report(session, outcome_str, db)
        return report

