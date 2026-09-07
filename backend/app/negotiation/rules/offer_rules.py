import re
from typing import Dict, Any, Optional
from app.negotiation.validation.validation_result import ValidationResult, ValidationErrorCategory


class OfferRules:
    """Validates structural correctness, non-negative bounds, and mandatory dimensions of negotiation offers."""

    REQUIRED_DIMENSIONS: Dict[str, list] = {
        "vendor-pricing": ["price"],
        "job-offer": ["salary"],
        "budget-allocation": ["marketingAllocation", "engineeringAllocation", "allocation"],
    }

    # Dimensions that contain textual/non-monetary values (e.g. "Net-45", "3 years")
    # and should NOT be subjected to negative-number validation.
    NON_NUMERIC_DIMENSIONS: set = {
        "paymentTerms", "payment_terms", "paymentterms",
        "contractLength", "contract_length", "contractlength",
        "startDate", "start_date", "startdate",
        "noticePeriod", "notice_period", "noticeperiod",
        "vestingSchedule", "vesting_schedule", "vestingschedule",
        "benefits", "perks", "notes", "comments", "terms",
    }

    @classmethod
    def parse_numeric_value(cls, raw_val: Any) -> Optional[float]:
        """Utility to extract clean float from strings like '$120,000 / year', '-$45/user/month', '15,000 shares'."""
        if raw_val is None:
            return None
        if isinstance(raw_val, (int, float)):
            return float(raw_val)

        val_str = str(raw_val).replace(",", "").replace("$", "").replace("€", "").replace("£", "").strip()
        match = re.search(r"[-+]?\d*\.\d+|[-+]?\d+", val_str)
        if match:
            try:
                return float(match.group())
            except ValueError:
                return None
        return None

    ALIAS_MAP: Dict[str, str] = {
        # Job offer
        "basesalary": "salary",
        "base_salary": "salary",
        "salary_amount": "salary",
        "salaryamount": "salary",
        "compensation": "salary",
        "base": "salary",

        # Vendor pricing
        "licensing_fee": "price",
        "licensingfee": "price",
        "unit_price": "price",
        "unitprice": "price",
        "user_price": "price",
        "userprice": "price",
        "per_user_price": "price",
        "pricing": "price",
        "cost": "price",
        "fee": "price",

        # Budget allocation
        "marketing_allocation": "marketingAllocation",
        "marketingbudget": "marketingAllocation",
        "marketing_budget": "marketingAllocation",
        "marketing": "marketingAllocation",
        "engineering_allocation": "engineeringAllocation",
        "engineeringbudget": "engineeringAllocation",
        "engineering_budget": "engineeringAllocation",
        "engineering": "engineeringAllocation",
        "operations_allocation": "allocation",
        "operationsallocation": "allocation",
        "operationsbudget": "allocation",
        "operations_budget": "allocation",
        "operations": "allocation",
        "ops_allocation": "allocation",
        "opsallocation": "allocation",
    }

    @classmethod
    def normalize_offer(cls, offer: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """Normalizes near-synonym key aliases in offer dictionary to standard dimension names."""
        if not offer or not isinstance(offer, dict):
            return offer

        normalized: Dict[str, Any] = {}
        for k, v in offer.items():
            clean_k = k.lower().replace("-", "").replace("_", "").strip()
            standard_k = cls.ALIAS_MAP.get(k.lower(), cls.ALIAS_MAP.get(clean_k, k))
            normalized[standard_k] = v

        return normalized

    @classmethod
    def validate_offer_structure(cls, scenario_id: str, offer: Optional[Dict[str, Any]], action: str = "offer") -> ValidationResult:
        """Validates that proposed offer dictionary contains required dimensions and valid numerical types."""
        # Actions like 'reject' or 'deadlock' or opening message might not have offer dict
        if action in ["reject", "deadlock"] and not offer:
            return ValidationResult.valid_result("offer_structure_rule")

        if not offer:
            # If action is 'offer' or 'counteroffer' or 'accept', offer data is mandatory
            if action in ["offer", "counteroffer", "accept"]:
                return ValidationResult.invalid_result(
                    error_code="MISSING_OFFER_DATA",
                    error_category=ValidationErrorCategory.MISSING_REQUIRED_TERM,
                    human_safe_message="Proposal requires structured offer details.",
                    internal_reason=f"Action '{action}' requires structured offer dictionary, but none was provided.",
                    rule_name="offer_structure_rule",
                )
            return ValidationResult.valid_result("offer_structure_rule")

        # Normalize key aliases
        norm_offer = cls.normalize_offer(offer) or offer

        # Check for mandatory scenario dimensions
        required_dims = cls.REQUIRED_DIMENSIONS.get(scenario_id, [])
        if required_dims:
            # At least one required dimension must be present in offer
            has_required = any(dim in norm_offer for dim in required_dims)
            if not has_required:
                return ValidationResult.invalid_result(
                    error_code="MISSING_REQUIRED_DIMENSION",
                    error_category=ValidationErrorCategory.MISSING_REQUIRED_TERM,
                    human_safe_message=f"Offer is missing required commercial terms for scenario '{scenario_id}'.",
                    internal_reason=f"Offer {offer} does not contain any of required dimensions {required_dims} for scenario {scenario_id}.",
                    rule_name="offer_structure_rule",
                )

        # Check for invalid negative numbers (skip known non-numeric dimensions)
        for key, val in norm_offer.items():
            if key in cls.NON_NUMERIC_DIMENSIONS:
                continue
            parsed_num = cls.parse_numeric_value(val)
            if parsed_num is not None and parsed_num < 0:
                return ValidationResult.invalid_result(
                    error_code="NEGATIVE_OFFER_VALUE",
                    error_category=ValidationErrorCategory.INVALID_NUMERIC_VALUE,
                    human_safe_message="Offer contains invalid negative monetary or unit values.",
                    internal_reason=f"Dimension '{key}' has invalid negative numerical value: {val}.",
                    rule_name="offer_structure_rule",
                )

        # Check for invalid negative numbers (skip known non-numeric dimensions)
        for key, val in offer.items():
            if key in cls.NON_NUMERIC_DIMENSIONS:
                continue
            parsed_num = cls.parse_numeric_value(val)
            if parsed_num is not None and parsed_num < 0:
                return ValidationResult.invalid_result(
                    error_code="NEGATIVE_OFFER_VALUE",
                    error_category=ValidationErrorCategory.INVALID_NUMERIC_VALUE,
                    human_safe_message="Offer contains invalid negative monetary or unit values.",
                    internal_reason=f"Dimension '{key}' has invalid negative numerical value: {val}.",
                    rule_name="offer_structure_rule",
                )

        return ValidationResult.valid_result("offer_structure_rule")
