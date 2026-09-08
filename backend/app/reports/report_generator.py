import logging
import re
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.negotiation import NegotiationSession, NegotiationMessage
from app.models.report import OutcomeReport

logger = logging.getLogger("backend.report_generator")


class ReportGenerator:
    @staticmethod
    def _parse_num(val: Any) -> Optional[float]:
        """Safely extracts numeric float value from string or number, supporting Indian & Western formats, Rs., ₹, LPA."""
        if val is None:
            return None
        if isinstance(val, (int, float)):
            return float(val)
        s = str(val).strip()
        if not s:
            return None

        # Cleanly strip currency identifiers without treating trailing dot in 'Rs.' as a decimal point
        s_clean = re.sub(r"(?i)\b(?:rs\.?|inr|usd|eur|gbp)\b|[₹$€£]", " ", s)

        # Detect multipliers (k, lakh, lpa, crore, cr, million, m)
        multiplier = 1.0
        s_lower = s.lower()
        if re.search(r"\b\d+(?:\.\d+)?\s*k\b", s_lower):
            multiplier = 1000.0
        elif "lakh" in s_lower or "lpa" in s_lower:
            multiplier = 100000.0
        elif "crore" in s_lower or re.search(r"\b\d+(?:\.\d+)?\s*cr\b", s_lower):
            multiplier = 10000000.0
        elif "million" in s_lower or re.search(r"\b\d+(?:\.\d+)?\s*m\b", s_lower):
            multiplier = 1000000.0

        # Remove commas
        s_no_commas = s_clean.replace(",", "").strip()
        m = re.search(r"[-+]?\d+(?:\.\d+)?", s_no_commas)
        if m:
            try:
                return float(m.group()) * multiplier
            except ValueError:
                return None
        return None

    @staticmethod
    def _detect_currency(sc_data: Dict[str, Any], default: str = "") -> str:
        """Extracts currency symbol from scenario fields."""
        if not sc_data:
            return default
        if "currency" in sc_data and sc_data["currency"]:
            c = str(sc_data["currency"]).strip()
            if c.lower() in ["rs", "rs.", "inr", "rupee", "rupees"]:
                return "₹"
            elif c.lower() in ["usd", "dollar", "dollars"]:
                return "$"
            elif c.lower() in ["eur", "euro", "euros"]:
                return "€"
            elif c.lower() in ["gbp", "pound", "pounds"]:
                return "£"
            return c

        for val in sc_data.values():
            if not isinstance(val, str):
                continue
            m = re.search(r"([₹$€£]|rs\.?|inr|usd|eur|gbp)", val, re.IGNORECASE)
            if m:
                sym = m.group(1).strip()
                if sym.lower() in ["rs", "rs.", "inr"]:
                    return "₹"
                elif sym.lower() == "usd":
                    return "$"
                elif sym.lower() == "eur":
                    return "€"
                elif sym.lower() == "gbp":
                    return "£"
                return sym
        return default

    @classmethod
    def _build_scenario_analysis(
        cls,
        scenario_id: str,
        sc_data: Dict[str, Any],
        final_terms: Dict[str, Any],
        outcome: str,
        messages: Optional[List[Any]] = None,
        session: Optional[NegotiationSession] = None,
    ) -> Dict[str, Any]:
        """Constructs scenario-specific metrics and comparative analysis dictionary."""
        analysis: Dict[str, Any] = {}
        curr = cls._detect_currency(sc_data, default="")

        if scenario_id == "vendor-pricing":
            init_price = sc_data.get("initial_price") or sc_data.get("initial_vendor_price") or sc_data.get("current_vendor_price") or "Not available"
            target_price = sc_data.get("target_price") or "Not available"
            final_price = final_terms.get("price") or "Not finalized"
            quantity = sc_data.get("quantity") or final_terms.get("quantity") or "Not specified"
            budget = sc_data.get("budget_limit") or sc_data.get("maximum_budget") or "Not specified"
            delivery = final_terms.get("delivery") or sc_data.get("delivery_timeline") or sc_data.get("delivery_requirement") or "Standard"
            quality = final_terms.get("warranty") or sc_data.get("quality_requirements") or sc_data.get("quality_requirement") or "Standard"
            payment_terms = final_terms.get("payment_terms") or final_terms.get("paymentTerms") or sc_data.get("payment_terms") or "Net-30"

            if not curr:
                for p_val in [str(init_price), str(target_price), str(budget), str(final_price)]:
                    c_found = cls._detect_currency({"val": p_val}, default="")
                    if c_found:
                        curr = c_found
                        break

            init_num = cls._parse_num(init_price)
            final_num = cls._parse_num(final_price) if final_price != "Not finalized" else None

            if final_num is not None:
                formatted_p = f"{curr}{final_num:,.2f}" if final_num != int(final_num) else f"{curr}{int(final_num):,}"
                final_price = formatted_p
                final_terms["price"] = formatted_p
            else:
                recovered_price = None
                if messages:
                    from app.negotiation.state_tracker import NegotiationStateTracker
                    cum = NegotiationStateTracker.track_cumulative_state(
                        session_id=getattr(session, "id", ""),
                        scenario_id=scenario_id,
                        mode=getattr(session, "mode", "human-ai"),
                        initial_data=sc_data,
                        messages=[{"sender": getattr(m, "sender", ""), "content": getattr(m, "content", ""), "offer_data": getattr(m, "offer_data", {}), "round": getattr(m, "round", 1)} for m in messages],
                        participants=[],
                        current_round=getattr(session, "current_round", 1),
                        status=getattr(session, "status", outcome),
                    )
                    recovered_price = cum.get("agreed_terms", {}).get("price") or cum.get("current_terms", {}).get("price")
                    for k in ["delivery", "warranty", "payment_terms", "quantity"]:
                        if k in cum.get("current_terms", {}):
                            final_terms[k] = cum["current_terms"][k]
                    delivery = final_terms.get("delivery") or delivery
                    quality = final_terms.get("warranty") or quality
                    payment_terms = final_terms.get("payment_terms") or payment_terms
                    quantity = final_terms.get("quantity") or quantity

                if recovered_price:
                    final_num = cls._parse_num(recovered_price)
                    final_price = recovered_price
                    final_terms["price"] = recovered_price
                elif outcome in ["Agreement Reached", "Agreement"]:
                    if init_num:
                        final_num = float(init_num)
                        final_price = f"{curr}{int(init_num):,}"
                        final_terms["price"] = final_price
                    else:
                        final_price = "Agreed (Baseline)"
                else:
                    final_price = "Not finalized (Deadlock / Incomplete)"
                    final_num = None

            concession_amt = (init_num - final_num) if (init_num and final_num) else 0.0
            savings_pct = f"{(concession_amt / init_num * 100):.1f}%" if (init_num and init_num > 0 and concession_amt > 0) else "0.0%"

            analysis = {
                "initial_price": str(init_price),
                "target_price": str(target_price),
                "final_price": str(final_price),
                "quantity": str(quantity),
                "budget": str(budget),
                "delivery": str(delivery),
                "quality": str(quality),
                "payment_terms": str(payment_terms),
                "price_concessions": f"{curr}{concession_amt:,.2f}" if concession_amt else "0",
                "savings": savings_pct,
                "currency": curr,
            }

        elif scenario_id == "job-offer":
            init_sal = sc_data.get("initial_salary_offer") or sc_data.get("current_initial_salary") or "Not available"
            exp_sal = sc_data.get("expected_salary") or "Not available"
            min_sal = sc_data.get("minimum_acceptable_salary") or "Not available"
            final_sal = final_terms.get("salary") or "Not finalized"
            benefits = final_terms.get("benefits") or sc_data.get("benefits") or "Standard package"
            work_mode = final_terms.get("work_mode") or final_terms.get("workMode") or sc_data.get("work_mode") or "Hybrid"
            location = sc_data.get("location") or "Designated Office"
            joining_date = final_terms.get("joining_date") or final_terms.get("joiningDate") or sc_data.get("joining_date") or "Agreed start"
            notice_period = final_terms.get("notice_period") or sc_data.get("notice_period") or "Standard notice"

            if not curr:
                for s_val in [str(init_sal), str(exp_sal), str(min_sal), str(final_sal)]:
                    c_found = cls._detect_currency({"val": s_val}, default="")
                    if c_found:
                        curr = c_found
                        break

            # Detect salary time unit / scale suffix from user input
            unit_suffix = ""
            for s_field in [str(init_sal), str(exp_sal), str(min_sal)]:
                if any(u in s_field.lower() for u in ["/ month", "/mo", "per month", "p.m."]):
                    unit_suffix = " / month"
                    break
                elif any(u in s_field.lower() for u in ["/ year", "/yr", "per year", "per annum", "p.a."]):
                    unit_suffix = " / year"
                    break
                elif "lpa" in s_field.lower() or "lakh" in s_field.lower():
                    unit_suffix = " LPA"
                    break

            init_num = cls._parse_num(init_sal)
            exp_num = cls._parse_num(exp_sal)
            min_num = cls._parse_num(min_sal)
            final_num = cls._parse_num(final_sal) if final_sal != "Not finalized" else None

            # Format or resolve real final salary grounded strictly in user input and conversation state
            if final_num is not None and final_num > 0:
                final_sal_formatted = f"{curr}{int(final_num):,}{unit_suffix}"
                final_sal = final_sal_formatted
                final_terms["salary"] = final_sal_formatted
            else:
                recovered_sal = None
                if messages:
                    from app.negotiation.state_tracker import NegotiationStateTracker
                    cum = NegotiationStateTracker.track_cumulative_state(
                        session_id=getattr(session, "id", ""),
                        scenario_id=scenario_id,
                        mode=getattr(session, "mode", "human-ai"),
                        initial_data=sc_data,
                        messages=[{"sender": getattr(m, "sender", ""), "content": getattr(m, "content", ""), "offer_data": getattr(m, "offer_data", {}), "round": getattr(m, "round", 1)} for m in messages],
                        participants=[],
                        current_round=getattr(session, "current_round", 1),
                        status=getattr(session, "status", outcome),
                    )
                    recovered_sal = cum.get("agreed_terms", {}).get("salary") or cum.get("current_terms", {}).get("salary")
                    # If recovered salary is 0 or empty, check messages directly for numeric offers
                    if not recovered_sal or cls._parse_num(recovered_sal) in [None, 0.0]:
                        for m_obj in reversed(messages):
                            m_text = getattr(m_obj, "content", "")
                            m_data = getattr(m_obj, "offer_data", {}) or {}
                            m_sal = m_data.get("salary")
                            if m_sal and cls._parse_num(m_sal) not in [None, 0.0]:
                                recovered_sal = m_sal
                                break
                            parsed_from_text = NegotiationStateTracker.parse_numeric(m_text)
                            if parsed_from_text and parsed_from_text > 500:
                                recovered_sal = f"{curr}{int(parsed_from_text):,}{unit_suffix}"
                                break

                    for k in ["work_mode", "joining_date", "benefits", "notice_period"]:
                        if k in cum.get("current_terms", {}):
                            final_terms[k] = cum["current_terms"][k]
                    work_mode = final_terms.get("work_mode") or work_mode
                    joining_date = final_terms.get("joining_date") or joining_date
                    benefits = final_terms.get("benefits") or benefits
                    notice_period = final_terms.get("notice_period") or notice_period

                recov_num = cls._parse_num(recovered_sal) if recovered_sal else None
                if recov_num and recov_num > 0:
                    final_num = recov_num
                    final_sal = f"{curr}{int(recov_num):,}{unit_suffix}"
                    final_terms["salary"] = final_sal
                elif outcome in ["Agreement Reached", "Agreement", "Partial Agreement"]:
                    if init_num and init_num > 0:
                        agreed_num = int(init_num)
                        final_num = float(agreed_num)
                        final_sal = f"{curr}{agreed_num:,}{unit_suffix}"
                        final_terms["salary"] = final_sal
                    elif exp_num and exp_num > 0:
                        agreed_num = int(exp_num)
                        final_num = float(agreed_num)
                        final_sal = f"{curr}{agreed_num:,}{unit_suffix}"
                        final_terms["salary"] = final_sal
                    else:
                        final_sal = "Agreed (Baseline)"
                else:
                    final_sal = "Not finalized (Deadlock / Incomplete)"
                    final_num = None

            sal_diff = (final_num - init_num) if (init_num and final_num) else 0.0
            diff_pct = f"+{(sal_diff / init_num * 100):.1f}%" if (init_num and init_num > 0 and sal_diff > 0) else ("0.0%" if sal_diff == 0 else f"{(sal_diff / init_num * 100):.1f}%")

            analysis = {
                "initial_salary": str(init_sal),
                "expected_salary": str(exp_sal),
                "minimum_acceptable_salary": str(min_sal),
                "final_salary": str(final_sal),
                "benefits": str(benefits),
                "work_mode": str(work_mode),
                "location": str(location),
                "joining_date": str(joining_date),
                "notice_period": str(notice_period),
                "salary_concessions": f"{curr}{abs(int(sal_diff)):,}" if sal_diff else "0",
                "difference": diff_pct,
                "currency": curr,
            }

        elif scenario_id == "budget-allocation":
            total_budget = sc_data.get("total_budget") or sc_data.get("total_project_budget") or "Not available"
            dept_alloc = sc_data.get("department_allocations") or sc_data.get("initial_allocations") or "Not specified"
            req_alloc = sc_data.get("requested_budget") or sc_data.get("requested_allocations") or "Not specified"
            final_alloc = final_terms.get("allocations") or final_terms.get("totalBudget") or "Not finalized"
            priorities = sc_data.get("priorities") or "Milestone milestones and core deliverables"
            resources = sc_data.get("resource_requirements") or "Standard staff & tooling allocations"
            unresolved = "None" if outcome in ["Agreement Reached", "Agreement"] else "Department allocation caps"

            if not curr:
                for b_val in [str(total_budget), str(dept_alloc), str(req_alloc), str(final_alloc)]:
                    c_found = cls._detect_currency({"val": b_val}, default="")
                    if c_found:
                        curr = c_found
                        break

            analysis = {
                "total_budget": str(total_budget),
                "initial_allocations": str(dept_alloc),
                "requested_allocations": str(req_alloc),
                "final_allocations": str(final_alloc),
                "budget_changes": "Optimized cross-departmental distribution",
                "priorities": str(priorities),
                "resource_requirements": str(resources),
                "remaining_budget": "0 (Fully Allocated)" if outcome in ["Agreement Reached", "Agreement"] else "Under review",
                "unresolved_allocation_issues": unresolved,
                "currency": curr,
            }

        return analysis

    @classmethod
    async def generate_and_save_report(
        cls,
        session: NegotiationSession,
        outcome: str,
        db: AsyncSession,
    ) -> OutcomeReport:
        """Calculates performance metrics, generates 18-section analysis, and persists report in database."""
        # Fetch existing report if any to refresh rather than duplicate
        stmt = select(OutcomeReport).where(OutcomeReport.session_id == session.id)
        result = await db.execute(stmt)
        existing = result.scalar_one_or_none()

        messages: List[NegotiationMessage] = session.messages or []
        rounds_count = session.current_round

        # Calculate duration
        now = datetime.now(timezone.utc)
        created = session.created_at or now
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        duration_sec = max(10, int(abs((now - created).total_seconds())))

        is_agreement = (outcome in ["Agreement Reached", "Agreement"])
        is_partial = (outcome == "Partial Agreement")

        concession_score = 88 if is_agreement else (72 if is_partial else 58)
        argument_score = min(96, 70 + len(messages) * 3)
        active_listening_score = 85 if is_agreement else (75 if is_partial else 62)
        deal_progress_score = 96 if is_agreement else (68 if is_partial else (35 if outcome == "Deadlock" else 50))

        metrics = {
            "concessionControl": concession_score,
            "argumentStrength": argument_score,
            "activeListening": active_listening_score,
            "dealProgress": deal_progress_score,
            "totalRounds": rounds_count,
            "jointUtility": 90 if is_agreement else (70 if is_partial else 45),
            "paretoEfficiency": 92 if is_agreement else (72 if is_partial else 50),
        }

        overall_score = int(
            (metrics["concessionControl"] * 0.25)
            + (metrics["argumentStrength"] * 0.25)
            + (metrics["activeListening"] * 0.25)
            + (metrics["dealProgress"] * 0.25)
        )

        titles = {
            "vendor-pricing": "Vendor Pricing Negotiation",
            "job-offer": "Job Offer Negotiation",
            "budget-allocation": "Project Budget Allocation",
        }
        scenario_title = titles.get(session.scenario_id, session.scenario_id)

        # Extract structured events
        events = list(session.structured_events or [])
        if not events and messages:
            for idx, m in enumerate(messages):
                ev_type = "offer" if idx == 0 else ("counteroffer" if m.offer_data else "statement")
                ev_summary = ", ".join(f"{k}: {v}" for k, v in m.offer_data.items()) if m.offer_data else m.content[:60]
                events.append({
                    "round": m.round,
                    "turn_index": m.turn_index,
                    "speaker": m.sender,
                    "role": m.role,
                    "event_type": ev_type,
                    "summary": f"{ev_type.capitalize()} -> {ev_summary}",
                    "terms": m.offer_data or {},
                    "concessions": [],
                    "timestamp": (m.timestamp or now).isoformat(),
                })

        # Identify participants
        from app.orchestration.turn_resolver import TurnResolver
        human_ag = TurnResolver.resolve_human_agent(session.scenario_id, session.human_role, session.agents or []) if session.mode == "human-ai" else None
        human_ag_id = getattr(human_ag, "id", None)

        participants = []
        for a in (session.agents or []):
            is_human = (session.mode == "human-ai" and human_ag_id is not None and a.id == human_ag_id)
            participants.append({
                "name": a.name,
                "role": a.role,
                "avatar": a.avatar,
                "personality": a.personality,
                "experience": a.experience,
                "is_human": is_human,
            })

        # Identify unresolved terms
        final_terms = session.final_terms or {}
        unresolved_terms = {}
        if session.scenario_data:
            for k, v in session.scenario_data.items():
                if k not in final_terms and k not in ["other_conditions", "constraints", "other_requirements"]:
                    unresolved_terms[k] = v

        # Agent behavior / strategy analysis
        agent_analysis = {}
        for p in participants:
            p_name = p["name"]
            p_msgs = [m for m in messages if m.sender == p_name]
            p_offers = [m for m in p_msgs if m.offer_data]
            style_desc = f"{p['personality']} style. "
            if p["is_human"]:
                style_desc += "Participated dynamically as active human counterparty."
            elif p["personality"] == "Aggressive":
                style_desc += "Maintained firm anchor positions and extracted concessions systematically."
            elif p["personality"] == "Collaborative":
                style_desc += "Emphasized integrative negotiation, mutual value discovery, and creative package trade-offs."
            else:
                style_desc += "Focused on risk mitigation, operational guarantees, and budgetary compliance."

            agent_analysis[p_name] = {
                "role": p["role"],
                "strategy": style_desc,
                "messages_sent": len(p_msgs),
                "offers_tabled": len(p_offers),
            }

        # Build scenario-specific metrics & comparative analysis
        sc_data = session.scenario_data or {}
        scenario_analysis = cls._build_scenario_analysis(
            session.scenario_id,
            sc_data,
            final_terms,
            outcome,
            messages=messages,
            session=session,
        )

        # Build comprehensive deadlock analysis if impasse occurred
        if outcome == "Deadlock" or session.status == "deadlock":
            last_msg = messages[-1].content if messages else "No final proposal recorded"
            last_sender = messages[-1].sender if messages else "N/A"
            prev_msg = messages[-2].content if len(messages) > 1 else "No counterparty proposal recorded"
            prev_sender = messages[-2].sender if len(messages) > 1 else "N/A"

            conflicts = []
            if session.deadlock_reason:
                conflicts.append(session.deadlock_reason)
            else:
                conflicts.append("Mutually exclusive constraint limits; Zone of Possible Agreement (ZOPA) is non-existent.")

            scenario_analysis["deadlock_analysis"] = {
                "deadlock_reason": session.deadlock_reason or "Empirical constraint conflict or repeated offer stagnation",
                "round_of_deadlock": rounds_count,
                "conflicting_constraints": conflicts,
                "last_positions": {
                    "last_proposal": f"{last_sender}: {last_msg}",
                    "counterpart_position": f"{prev_sender}: {prev_msg}",
                },
                "why_impossible": (
                    session.deadlock_reason or 
                    "Neither participant could concede further without violating their mandatory reservation boundaries."
                ),
            }

        # Mode-specific strategic behavior analysis
        mode_val = (session.mode or "collaborative").lower().replace("-", "_")
        mode_analysis: Dict[str, Any] = {
            "selected_mode": session.mode,
            "mode_label": mode_val.replace("_", " ").title(),
            "rounds_observed": rounds_count,
            "messages_analyzed": len(messages),
        }

        # Analyze transcript signals
        transcript_text = " ".join([m.content for m in messages]).lower()
        has_trade_offs = any(w in transcript_text for w in ["trade", "flexibility", "package", "deliver", "payment", "net-", "hybrid", "remote", "benefits"])
        has_risk_guards = any(w in transcript_text for w in ["risk", "buffer", "contingency", "safety", "margin", "warranty", "sla", "penalty", "ceiling", "floor"])
        has_pressure = any(w in transcript_text for w in ["firm", "market", "demand", "uncompetitive", "benchmark", "leverage", "undervalue", "competing"])

        if mode_val == "collaborative":
            mode_analysis.update({
                "strategy_goal": "Find a mutually beneficial win-win agreement through multi-variable trade-offs and creative package options.",
                "cooperation_level": "High — Both negotiators actively sought mutual ground and creative term alignment.",
                "trade_offs_explored": (
                    "Negotiators actively tabled trade-offs across secondary dimensions (such as payment terms, warranty coverage, or schedule flexibility) to reach compromise on primary financial terms."
                    if has_trade_offs else "The parties engaged constructively with balanced concession proposals."
                ),
                "mutual_benefit_assessment": "The negotiation balanced both parties' core priorities without unnecessary adversarial posturing.",
                "concession_behavior": "Moderate, reciprocal concessions were made once justified by counterparty proposals, avoiding one-sided compromise.",
                "win_win_outcome": (
                    "Successfully achieved a balanced Pareto-efficient outcome reflecting joint value discovery."
                    if is_agreement else "Collaborative exploration concluded when reservation boundaries could not be bridged without violating core limits."
                ),
            })
        elif mode_val == "risk_averse":
            mode_analysis.update({
                "strategy_goal": "Protect against unfavorable or uncertain outcomes while guarding strict reservation limits and safety buffers.",
                "constraint_protection": "Very High — Negotiators rigorously defended baseline reservation boundaries and operational buffers.",
                "risk_avoidance": (
                    "Cautious evaluation of all proposals; insisted on contractual safeguards, milestone reviews, and warranty protections."
                    if has_risk_guards else "High caution demonstrated throughout round exchanges, avoiding speculative compromises."
                ),
                "conservative_concessions": "Concessions were tightly metered and incremental (under 3%), avoiding sudden moves that could erode margin.",
                "safety_margins_preserved": "Maintained an operational safety buffer above absolute constraint floors throughout all rounds.",
                "rejected_risky_proposals": "Proposals encroaching on mandatory reservation boundaries were either rejected or countered conservatively with explicit protective clauses.",
            })
        elif mode_val == "aggressive":
            mode_analysis.update({
                "strategy_goal": "Maximize participant advantage through assertive anchoring, competitive pressure, and concession resistance.",
                "initial_demands": "Opened with firm, ambitious anchor positions to establish dominant negotiation reference points.",
                "pressure_strategy": (
                    "Applied strategic counter-pressure, emphasizing market alternatives, high demand, and delivery leverage."
                    if has_pressure else "Emphasized leverage and challenged counterparty assumptions systematically."
                ),
                "strong_counteroffers": "Responded to unfavorable proposals with resolute counteroffers rather than early concessions.",
                "concession_resistance": "Delayed concessions systematically, conceding minimal increments only when necessary to keep the dialogue active.",
                "final_advantage": (
                    "Secured highly favorable commercial terms while remaining within valid operational constraints."
                    if is_agreement else "Stood firm on core value anchors, refusing to concede beyond strategic thresholds."
                ),
            })
        else:
            mode_analysis.update({
                "strategy_goal": "Balanced strategic exchange between participants.",
                "cooperation_level": "Adaptive",
                "concession_behavior": "Dynamic responsiveness based on active participant inputs.",
            })

        scenario_analysis["mode_strategy_analysis"] = mode_analysis

        if session.mode == "human-ai":
            human_role_name = getattr(human_ag, "role", session.human_role or "Human Negotiator")
            ai_roles = [a.role for a in (session.agents or []) if a.id != human_ag_id]
            ai_role_str = ", ".join(ai_roles) if ai_roles else "AI Counterparty"
            role_header = f"Mode: Human vs AI | Human Role: {human_role_name} | AI Role: {ai_role_str}. "
        else:
            participant_roles = [f"{a.role} AI" for a in (session.agents or [])]
            parts_str = " vs ".join(participant_roles) if participant_roles else "AI Participants"
            role_header = f"Mode: AI vs AI | Participants: {parts_str}. "

        summary = (
            f"{role_header}The negotiation session for '{scenario_title}' concluded with an outcome of '{outcome}' "
            f"after {rounds_count} round(s) across {len(messages)} message exchange(s). "
        )
        if is_agreement and final_terms:
            terms_str = ", ".join([f"{k}: {v}" for k, v in final_terms.items()])
            summary += f"Final agreed terms successfully established: {terms_str}."
        elif is_partial:
            summary += "The parties reached agreement on primary commercial points, but auxiliary terms remain unresolved."
        elif outcome == "Deadlock":
            reason_text = f" ({session.deadlock_reason})" if session.deadlock_reason else ""
            summary += f"The negotiation terminated in a deadlock{reason_text}. Conflicting reservation boundaries prevented a feasible agreement."
        else:
            summary += "The negotiation session was concluded by the participant."

        # Strategic recommendations
        recommendations = (
            "1. Ground opening anchors in empirical benchmark data to build early negotiation credibility.\n"
            "2. Trade secondary negotiable dimensions (such as payment terms, warranty tiers, or start dates) to preserve primary economic value.\n"
            "3. Concede incrementally and always condition concessions upon reciprocal moves by the counterparty."
        )

        # Final assessment narrative
        final_assessment = (
            f"Overall Negotiation Health Score: {overall_score}/100. "
            f"Outcome: {outcome}. Both parties engaged across {rounds_count} rounds with {metrics['concessionControl']}% concession control "
            f"and {metrics['dealProgress']}% deal progression efficiency. "
            + ("The session achieved Pareto-efficient terms that align with the participant's core constraints."
               if is_agreement else
               "While unresolved items remain, substantial discovery occurred around reserve limits and trade-off flexibility.")
        )

        if existing:
            existing.outcome = outcome
            existing.rounds_completed = rounds_count
            existing.final_terms = final_terms
            existing.initial_data = sc_data
            existing.participants = participants
            existing.key_events = events
            existing.unresolved_terms = unresolved_terms
            existing.agent_analysis = agent_analysis
            existing.overall_score = overall_score
            existing.duration_seconds = duration_sec
            existing.metrics = metrics
            existing.summary = summary
            existing.recommendations = recommendations
            existing.scenario_analysis = scenario_analysis
            existing.final_assessment = final_assessment
            await db.commit()
            await db.refresh(existing)
            logger.info(f"Outcome report for session {session.id} refreshed with updated real scenario terms.")
            return existing

        report = OutcomeReport(
            session_id=session.id,
            user_id=session.user_id,
            scenario_id=session.scenario_id,
            scenario_title=scenario_title,
            mode=session.mode,
            outcome=outcome,
            rounds_completed=rounds_count,
            final_terms=final_terms,
            initial_data=sc_data,
            participants=participants,
            key_events=events,
            unresolved_terms=unresolved_terms,
            agent_analysis=agent_analysis,
            overall_score=overall_score,
            duration_seconds=duration_sec,
            metrics=metrics,
            summary=summary,
            recommendations=recommendations,
            scenario_analysis=scenario_analysis,
            final_assessment=final_assessment,
        )

        db.add(report)
        await db.commit()
        await db.refresh(report)
        logger.info(f"Comprehensive 18-section outcome report generated and persisted for session {session.id}.")
        return report
