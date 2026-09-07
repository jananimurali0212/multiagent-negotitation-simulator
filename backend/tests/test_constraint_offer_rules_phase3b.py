import pytest
from app.schemas.agent import AgentConfigSchema, GoalSchema, ConstraintSchema
from app.negotiation.rules.offer_rules import OfferRules
from app.negotiation.rules.constraint_rules import ConstraintRules
from app.negotiation.validation.validation_result import ValidationErrorCategory


def test_offer_rules_parsing():
    assert OfferRules.parse_numeric_value("$120,000 / year") == 120000.0
    assert OfferRules.parse_numeric_value("$45/user/month") == 45.0
    assert OfferRules.parse_numeric_value("15,000 shares") == 15000.0
    assert OfferRules.parse_numeric_value(None) is None


def test_offer_rules_validation():
    # Missing required dimension for vendor-pricing
    res = OfferRules.validate_offer_structure("vendor-pricing", {"term": "Net-30"}, action="offer")
    assert res.is_valid is False
    assert res.error_category == ValidationErrorCategory.MISSING_REQUIRED_TERM

    # Valid vendor pricing offer
    res_valid = OfferRules.validate_offer_structure("vendor-pricing", {"price": "$50/user/month"}, action="offer")
    assert res_valid.is_valid is True

    # Negative number rejection
    res_neg = OfferRules.validate_offer_structure("vendor-pricing", {"price": "-$50/user/month"}, action="offer")
    assert res_neg.is_valid is False
    assert res_neg.error_category == ValidationErrorCategory.INVALID_NUMERIC_VALUE


def test_vendor_min_price_constraint():
    vendor_agent = AgentConfigSchema(
        id="v1",
        agent_template_id="t1",
        name="Sarah Chen",
        role="Enterprise Sales VP",
        avatar="SC",
        personality="Aggressive",
        goals=[],
        constraints=[ConstraintSchema(label="Standard list price", value="$80")],
        negotiation_parameters={"minPrice": "$55/user/month"},
    )

    # Offer above min price -> VALID
    res_ok = ConstraintRules.validate_agent_constraints(vendor_agent, "vendor-pricing", {"price": "$60/user/month"})
    assert res_ok.is_valid is True

    # Offer below min price ($45 < $55) -> INVALID
    res_violation = ConstraintRules.validate_agent_constraints(vendor_agent, "vendor-pricing", {"price": "$45/user/month"})
    assert res_violation.is_valid is False
    assert res_violation.error_code == "PRICE_BELOW_MINIMUM_FLOOR"
    assert res_violation.error_category == ValidationErrorCategory.HARD_CONSTRAINT_VIOLATION


def test_recruiter_grade_cap_constraint():
    recruiter_agent = AgentConfigSchema(
        id="r1",
        agent_template_id="t2",
        name="Marcus Brody",
        role="Lead HR Partner",
        avatar="MB",
        personality="Risk-Averse",
        goals=[],
        constraints=[ConstraintSchema(label="Internal grade cap", value="$170,000 absolute limit")],
        negotiation_parameters={"maxSalary": "$170,000"},
    )

    # Salary below grade cap ($165k < $170k) -> VALID
    res_ok = ConstraintRules.validate_agent_constraints(recruiter_agent, "job-offer", {"salary": "$165,000"})
    assert res_ok.is_valid is True

    # Salary above grade cap ($180k > $170k) -> INVALID
    res_violation = ConstraintRules.validate_agent_constraints(recruiter_agent, "job-offer", {"salary": "$180,000"})
    assert res_violation.is_valid is False
    assert res_violation.error_code == "SALARY_EXCEEDS_GRADE_CAP"


def test_finance_budget_pool_ceiling():
    finance_agent = AgentConfigSchema(
        id="f1",
        agent_template_id="t3",
        name="David Vance",
        role="VP of Finance",
        avatar="DV",
        personality="Risk-Averse",
        goals=[],
        constraints=[ConstraintSchema(label="Total Pool Ceiling", value="$500,000 absolute cap")],
        negotiation_parameters={"maxAllocation": "$500,000"},
    )

    # Allocations summing to $480k -> VALID
    offer_valid = {"engineeringAllocation": "$200,000", "marketingAllocation": "$160,000", "allocation": "$120,000"}
    res_ok = ConstraintRules.validate_agent_constraints(finance_agent, "budget-allocation", offer_valid)
    assert res_ok.is_valid is True

    # Allocations summing to $600k -> INVALID
    offer_exceeded = {"engineeringAllocation": "$250,000", "marketingAllocation": "$200,000", "allocation": "$150,000"}
    res_violation = ConstraintRules.validate_agent_constraints(finance_agent, "budget-allocation", offer_exceeded)
    assert res_violation.is_valid is False
    assert res_violation.error_code == "BUDGET_POOL_EXCEEDED"
