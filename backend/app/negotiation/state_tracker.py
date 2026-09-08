import re
import logging
from typing import Dict, Any, Optional, List, Tuple

logger = logging.getLogger("backend.negotiation.state_tracker")


class NegotiationStateTracker:
    """
    Centralized intelligence engine for:
    1. Extracting multi-issue offers, conditions, and intent from natural language.
    2. Maintaining and accumulating structured negotiation state across rounds without losing context.
    3. Detecting agreements, counteroffers, concessions, and deadlocks.
    """

    @staticmethod
    def detect_currency(text: str, default: str = "") -> str:
        if not text:
            return default or "$"
        text_lower = text.lower()
        if "₹" in text or "rs" in text_lower or "inr" in text_lower or "rupee" in text_lower:
            return "₹"
        if "€" in text or "eur" in text_lower or "euro" in text_lower:
            return "€"
        if "£" in text or "gbp" in text_lower or "pound" in text_lower:
            return "£"
        if "$" in text or "usd" in text_lower or "dollar" in text_lower:
            return "$"
        return default or "$"

    @staticmethod
    def parse_numeric(val: Any) -> Optional[float]:
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

    @classmethod
    def format_currency_value(cls, num: float, curr: str, suffix: str = "") -> str:
        if num == int(num):
            formatted = f"{curr}{int(num):,}"
        else:
            formatted = f"{curr}{num:,.2f}"
        if suffix:
            if suffix.startswith("/"):
                formatted = f"{formatted}{suffix}".strip()
            else:
                formatted = f"{formatted} {suffix}".strip()
        return formatted

    @classmethod
    def extract_terms_from_text(
        cls,
        scenario_id: str,
        text: str,
        default_curr: str = "",
        existing_terms: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Extracts multi-issue terms and conditions from natural language.
        Preserves existing terms and overlays newly stated positions.
        """
        extracted: Dict[str, Any] = dict(existing_terms or {})
        if not text:
            return extracted

        curr = cls.detect_currency(text, default=default_curr)
        text_clean = text.strip()
        text_lower = text_clean.lower()

        # =====================================================================
        # SCENARIO 1: JOB OFFER
        # =====================================================================
        if "job" in scenario_id or "salary" in scenario_id or "offer" in scenario_id:
            # 1. Salary Extraction
            sal_num = None
            # e.g., 37k, 40k, 37,000, ₹37,000, 37000
            k_match = re.search(r"(?:[\$₹€£]|rs\.?|inr|usd)?\s*(\d{1,4})\s*k\b", text_clean, re.IGNORECASE)
            if k_match:
                sal_num = float(k_match.group(1)) * 1000
            else:
                # Look for numbers with currency or tied to salary words
                sal_explicit = re.search(
                    r"(?:salary|offer|accept|consider|pay|at|to|for|expect|minimum|floor)?\s*(?:[\$₹€£]|rs\.?|inr|usd)?\s*(\d{1,3}(?:,\d{3})+|\d{1,2}(?:,\d{2})*,\d{3}|\d{4,9})\b",
                    text_clean,
                    re.IGNORECASE,
                )
                if sal_explicit:
                    sal_num = cls.parse_numeric(sal_explicit.group(1))

            if sal_num is not None and sal_num > 500:  # Sensible minimum to exclude tiny counts
                unit_suffix = ""
                if any(u in text_lower for u in ["/ month", "/mo", "per month", "p.m."]):
                    unit_suffix = "/month"
                elif any(u in text_lower for u in ["/ year", "/yr", "per year", "per annum", "p.a."]):
                    unit_suffix = "/year"
                elif "lpa" in text_lower:
                    unit_suffix = "LPA"
                extracted["salary"] = cls.format_currency_value(sal_num, curr, unit_suffix)

            # 2. Work Arrangement / Remote Mode
            remote_days_m = re.search(r"(\d+)\s*(?:days?\s*(?:remote|wfh|from home|in office)|remote\s*days?)", text_lower)
            if remote_days_m:
                extracted["remote_days"] = f"{remote_days_m.group(1)} days remote"
                extracted["work_mode"] = "Hybrid"
            elif "fully remote" in text_lower or "full remote" in text_lower:
                extracted["work_mode"] = "Remote"
                extracted["remote_days"] = "5 days remote"
            elif "remote" in text_lower:
                extracted["work_mode"] = "Remote"
            elif "hybrid" in text_lower:
                extracted["work_mode"] = "Hybrid"
            elif "onsite" in text_lower or "on-site" in text_lower or "in-office" in text_lower or "office" in text_lower:
                extracted["work_mode"] = "On-site"

            # 3. Joining Date
            # e.g., "joining after October 15", "joining date is October 20", "start on Nov 1st", "joining date October 20"
            join_m = re.search(
                r"(?:joining|start(?:ing)?(?:\s*date)?|join)\s*(?:date)?\s*(?:is|on|after|from|by)?\s*([a-zA-Z]+\s+\d{1,2}(?:st|nd|rd|th)?|\d{1,2}(?:st|nd|rd|th)?\s+(?:of\s+)?[a-zA-Z]+|\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|immediately|in\s+\d+\s+(?:weeks?|months?|days?))",
                text_clean,
                re.IGNORECASE,
            )
            if join_m:
                extracted["joining_date"] = join_m.group(1).strip()
            elif "immediately" in text_lower or "immediate join" in text_lower:
                extracted["joining_date"] = "Immediate"

            # 4. Notice Period
            notice_m = re.search(r"(\d+)\s*(?:days?|weeks?|months?)\s*notice(?:\s*period)?", text_lower)
            if notice_m:
                extracted["notice_period"] = notice_m.group(0).strip()

            # 5. Equity / Stock Options
            eq_m = re.search(r"(\d[\d,]*(?:\.\d+)?)\s*(?:shares|options|units|equity|% equity|% stock)", text_clean, re.IGNORECASE)
            if eq_m:
                extracted["equity"] = eq_m.group(0).strip()

            # 6. Benefits / Specific Perks
            perks = []
            if "medical" in text_lower or "health insurance" in text_lower:
                perks.append("Comprehensive Medical")
            if "signing bonus" in text_lower or "sign-on" in text_lower:
                perks.append("Signing Bonus")
            if "learning" in text_lower or "stipend" in text_lower:
                perks.append("Learning Budget")
            if perks:
                extracted["benefits"] = ", ".join(perks)

        # =====================================================================
        # SCENARIO 2: VENDOR PRICING
        # =====================================================================
        elif "vendor" in scenario_id or "pricing" in scenario_id:
            # 1. Price Extraction
            p_num = None
            explicit_price = re.search(
                r"(?:[₹$€£]|rs\.?|inr|usd|eur|gbp)\s*(\d+(?:,\d{3})*(?:\.\d+)?|\d+(?:,\d{2})*(?:\.\d+)?|\d+)",
                text_clean,
                re.IGNORECASE,
            )
            if explicit_price:
                p_num = cls.parse_numeric(explicit_price.group(1))
            else:
                word_price = re.search(
                    r"(?:offer|price|rate|at|to|cost|quote)\s*(?:of|is|at)?\s*(?:[₹$€£]|rs\.?|inr|usd)?\s*(\d+(?:,\d+)*(?:\.\d+)?)",
                    text_clean,
                    re.IGNORECASE,
                )
                if word_price:
                    p_num = cls.parse_numeric(word_price.group(1))

            if p_num is not None:
                unit_suffix = ""
                if "/user/month" in text_lower or "/user/mo" in text_lower:
                    unit_suffix = "/user/month"
                elif any(u in text_lower for u in ["/user", "/seat", "/license", "per user", "per seat"]):
                    unit_suffix = "/user"
                elif any(u in text_lower for u in ["/month", "/mo", "per month"]):
                    unit_suffix = "/month"
                elif any(u in text_lower for u in ["/unit", "per unit"]):
                    unit_suffix = "/unit"
                extracted["price"] = cls.format_currency_value(p_num, curr, unit_suffix)

            # 2. Payment Terms
            if "net-60" in text_lower or "net 60" in text_lower:
                extracted["payment_terms"] = "Net-60"
            elif "net-45" in text_lower or "net 45" in text_lower:
                extracted["payment_terms"] = "Net-45"
            elif "net-30" in text_lower or "net 30" in text_lower:
                extracted["payment_terms"] = "Net-30"
            elif "advance" in text_lower or "upfront" in text_lower:
                extracted["payment_terms"] = "Advance / Upfront"

            # 3. Delivery Requirements
            deliv_m = re.search(r"(\d+)\s*(?:business\s*days?|calendar\s*days?|days?|weeks?)\s*(?:delivery|timeline|shipment)?", text_lower)
            if deliv_m:
                extracted["delivery"] = deliv_m.group(0).strip()
            elif "immediate delivery" in text_lower or "in stock" in text_lower:
                extracted["delivery"] = "Immediate delivery"

            # 4. Warranty / Support
            if "gold" in text_lower:
                extracted["warranty"] = "Gold Support"
            elif "silver" in text_lower:
                extracted["warranty"] = "Silver Support"
            elif "3-year" in text_lower or "3 year" in text_lower:
                extracted["warranty"] = "3-Year Warranty"
            elif "standard" in text_lower:
                extracted["warranty"] = "Standard Warranty"

            # 5. Quantity
            qty_m = re.search(r"(\d+)\s*(?:units?|seats?|licenses?|chairs?|desks?|items?)", text_lower)
            if qty_m:
                extracted["quantity"] = qty_m.group(0).strip()

        # =====================================================================
        # SCENARIO 3: BUDGET ALLOCATION
        # =====================================================================
        elif "budget" in scenario_id or "allocation" in scenario_id:
            b_num = cls.parse_numeric(text_clean)
            if b_num is not None and b_num > 1000:
                extracted["total_budget"] = cls.format_currency_value(b_num, curr)

            if "ai" in text_lower and re.search(r"ai\s*(?:engineering)?:?\s*([₹$€£\d,\.k]+)", text_lower):
                m_ai = re.search(r"ai\s*(?:engineering)?:?\s*([₹$€£\d,\.k]+)", text_lower)
                if m_ai:
                    extracted["ai_allocation"] = m_ai.group(1)
            if "ops" in text_lower or "platform" in text_lower:
                m_ops = re.search(r"(?:ops|platform):?\s*([₹$€£\d,\.k]+)", text_lower)
                if m_ops:
                    extracted["ops_allocation"] = m_ops.group(1)
            if "security" in text_lower:
                m_sec = re.search(r"security:?\s*([₹$€£\d,\.k]+)", text_lower)
                if m_sec:
                    extracted["sec_allocation"] = m_sec.group(1)

        # Populate camelCase aliases for backward compatibility
        if "payment_terms" in extracted:
            extracted["paymentTerms"] = extracted["payment_terms"]
        if "remote_days" in extracted:
            extracted["remoteDays"] = extracted["remote_days"]
        if "work_mode" in extracted:
            extracted["workMode"] = extracted["work_mode"]
        if "joining_date" in extracted:
            extracted["joiningDate"] = extracted["joining_date"]

        return extracted

    @staticmethod
    def detect_intent(text: str) -> Dict[str, bool]:
        """
        Classifies the intent of a negotiation statement:
        - is_acceptance
        - is_rejection
        - is_counteroffer
        - is_inquiry
        """
        if not text:
            return {"is_acceptance": False, "is_rejection": False, "is_counteroffer": False, "is_inquiry": False}

        clean = text.strip().lower()

        # Explicit Negations
        has_negation = any(neg in clean for neg in [
            "cannot accept", "can't accept", "not accept", "do not accept",
            "won't accept", "unable to accept", "reject", "not agree",
            "don't agree", "cannot agree", "too high", "too low", "not able to accept"
        ])

        # Conditional markers: if present with "accept" or "agree", it is a conditional counteroffer, NOT an acceptance!
        has_conditional = bool(re.search(
            r"\b(if|only if|provided|provided that|as long as|subject to|on condition that|conditional on|in exchange for|unless|with the condition)\b",
            clean
        ))

        # Non-committal or exploratory markers: e.g. "I could accept", "I can consider this", "That sounds reasonable"
        has_non_committal = bool(re.search(
            r"\b(could accept|can consider|willing to discuss|willing to consider|willing to accept if|"
            r"open to discuss|open to considering|sounds reasonable|can offer|i can offer|"
            r"let's discuss|to discuss|would consider|might consider)\b",
            clean
        ))

        # Acceptance phrases: strict definitive acceptance
        accept_exact = {
            "accept", "accepted", "i accept", "agree", "agreed", "i agree",
            "done deal", "let's do it", "we accept", "sounds good",
            "i agree to these terms", "we have a deal", "that works for me",
            "pleased to accept", "happy to accept", "let's shake on it", "i accept the offer"
        }
        is_exact_accept = clean in accept_exact
        accept_phrases = [
            "i accept", "we accept", "accept your offer", "accept your proposal",
            "accept this offer", "accept these terms", "agree to your offer",
            "agree to your proposal", "agree to these terms", "happy to accept",
            "pleased to accept", "we have a deal", "done deal", "deal agreed",
            "deal, let's do it", "deal,", "deal.", "deal!", "that works for me", "sounds good"
        ]
        is_phrase_accept = any(p in clean for p in accept_phrases)
        is_acceptance = (is_exact_accept or is_phrase_accept) and not has_negation and not has_conditional and not has_non_committal

        # Rejection phrases
        is_rejection = any(r in clean for r in [
            "reject", "unacceptable", "cannot accept", "can't accept", "refuse",
            "not feasible", "out of the question", "deal breaker", "walk away"
        ])

        # Counteroffer detection (conditional or new terms proposed)
        is_counteroffer = not is_acceptance and (has_conditional or has_non_committal or any(w in clean for w in [
            "counter", "counteroffer", "what if", "how about", "instead", "could you do",
            "meet in the middle", "split", "can consider", "would you consider",
            "willing to", "propose", "my offer", "new offer", "counter offer", "i can offer"
        ]))

        is_inquiry = "?" in clean or any(clean.startswith(q) for q in ["can you", "could you", "would you", "is it possible"])

        return {
            "is_acceptance": is_acceptance,
            "is_rejection": is_rejection,
            "is_counteroffer": is_counteroffer,
            "is_inquiry": is_inquiry,
        }

    @classmethod
    def track_cumulative_state(
        cls,
        session_id: str,
        scenario_id: str,
        mode: str,
        initial_data: Dict[str, Any],
        messages: List[Dict[str, Any]],
        participants: List[Dict[str, Any]],
        current_round: int,
        status: str,
        deadlock_reason: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Reconstructs the authoritative cumulative negotiation state across the full dialogue history.
        Tracks all offers, counteroffers, concessions, active terms, agreed terms, and unresolved terms.
        """
        curr = cls.detect_currency(" ".join(str(v) for v in initial_data.values()), default="$")

        current_terms: Dict[str, Any] = {}
        agreed_terms: Dict[str, Any] = {}
        unresolved_terms: Dict[str, Any] = {}
        offers: List[Dict[str, Any]] = []
        counteroffers: List[Dict[str, Any]] = []
        concessions: List[Dict[str, Any]] = []

        # Seed initial baseline terms from authoritative scenario data
        if scenario_id == "job-offer":
            init_sal = initial_data.get("initial_salary") or initial_data.get("initial_offer") or initial_data.get("salary")
            if init_sal:
                current_terms["salary"] = str(init_sal)
            if initial_data.get("job_role"):
                current_terms["job_role"] = initial_data["job_role"]
            if initial_data.get("work_mode"):
                current_terms["work_mode"] = initial_data["work_mode"]
            if initial_data.get("benefits"):
                current_terms["benefits"] = initial_data["benefits"]
            if initial_data.get("joining_date"):
                current_terms["joining_date"] = initial_data["joining_date"]
            if initial_data.get("notice_period"):
                current_terms["notice_period"] = initial_data["notice_period"]
        elif scenario_id == "vendor-pricing":
            init_price = initial_data.get("target_price") or initial_data.get("initial_quote") or initial_data.get("price")
            if init_price:
                current_terms["price"] = str(init_price)
            if initial_data.get("product"):
                current_terms["product"] = initial_data["product"]
            if initial_data.get("quantity"):
                current_terms["quantity"] = initial_data["quantity"]
            if initial_data.get("delivery_requirements") or initial_data.get("delivery_requirement"):
                current_terms["delivery"] = initial_data.get("delivery_requirements") or initial_data.get("delivery_requirement")
            if initial_data.get("payment_terms"):
                current_terms["payment_terms"] = initial_data["payment_terms"]
            if initial_data.get("quality_requirements") or initial_data.get("quality_requirement"):
                current_terms["warranty"] = initial_data.get("quality_requirements") or initial_data.get("quality_requirement")
        elif scenario_id == "budget-allocation":
            if initial_data.get("total_budget"):
                current_terms["total_budget"] = initial_data["total_budget"]
            if initial_data.get("deadline"):
                current_terms["deadline"] = initial_data["deadline"]

        last_terms_by_speaker: Dict[str, Dict[str, Any]] = {}
        agreement_confirmed = False

        # Chronologically step through all messages to accumulate terms and events
        for msg in messages:
            speaker = msg.get("sender", "Participant")
            content = msg.get("content", "")
            msg_round = msg.get("round", current_round)
            intent = cls.detect_intent(content)

            # Extract terms from natural language and merge with explicit offer_data if available
            extracted = cls.extract_terms_from_text(scenario_id, content, default_curr=curr)
            if msg.get("offer_data"):
                for k, v in msg["offer_data"].items():
                    if v is not None:
                        # Normalize key name to snake_case
                        norm_k = k.replace("paymentTerms", "payment_terms").replace("workMode", "work_mode").replace("remoteDays", "remote_days").replace("joiningDate", "joining_date").replace("totalBudget", "total_budget")
                        extracted[norm_k] = v

            # If message contains proposals or counteroffers, update cumulative terms
            if extracted:
                for k, v in extracted.items():
                    prev_v = current_terms.get(k)
                    current_terms[k] = v

                    # Check for concessions
                    if prev_v and str(prev_v) != str(v):
                        concessions.append({
                            "round": msg_round,
                            "speaker": speaker,
                            "field": k,
                            "from_value": prev_v,
                            "to_value": v,
                        })

                event_data = {
                    "round": msg_round,
                    "speaker": speaker,
                    "terms": dict(extracted),
                    "content": content[:120],
                }

                prev_speaker_terms = last_terms_by_speaker.get(speaker)
                if prev_speaker_terms:
                    counteroffers.append(event_data)
                else:
                    offers.append(event_data)
                last_terms_by_speaker[speaker] = dict(extracted)

            if intent["is_acceptance"]:
                agreement_confirmed = True
                agreed_terms = dict(current_terms)

        if agreement_confirmed or status in ["finished", "agreement"]:
            agreed_terms = dict(current_terms)
            unresolved_terms = {}
        elif status == "deadlock":
            unresolved_terms = dict(current_terms)

        return {
            "session_id": session_id,
            "scenario_id": scenario_id,
            "mode": mode,
            "initial_data": initial_data,
            "participants": participants,
            "current_round": current_round,
            "messages": messages,
            "offers": offers,
            "counteroffers": counteroffers,
            "concessions": concessions,
            "current_terms": current_terms,
            "agreed_terms": agreed_terms,
            "unresolved_terms": unresolved_terms,
            "status": "agreement" if (agreement_confirmed or status in ["finished", "agreement"]) else status,
            "deadlock_reason": deadlock_reason,
        }
