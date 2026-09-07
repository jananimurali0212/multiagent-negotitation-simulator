import logging
from typing import List, Dict, Any, Optional, Tuple
from app.schemas.agent import AgentConfigSchema
from app.negotiation.rules.offer_rules import OfferRules
from app.negotiation.rules.constraint_rules import ConstraintRules

logger = logging.getLogger("backend.rules.zopa")


class ZOPAService:
    """Calculates deterministic Zone of Possible Agreement (ZOPA) and boundary distances."""

    @classmethod
    def calculate_zopa(cls, scenario_id: str, agents: List[AgentConfigSchema]) -> Dict[str, Any]:
        """Calculates internal ZOPA overlap interval and feasibility status."""
        default_zopa = {
            "zopa_exists": False,
            "overlap_interval": None,
            "overlap_width": 0.0,
            "status": "unavailable",
            "lower_bound": None,
            "upper_bound": None,
        }

        if not agents or len(agents) < 2:
            return default_zopa

        # 1. Vendor Pricing Scenario
        if scenario_id == "vendor-pricing":
            vendor = cls._find_agent(agents, ["sales", "vendor", "seller"])
            buyer = cls._find_agent(agents, ["procurement", "buyer", "purchasing"])

            if not vendor or not buyer:
                return default_zopa

            vendor_min = ConstraintRules._extract_param_value(vendor, ["minprice", "min_price", "minimum price", "price floor"])
            buyer_max_budget = ConstraintRules._extract_param_value(buyer, ["maxbudget", "max_budget", "budget cap", "maximum budget"])

            if vendor_min is None or buyer_max_budget is None:
                return default_zopa

            buyer_max_monthly = buyer_max_budget / (150 * 12) if buyer_max_budget > 1000 else buyer_max_budget

            if vendor_min <= buyer_max_monthly:
                width = round(buyer_max_monthly - vendor_min, 2)
                return {
                    "zopa_exists": True,
                    "overlap_interval": [round(vendor_min, 2), round(buyer_max_monthly, 2)],
                    "overlap_width": width,
                    "status": "positive_zopa" if width > 0 else "zero_width",
                    "lower_bound": round(vendor_min, 2),
                    "upper_bound": round(buyer_max_monthly, 2),
                }
            else:
                return {
                    "zopa_exists": False,
                    "overlap_interval": None,
                    "overlap_width": 0.0,
                    "status": "no_zopa",
                    "lower_bound": round(vendor_min, 2),
                    "upper_bound": round(buyer_max_monthly, 2),
                }

        # 2. Job Salary Scenario
        elif scenario_id == "job-offer":
            candidate = cls._find_agent(agents, ["candidate", "developer", "engineer"])
            recruiter = cls._find_agent(agents, ["recruiter", "hr", "hiring"])

            if not candidate or not recruiter:
                return default_zopa

            cand_min = ConstraintRules._extract_param_value(candidate, ["minsalary", "min_salary", "competing offer", "floor"])
            rec_max = ConstraintRules._extract_param_value(recruiter, ["maxsalary", "max_salary", "grade cap", "ceiling"])

            if cand_min is None or rec_max is None:
                return default_zopa

            if cand_min <= rec_max:
                width = round(rec_max - cand_min, 2)
                return {
                    "zopa_exists": True,
                    "overlap_interval": [round(cand_min, 2), round(rec_max, 2)],
                    "overlap_width": width,
                    "status": "positive_zopa" if width > 0 else "zero_width",
                    "lower_bound": round(cand_min, 2),
                    "upper_bound": round(rec_max, 2),
                }
            else:
                return {
                    "zopa_exists": False,
                    "overlap_interval": None,
                    "overlap_width": 0.0,
                    "status": "no_zopa",
                    "lower_bound": round(cand_min, 2),
                    "upper_bound": round(rec_max, 2),
                }

        # 3. Budget Allocation Scenario
        elif scenario_id == "budget-allocation":
            finance = cls._find_agent(agents, ["finance", "cfo"])
            total_pool = ConstraintRules._extract_param_value(finance, ["maxallocation", "max_allocation", "total pool", "ceiling"]) if finance else 500000.0

            sum_min_floors = 0.0
            for a in agents:
                if "finance" not in a.role.lower():
                    flr = ConstraintRules._extract_param_value(a, ["minallocation", "min_allocation", "floor"]) or 0.0
                    sum_min_floors += flr

            if sum_min_floors <= total_pool:
                width = round(total_pool - sum_min_floors, 2)
                return {
                    "zopa_exists": True,
                    "overlap_interval": [round(sum_min_floors, 2), round(total_pool, 2)],
                    "overlap_width": width,
                    "status": "positive_zopa" if width > 0 else "zero_width",
                    "lower_bound": round(sum_min_floors, 2),
                    "upper_bound": round(total_pool, 2),
                }
            else:
                return {
                    "zopa_exists": False,
                    "overlap_interval": None,
                    "overlap_width": 0.0,
                    "status": "no_zopa",
                    "lower_bound": round(sum_min_floors, 2),
                    "upper_bound": round(total_pool, 2),
                }

        return default_zopa

    @classmethod
    def calculate_boundary_distance(cls, scenario_id: str, agent: AgentConfigSchema, offer: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculates distance between current proposed offer and agent's confidential target vs hard limit."""
        if not offer:
            return {"distance_to_target": None, "distance_to_limit": None, "inside_boundary": True}

        role_clean = agent.role.lower()

        if scenario_id == "vendor-pricing":
            curr_price = OfferRules.parse_numeric_value(offer.get("price"))
            if curr_price is None:
                return {"distance_to_target": None, "distance_to_limit": None, "inside_boundary": True}

            target_price = ConstraintRules._extract_param_value(agent, ["targetprice", "target_price"])
            limit_val = (
                ConstraintRules._extract_param_value(agent, ["minprice", "min_price"])
                if any(w in role_clean for w in ["sales", "vendor", "seller"])
                else ConstraintRules._extract_param_value(agent, ["maxbudget", "max_budget"])
            )

            dist_target = round(abs(curr_price - target_price), 2) if target_price is not None else None
            dist_limit = round(abs(curr_price - limit_val), 2) if limit_val is not None else None
            
            is_inside = True
            if limit_val is not None:
                if any(w in role_clean for w in ["sales", "vendor", "seller"]):
                    is_inside = curr_price >= limit_val
                else:
                    monthly_cap = limit_val / (150 * 12) if limit_val > 1000 else limit_val
                    is_inside = curr_price <= monthly_cap

            return {
                "distance_to_target": dist_target,
                "distance_to_limit": dist_limit,
                "inside_boundary": is_inside,
            }

        return {"distance_to_target": None, "distance_to_limit": None, "inside_boundary": True}

    @classmethod
    def _find_agent(cls, agents: List[AgentConfigSchema], keywords: List[str]) -> Optional[AgentConfigSchema]:
        for a in agents:
            role_clean = a.role.lower()
            if any(kw in role_clean for kw in keywords):
                return a
        return None
