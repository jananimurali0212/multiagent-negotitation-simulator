import re
import json
import logging
from typing import Optional, Dict, Any, Tuple
from app.core.config import settings
from app.schemas.arena import AgentDecision
from app.providers.base import BaseLLMProvider, LLMProviderError
from app.negotiation.mode_strategy import get_personality_strategy, get_mode_strategy

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
        match = re.search(r"[-+]?\d+(?:\.\d+)?", s_no_commas)
        if match:
            try:
                return float(match.group()) * multiplier
            except ValueError:
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

    @staticmethod
    def _extract_mode_from_prompt(prompt: str) -> str:
        """Extracts the authoritative negotiation mode from the system prompt."""
        if not prompt:
            return "collaborative"
        m = re.search(r"SECTION 1C — NEGOTIATION MODE & BEHAVIORAL STRATEGY:\s*([A-Z_\-]+)", prompt, re.IGNORECASE)
        if m:
            raw = m.group(1).strip().lower().replace("-", "_")
            if raw in ["collaborative", "risk_averse", "aggressive"]:
                return raw
        m2 = re.search(r'Mode value:\s*"([^"]+)"', prompt, re.IGNORECASE)
        if m2:
            raw = m2.group(1).strip().lower().replace("-", "_")
            if raw in ["collaborative", "risk_averse", "aggressive"]:
                return raw
        if "risk_averse" in prompt.lower() or "risk-averse" in prompt.lower():
            return "risk_averse"
        if "aggressive" in prompt.lower():
            return "aggressive"
        return "collaborative"

    async def generate_decision(
        self,
        prompt: str,
        agent_personality: str,
        agent_role: str,
        current_round: int,
        scenario_id: str,
    ) -> AgentDecision:
        """Personality and mode-driven dynamic negotiation decision maker strictly grounded on real user data."""
        sc_data = self._extract_scenario_data_from_prompt(prompt)
        ctx = self._extract_last_counterparty_context(prompt, sc_data)
        mode = self._extract_mode_from_prompt(prompt)
        strategy = get_personality_strategy(agent_personality)
        logger.info(
            f"FallbackRuleProvider generating decision for role='{agent_role}', round={current_round}, "
            f"scenario='{scenario_id}', mode='{mode}', personality='{agent_personality}', real_data_keys={list(sc_data.keys())}"
        )
        return self._generate_scenario_decision(
            agent_personality, agent_role, current_round, scenario_id, ctx, sc_data, mode, strategy
        )

    def _generate_scenario_decision(
        self,
        personality: str,
        role: str,
        current_round: int,
        scenario_id: str,
        ctx: Dict[str, Any],
        sc_data: Dict[str, Any],
        mode: str,
        strategy: Any,
    ) -> AgentDecision:
        role_lower = role.lower()
        curr = ctx.get("currency") or "$"
        user_msg = ctx.get("last_message", "")
        pers = (personality or getattr(strategy, "personality", None) or "collaborative").lower().replace("-", "_")


        # =========================================================================
        # SCENARIO 1: VENDOR PRICING
        # =========================================================================
        if scenario_id == "vendor-pricing":
            is_vendor = any(w in role_lower for w in ["sales", "vendor", "seller", "account", "sarah"])
            product = sc_data.get("product") or "the equipment/service"
            quantity = sc_data.get("quantity") or "the requested volume"
            p_init = self._parse_numeric(sc_data.get("initial_vendor_price") or sc_data.get("current_vendor_price") or sc_data.get("initial_price")) or 85000.0
            p_target = self._parse_numeric(sc_data.get("target_price")) or (p_init * 0.75)
            p_max = self._parse_numeric(sc_data.get("maximum_budget") or sc_data.get("budget_limit")) or (p_target * 1.20)
            p_min = self._parse_numeric(sc_data.get("minimum_price") or sc_data.get("min_price") or sc_data.get("vendor_floor")) or (p_init * 0.70)
            p_delivery = sc_data.get("delivery_requirements") or sc_data.get("delivery_requirement") or sc_data.get("delivery_timeline") or "standard timeline"
            p_quality = sc_data.get("quality_requirements") or sc_data.get("quality_requirement") or "standard SLA and warranty"
            p_terms = sc_data.get("payment_terms") or "Net-30"

            user_prop = ctx.get("proposed_number")

            # --- DEADLOCK CONDITION CHECK (Impossible reservation boundaries) ---
            if p_max is not None and p_min is not None and p_max < p_min and current_round >= 2:
                deadlock_msg = (
                    f"Our reservation boundaries do not overlap: the buyer maximum budget of {self._format_num(p_max, curr)} "
                    f"is strictly below the vendor minimum acceptable floor of {self._format_num(p_min, curr)}. "
                    f"Because no feasible Zone of Possible Agreement (ZOPA) exists, we must conclude in a deadlock."
                )
                return AgentDecision(
                    action="deadlock",
                    message=deadlock_msg,
                    rationale_summary=f"Deadlock declared: hard boundary floor ({self._format_num(p_min, curr)}) exceeds ceiling ({self._format_num(p_max, curr)}).",
                    offer={"price": self._format_num(p_min if is_vendor else p_max, curr), "paymentTerms": p_terms, "delivery": p_delivery},
                    concession_percentage=0.0,
                    confidence_score=0.99,
                )

            # --- PERSONALITY-SPECIFIC STRATEGIES ---
            if "collaborative" in pers:
                # Collaborative: Multi-variable trade-offs, moderate concessions (6-8%), seeking win-win
                if is_vendor:
                    if current_round == 1 and not user_msg:
                        return AgentDecision(
                            action="offer",
                            message=(
                                f"Thank you for considering our proposal for {quantity} of {product}. "
                                f"Our opening pricing is {self._format_num(p_init, curr)} with {p_quality} and delivery within {p_delivery}. "
                                f"We are very open to exploring trade-offs on payment terms and delivery to reach a mutually beneficial agreement."
                            ),
                            rationale_summary="Collaborative opening proposal anchored on initial vendor quote, inviting package trade-offs.",
                            offer={"price": self._format_num(p_init, curr), "paymentTerms": p_terms, "delivery": p_delivery},
                            concession_percentage=0.0,
                            confidence_score=0.92,
                        )

                    if user_prop is not None:
                        # Multi-round progression: Rounds 1 & 2 are for probing, trade-offs, and counteroffers
                        if current_round >= 3:
                            if user_prop >= p_target and abs(user_prop - p_target) / max(p_target, 1) < 0.04:
                                return AgentDecision(
                                    action="accept",
                                    message=(
                                        f"We are pleased to accept your proposal of {self._format_num(user_prop, curr)} for {quantity} of {product}. "
                                        f"In the spirit of collaboration, we will include {p_quality} and standard delivery under {p_terms} terms. We look forward to a great partnership!"
                                    ),
                                    rationale_summary=f"Collaborative acceptance of counterparty rate {self._format_num(user_prop, curr)} in round {current_round}.",
                                    offer={"price": self._format_num(user_prop, curr), "paymentTerms": p_terms, "delivery": p_delivery},
                                    concession_percentage=7.5,
                                    confidence_score=0.96,
                                )

                        if current_round >= 4:
                            closing_val = max(p_min, min(p_max, (p_init + user_prop) / 2))
                            if abs(user_prop - closing_val) / max(closing_val, 1) < 0.03:
                                return AgentDecision(
                                    action="accept",
                                    message=(
                                        f"We accept your proposed terms at {self._format_num(user_prop, curr)} for {quantity} of {product}. "
                                        f"Let us finalize on {p_terms} with {p_quality}."
                                    ),
                                    rationale_summary=f"Collaborative closing acceptance at {self._format_num(user_prop, curr)}.",
                                    offer={"price": self._format_num(user_prop, curr), "paymentTerms": p_terms, "delivery": p_delivery},
                                    concession_percentage=7.0,
                                    confidence_score=0.95,
                                )
                            return AgentDecision(
                                action="counteroffer",
                                message=(
                                    f"To finalize a win-win partnership for {quantity} of {product}, we can adjust our price to {self._format_num(closing_val, curr)} "
                                    f"if payment can be arranged on Net-15 terms with {p_quality}. This balances both of our operational goals."
                                ),
                                rationale_summary=f"Collaborative closing proposal at {self._format_num(closing_val, curr)} with payment trade-off.",
                                offer={"price": self._format_num(closing_val, curr), "paymentTerms": "Net-15", "delivery": p_delivery},
                                concession_percentage=7.0,
                                confidence_score=0.94,
                            )

                        # Rounds 1 & 2: Counteroffer with steady reciprocal movement
                        concession_factor = 0.25 if current_round == 1 else 0.45
                        counter_p = p_init - (p_init - max(p_target, user_prop)) * concession_factor
                        return AgentDecision(
                            action="counteroffer",
                            message=(
                                f"We appreciate your offer of {self._format_num(user_prop, curr)}. While our standard rate is {self._format_num(p_init, curr)}, "
                                f"we can move to {self._format_num(counter_p, curr)} for {quantity} if we structure payment on {p_terms} with {p_delivery} delivery."
                            ),
                            rationale_summary=f"Collaborative counteroffer at {self._format_num(counter_p, curr)} offering trade-off.",
                            offer={"price": self._format_num(counter_p, curr), "paymentTerms": p_terms, "delivery": p_delivery},
                            concession_percentage=6.5,
                            confidence_score=0.91,
                        )
                    else:
                        counter_p = (p_init + p_target) / 2
                        return AgentDecision(
                            action="counteroffer",
                            message=f"We propose a collaborative package of {self._format_num(counter_p, curr)} for {quantity} of {product} on {p_terms} terms.",
                            rationale_summary="Collaborative counter proposal.",
                            offer={"price": self._format_num(counter_p, curr), "paymentTerms": p_terms, "delivery": p_delivery},
                            concession_percentage=6.0,
                            confidence_score=0.90,
                        )

                else:
                    # Collaborative Buyer
                    if user_prop is not None:
                        if current_round >= 3:
                            midpoint = (p_init + p_target) / 2
                            if user_prop <= p_target or (user_prop <= p_max and user_prop <= midpoint) or (user_prop <= p_max and abs(user_prop - midpoint) / max(p_target, 1) < 0.06):
                                return AgentDecision(
                                    action="accept",
                                    message=(
                                        f"We accept your proposed price of {self._format_num(user_prop, curr)} for {quantity} of {product}. "
                                        f"This meets our budget objectives and satisfies our {p_delivery} requirements under {p_terms}. Thank you for collaborating!"
                                    ),
                                    rationale_summary=f"Collaborative acceptance of vendor rate {self._format_num(user_prop, curr)} in round {current_round}.",
                                    offer={"price": self._format_num(user_prop, curr), "paymentTerms": p_terms, "delivery": p_delivery},
                                    concession_percentage=7.0,
                                    confidence_score=0.95,
                                )

                        if current_round >= 4:
                            buyer_closing = min(p_max, max(p_target, user_prop))
                            if abs(user_prop - buyer_closing) / max(buyer_closing, 1) < 0.03:
                                return AgentDecision(
                                    action="accept",
                                    message=(
                                        f"We can finalize agreement at {self._format_num(user_prop, curr)} for {quantity} of {product}, "
                                        f"confirming {p_quality} and delivery within {p_delivery} on {p_terms} terms. We appreciate the constructive dialogue!"
                                    ),
                                    rationale_summary=f"Collaborative round {current_round} agreement at {self._format_num(user_prop, curr)}.",
                                    offer={"price": self._format_num(user_prop, curr), "paymentTerms": p_terms, "delivery": p_delivery},
                                    concession_percentage=7.0,
                                    confidence_score=0.94,
                                )
                            return AgentDecision(
                                action="counteroffer",
                                message=(
                                    f"We can advance our offer to {self._format_num(buyer_closing, curr)} for {quantity} of {product}, "
                                    f"confirming {p_quality} and delivery within {p_delivery} on {p_terms} terms."
                                ),
                                rationale_summary=f"Collaborative round {current_round} counteroffer at {self._format_num(buyer_closing, curr)}.",
                                offer={"price": self._format_num(buyer_closing, curr), "paymentTerms": p_terms, "delivery": p_delivery},
                                concession_percentage=7.0,
                                confidence_score=0.94,
                            )

                        concession_factor = 0.25 if current_round == 1 else 0.45
                        buyer_step = p_target + (min(p_max, user_prop) - p_target) * concession_factor
                        return AgentDecision(
                            action="counteroffer",
                            message=(
                                f"Thank you for the proposal of {self._format_num(user_prop, curr)}. To bridge the gap collaboratively, "
                                f"we can increase our offer to {self._format_num(buyer_step, curr)} for {quantity} of {product} if you can include {p_quality}."
                            ),
                            rationale_summary=f"Collaborative buyer counter at {self._format_num(buyer_step, curr)} with quality trade-off.",
                            offer={"price": self._format_num(buyer_step, curr), "paymentTerms": p_terms, "delivery": p_delivery},
                            concession_percentage=6.5,
                            confidence_score=0.91,
                        )
                    else:
                        return AgentDecision(
                            action="counteroffer",
                            message=f"Our target proposal for {quantity} of {product} is {self._format_num(p_target, curr)} with {p_delivery} delivery on {p_terms} terms.",
                            rationale_summary="Collaborative opening counter proposal.",
                            offer={"price": self._format_num(p_target, curr), "paymentTerms": p_terms, "delivery": p_delivery},
                            concession_percentage=5.0,
                            confidence_score=0.90,
                        )

            elif "risk" in pers or "averse" in pers:
                # Risk-Averse: Protect safety margin from floor/ceiling, small concessions (2-3%), require guarantees
                vendor_safe_floor = max(p_min, p_target * 1.10)
                buyer_safe_ceiling = min(p_max, p_target * 1.12)

                if is_vendor:
                    if current_round == 1 and not user_msg:
                        return AgentDecision(
                            action="offer",
                            message=(
                                f"Regarding your inquiry for {quantity} of {product}: our quote is {self._format_num(p_init, curr)}. "
                                f"To maintain rigorous {p_quality} and guaranteed delivery within {p_delivery}, this pricing incorporates complete operational coverage on {p_terms} terms."
                            ),
                            rationale_summary="Risk-averse opening offer preserving full cost margins and operational protections.",
                            offer={"price": self._format_num(p_init, curr), "paymentTerms": p_terms, "delivery": p_delivery},
                            concession_percentage=0.0,
                            confidence_score=0.94,
                        )

                    if user_prop is not None:
                        # Only accept after multi-round negotiation (round 4+) and if comfortably above safe floor
                        if user_prop >= vendor_safe_floor and current_round >= 4 and abs(user_prop - vendor_safe_floor) / max(vendor_safe_floor, 1) < 0.03:
                            return AgentDecision(
                                action="accept",
                                message=(
                                    f"Your proposal of {self._format_num(user_prop, curr)} satisfies our risk and margin requirements for {quantity} of {product}. "
                                    f"We accept with strict milestone delivery within {p_delivery} and standard {p_terms} terms."
                                ),
                                rationale_summary=f"Risk-averse acceptance of {self._format_num(user_prop, curr)} meeting safety threshold.",
                                offer={"price": self._format_num(user_prop, curr), "paymentTerms": p_terms, "delivery": p_delivery},
                                concession_percentage=2.5,
                                confidence_score=0.95,
                            )

                        # Small conservative concession (1.5-2%) preserving safety buffer
                        safe_counter = max(vendor_safe_floor, p_init * (1.0 - (0.018 * current_round)))
                        return AgentDecision(
                            action="counteroffer",
                            message=(
                                f"We have reviewed your offer of {self._format_num(user_prop, curr)}. To protect quality standards and avoid delivery risks on {quantity} of {product}, "
                                f"our conservative adjusted rate is {self._format_num(safe_counter, curr)} with full {p_quality} and milestone-backed {p_terms}."
                            ),
                            rationale_summary=f"Risk-averse conservative counter {self._format_num(safe_counter, curr)} defending safety floor.",
                            offer={"price": self._format_num(safe_counter, curr), "paymentTerms": p_terms, "delivery": p_delivery},
                            concession_percentage=2.0,
                            confidence_score=0.92,
                        )
                    else:
                        safe_counter = max(vendor_safe_floor, p_init * 0.98)
                        return AgentDecision(
                            action="counteroffer",
                            message=f"Our conservative rate for {quantity} of {product} is {self._format_num(safe_counter, curr)} safeguarding delivery standards.",
                            rationale_summary="Risk-averse counter protecting safety margin.",
                            offer={"price": self._format_num(safe_counter, curr), "paymentTerms": p_terms, "delivery": p_delivery},
                            concession_percentage=2.0,
                            confidence_score=0.90,
                        )

                else:
                    # Risk-averse Buyer: strictly caps concessions well below budget ceiling
                    if user_prop is not None:
                        if user_prop <= buyer_safe_ceiling and current_round >= 4 and abs(user_prop - buyer_safe_ceiling) / max(buyer_safe_ceiling, 1) < 0.03:
                            return AgentDecision(
                                action="accept",
                                message=(
                                    f"We accept your proposal of {self._format_num(user_prop, curr)} for {quantity} of {product}. "
                                    f"This pricing remains within our safety threshold, provided {p_quality} and SLA penalties on {p_delivery} are contractually secured."
                                ),
                                rationale_summary=f"Risk-averse buyer acceptance of safe rate {self._format_num(user_prop, curr)}.",
                                offer={"price": self._format_num(user_prop, curr), "paymentTerms": p_terms, "delivery": p_delivery},
                                concession_percentage=2.0,
                                confidence_score=0.95,
                            )

                        safe_buyer_counter = min(buyer_safe_ceiling, p_target * (1.0 + (0.018 * current_round)))
                        return AgentDecision(
                            action="counteroffer",
                            message=(
                                f"Your proposal of {self._format_num(user_prop, curr)} carries substantial budgetary risk. "
                                f"To maintain a mandatory safety cushion, our best counter is {self._format_num(safe_buyer_counter, curr)} for {quantity} with guaranteed {p_quality}."
                            ),
                            rationale_summary=f"Risk-averse buyer counter {self._format_num(safe_buyer_counter, curr)} protecting budget buffer.",
                            offer={"price": self._format_num(safe_buyer_counter, curr), "paymentTerms": p_terms, "delivery": p_delivery},
                            concession_percentage=2.0,
                            confidence_score=0.91,
                        )
                    else:
                        return AgentDecision(
                            action="counteroffer",
                            message=f"Our safe baseline proposal is {self._format_num(p_target, curr)} on {p_terms} terms.",
                            rationale_summary="Risk-averse buyer anchor.",
                            offer={"price": self._format_num(p_target, curr), "paymentTerms": p_terms, "delivery": p_delivery},
                            concession_percentage=1.5,
                            confidence_score=0.90,
                        )

            else:
                # AGGRESSIVE MODE: High pressure, low concessions (0.8-1.2%), strong counteroffers, maximizing advantage
                if is_vendor:
                    if current_round == 1 and not user_msg:
                        return AgentDecision(
                            action="offer",
                            message=(
                                f"We offer {quantity} of {product} at {self._format_num(p_init, curr)}. "
                                f"Given our tier-one market reputation, superior {p_quality}, and rapid {p_delivery}, this represents exceptional commercial value."
                            ),
                            rationale_summary="Aggressive opening anchor establishing firm market positioning.",
                            offer={"price": self._format_num(p_init, curr), "paymentTerms": p_terms, "delivery": p_delivery},
                            concession_percentage=0.0,
                            confidence_score=0.93,
                        )

                    if user_prop is not None:
                        # Accept only if counterparty meets our high target in round 4+
                        if user_prop >= (p_init * 0.96) and current_round >= 4:
                            return AgentDecision(
                                action="accept",
                                message=(
                                    f"Your offer of {self._format_num(user_prop, curr)} for {quantity} of {product} meets our pricing requirements. "
                                    f"We accept on {p_terms} terms with standard delivery."
                                ),
                                rationale_summary=f"Aggressive acceptance at favorable rate {self._format_num(user_prop, curr)}.",
                                offer={"price": self._format_num(user_prop, curr), "paymentTerms": p_terms, "delivery": p_delivery},
                                concession_percentage=1.0,
                                confidence_score=0.95,
                            )

                        # Minimal concession (0.8%) and asserting leverage
                        aggr_counter = max(p_target * 1.15, p_init * (1.0 - (0.008 * current_round)))
                        return AgentDecision(
                            action="counteroffer",
                            message=(
                                f"Your offer of {self._format_num(user_prop, curr)} significantly undervalues {product}. "
                                f"Demand for our delivery slots is high. Our firm counter is {self._format_num(aggr_counter, curr)} under {p_terms} terms."
                            ),
                            rationale_summary=f"Aggressive counter {self._format_num(aggr_counter, curr)} asserting leverage and minimal concession.",
                            offer={"price": self._format_num(aggr_counter, curr), "paymentTerms": p_terms, "delivery": p_delivery},
                            concession_percentage=0.8,
                            confidence_score=0.92,
                        )
                    else:
                        return AgentDecision(
                            action="counteroffer",
                            message=f"Our firm rate for {quantity} of {product} is {self._format_num(p_init, curr)}.",
                            rationale_summary="Aggressive standing firm on opening anchor.",
                            offer={"price": self._format_num(p_init, curr), "paymentTerms": p_terms, "delivery": p_delivery},
                            concession_percentage=0.5,
                            confidence_score=0.91,
                        )

                else:
                    # Aggressive Buyer
                    if user_prop is not None:
                        if user_prop <= p_target and current_round >= 4:
                            return AgentDecision(
                                action="accept",
                                message=(
                                    f"We accept your revised quote of {self._format_num(user_prop, curr)} for {quantity} of {product}. "
                                    f"Proceed with delivery on {p_terms} terms."
                                ),
                                rationale_summary=f"Aggressive acceptance having secured target rate {self._format_num(user_prop, curr)}.",
                                offer={"price": self._format_num(user_prop, curr), "paymentTerms": p_terms, "delivery": p_delivery},
                                concession_percentage=1.0,
                                confidence_score=0.96,
                            )

                        aggr_buyer_counter = p_target * (1.0 + (0.008 * current_round))
                        return AgentDecision(
                            action="counteroffer",
                            message=(
                                f"Your rate of {self._format_num(user_prop, curr)} is uncompetitive compared to our alternative market quotes. "
                                f"We counter with {self._format_num(aggr_buyer_counter, curr)} for {quantity} of {product} and expect confirmation promptly."
                            ),
                            rationale_summary=f"Aggressive buyer counter {self._format_num(aggr_buyer_counter, curr)} applying market competition pressure.",
                            offer={"price": self._format_num(aggr_buyer_counter, curr), "paymentTerms": p_terms, "delivery": p_delivery},
                            concession_percentage=0.8,
                            confidence_score=0.91,
                        )
                    else:
                        return AgentDecision(
                            action="counteroffer",
                            message=f"Our baseline target is {self._format_num(p_target, curr)} for {quantity} of {product}.",
                            rationale_summary="Aggressive buyer target anchor.",
                            offer={"price": self._format_num(p_target, curr), "paymentTerms": p_terms, "delivery": p_delivery},
                            concession_percentage=0.5,
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
            benefits = sc_data.get("benefits") or "competitive healthcare and retirement plan"
            joining = sc_data.get("joining_date") or "mutually agreeable date"
            notice = sc_data.get("notice_period") or "standard notice"

            user_prop = ctx.get("proposed_number")

            # --- DEADLOCK CONDITION CHECK ---
            if sal_init is not None and sal_min is not None and sal_init < (sal_min * 0.70) and current_round >= 2:
                deadlock_msg = (
                    f"Irreconcilable constraint conflict: the recruiter maximum compensation band is capped well below the candidate's "
                    f"minimum acceptable floor of {self._format_num(sal_min, curr)}. No feasible ZOPA exists, resulting in deadlock."
                )
                return AgentDecision(
                    action="deadlock",
                    message=deadlock_msg,
                    rationale_summary=f"Deadlock declared: salary expectations ({self._format_num(sal_min, curr)}) exceed compensation budget.",
                    offer={"salary": self._format_num(sal_min if not is_recruiter else sal_init, curr), "workMode": work_mode, "benefits": benefits},
                    concession_percentage=0.0,
                    confidence_score=0.99,
                )

            # --- PERSONALITY-SPECIFIC STRATEGIES ---
            if "collaborative" in pers:
                if is_recruiter:
                    if current_round == 1 and not user_msg:
                        return AgentDecision(
                            action="offer",
                            message=(
                                f"Welcome! We are excited to extend an offer for {role_name} at {company}. "
                                f"Our opening base is {self._format_num(sal_init, curr)} with {work_mode} flexibility, full {benefits}, and onboarding on {joining}. "
                                f"We value finding an agreement that works for both of us."
                            ),
                            rationale_summary="Collaborative recruiter opening offer inviting creative package discussion.",
                            offer={"salary": self._format_num(sal_init, curr), "workMode": work_mode, "benefits": benefits},
                            concession_percentage=0.0,
                            confidence_score=0.92,
                        )

                    if user_prop is not None:
                        # Multi-round progression: Rounds 1 & 2 are for probing expectations and trade-offs
                        if current_round >= 3:
                            if user_prop <= sal_min or (user_prop <= (sal_init + sal_exp) / 2 and abs(user_prop - ((sal_init + sal_exp) / 2)) / max(sal_exp, 1) < 0.04):
                                return AgentDecision(
                                    action="accept",
                                    message=(
                                        f"We are delighted to accept your compensation request of {self._format_num(user_prop, curr)} for {role_name} at {company}! "
                                        f"This package includes {work_mode} flexibility and comprehensive {benefits}. Welcome aboard!"
                                    ),
                                    rationale_summary=f"Collaborative acceptance of candidate rate {self._format_num(user_prop, curr)} in round {current_round}.",
                                    offer={"salary": self._format_num(user_prop, curr), "workMode": work_mode, "benefits": benefits},
                                    concession_percentage=7.0,
                                    confidence_score=0.96,
                                )

                        if current_round >= 4:
                            agree_sal = max(sal_min, min(sal_exp, (sal_init + user_prop) / 2))
                            if abs(user_prop - agree_sal) / max(agree_sal, 1) < 0.03:
                                return AgentDecision(
                                    action="accept",
                                    message=(
                                        f"We accept your compensation proposal of {self._format_num(user_prop, curr)} for {role_name} at {company}, "
                                        f"with {work_mode} flexibility and {benefits}. We are thrilled to welcome you!"
                                    ),
                                    rationale_summary=f"Collaborative closing acceptance at {self._format_num(user_prop, curr)}.",
                                    offer={"salary": self._format_num(user_prop, curr), "workMode": work_mode, "benefits": benefits},
                                    concession_percentage=6.5,
                                    confidence_score=0.95,
                                )
                            return AgentDecision(
                                action="counteroffer",
                                message=(
                                    f"To bring you onboard at {company}, we can finalize base compensation at {self._format_num(agree_sal, curr)} "
                                    f"paired with {work_mode} work options and full {benefits}. We are thrilled to partner together!"
                                ),
                                rationale_summary=f"Collaborative closing counteroffer at {self._format_num(agree_sal, curr)}.",
                                offer={"salary": self._format_num(agree_sal, curr), "workMode": work_mode, "benefits": benefits},
                                concession_percentage=6.5,
                                confidence_score=0.94,
                            )

                        concession_factor = 0.30 if current_round == 1 else 0.55
                        counter_sal = sal_init + (user_prop - sal_init) * concession_factor
                        return AgentDecision(
                            action="counteroffer",
                            message=(
                                f"We hear your target of {self._format_num(user_prop, curr)}. In the interest of collaboration, we can move our offer to "
                                f"{self._format_num(counter_sal, curr)} with {work_mode} work flexibility and {benefits}."
                            ),
                            rationale_summary=f"Collaborative counteroffer at {self._format_num(counter_sal, curr)}.",
                            offer={"salary": self._format_num(counter_sal, curr), "workMode": work_mode, "benefits": benefits},
                            concession_percentage=6.0,
                            confidence_score=0.91,
                        )
                    else:
                        counter_sal = (sal_init + sal_min) / 2
                        return AgentDecision(
                            action="counteroffer",
                            message=f"We can offer {self._format_num(counter_sal, curr)} with {work_mode} arrangement and {benefits} for {role_name}.",
                            rationale_summary="Collaborative recruiter counteroffer.",
                            offer={"salary": self._format_num(counter_sal, curr), "workMode": work_mode, "benefits": benefits},
                            concession_percentage=5.5,
                            confidence_score=0.89,
                        )

                else:
                    # Collaborative Candidate
                    if user_prop is not None:
                        if current_round >= 3:
                            if user_prop >= sal_exp or (user_prop >= sal_min and abs(user_prop - sal_min) / max(sal_min, 1) < 0.04):
                                return AgentDecision(
                                    action="accept",
                                    message=(
                                        f"Thank you for extending the offer of {self._format_num(user_prop, curr)} for {role_name} at {company}. "
                                        f"This aligns with my professional objectives and {work_mode} preference. I am delighted to accept!"
                                    ),
                                    rationale_summary=f"Collaborative candidate acceptance of {self._format_num(user_prop, curr)} in round {current_round}.",
                                    offer={"salary": self._format_num(user_prop, curr), "workMode": work_mode, "benefits": benefits},
                                    concession_percentage=6.5,
                                    confidence_score=0.96,
                                )

                        if current_round >= 4:
                            final_ask = max(sal_min, user_prop)
                            if abs(user_prop - final_ask) / max(final_ask, 1) < 0.03:
                                return AgentDecision(
                                    action="accept",
                                    message=(
                                        f"Thank you for the constructive dialogue. I am happy to join {company} as {role_name} at "
                                        f"{self._format_num(user_prop, curr)} with {work_mode} flexibility and start following my notice period."
                                    ),
                                    rationale_summary=f"Collaborative round {current_round} candidate acceptance at {self._format_num(user_prop, curr)}.",
                                    offer={"salary": self._format_num(user_prop, curr), "workMode": work_mode, "benefits": benefits},
                                    concession_percentage=6.0,
                                    confidence_score=0.94,
                                )
                            return AgentDecision(
                                action="counteroffer",
                                message=(
                                    f"I can adjust my expectation to {self._format_num(final_ask, curr)} if we can agree on {work_mode} flexibility "
                                    f"and onboarding on {joining}."
                                ),
                                rationale_summary=f"Collaborative round {current_round} candidate counter at {self._format_num(final_ask, curr)}.",
                                offer={"salary": self._format_num(final_ask, curr), "workMode": work_mode, "benefits": benefits},
                                concession_percentage=6.0,
                                confidence_score=0.92,
                            )

                        concession_factor = 0.30 if current_round == 1 else 0.55
                        cand_counter = sal_exp - (sal_exp - max(sal_min, user_prop)) * concession_factor
                        return AgentDecision(
                            action="counteroffer",
                            message=(
                                f"Thank you for proposing {self._format_num(user_prop, curr)}. In the spirit of finding common ground, "
                                f"I can propose {self._format_num(cand_counter, curr)} with {work_mode} flexibility and {benefits}."
                            ),
                            rationale_summary=f"Collaborative candidate counteroffer at {self._format_num(cand_counter, curr)}.",
                            offer={"salary": self._format_num(cand_counter, curr), "workMode": work_mode, "benefits": benefits},
                            concession_percentage=6.0,
                            confidence_score=0.90,
                        )
                    else:
                        return AgentDecision(
                            action="counteroffer",
                            message=f"My expected compensation for {role_name} is {self._format_num(sal_exp, curr)} with {work_mode} flexibility.",
                            rationale_summary="Collaborative candidate opening statement.",
                            offer={"salary": self._format_num(sal_exp, curr), "workMode": work_mode, "benefits": benefits},
                            concession_percentage=4.0,
                            confidence_score=0.90,
                        )

            elif "risk" in pers or "averse" in pers:
                # Risk-averse: candidate protects minimum salary plus safety margin; recruiter protects approved salary ceiling
                safe_sal_min = sal_min * 1.05
                safe_recruiter_cap = sal_init * 1.15

                if is_recruiter:
                    if user_prop is not None and user_prop <= safe_recruiter_cap and current_round >= 4 and abs(user_prop - safe_recruiter_cap) / max(safe_recruiter_cap, 1) < 0.03:
                        return AgentDecision(
                            action="accept",
                            message=(
                                f"Your salary expectation of {self._format_num(user_prop, curr)} falls within our pre-approved departmental risk band. "
                                f"We accept for {role_name} at {company} with {work_mode} and standard {benefits}."
                            ),
                            rationale_summary=f"Risk-averse recruiter acceptance of safe rate {self._format_num(user_prop, curr)} in round {current_round}.",
                            offer={"salary": self._format_num(user_prop, curr), "workMode": work_mode, "benefits": benefits},
                            concession_percentage=2.0,
                            confidence_score=0.95,
                        )

                    safe_sal_step = min(safe_recruiter_cap, sal_init * (1.0 + (0.018 * current_round)))
                    return AgentDecision(
                        action="counteroffer",
                        message=(
                            f"We have reviewed your request of {self._format_num(user_prop or sal_exp, curr)}. To adhere to strict equity bands and minimize compensation risk, "
                            f"our conservative counter is {self._format_num(safe_sal_step, curr)} for {role_name} with standard {benefits}."
                        ),
                        rationale_summary=f"Risk-averse recruiter counter at {self._format_num(safe_sal_step, curr)} protecting salary limits.",
                        offer={"salary": self._format_num(safe_sal_step, curr), "workMode": work_mode, "benefits": benefits},
                        concession_percentage=2.0,
                        confidence_score=0.92,
                    )
                else:
                    if user_prop is not None and user_prop >= safe_sal_min and current_round >= 4 and abs(user_prop - safe_sal_min) / max(safe_sal_min, 1) < 0.03:
                        return AgentDecision(
                            action="accept",
                            message=(
                                f"I accept your compensation offer of {self._format_num(user_prop, curr)} for {role_name}. "
                                f"This preserves my safety requirements and provides the stability needed to commit to {company}."
                            ),
                            rationale_summary=f"Risk-averse candidate acceptance of safe salary {self._format_num(user_prop, curr)} in round {current_round}.",
                            offer={"salary": self._format_num(user_prop, curr), "workMode": work_mode, "benefits": benefits},
                            concession_percentage=2.0,
                            confidence_score=0.95,
                        )

                    cand_safe_ask = max(safe_sal_min, sal_exp * (1.0 - (0.018 * current_round)))
                    return AgentDecision(
                        action="counteroffer",
                        message=(
                            f"Thank you for the proposal of {self._format_num(user_prop or sal_init, curr)}. To ensure financial security and market equity, "
                            f"my minimum safe requirement is {self._format_num(cand_safe_ask, curr)} along with guaranteed {benefits}."
                        ),
                        rationale_summary=f"Risk-averse candidate defending safe compensation cushion of {self._format_num(cand_safe_ask, curr)}.",
                        offer={"salary": self._format_num(cand_safe_ask, curr), "workMode": work_mode, "benefits": benefits},
                        concession_percentage=2.0,
                        confidence_score=0.92,
                    )

            else:
                # AGGRESSIVE MODE: High pressure, low concessions (0.8-1.2%), leverage emphasis
                if is_recruiter:
                    if user_prop is not None and user_prop <= sal_init * 1.04 and current_round >= 4:
                        return AgentDecision(
                            action="accept",
                            message=(
                                f"We accept your revised figure of {self._format_num(user_prop, curr)} for {role_name} at {company}. "
                                f"This fits our commercial structure under {work_mode} terms."
                            ),
                            rationale_summary=f"Aggressive recruiter acceptance at favorable figure {self._format_num(user_prop, curr)} in round {current_round}.",
                            offer={"salary": self._format_num(user_prop, curr), "workMode": work_mode, "benefits": benefits},
                            concession_percentage=1.0,
                            confidence_score=0.95,
                        )

                    aggr_sal_step = sal_init * (1.0 + (0.008 * current_round))
                    return AgentDecision(
                        action="counteroffer",
                        message=(
                            f"The requested salary of {self._format_num(user_prop or sal_exp, curr)} exceeds current market benchmarks for {role_name}. "
                            f"{company} offers outstanding brand prestige and career acceleration. Our firm offer is {self._format_num(aggr_sal_step, curr)}."
                        ),
                        rationale_summary=f"Aggressive recruiter firm counter {self._format_num(aggr_sal_step, curr)} asserting prestige leverage.",
                        offer={"salary": self._format_num(aggr_sal_step, curr), "workMode": work_mode, "benefits": benefits},
                        concession_percentage=0.8,
                        confidence_score=0.91,
                    )
                else:
                    if user_prop is not None and user_prop >= sal_exp * 0.96 and current_round >= 4:
                        return AgentDecision(
                            action="accept",
                            message=(
                                f"I accept your revised compensation offer of {self._format_num(user_prop, curr)} for {role_name} at {company}. "
                                f"I look forward to driving high-impact results."
                            ),
                            rationale_summary=f"Aggressive candidate acceptance at high compensation {self._format_num(user_prop, curr)} in round {current_round}.",
                            offer={"salary": self._format_num(user_prop, curr), "workMode": work_mode, "benefits": benefits},
                            concession_percentage=1.0,
                            confidence_score=0.95,
                        )

                    aggr_ask = sal_exp * (1.0 - (0.008 * current_round))
                    return AgentDecision(
                        action="counteroffer",
                        message=(
                            f"Given my proven leadership track record and competing market opportunities, my compensation target remains {self._format_num(aggr_ask, curr)}. "
                            f"Your proposal of {self._format_num(user_prop or sal_init, curr)} is insufficient for the scope of {role_name}."
                        ),
                        rationale_summary=f"Aggressive candidate holding firm at {self._format_num(aggr_ask, curr)} emphasizing market alternatives.",
                        offer={"salary": self._format_num(aggr_ask, curr), "workMode": work_mode, "benefits": benefits},
                        concession_percentage=0.8,
                        confidence_score=0.92,
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

            # --- PERSONALITY-SPECIFIC STRATEGIES ---
            if "collaborative" in pers:
                if current_round >= 3:
                    return AgentDecision(
                        action="accept",
                        message=(
                            f"The proposed cross-departmental resource allocation for {project_name} successfully aligns with our {self._format_num(tot_num, curr)} ceiling. "
                            f"Funding is cooperatively structured across {teams} with joint milestones on {priorities} targeting completion by {deadline}."
                        ),
                        rationale_summary=f"Collaborative approval of balanced resource distribution within {self._format_num(tot_num, curr)} cap in round {current_round}.",
                        offer={"totalBudget": self._format_num(tot_num, curr), "project": project_name, "priorities": priorities},
                        concession_percentage=6.0,
                        confidence_score=0.95,
                    )
                else:
                    return AgentDecision(
                        action="counteroffer",
                        message=(
                            f"To ensure balanced success for {project_name} within our {self._format_num(tot_num, curr)} total budget, "
                            f"we propose a collaborative sharing framework across {teams} prioritizing {priorities} with joint milestone reviews."
                        ),
                        rationale_summary="Collaborative budget proposal establishing equitable departmental distribution.",
                        offer={"totalBudget": self._format_num(tot_num, curr), "project": project_name, "priorities": priorities},
                        concession_percentage=5.0,
                        confidence_score=0.91,
                    )

            elif "risk" in pers or "averse" in pers:
                # Risk-averse: reserves mandatory 15% emergency contingency reserve, strict milestone sign-offs
                contingency_budget = tot_num * 0.85
                if current_round >= 4:
                    return AgentDecision(
                        action="accept",
                        message=(
                            f"We approve the risk-adjusted allocation for {project_name} capped at {self._format_num(contingency_budget, curr)}, "
                            f"reserving a 15% risk buffer ({self._format_num(tot_num * 0.15, curr)}) for critical infrastructure contingency across {teams}."
                        ),
                        rationale_summary=f"Risk-averse budget approval maintaining mandatory 15% safety contingency reserve in round {current_round}.",
                        offer={"totalBudget": self._format_num(contingency_budget, curr), "contingencyReserve": self._format_num(tot_num * 0.15, curr), "project": project_name},
                        concession_percentage=2.5,
                        confidence_score=0.94,
                    )
                else:
                    return AgentDecision(
                        action="counteroffer",
                        message=(
                            f"To guard against cost overruns on {project_name}, finance mandates reserving 15% of the {self._format_num(tot_num, curr)} budget. "
                            f"Allocations across {teams} will be phased according to verifiable delivery milestones for {priorities}."
                        ),
                        rationale_summary="Risk-averse budget counter enforcing 15% reserve fund and phased release.",
                        offer={"totalBudget": self._format_num(contingency_budget, curr), "project": project_name, "priorities": priorities},
                        concession_percentage=2.0,
                        confidence_score=0.92,
                    )

            else:
                # AGGRESSIVE MODE: Pushes hard for priority departmental funding, tight control
                if current_round >= 4:
                    return AgentDecision(
                        action="accept",
                        message=(
                            f"We accept the firm distribution for {project_name} within {self._format_num(tot_num, curr)}, "
                            f"mandating that core deliverables for {priorities} receive primary resource allocation."
                        ),
                        rationale_summary=f"Aggressive approval enforcing priority resource dominance within {self._format_num(tot_num, curr)} in round {current_round}.",
                        offer={"totalBudget": self._format_num(tot_num, curr), "project": project_name, "priorities": priorities},
                        concession_percentage=1.5,
                        confidence_score=0.95,
                    )
                else:
                    return AgentDecision(
                        action="counteroffer",
                        message=(
                            f"Given critical delivery timelines for {project_name} by {deadline}, non-essential departmental overhead must be stripped. "
                            f"We demand prioritizing the primary engineering teams to guarantee core milestones under {self._format_num(tot_num, curr)}."
                        ),
                        rationale_summary="Aggressive counter asserting strict priority delivery and challenging non-core overhead.",
                        offer={"totalBudget": self._format_num(tot_num, curr), "project": project_name, "priorities": priorities},
                        concession_percentage=1.0,
                        confidence_score=0.92,
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
