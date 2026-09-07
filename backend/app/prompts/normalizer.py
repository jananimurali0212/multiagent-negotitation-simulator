from typing import List, Dict, Any, Tuple


class PromptNormalizer:
    """Normalizes raw configuration dictionaries, goals, constraints, and parameters for system prompts."""

    PARAM_DISPLAY_NAMES: Dict[str, str] = {
        "targetprice": "Target Price",
        "target_price": "Target Price",
        "minprice": "Minimum Price Floor",
        "min_price": "Minimum Price Floor",
        "maxbudget": "Maximum Budget Cap",
        "max_budget": "Maximum Budget Cap",
        "paymentterms": "Payment Terms",
        "payment_terms": "Payment Terms",
        "deliveryrequirement": "Delivery Timeline Requirement",
        "delivery_requirement": "Delivery Timeline Requirement",
        "warrantysupport": "Warranty / Support Tier",
        "warranty_support": "Warranty / Support Tier",
        "targetsalary": "Target Base Salary",
        "target_salary": "Target Base Salary",
        "maxsalary": "Maximum Base Salary Ceiling",
        "max_salary": "Maximum Base Salary Ceiling",
        "minsalary": "Minimum Base Salary Floor",
        "min_salary": "Minimum Base Salary Floor",
        "equityboundary": "Equity Options Boundary",
        "equity_boundary": "Equity Options Boundary",
        "equityexpectation": "Equity Options Expectation",
        "equity_expectation": "Equity Options Expectation",
        "workarrangement": "Work Location Arrangement",
        "work_arrangement": "Work Location Arrangement",
        "remotepreference": "Remote Work Schedule Preference",
        "remote_preference": "Remote Work Schedule Preference",
        "maxallocation": "Maximum Total Budget Pool",
        "max_allocation": "Maximum Total Budget Pool",
        "targetallocation": "Target Allocation Share",
        "target_allocation": "Target Allocation Share",
        "minallocation": "Minimum Allocation Floor",
        "min_allocation": "Minimum Allocation Floor",
    }

    @classmethod
    def normalize_parameters(cls, raw_params: Dict[str, Any]) -> Tuple[Dict[str, str], str]:
        """Deduplicates raw parameter keys, formats clean display names, and extracts custom instructions."""
        normalized: Dict[str, str] = {}
        custom_instructions = ""

        if not raw_params:
            return normalized, custom_instructions

        for k, v in raw_params.items():
            k_lower = str(k).lower().strip()
            
            # Extract custom instructions separately
            if k_lower in ["custom_instructions", "custominstructions", "instructions", "strategy_note"]:
                if v and str(v).strip():
                    custom_instructions = str(v).strip()
                continue

            # Standardize label
            display_name = cls.PARAM_DISPLAY_NAMES.get(k_lower, str(k).replace("_", " ").title())
            if display_name not in normalized and v is not None:
                normalized[display_name] = str(v)

        return normalized, custom_instructions

    @classmethod
    def normalize_goals(cls, goals: List[Dict[str, Any]]) -> List[Dict[str, str]]:
        """Normalizes and sorts goals by priority (High -> Medium -> Low)."""
        priority_weights = {"High": 1, "Medium": 2, "Low": 3}
        normalized_goals = []

        for g in goals:
            text = g.get("text", "").strip()
            if not text:
                continue
            priority = g.get("priority", "Medium").capitalize()
            if priority not in priority_weights:
                priority = "Medium"
            normalized_goals.append({"text": text, "priority": priority})

        normalized_goals.sort(key=lambda x: priority_weights.get(x["priority"], 2))
        return normalized_goals

    @classmethod
    def normalize_constraints(cls, constraints: List[Dict[str, Any]]) -> List[Dict[str, str]]:
        """Normalizes constraints list."""
        normalized = []
        for c in constraints:
            label = c.get("label", "").strip()
            value = str(c.get("value", "")).strip()
            if label and value:
                normalized.append({"label": label, "value": value})
        return normalized
