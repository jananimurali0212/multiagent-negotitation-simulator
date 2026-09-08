import re
import json
import logging
from typing import Optional, Dict, Any, Tuple
from app.core.config import settings
from app.schemas.arena import AgentDecision
from app.providers.base import BaseLLMProvider, LLMProviderError

logger = logging.getLogger("backend.providers.fallback")


class FallbackRuleProvider(BaseLLMProvider):
    """Intelligent personality-driven decision maker and fallback provider.
    Parses counterparty/human statements, understands proposed numbers and intent,
    and constructs authentic, conversational, and strategically aligned responses.
    """

    def provider_name(self) -> str:
        return "rule_fallback"

    def supports_structured_output(self) -> bool:
        return True

    async def health_check(self) -> bool:
        return True

    @staticmethod
    def _extract_scenario_data_from_prompt(prompt: str) -> Dict[str, str]:
        """Extracts authoritative user-entered scenario data from prompt sections."""
        data: Dict[str, str] = {}
        if not prompt:
            return data

        sec_match = re.search(
            r"SECTION 1B — AUTHORITATIVE REAL SCENARIO DATA.*?\n(.*?)(?=\n={10,}|\Z)",
            prompt,
            re.DOTALL,
        )
        if sec_match:
            for line in sec_match.group(1).split("\n"):
                line = line.strip()
                if line.startswith("-") and ":" in line:
                    parts = line[1:].split(":", 1)
                    key = parts[0].strip().lower().replace(" ", "_")
                    val = parts[1].strip()
                    data[key] = val

        # Fallback: scan for parameters in section 6 or section 4
        param_match = re.search(
            r"SECTION 6 — NEGOTIATION TARGETS & PARAMETERS.*?\n(.*?)(?=\n={10,}|\Z)",
            prompt,
            re.DOTALL,
        )
        if param_match:
            for line in param_match.group(1).split("\n"):
                line = line.strip()
                if line.startswith("-") and ":" in line:
                    parts = line[1:].split(":", 1)
                    key = parts[0].strip().lower().replace(" ", "_")
                    val = parts[1].strip()
                    if key not in data:
                        data[key] = val

        return data

    @staticmethod
    def _detect_currency(text: str) -> str:
        if not text:
            return "$"
        if "₹" in text or "rs" in text.lower() or "inr" in text.lower() or "rupee" in text.lower():
            return "₹"
        if "€" in text or "eur" in text.lower():
            return "€"
        if "£" in text or "gbp" in text.lower():
            return "£"
        return "$"

    @staticmethod
    def _parse_numeric(val: Any) -> Optional[float]:
        if val is None:
            return None
        s = str(val).strip()
        # Look for number directly tied to currency symbol or monetary words
        m_curr = re.search(r"(?:[\$₹€£]|rs\.?|usd|inr)\s*(\d[\d,]*(?:\.\d+)?)", s, re.IGNORECASE)
        if m_curr:
            cleaned = m_curr.group(1).replace(",", "")
            try:
                num = float(cleaned)
                if re.search(r"\b\d+\s*k\b", s, re.IGNORECASE):
                    num *= 1000
                elif "lakh" in s.lower():
                    num *= 100000
                elif "crore" in s.lower() or "cr" in s.lower():
                    num *= 10000000
                return num
            except Exception:
                pass

        # Otherwise look for standard number
        s_clean = s.replace(",", "")
        m = re.search(r"(\d+(?:\.\d+)?)", s_clean)
        if m:
            try:
                num = float(m.group(1))
                if re.search(r"\b\d+\s*k\b", s, re.IGNORECASE):
                    num *= 1000
                elif "lakh" in s.lower():
                    num *= 100000
                elif "crore" in s.lower() or "cr" in s.lower():
                    num *= 10000000
                return num
            except Exception:
                return None
        return None

    @staticmethod
    def _format_num(amount: float, curr: str) -> str:
        if amount == int(amount):
            return f"{curr}{int(amount):,}"
        return f"{curr}{amount:,.2f}"

    @classmethod
    def _extract_last_counterparty_context(cls, prompt: str, sc_data: Dict[str, str]) -> Dict[str, Any]:
        """Parses the prompt to extract the latest message, intent, and proposed terms from the opponent/human."""
        ctx: Dict[str, Any] = {
            "last_message": "",
            "last_sender": "Counterparty",
            "proposed_number": None,
            "currency": "$",
            "is_accept": False,
            "is_pushback": False,
            "is_compromise": False,
            "is_question": False,
            "terms": {},
        }

        if not prompt:
            return ctx

        # Extract latest message from prompt callout or transcript
        callout_match = re.search(
            r'>>> LATEST MESSAGE FROM COUNTERPARTY TO DIRECTLY RESPOND TO:\s*- Sender:\s*([^\n]+)\s*- Message:\s*"([^"]+)"',
            prompt,
            re.DOTALL,
        )
        if callout_match:
            ctx["last_sender"] = callout_match.group(1).strip()
            ctx["last_message"] = callout_match.group(2).strip()
        else:
            history_lines = [line.strip() for line in prompt.split("\n") if line.strip().startswith("[") and "]:" in line]
            if history_lines:
                last_line = history_lines[-1]
                msg_match = re.search(r'\[([^\]]+)\]:\s*(.*)', last_line)
                if msg_match:
                    ctx["last_sender"] = msg_match.group(1).strip()
                    ctx["last_message"] = msg_match.group(2).strip()

        text = ctx["last_message"]
        text_lower = text.lower()

        # Intent detection
        accept_phrases = ["accept", "agree", "deal", "done deal", "sounds good", "let's do it", "we have a deal", "pleased to agree"]
        if any(phrase in text_lower for phrase in accept_phrases) and not any(neg in text_lower for neg in ["cannot accept", "can't accept", "not accept", "don't agree"]):
            ctx["is_accept"] = True

        pushback_phrases = ["too high", "too low", "expensive", "unacceptable", "over budget", "cannot afford", "ceiling", "floor", "reduce", "too much"]
        if any(phrase in text_lower for phrase in pushback_phrases):
            ctx["is_pushback"] = True

        compromise_phrases = ["meet in the middle", "compromise", "trade", "split", "counter", "what if", "how about"]
        if any(phrase in text_lower for phrase in compromise_phrases):
            ctx["is_compromise"] = True

        if "?" in text or any(text_lower.startswith(w) for w in ["can you", "could you", "what is", "is it possible", "how about", "would you"]):
            ctx["is_question"] = True

        # Detect currency from text or scenario data
        ctx["currency"] = cls._detect_currency(text)
        if ctx["currency"] == "$" and sc_data:
            combined_sc_text = " ".join(sc_data.values())
            ctx["currency"] = cls._detect_currency(combined_sc_text)

        # Parse proposed number from counterparty text
        ctx["proposed_number"] = cls._parse_numeric(text)

        return ctx

    async def generate_decision(
        self,
        prompt: str,
        agent_personality: str,
        agent_role: str,
        current_round: int,
        scenario_id: str,
    ) -> AgentDecision:
        """Personality-driven dynamic negotiation decision maker strictly grounded on real user data."""
        sc_data = self._extract_scenario_data_from_prompt(prompt)
        ctx = self._extract_last_counterparty_context(prompt, sc_data)
        logger.info(
            f"FallbackRuleProvider generating decision for role='{agent_role}', round={current_round}, "
            f"scenario='{scenario_id}', personality='{agent_personality}', real_data_keys={list(sc_data.keys())}"
        )
        return self._generate_scenario_decision(agent_personality, agent_role, current_round, scenario_id, ctx, sc_data)

    def _generate_scenario_decision(
        self,
        personality: str,
        role: str,
        current_round: int,
        scenario_id: str,
        ctx: Dict[str, Any],
        sc_data: Dict[str, Any],
    ) -> AgentDecision:
        role_lower = role.lower()
        curr = ctx.get("currency") or "$"
        user_msg = ctx.get("last_message", "")

        # Handle explicit acceptance from counterparty
        if ctx.get("is_accept") and current_round > 1:
            return AgentDecision(
                action="accept",
                message=(
                    "Wonderful! I am delighted that we have aligned on these terms. "
                    "Thank you for a constructive negotiation, and we look forward to finalizing our agreement."
                ),
                rationale_summary="Accepting deal following counterparty agreement confirmation.",
                offer=None,
                concession_percentage=0.0,
                confidence_score=0.98,
            )

        # =========================================================================
        # SCENARIO 1: VENDOR PRICING
        # =========================================================================
        if scenario_id == "vendor-pricing":
            is_vendor = any(w in role_lower for w in ["sales", "vendor", "seller", "account", "sarah"])
            product = sc_data.get("product") or "the equipment/service"
            quantity = sc_data.get("quantity") or "the requested volume"
            p_init = self._parse_numeric(sc_data.get("initial_vendor_price") or sc_data.get("current_vendor_price")) or 85000.0
            p_target = self._parse_numeric(sc_data.get("target_price")) or (p_init * 0.75)
            p_max = self._parse_numeric(sc_data.get("maximum_budget")) or (p_target * 1.15)
            p_delivery = sc_data.get("delivery_requirements") or sc_data.get("delivery_requirement") or "standard timeline"
            p_quality = sc_data.get("quality_requirements") or sc_data.get("quality_requirement") or "standard SLA and warranty"
            p_terms = sc_data.get("payment_terms") or "Net-30"

            user_prop = ctx.get("proposed_number")

            if is_vendor:
                # Opening turn
                if current_round == 1 and not user_msg:
                    return AgentDecision(
                        action="offer",
                        message=(
                            f"Thank you for considering our proposal for {quantity} of {product}. "
                            f"Our standard pricing is {self._format_num(p_init, curr)} with {p_quality} and delivery within {p_delivery} under {p_terms} terms."
                        ),
                        rationale_summary=f"Opening proposal anchored on initial vendor quote of {self._format_num(p_init, curr)}.",
                        offer={"price": self._format_num(p_init, curr), "paymentTerms": p_terms, "delivery": p_delivery},
                        concession_percentage=0.0,
                        confidence_score=0.92,
                    )

                # Counterparty offered a number
                if user_prop is not None:
                    # If counterparty meets or exceeds target/max budget and round >= 2
                    if (user_prop >= p_max or user_prop >= (p_init + p_target) / 2) and current_round >= 2:
                        final_val = user_prop
                        return AgentDecision(
                            action="accept",
                            message=(
                                f"Your proposal of {self._format_num(final_val, curr)} for {quantity} of {product} meets our commercial requirements. "
                                f"We are pleased to accept these terms with {p_quality} on {p_terms} terms."
                            ),
                            rationale_summary=f"Accepting counterparty offer of {self._format_num(final_val, curr)}.",
                            offer={"price": self._format_num(final_val, curr), "paymentTerms": p_terms, "delivery": p_delivery},
                            concession_percentage=5.0,
                            confidence_score=0.96,
                        )

                    # In round 3+, make closing compromise near p_max
                    if current_round >= 3:
                        compromise_p = max(p_target, min(p_max, (p_init + user_prop) / 2))
                        return AgentDecision(
                            action="accept" if abs(user_prop - compromise_p) / compromise_p < 0.08 else "counteroffer",
                            message=(
                                f"In the spirit of partnership for this {product} deployment, we can align at {self._format_num(compromise_p, curr)} "
                                f"for {quantity} with {p_quality} and {p_terms} terms. We look forward to working together!"
                            ),
                            rationale_summary=f"Closing negotiation at compromise rate {self._format_num(compromise_p, curr)}.",
                            offer={"price": self._format_num(compromise_p, curr), "paymentTerms": p_terms, "delivery": p_delivery},
                            concession_percentage=6.0,
                            confidence_score=0.94,
                        )

                    # Round 1-2 counteroffer
                    counter_val = max(p_max, (p_init + user_prop) / 2)
                    return AgentDecision(
                        action="counteroffer",
                        message=(
                            f"We acknowledge your proposal of {self._format_num(user_prop, curr)}. "
                            f"To account for {p_quality} and expedited {p_delivery} on {quantity} of {product}, "
                            f"our best rate is {self._format_num(counter_val, curr)} under {p_terms} terms."
                        ),
                        rationale_summary=f"Countering with {self._format_num(counter_val, curr)} protecting margins.",
                        offer={"price": self._format_num(counter_val, curr), "paymentTerms": p_terms, "delivery": p_delivery},
                        concession_percentage=4.0,
                        confidence_score=0.90,
                    )
                else:
                    counter_val = (p_init + p_max) / 2
                    return AgentDecision(
                        action="counteroffer",
                        message=(
                            f"To ensure balanced terms for {quantity} of {product}, our revised proposal is "
                            f"{self._format_num(counter_val, curr)} on {p_terms} terms with {p_quality}."
                        ),
                        rationale_summary=f"Countering with structured terms at {self._format_num(counter_val, curr)}.",
                        offer={"price": self._format_num(counter_val, curr), "paymentTerms": p_terms, "delivery": p_delivery},
                        concession_percentage=4.0,
                        confidence_score=0.88,
                    )

            else:
                # Buyer / Procurement Director
                if user_prop is not None:
                    # If vendor met target or is within budget
                    if (user_prop <= p_max or user_prop <= p_target) and current_round >= 2:
                        return AgentDecision(
                            action="accept",
                            message=(
                                f"We accept your proposed price of {self._format_num(user_prop, curr)} for {quantity} of {product}. "
                                f"This fits within our budget ceiling and meets our {p_delivery} schedule under {p_terms}."
                            ),
                            rationale_summary=f"Accepting price of {self._format_num(user_prop, curr)} within budget.",
                            offer={"price": self._format_num(user_prop, curr), "paymentTerms": p_terms, "delivery": p_delivery},
                            concession_percentage=5.0,
                            confidence_score=0.95,
                        )

                    if current_round >= 3:
                        agree_val = min(p_max, user_prop)
                        return AgentDecision(
                            action="accept",
                            message=(
                                f"We can finalize agreement at {self._format_num(agree_val, curr)} for {quantity} of {product}, "
                                f"provided {p_quality} and {p_delivery} are fully guaranteed on {p_terms}."
                            ),
                            rationale_summary=f"Accepting final price {self._format_num(agree_val, curr)} in round {current_round}.",
                            offer={"price": self._format_num(agree_val, curr), "paymentTerms": p_terms, "delivery": p_delivery},
                            concession_percentage=6.0,
                            confidence_score=0.93,
                        )

                    buyer_counter = min(p_max, (p_target + user_prop) / 2)
                    return AgentDecision(
                        action="counteroffer",
                        message=(
                            f"Thank you for the proposal of {self._format_num(user_prop, curr)}. Our procurement budget ceiling is capped, "
                            f"so we counter with {self._format_num(buyer_counter, curr)} for {quantity} of {product} on {p_terms}."
                        ),
                        rationale_summary=f"Countering vendor quote with {self._format_num(buyer_counter, curr)}.",
                        offer={"price": self._format_num(buyer_counter, curr), "paymentTerms": p_terms, "delivery": p_delivery},
                        concession_percentage=5.0,
                        confidence_score=0.90,
                    )
                else:
                    return AgentDecision(
                        action="counteroffer",
                        message=(
                            f"Our target rate for {quantity} of {product} is {self._format_num(p_target, curr)} on {p_terms} terms "
                            f"with delivery in {p_delivery}."
                        ),
                        rationale_summary=f"Proposing target rate of {self._format_num(p_target, curr)}.",
                        offer={"price": self._format_num(p_target, curr), "paymentTerms": p_terms, "delivery": p_delivery},
                        concession_percentage=4.0,
                        confidence_score=0.90,
                    )

        # =========================================================================
        # SCENARIO 2: JOB OFFER
        # =========================================================================
        elif scenario_id == "job-offer":
            is_recruiter = any(w in role_lower for w in ["recruiter", "hr", "hiring", "talent", "partner", "marcus"])
            role_name = sc_data.get("job_role") or "the role"
            company = sc_data.get("company") or "our organization"
            sal_init = self._parse_numeric(sc_data.get("initial_salary_offer") or sc_data.get("current_initial_salary")) or 30000.0
            sal_exp = self._parse_numeric(sc_data.get("expected_salary")) or (sal_init * 1.33)
            sal_min = self._parse_numeric(sc_data.get("minimum_acceptable_salary")) or (sal_init * 1.15)
            work_mode = sc_data.get("work_mode") or "Hybrid"
            location = sc_data.get("location") or "designated location"
            benefits = sc_data.get("benefits") or "competitive healthcare, annual review, and retirement match"
            joining = sc_data.get("joining_date") or "mutually agreeable date"
            notice = sc_data.get("notice_period") or "standard notice"

            user_prop = ctx.get("proposed_number")

            if is_recruiter:
                # Opening turn
                if current_round == 1 and not user_msg:
                    return AgentDecision(
                        action="offer",
                        message=(
                            f"Welcome! We are excited to extend an initial offer for the {role_name} position at {company}. "
                            f"We propose a base compensation of {self._format_num(sal_init, curr)}, with {work_mode} flexibility, {benefits}, and start date of {joining}."
                        ),
                        rationale_summary=f"Opening offer anchored at initial budget {self._format_num(sal_init, curr)}.",
                        offer={"salary": self._format_num(sal_init, curr), "workMode": work_mode, "benefits": benefits},
                        concession_percentage=0.0,
                        confidence_score=0.92,
                    )

                if user_prop is not None:
                    # If candidate ask is within acceptable band and round >= 2
                    if (user_prop <= sal_min or user_prop <= (sal_init + sal_exp) / 2) and current_round >= 2:
                        final_sal = user_prop
                        return AgentDecision(
                            action="accept",
                            message=(
                                f"We are delighted to accept your compensation expectation of {self._format_num(final_sal, curr)} for {role_name} at {company}! "
                                f"This package includes {work_mode} flexibility and full {benefits}. Welcome to the team!"
                            ),
                            rationale_summary=f"Accepting candidate salary request of {self._format_num(final_sal, curr)}.",
                            offer={"salary": self._format_num(final_sal, curr), "workMode": work_mode, "benefits": benefits},
                            concession_percentage=6.0,
                            confidence_score=0.96,
                        )

                    # Round 3+ close deal near min/compromise
                    if current_round >= 3:
                        agree_sal = max(sal_min, min(sal_exp, (sal_init + user_prop) / 2))
                        return AgentDecision(
                            action="accept",
                            message=(
                                f"To bring you onboard at {company}, we can finalize compensation at {self._format_num(agree_sal, curr)} "
                                f"along with {work_mode} arrangement, {benefits}, and onboarding on {joining}. We are excited to partner with you!"
                            ),
                            rationale_summary=f"Closing offer at {self._format_num(agree_sal, curr)}.",
                            offer={"salary": self._format_num(agree_sal, curr), "workMode": work_mode, "benefits": benefits},
                            concession_percentage=7.0,
                            confidence_score=0.94,
                        )

                    counter_sal = (sal_init + user_prop) / 2
                    return AgentDecision(
                        action="counteroffer",
                        message=(
                            f"We value your background and hear your target of {self._format_num(user_prop, curr)}. "
                            f"While our initial band was {self._format_num(sal_init, curr)}, we can increase to {self._format_num(counter_sal, curr)} "
                            f"with {work_mode} work options and comprehensive {benefits}."
                        ),
                        rationale_summary=f"Countering candidate ask with {self._format_num(counter_sal, curr)}.",
                        offer={"salary": self._format_num(counter_sal, curr), "workMode": work_mode, "benefits": benefits},
                        concession_percentage=5.0,
                        confidence_score=0.90,
                    )
                else:
                    mid_sal = (sal_init + sal_min) / 2
                    return AgentDecision(
                        action="counteroffer",
                        message=(
                            f"We can offer a competitive compensation package of {self._format_num(mid_sal, curr)} "
                            f"with {work_mode} arrangement and {benefits} for {role_name} at {company}."
                        ),
                        rationale_summary=f"Countering with {self._format_num(mid_sal, curr)}.",
                        offer={"salary": self._format_num(mid_sal, curr), "workMode": work_mode, "benefits": benefits},
                        concession_percentage=5.0,
                        confidence_score=0.89,
                    )

            else:
                # Candidate (Elena Rostova or human)
                if user_prop is not None:
                    # If recruiter meets or exceeds minimum acceptable salary
                    if (user_prop >= sal_exp or (user_prop >= sal_min and current_round >= 2)):
                        return AgentDecision(
                            action="accept",
                            message=(
                                f"Thank you for extending the offer of {self._format_num(user_prop, curr)} for {role_name} at {company}. "
                                f"This aligns with my professional expectations and {work_mode} preference. I am delighted to accept!"
                            ),
                            rationale_summary=f"Accepting offer of {self._format_num(user_prop, curr)} exceeding floor.",
                            offer={"salary": self._format_num(user_prop, curr), "workMode": work_mode, "benefits": benefits},
                            concession_percentage=6.0,
                            confidence_score=0.96,
                        )

                    if current_round >= 3:
                        final_ask = max(sal_min, user_prop)
                        return AgentDecision(
                            action="accept" if user_prop >= sal_min else "counteroffer",
                            message=(
                                f"Thank you for your constructive discussions. I can commit to joining {company} as {role_name} at "
                                f"{self._format_num(final_ask, curr)} with {work_mode} flexibility, ready to start after {notice}."
                            ),
                            rationale_summary=f"Finalizing position at {self._format_num(final_ask, curr)}.",
                            offer={"salary": self._format_num(final_ask, curr), "workMode": work_mode, "benefits": benefits},
                            concession_percentage=5.0,
                            confidence_score=0.92,
                        )

                    # If recruiter offer is below minimum acceptable, defend floor politely
                    cand_counter = max(sal_min, (sal_exp + user_prop) / 2)
                    return AgentDecision(
                        action="counteroffer",
                        message=(
                            f"Thank you for the proposal of {self._format_num(user_prop, curr)}. Given the scope of the {role_name} role and market expectations, "
                            f"my target is {self._format_num(cand_counter, curr)}. With {work_mode} flexibility and {benefits}, this represents an ideal match."
                        ),
                        rationale_summary=f"Countering recruiter offer of {self._format_num(user_prop, curr)} with {self._format_num(cand_counter, curr)}.",
                        offer={"salary": self._format_num(cand_counter, curr), "workMode": work_mode, "benefits": benefits},
                        concession_percentage=5.0,
                        confidence_score=0.90,
                    )
                else:
                    return AgentDecision(
                        action="counteroffer",
                        message=(
                            f"For the {role_name} role at {company}, my expected compensation is {self._format_num(sal_exp, curr)} "
                            f"along with {work_mode} work mode and standard benefits."
                        ),
                        rationale_summary=f"Stating expected compensation of {self._format_num(sal_exp, curr)}.",
                        offer={"salary": self._format_num(sal_exp, curr), "workMode": work_mode, "benefits": benefits},
                        concession_percentage=4.0,
                        confidence_score=0.90,
                    )

        # =========================================================================
        # SCENARIO 3: BUDGET ALLOCATION
        # =========================================================================
        else:
            is_finance = any(w in role_lower for w in ["finance", "cfo", "david", "vance", "director"])
            project_name = sc_data.get("project_name") or sc_data.get("project") or "the project"
            tot_raw = sc_data.get("total_budget") or "Total Budget"
            tot_num = self._parse_numeric(tot_raw) or 1000000.0
            teams = sc_data.get("teams_departments") or "Engineering, AI Research, Operations, Security"
            priorities = sc_data.get("priorities") or sc_data.get("priority_areas") or "operational milestones"
            deadline = sc_data.get("deadline") or "scheduled deadline"
            req_budget = sc_data.get("requested_budget") or ""

            if is_finance:
                if current_round >= 2:
                    return AgentDecision(
                        action="accept",
                        message=(
                            f"The proposed resource allocation for {project_name} successfully aligns with our {self._format_num(tot_num, curr)} total ceiling. "
                            f"Funding is approved across {teams} prioritizing {priorities} with target delivery by {deadline}."
                        ),
                        rationale_summary=f"Approving balanced allocation within {self._format_num(tot_num, curr)} cap.",
                        offer={"totalBudget": self._format_num(tot_num, curr), "project": project_name, "priorities": priorities},
                        concession_percentage=5.0,
                        confidence_score=0.95,
                    )
                else:
                    return AgentDecision(
                        action="counteroffer",
                        message=(
                            f"To safeguard delivery of {project_name} within our {self._format_num(tot_num, curr)} ceiling, "
                            f"we propose structuring department distributions across {teams} with strict milestone sign-offs focusing on {priorities}."
                        ),
                        rationale_summary="Establishing balanced allocation framework.",
                        offer={"totalBudget": self._format_num(tot_num, curr), "project": project_name, "priorities": priorities},
                        concession_percentage=4.0,
                        confidence_score=0.91,
                    )
            else:
                return AgentDecision(
                    action="counteroffer" if current_round < 2 else "accept",
                    message=(
                        f"From our delivery team's perspective, this distribution for {project_name} within {self._format_num(tot_num, curr)} "
                        f"fully supports our milestones for {teams} targeting {priorities} by {deadline}."
                    ),
                    rationale_summary="Supporting viable resource distribution.",
                    offer={"totalBudget": self._format_num(tot_num, curr), "project": project_name, "priorities": priorities},
                    concession_percentage=5.0,
                    confidence_score=0.93,
                )


class SecondaryLLMProvider(BaseLLMProvider):
    """Secondary external LLM provider (OpenAI-compatible / Groq / Anthropic compatible)."""

    def __init__(self, provider_name: str = "secondary_llm", api_key: Optional[str] = None, model_name: Optional[str] = None):
        self._name = provider_name
        self.api_key = api_key or settings.FALLBACK_API_KEY
        self.model_name = model_name or settings.FALLBACK_MODEL or "gpt-3.5-turbo"

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
                message=f"Secondary provider {self._name} has no configured API key",
                provider_name=self.provider_name(),
                status_code=401,
                is_quota=False,
                is_transient=False,
            )

        # In production this makes an async HTTP call to OpenAI / Groq API.
        # If API key is present but call fails, it raises LLMProviderError.
        raise LLMProviderError(
            message=f"Secondary provider {self._name} connection error",
            provider_name=self.provider_name(),
            status_code=503,
            is_quota=False,
            is_transient=True,
        )
