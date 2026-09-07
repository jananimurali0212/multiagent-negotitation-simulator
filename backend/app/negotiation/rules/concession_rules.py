import logging
from typing import Dict, Any, Optional
from app.negotiation.rules.offer_rules import OfferRules

logger = logging.getLogger("backend.rules.concession")


class ConcessionRules:
    """Calculates deterministic concession amounts and percentages based on role-aware valuation directions."""

    @classmethod
    def calculate_concession(
        cls,
        scenario_id: str,
        agent_role: str,
        previous_offer: Optional[Dict[str, Any]],
        current_offer: Optional[Dict[str, Any]],
        reported_percentage: Optional[float] = 0.0,
    ) -> Dict[str, Any]:
        """Calculates exact numerical concession and validates reported LLM concession percentage."""
        default_result = {
            "previous_value": None,
            "current_value": None,
            "concession_amount": 0.0,
            "calculated_percentage": 0.0,
            "reported_percentage": reported_percentage or 0.0,
            "is_concession": False,
            "discrepancy": 0.0,
            "normalized_percentage": reported_percentage or 0.0,
        }

        if not previous_offer or not current_offer:
            return default_result

        role_clean = agent_role.lower()

        # 1. Vendor Pricing Scenario
        if scenario_id == "vendor-pricing":
            prev_price = OfferRules.parse_numeric_value(previous_offer.get("price"))
            curr_price = OfferRules.parse_numeric_value(current_offer.get("price"))

            if prev_price is None or curr_price is None or prev_price == 0:
                return default_result

            # Vendor/Seller: Concession means price DECREASE (e.g. $65 -> $60)
            if any(w in role_clean for w in ["sales", "vendor", "seller"]):
                concession_amt = max(0.0, prev_price - curr_price)
                is_concession = curr_price < prev_price
                calc_pct = (concession_amt / prev_price) * 100.0 if prev_price > 0 else 0.0

            # Buyer/Procurement: Concession means price INCREASE (e.g. $42 -> $48)
            else:
                concession_amt = max(0.0, curr_price - prev_price)
                is_concession = curr_price > prev_price
                calc_pct = (concession_amt / prev_price) * 100.0 if prev_price > 0 else 0.0

            reported = float(reported_percentage or 0.0)
            discrepancy = abs(calc_pct - reported)

            return {
                "previous_value": prev_price,
                "current_value": curr_price,
                "concession_amount": round(concession_amt, 2),
                "calculated_percentage": round(calc_pct, 2),
                "reported_percentage": round(reported, 2),
                "is_concession": is_concession,
                "discrepancy": round(discrepancy, 2),
                "normalized_percentage": round(calc_pct, 2),
            }

        # 2. Job Salary Scenario
        elif scenario_id == "job-offer":
            prev_salary = OfferRules.parse_numeric_value(previous_offer.get("salary"))
            curr_salary = OfferRules.parse_numeric_value(current_offer.get("salary"))

            if prev_salary is None or curr_salary is None or prev_salary == 0:
                return default_result

            # Recruiter/HR: Concession means salary INCREASE (e.g. $155k -> $160k)
            if any(w in role_clean for w in ["recruiter", "hr", "hiring"]):
                concession_amt = max(0.0, curr_salary - prev_salary)
                is_concession = curr_salary > prev_salary
                calc_pct = (concession_amt / prev_salary) * 100.0 if prev_salary > 0 else 0.0

            # Candidate: Concession means salary DECREASE (e.g. $175k -> $168k)
            else:
                concession_amt = max(0.0, prev_salary - curr_salary)
                is_concession = curr_salary < prev_salary
                calc_pct = (concession_amt / prev_salary) * 100.0 if prev_salary > 0 else 0.0

            reported = float(reported_percentage or 0.0)
            discrepancy = abs(calc_pct - reported)

            return {
                "previous_value": prev_salary,
                "current_value": curr_salary,
                "concession_amount": round(concession_amt, 2),
                "calculated_percentage": round(calc_pct, 2),
                "reported_percentage": round(reported, 2),
                "is_concession": is_concession,
                "discrepancy": round(discrepancy, 2),
                "normalized_percentage": round(calc_pct, 2),
            }

        # 3. Budget Allocation Scenario
        elif scenario_id == "budget-allocation":
            # Compare primary department allocation
            dim_key = "engineeringAllocation" if "engineering" in role_clean else ("marketingAllocation" if "marketing" in role_clean else "allocation")
            prev_alloc = OfferRules.parse_numeric_value(previous_offer.get(dim_key))
            curr_alloc = OfferRules.parse_numeric_value(current_offer.get(dim_key))

            if prev_alloc is None or curr_alloc is None or prev_alloc == 0:
                return default_result

            # Department heads conceding means accepting lower allocation (e.g. $250k -> $220k)
            concession_amt = max(0.0, prev_alloc - curr_alloc) if "finance" not in role_clean else max(0.0, curr_alloc - prev_alloc)
            calc_pct = (concession_amt / prev_alloc) * 100.0 if prev_alloc > 0 else 0.0
            reported = float(reported_percentage or 0.0)

            return {
                "previous_value": prev_alloc,
                "current_value": curr_alloc,
                "concession_amount": round(concession_amt, 2),
                "calculated_percentage": round(calc_pct, 2),
                "reported_percentage": round(reported, 2),
                "is_concession": concession_amt > 0,
                "discrepancy": round(abs(calc_pct - reported), 2),
                "normalized_percentage": round(calc_pct, 2),
            }

        return default_result
