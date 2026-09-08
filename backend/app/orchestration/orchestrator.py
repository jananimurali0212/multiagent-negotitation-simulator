import re
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
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

    @staticmethod
    def _extract_offer_from_text(scenario_id: str, text: str, default_curr: str = "") -> Dict[str, Any]:
        """Extracts structured offer dimensions from natural language input across all currency/format variations."""
        offer: Dict[str, Any] = {}
        if not text:
            return offer

        text_lower = text.lower()
        curr_match = re.search(r"([₹$€£]|rs\.?|inr|usd|eur|gbp)", text, re.IGNORECASE)
        curr = curr_match.group(1).strip() if curr_match else default_curr
        if curr.lower() in ["rs", "rs.", "inr"]:
            curr = "₹"
        elif curr.lower() == "usd":
            curr = "$"
        elif curr.lower() == "eur":
            curr = "€"
        elif curr.lower() == "gbp":
            curr = "£"

        if scenario_id == "vendor-pricing":
            price_val = None
            unit_suffix = ""
            explicit_price = re.search(r"(?:[₹$€£]|rs\.?|inr|usd|eur|gbp)\s*(\d+(?:,\d{3})*(?:\.\d+)?|\d+(?:,\d{2})*(?:\.\d+)?|\d+)(\s*\/\s*(?:user|seat|month|unit|mo|yr)(?:\s*\/\s*(?:month|mo|yr))?)?", text, re.IGNORECASE)
            if explicit_price:
                price_val = float(explicit_price.group(1).replace(",", ""))
                if explicit_price.group(2):
                    unit_suffix = explicit_price.group(2).strip()
            else:
                word_price = re.search(r"(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:[₹$€£]|dollars?|rupees?|bucks?|\/\s*(?:user|seat|month|unit|mo|yr)|per\s*(?:user|seat|month|unit|mo))", text, re.IGNORECASE)
                if word_price:
                    price_val = float(word_price.group(1).replace(",", ""))
                else:
                    verb_price = re.search(r"(?:pay|offer|rate|at|to|price\s*of|price\s*is|for)\s*(?:[₹$€£]\s*)?(\d+(?:,\d+)*(?:\.\d+)?)", text, re.IGNORECASE)
                    if verb_price:
                        price_val = float(verb_price.group(1).replace(",", ""))

            if price_val is not None:
                formatted_num = f"{price_val:,.2f}" if price_val != int(price_val) else f"{int(price_val):,}"
                offer["price"] = f"{curr}{formatted_num}{unit_suffix}"

            if "net-60" in text_lower or "net 60" in text_lower:
                offer["paymentTerms"] = "Net-60"
            elif "net-45" in text_lower or "net 45" in text_lower:
                offer["paymentTerms"] = "Net-45"
            elif "net-30" in text_lower or "net 30" in text_lower:
                offer["paymentTerms"] = "Net-30"

            if "gold" in text_lower:
                offer["warranty"] = "Gold Support"
            elif "silver" in text_lower:
                offer["warranty"] = "Silver Support"
            elif "standard" in text_lower:
                offer["warranty"] = "Standard Support"

        elif scenario_id == "job-offer":
            sal_val = None
            k_match = re.search(r"(?:[₹$€£]|rs\.?|inr|usd|\b)\s*(\d{1,4})\s*k\b", text, re.IGNORECASE)
            if k_match:
                sal_val = int(k_match.group(1)) * 1000
            else:
                sal_match = re.search(r"(?:[₹$€£]|rs\.?|inr|usd)?\s*(\d{1,3}(?:,\d{3})+|\d{1,2}(?:,\d{2})*,\d{3}|\d{4,9})\b", text)
                if sal_match:
                    num_clean = int(sal_match.group(1).replace(",", ""))
                    sal_val = num_clean

            if sal_val:
                offer["salary"] = f"{curr}{sal_val:,}"

            eq_k_match = re.search(r"(\d{1,3})\s*k\s*(?:shares|options|units|equity|stock)", text, re.IGNORECASE)
            if eq_k_match:
                eq_val = int(eq_k_match.group(1)) * 1000
                offer["equity"] = f"{eq_val:,} shares"
            else:
                eq_match = re.search(r"(\d{1,3}(?:,\d{3})+|\d{4,6})\s*(?:shares|options|units|equity|stock)", text, re.IGNORECASE)
                if eq_match:
                    num_eq = int(eq_match.group(1).replace(",", ""))
                    offer["equity"] = f"{num_eq:,} shares"

            remote_match = re.search(r"(\d+)\s*(?:days?\s*(?:remote|wfh|from home|in office)|remote\s*days?)", text, re.IGNORECASE)
            if remote_match:
                offer["remoteDays"] = f"{remote_match.group(1)} days remote"
            elif "fully remote" in text_lower or "full remote" in text_lower:
                offer["remoteDays"] = "5 days remote"
            elif "remote" in text_lower:
                offer["workMode"] = "Remote"
            elif "hybrid" in text_lower:
                offer["workMode"] = "Hybrid"
            elif "onsite" in text_lower or "on-site" in text_lower or "office" in text_lower:
                offer["workMode"] = "On-site"

        elif scenario_id == "budget-allocation":
            bud_match = re.search(r"(?:[₹$€£]|rs\.?|inr|usd)?\s*(\d{1,3}(?:,\d{3})+|\d{1,2}(?:,\d{2})*,\d{3}|\d{4,9})\b", text)
            if bud_match:
                offer["totalBudget"] = f"{curr}{int(bud_match.group(1).replace(',', '')):,}"

        return offer

    @staticmethod
    def _is_acceptance_intent(text: str) -> bool:
        """Determines if the user message conveys clear acceptance intent."""
        if not text:
            return False
        clean = text.strip().lower()
        # Explicit negation check
        if any(neg in clean for neg in ["cannot accept", "can't accept", "not accept", "do not accept", "won't accept", "unable to accept", "reject", "counter"]):
            return False

        accept_exact = {"accept", "accepted", "i accept", "agree", "i agree", "deal", "done deal", "sounds good", "let's do it", "we accept", "i agree to these terms"}
        if clean in accept_exact:
            return True

        accept_phrases = [
            "i accept", "we accept", "accept your", "accept the", "accept this",
            "agree to", "agreed to", "deal", "happy to accept", "delighted to accept", "pleased to accept"
        ]
        return any(phrase in clean for phrase in accept_phrases)

    @staticmethod
    def _record_structured_event(
        session: NegotiationSession,
        speaker: str,
        role: str,
        round_num: int,
        turn_index: int,
        offer_data: Dict[str, Any],
        content: str,
        is_accept: bool = False,
    ):
        """Records a structured negotiation event (Offer, Counteroffer, Concession, Acceptance)."""
        events = list(session.structured_events or [])
        event_type = "offer"
        summary = ""
        concessions = []

        if is_accept:
            event_type = "acceptance"
            terms_str = ", ".join(f"{k}: {v}" for k, v in offer_data.items()) if offer_data else "All proposed terms"
            summary = f"Acceptance -> Agreed on {terms_str}"
        elif offer_data:
            prev_events = [e for e in events if e.get("terms")]
            if prev_events:
                event_type = "counteroffer"
                last_event = prev_events[-1]
                last_terms = last_event.get("terms", {})
                for k, v in offer_data.items():
                    if k in last_terms and str(last_terms[k]) != str(v):
                        concessions.append(f"{k.capitalize()} adjusted from {last_terms[k]} to {v}")
                if concessions:
                    event_type = "concession"
                terms_str = ", ".join(f"{k}: {v}" for k, v in offer_data.items())
                summary = f"{event_type.capitalize()} -> {terms_str}"
            else:
                event_type = "offer"
                terms_str = ", ".join(f"{k}: {v}" for k, v in offer_data.items())
                summary = f"Opening Offer -> {terms_str}"
        else:
            event_type = "statement"
            short_content = content[:80] + "..." if len(content) > 80 else content
            summary = f"Dialogue -> {short_content}"

        event = {
            "round": round_num,
            "turn_index": turn_index,
            "speaker": speaker,
            "role": role,
            "event_type": event_type,
            "summary": summary,
            "terms": offer_data or {},
            "concessions": concessions,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        events.append(event)
        session.structured_events = events

    async def execute_turn(
        self,
        session_id: str,
        db: AsyncSession,
        user_message: Optional[str] = None,
        user_offer: Optional[Dict[str, Any]] = None,
        turn_index: Optional[int] = None,
        request_id: Optional[str] = None,
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

        if user_message is not None:
            user_message = user_message.strip()
            if not user_message:
                user_message = None

        if session.status in ["finished", "deadlock", "terminated"]:
            return {
                "status": session.status,
                "round": session.current_round,
                "message": None,
                "agreement_reached": session.agreement_reached,
                "final_terms": session.final_terms,
            }

        from app.orchestration.turn_resolver import TurnResolver

        ordered_agents = TurnResolver.get_ordered_agents(session.scenario_id, session.agents)
        if not ordered_agents:
            ordered_agents = session.agents

        messages = session.messages or []
        turn_count = len(messages)

        # Handle Human vs AI mode turn authority
        if session.mode == "human-ai":
            human_agent = TurnResolver.resolve_human_agent(session.scenario_id, getattr(session, "human_role", None), ordered_agents)
            current_speaker_ag = TurnResolver.get_current_speaker(session.scenario_id, ordered_agents, turn_count)
            is_human = TurnResolver.is_human_turn(
                session.scenario_id, session.mode, getattr(session, "human_role", None), ordered_agents, turn_count
            )

            if not user_message:
                # Backend Turn Guard: If it is the human's turn, AI must NOT execute
                if is_human:
                    logger.info(
                        f"[WAITING FOR HUMAN] session_id={session.id} | speaker={getattr(human_agent, 'name', '')} | turn_index={turn_count}"
                    )
                    if session.status != "waiting_for_human":
                        session.status = "waiting_for_human"
                        await db.commit()
                    return {
                        "status": "waiting_for_human",
                        "round": session.current_round,
                        "current_turn_speaker": getattr(human_agent, "name", "You"),
                        "message": None,
                        "agreement_reached": session.agreement_reached,
                        "final_terms": session.final_terms,
                        "is_human_turn": True,
                    }
            else:
                # User message provided: First check explicit turn_index idempotency
                if turn_index is not None:
                    existing_user_m = next((m for m in messages if m.is_user and m.turn_index == turn_index), None)
                    if existing_user_m:
                        last_ai_m = next(
                            (m for m in messages if not m.is_user and m.turn_index > turn_index),
                            messages[-1] if (messages and not messages[-1].is_user) else None,
                        )
                        if last_ai_m:
                            logger.info(f"[DUPLICATE HUMAN REQUEST BY TURN_INDEX] session_id={session.id} | turn_index={turn_index}")
                            next_speaker_ag = TurnResolver.get_current_speaker(session.scenario_id, ordered_agents, len(messages))
                            next_is_human = TurnResolver.is_human_turn(
                                session.scenario_id, session.mode, getattr(session, "human_role", None), ordered_agents, len(messages)
                            )
                            return {
                                "status": session.status,
                                "round": session.current_round,
                                "current_turn_speaker": getattr(next_speaker_ag, "name", ""),
                                "message": {
                                    "id": last_ai_m.id,
                                    "sender": last_ai_m.sender,
                                    "role": last_ai_m.role,
                                    "avatar": last_ai_m.avatar,
                                    "content": last_ai_m.content,
                                    "rationale_summary": getattr(last_ai_m, "rationale_summary", None),
                                    "round": last_ai_m.round,
                                    "turn_index": last_ai_m.turn_index,
                                    "is_user": False,
                                    "timestamp": (last_ai_m.timestamp or datetime.now(timezone.utc)).isoformat(),
                                    "offer_data": last_ai_m.offer_data,
                                },
                                "agreement_reached": session.agreement_reached,
                                "final_terms": session.final_terms,
                                "is_human_turn": next_is_human,
                            }

                # Check duplicate retry of recent message
                last_user_m = next((m for m in reversed(messages) if m.is_user), None)
                if last_user_m and last_user_m.content == user_message:
                    last_ai_m = messages[-1] if (messages and not messages[-1].is_user) else None
                    if last_ai_m and last_ai_m.turn_index > last_user_m.turn_index:
                        logger.info(f"[DUPLICATE HUMAN REQUEST IGNORED] session_id={session.id}")
                        next_speaker_ag = TurnResolver.get_current_speaker(session.scenario_id, ordered_agents, len(messages))
                        next_is_human = TurnResolver.is_human_turn(
                            session.scenario_id, session.mode, getattr(session, "human_role", None), ordered_agents, len(messages)
                        )
                        return {
                            "status": session.status,
                            "round": session.current_round,
                            "current_turn_speaker": getattr(next_speaker_ag, "name", ""),
                            "message": {
                                "id": last_ai_m.id,
                                "sender": last_ai_m.sender,
                                "role": last_ai_m.role,
                                "avatar": last_ai_m.avatar,
                                "content": last_ai_m.content,
                                "rationale_summary": getattr(last_ai_m, "rationale_summary", None),
                                "round": last_ai_m.round,
                                "turn_index": last_ai_m.turn_index,
                                "is_user": False,
                                "timestamp": (last_ai_m.timestamp or datetime.now(timezone.utc)).isoformat(),
                                "offer_data": last_ai_m.offer_data,
                            },
                            "agreement_reached": session.agreement_reached,
                            "final_terms": session.final_terms,
                            "is_human_turn": next_is_human,
                        }

                # Strict Human-Turn Guard: Reject out-of-turn submissions
                if not is_human:
                    logger.warning(
                        f"[HUMAN TURN REJECTED] session_id={session.id} | authoritative_speaker={getattr(current_speaker_ag, 'name', '')} | "
                        f"human_agent={getattr(human_agent, 'name', '')} | turn_index={turn_count}"
                    )
                    return {
                        "status": session.status,
                        "round": session.current_round,
                        "current_turn_speaker": getattr(current_speaker_ag, "name", ""),
                        "message": None,
                        "agreement_reached": session.agreement_reached,
                        "final_terms": session.final_terms,
                        "validation_error": "It is not the human player's turn to speak.",
                        "is_human_turn": False,
                    }

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

                sc_curr = ReportGenerator._detect_currency(session.scenario_data or {}, default="")
                if not sc_curr and messages:
                    for m in messages:
                        if m.content:
                            c_detected = ReportGenerator._detect_currency({"content": m.content}, default="")
                            if c_detected:
                                sc_curr = c_detected
                                break

                # Extract terms from text if user_offer is empty
                effective_user_offer = user_offer or self._extract_offer_from_text(session.scenario_id, user_message, default_curr=sc_curr)

                is_accept = self._is_acceptance_intent(user_message)

                # Handle User Acceptance
                if is_accept:
                    existing_msgs = [
                        {
                            "sender": m.sender, "role": m.role, "content": m.content,
                            "offer_data": m.offer_data, "round": m.round,
                        }
                        for m in messages
                    ]
                    # Resolve offer terms to accept
                    terms_to_accept = effective_user_offer or session.final_terms
                    if not terms_to_accept:
                        for m in reversed(messages):
                            if m.offer_data:
                                terms_to_accept = dict(m.offer_data)
                                break

                    if terms_to_accept and sc_curr:
                        terms_to_accept = dict(terms_to_accept)
                        if "salary" in terms_to_accept:
                            s_num = ReportGenerator._parse_num(terms_to_accept["salary"])
                            if s_num:
                                terms_to_accept["salary"] = f"{sc_curr}{int(s_num):,}"
                        elif "price" in terms_to_accept:
                            p_num = ReportGenerator._parse_num(terms_to_accept["price"])
                            if p_num:
                                terms_to_accept["price"] = f"{sc_curr}{int(p_num):,}" if p_num == int(p_num) else f"{sc_curr}{p_num:,.2f}"

                    acc_res = AcceptanceRules.validate_acceptance(
                        human_schema, session.scenario_id, terms_to_accept, existing_msgs, status=session.status
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

                    # Human accepted validly
                    user_msg = NegotiationMessage(
                        session_id=session.id,
                        sender=human_agent.name if (human_agent and human_agent.name) else "You (User)",
                        role=human_agent.role if (human_agent and human_agent.role) else "Participant",
                        avatar=human_agent.avatar if (human_agent and human_agent.avatar) else "US",
                        content=user_message,
                        offer_data=terms_to_accept or {},
                        round=session.current_round,
                        turn_index=turn_count,
                        is_user=True,
                    )
                    db.add(user_msg)
                    self._record_structured_event(
                        session, user_msg.sender, user_msg.role, session.current_round, turn_count, terms_to_accept or {}, user_message, is_accept=True
                    )

                    session.status = "finished"
                    session.agreement_reached = True
                    session.final_terms = terms_to_accept or {}
                    await db.commit()

                    await ReportGenerator.generate_and_save_report(session, "Agreement Reached", db)

                    return {
                        "status": "finished",
                        "round": session.current_round,
                        "current_turn_speaker": human_agent.name,
                        "message": {
                            "id": user_msg.id,
                            "sender": user_msg.sender,
                            "role": user_msg.role,
                            "avatar": user_msg.avatar,
                            "content": user_msg.content,
                            "round": user_msg.round,
                            "turn_index": user_msg.turn_index,
                            "is_user": True,
                            "timestamp": (user_msg.timestamp or datetime.now(timezone.utc)).isoformat(),
                            "offer_data": user_msg.offer_data,
                        },
                        "agreement_reached": True,
                        "final_terms": session.final_terms,
                        "is_human_turn": False,
                    }

                # Track constraint and structure notes for human input
                human_validation_note = None
                if effective_user_offer:
                    struct_res = OfferRules.validate_offer_structure(session.scenario_id, effective_user_offer, action="counteroffer")
                    if not struct_res.is_valid:
                        human_validation_note = struct_res.human_safe_message

                    constraint_res = ConstraintRules.validate_agent_constraints(human_schema, session.scenario_id, effective_user_offer, action="counteroffer")
                    if not constraint_res.is_valid and not human_validation_note:
                        human_validation_note = constraint_res.human_safe_message

                user_msg = NegotiationMessage(
                    session_id=session.id,
                    sender=human_agent.name if (human_agent and human_agent.name) else "You (User)",
                    role=human_agent.role if (human_agent and human_agent.role) else "Participant",
                    avatar=human_agent.avatar if (human_agent and human_agent.avatar) else "US",
                    content=user_message,
                    offer_data=effective_user_offer or {},
                    round=session.current_round,
                    turn_index=turn_count,
                    is_user=True,
                )
                db.add(user_msg)
                await db.flush()
                self._record_structured_event(
                    session, user_msg.sender, user_msg.role, session.current_round, turn_count, effective_user_offer or {}, user_message
                )
                messages.append(user_msg)
                turn_count += 1

        speaker_idx = turn_count % len(ordered_agents)
        active_ai_agent = ordered_agents[speaker_idx]

        logger.info(
            f"[NEGOTIATION TURN ENTRY] session_id={session.id} | mode={session.mode} | "
            f"round={session.current_round} | speaker={active_ai_agent.name} ({active_ai_agent.role}) | "
            f"message_count={len(messages)} | user_message_present={bool(user_message)}"
        )

        # Construct LangGraph State
        initial_state: NegotiationState = {
            "session_id": session.id,
            "scenario_id": session.scenario_id,
            "scenario_data": session.scenario_data or {},
            "mode": session.mode,
            "current_round": session.current_round,
            "max_rounds": session.max_rounds,
            "current_speaker_index": speaker_idx,
            "current_turn_speaker": ordered_agents[speaker_idx].name,
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
                for a in ordered_agents
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
            "deadlock_detected": (session.status == "deadlock"),
            "deadlock_reason": getattr(session, "deadlock_reason", None),
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
                "current_turn_speaker": ordered_agents[speaker_idx].name,
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

        ai_action = (initial_state.get("latest_decision") or {}).get("action")
        is_ai_accept = bool(ai_action == "accept" or initial_state.get("agreement_reached", False))
        self._record_structured_event(
            session, ai_msg.sender, ai_msg.role, ai_msg.round, ai_msg.turn_index,
            ai_msg.offer_data or {}, ai_msg.content, is_accept=is_ai_accept
        )

        session.current_round = initial_state["current_round"]

        if initial_state["status"] in ["finished", "deadlock"]:
            session.status = initial_state["status"]
            session.agreement_reached = initial_state.get("agreement_reached", False)
            if initial_state.get("deadlock_reason"):
                session.deadlock_reason = initial_state.get("deadlock_reason")
            raw_final_terms = dict(initial_state.get("current_offer") or {})
            if session.deadlock_reason and "deadlock_reason" not in raw_final_terms:
                raw_final_terms["deadlock_reason"] = session.deadlock_reason
            sc_curr = ReportGenerator._detect_currency(session.scenario_data or {}, default="")
            if sc_curr and raw_final_terms:
                if "salary" in raw_final_terms:
                    s_num = ReportGenerator._parse_num(raw_final_terms["salary"])
                    if s_num:
                        raw_final_terms["salary"] = f"{sc_curr}{int(s_num):,}"
                elif "price" in raw_final_terms:
                    p_num = ReportGenerator._parse_num(raw_final_terms["price"])
                    if p_num:
                        raw_final_terms["price"] = f"{sc_curr}{int(p_num):,}" if p_num == int(p_num) else f"{sc_curr}{p_num:,.2f}"
            session.final_terms = raw_final_terms
            await db.commit()

            outcome_str = "Agreement Reached" if session.agreement_reached else "Deadlock"
            await ReportGenerator.generate_and_save_report(session, outcome_str, db)
            next_speaker_name = ai_msg.sender
            next_is_human = False
        else:
            # Advance turn and determine authoritative next speaker
            next_turn_idx = turn_count + 1
            next_speaker_ag = TurnResolver.get_current_speaker(session.scenario_id, ordered_agents, next_turn_idx)
            next_speaker_name = getattr(next_speaker_ag, "name", "")
            next_is_human = TurnResolver.is_human_turn(
                session.scenario_id, session.mode, getattr(session, "human_role", None), ordered_agents, next_turn_idx
            )
            if session.mode == "human-ai":
                session.status = "waiting_for_human" if next_is_human else "running"
            else:
                session.status = "running"
            await db.commit()

        logger.info(
            f"[NEGOTIATION TURN EXIT] session_id={session.id} | mode={session.mode} | "
            f"round={session.current_round} | status={session.status} | "
            f"next_speaker={next_speaker_name} | is_human_turn={next_is_human} | agreement={session.agreement_reached}"
        )

        return {
            "status": session.status,
            "round": session.current_round,
            "current_turn_speaker": next_speaker_name,
            "message": {
                "id": ai_msg.id,
                "sender": ai_msg.sender,
                "role": ai_msg.role,
                "avatar": ai_msg.avatar,
                "content": ai_msg.content,
                "rationale_summary": ai_msg.rationale_summary,
                "round": ai_msg.round,
                "turn_index": ai_msg.turn_index,
                "is_user": False,
                "timestamp": (ai_msg.timestamp or datetime.now(timezone.utc)).isoformat(),
                "offer_data": ai_msg.offer_data,
            },
            "agreement_reached": session.agreement_reached,
            "deadlock_reason": getattr(session, "deadlock_reason", None),
            "final_terms": session.final_terms,
            "is_human_turn": next_is_human,
        }

