import logging
import re
from typing import Dict, Any, List, Tuple, Optional
from app.schemas.agent import AgentConfigSchema
from app.schemas.arena import AgentDecision
from app.negotiation.models.negotiation_state import NormalizedNegotiationState
from app.negotiation.rules.constraint_rules import ConstraintRules

logger = logging.getLogger("backend.validation.message_quality")

# Regex for detecting opening greetings that should NOT be repeated in Round 2+
GREETING_PATTERN = re.compile(
    r"^(hello|hi(\s+there)?|hey|good\s+(morning|afternoon|evening|day)|greetings|pleased\s+to\s+meet|nice\s+to\s+(meet|speak)|thank\s+you\s+for\s+(joining|meeting|speaking|having|connecting|taking\s+the\s+time))[\s,!.—\-]*",
    re.IGNORECASE,
)


class MessageQualityValidator:
    """Dynamic Message Quality Validator & Anti-Repetition Engine.
    Ensures every LLM message acts as a realistic continuation of an ongoing negotiation,
    prevents repeated greetings, detects verbatim repetition, and rejects unconfigured factual hallucinations.
    """

    @classmethod
    def validate_message_quality(
        cls,
        state: NormalizedNegotiationState,
        agent: AgentConfigSchema,
        decision: AgentDecision,
    ) -> Tuple[bool, AgentDecision, Optional[str]]:
        """Validates the conversational quality, repetition avoidance, and factual consistency of a decision.
        Returns: (is_valid, repaired_decision, failure_reason)
        """
        if not decision.message or not decision.message.strip():
            # If empty message, create contextual message
            repaired_msg = cls._build_dynamic_contextual_message(state, agent, decision)
            return True, decision.model_copy(update={"message": repaired_msg}), "EMPTY_MESSAGE_REPAIRED"

        raw_msg = decision.message.strip()
        repaired_msg = raw_msg
        repairs_applied: List[str] = []

        # 1. Repeated Greeting Prevention in Round > 1
        if state.current_round > 1:
            prev_msg = repaired_msg
            while True:
                match = GREETING_PATTERN.match(repaired_msg)
                if not match:
                    break
                repaired_msg = repaired_msg[match.end():].strip()
                # Clean up residual pleasantry connector phrases
                repaired_msg = re.sub(r"^(the meeting|this meeting|our call|joining us)[\s,!.—\-]*", "", repaired_msg, flags=re.IGNORECASE).strip()
                if not repairs_applied:
                    repairs_applied.append("stripped_repeated_greeting")

            if repaired_msg != prev_msg:
                if repaired_msg and repaired_msg[0].islower():
                    repaired_msg = repaired_msg[0].upper() + repaired_msg[1:]
                if not repaired_msg or len(repaired_msg) < 10:
                    # If entire message was pleasantries, build dynamic contextual message
                    repaired_msg = cls._build_dynamic_contextual_message(state, agent, decision)
                    repairs_applied.append("rebuilt_greeting_only_message")
                logger.info(f"[QUALITY_VALIDATOR] Stripped repeated greetings in round {state.current_round} for {agent.name}")

        # 2. Anti-Repetition Check: Exact sentence repetition against previous turns
        is_repetitive = cls._detect_verbatim_repetition(repaired_msg, state.messages, agent.name)
        if is_repetitive:
            logger.warning(f"[QUALITY_VALIDATOR] Detected repetitive message from {agent.name} in round {state.current_round}")
            repaired_msg = cls._build_dynamic_contextual_message(state, agent, decision)
            repairs_applied.append("rebuilt_repetitive_message")

        # 3. Check for Generic Placeholder / Goal Statement in isolation
        if cls._is_generic_or_isolated_goal(repaired_msg, agent):
            logger.warning(f"[QUALITY_VALIDATOR] Detected isolated/generic goal statement from {agent.name}")
            repaired_msg = cls._build_dynamic_contextual_message(state, agent, decision)
            repairs_applied.append("rebuilt_isolated_goal")

        # 4. Validate Factual Numbers Against Configured Bounds (Strict No Hallucination)
        fact_repaired_msg, fact_violation = cls._check_and_enforce_factual_bounds(
            state, agent, repaired_msg, decision.action
        )
        if fact_violation:
            logger.warning(f"[QUALITY_VALIDATOR] Fact violation detected for {agent.name}: {fact_violation}")
            repaired_msg = fact_repaired_msg
            repairs_applied.append(f"repaired_fact_bounds: {fact_violation}")

        final_decision = decision.model_copy(update={"message": repaired_msg})
        repair_summary = ", ".join(repairs_applied) if repairs_applied else None
        return True, final_decision, repair_summary

    @classmethod
    def _detect_verbatim_repetition(
        cls,
        current_msg: str,
        messages: List[Dict[str, Any]],
        agent_name: str,
    ) -> bool:
        """Detects if current message is essentially identical to an earlier message from the same agent."""
        curr_clean = re.sub(r"[^\w\s]", "", current_msg.lower()).strip()
        if not curr_clean:
            return False

        agent_prior_msgs = [
            m.get("content", "")
            for m in messages
            if (m.get("sender") == agent_name or m.get("role") == agent_name) and m.get("content")
        ]

        for prior_raw in agent_prior_msgs[-3:]:  # Check last 3 turns by this agent
            prior_clean = re.sub(r"[^\w\s]", "", prior_raw.lower()).strip()
            if not prior_clean:
                continue
            # Exact match
            if curr_clean == prior_clean:
                return True
            # Over 85% word overlap match
            curr_words = set(curr_clean.split())
            prior_words = set(prior_clean.split())
            if len(curr_words) > 4 and len(prior_words) > 4:
                intersection = curr_words.intersection(prior_words)
                union = curr_words.union(prior_words)
                similarity = len(intersection) / len(union) if union else 0
                if similarity > 0.85:
                    return True

        return False

    @classmethod
    def _is_generic_or_isolated_goal(cls, message: str, agent: AgentConfigSchema) -> bool:
        """Detects if message is a detached generic statement that does not engage in negotiation."""
        clean = message.lower().strip()
        generic_phrases = [
            "we are looking for the best candidate and want to provide a competitive offer",
            "we are looking to hire the best candidate",
            "our goal is to reach an agreement",
            "i am looking forward to reaching a deal",
            "i want to reach a mutual agreement",
        ]
        for gp in generic_phrases:
            if gp in clean and len(clean.split()) <= len(gp.split()) + 3:
                return True

        # Check if message is simply repeating the agent's goal text verbatim with no negotiation action
        goals = [g.text.lower() for g in agent.goals if g.text]
        for goal_text in goals:
            if clean == goal_text or (goal_text in clean and len(clean.split()) <= len(goal_text.split()) + 2):
                return True

        return False

    @classmethod
    def _check_and_enforce_factual_bounds(
        cls,
        state: NormalizedNegotiationState,
        agent: AgentConfigSchema,
        message: str,
        action: str,
    ) -> Tuple[str, Optional[str]]:
        """Checks if message mentions numeric terms violating configured bounds, and repairs them strictly."""
        role_clean = (agent.role or "").lower()
        violation: Optional[str] = None
        repaired_msg = message

        if state.scenario_id == "job-offer":
            extracted_salaries = [
                float(n.replace(",", ""))
                for n in re.findall(r"\$([0-9]{2,3}(?:,[0-9]{3})+|\b[0-9]{5,7}\b)", message)
            ]
            if any(w in role_clean for w in ["recruiter", "hr"]):
                max_s = ConstraintRules._extract_param_value(agent, ["maxsalary", "max_salary", "grade cap", "budget"])
                if max_s is not None:
                    for num in extracted_salaries:
                        if num > max_s * 1.05:
                            violation = f"Recruiter stated salary ${num:,.0f} exceeding max budget ${max_s:,.0f}"
                            repaired_msg = re.sub(
                                r"\$([0-9]{2,3}(?:,[0-9]{3})+|\b[0-9]{5,7}\b)",
                                f"${max_s:,.0f}",
                                repaired_msg,
                            )
            elif any(w in role_clean for w in ["candidate", "developer", "engineer"]):
                min_s = ConstraintRules._extract_param_value(agent, ["minsalary", "min_salary", "competing offer", "floor"])
                if min_s is not None and action == "accept":
                    for num in extracted_salaries:
                        if num < min_s * 0.95:
                            violation = f"Candidate accepted salary ${num:,.0f} below floor ${min_s:,.0f}"
                            repaired_msg = re.sub(
                                r"\$([0-9]{2,3}(?:,[0-9]{3})+|\b[0-9]{5,7}\b)",
                                f"${min_s:,.0f}",
                                repaired_msg,
                            )

        elif state.scenario_id == "vendor-pricing":
            extracted_prices = [
                float(n.replace(",", ""))
                for n in re.findall(r"\$([0-9]{1,4}(?:\.[0-9]{2})?)\s*(?:/|\bper\b)", message, re.IGNORECASE)
            ]
            if any(w in role_clean for w in ["vendor", "sales", "seller"]):
                min_p = ConstraintRules._extract_param_value(agent, ["minprice", "min_price", "targetprice", "target_price"])
                if min_p is not None and action == "accept":
                    for num in extracted_prices:
                        if num < min_p * 0.95:
                            violation = f"Vendor accepted price ${num:.0f} below floor ${min_p:.0f}"
                            repaired_msg = re.sub(
                                r"\$([0-9]{1,4}(?:\.[0-9]{2})?)\s*(?:/|\bper\b)",
                                f"${min_p:.0f}/user/month",
                                repaired_msg,
                                flags=re.IGNORECASE,
                            )

        return repaired_msg, violation

    @classmethod
    def _build_dynamic_contextual_message(
        cls,
        state: NormalizedNegotiationState,
        agent: AgentConfigSchema,
        decision: AgentDecision,
    ) -> str:
        """Constructs a rich, dynamic contextual message derived strictly from configured data & counterpart terms."""
        role_clean = (agent.role or "").lower()
        curr_offer = decision.offer or state.current_offer or {}

        # Extract primary goal
        primary_goal = agent.goals[0].text if agent.goals else "reach a mutually beneficial agreement"

        if state.scenario_id == "job-offer":
            if any(w in role_clean for w in ["recruiter", "hr"]):
                salary_val = curr_offer.get("salary") or agent.negotiation_parameters.get("maxSalary") or "$120,000"
                if state.current_round == 1:
                    return f"We are pleased to begin our discussion regarding the compensation package. Our initial offer starts at {salary_val}, and we are open to discussing remote work and equity arrangements."
                else:
                    return f"I understand your expectations, but our approved compensation limit is {salary_val}. We would be glad to explore flexibility on remote days and equity to make the package compelling."
            else:
                salary_val = curr_offer.get("salary") or agent.negotiation_parameters.get("minSalary") or "$135,000"
                if state.current_round == 1:
                    return f"Thank you for reaching out. Based on my experience and market expectations, I am targeting a base compensation of {salary_val} with flexibility around equity and remote work."
                else:
                    return f"I appreciate the offer; however, the compensation difference is significant for me. I am looking for terms closer to {salary_val}. Can we discuss adjustments to the base salary or equity components?"

        elif state.scenario_id == "vendor-pricing":
            if any(w in role_clean for w in ["buyer", "procurement", "client"]):
                price_val = curr_offer.get("price") or agent.negotiation_parameters.get("maxBudget") or "$85/user/month"
                if state.current_round == 1:
                    return f"We are interested in evaluating your software solution. Based on our procurement budget, we are proposing a licensing tier at {price_val} with standard annual payment terms."
                else:
                    return f"We have reviewed your pricing proposal. To align with our budget constraints, we need pricing closer to {price_val}. Could we adjust the payment terms or support tier to reach consensus?"
            else:
                price_val = curr_offer.get("price") or agent.negotiation_parameters.get("targetPrice") or "$120/user/month"
                if state.current_round == 1:
                    return f"Welcome. We are excited to present our enterprise software licensing at {price_val} per user, including comprehensive support and flexible payment terms."
                else:
                    return f"Thank you for your feedback. Our enterprise solution provides substantial ROI at {price_val}. If pricing needs to move, we can explore adjustments in payment schedule or SLA commitments."

        else:
            alloc_val = curr_offer.get("allocation") or "balanced capital allocation"
            if state.current_round == 1:
                return f"Let us review our departmental capital distribution priorities. Our primary objective is {primary_goal} with an initial target allocation of {alloc_val}."
            else:
                return f"Regarding the proposed capital split, our priority remains {primary_goal}. We propose aligning on {alloc_val} to ensure all strategic milestones are fully funded."
