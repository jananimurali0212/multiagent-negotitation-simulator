import pytest
from app.schemas.agent import AgentConfigSchema, GoalSchema, ConstraintSchema
from app.negotiation.rules.zopa import ZOPAService


def test_positive_zopa_vendor_pricing():
    vendor = AgentConfigSchema(
        id="v1", agent_template_id="t1", name="Sarah", role="Enterprise Sales VP", avatar="SC", personality="Aggressive",
        goals=[], constraints=[], negotiation_parameters={"minPrice": "$55/user/month"}
    )
    buyer = AgentConfigSchema(
        id="b1", agent_template_id="t2", name="Alex", role="Procurement Director", avatar="AR", personality="Collaborative",
        goals=[], constraints=[], negotiation_parameters={"maxBudget": "$120,000 / year"}  # $66.66/mo for 150 users
    )

    res = ZOPAService.calculate_zopa("vendor-pricing", [vendor, buyer])

    assert res["zopa_exists"] is True
    assert res["status"] == "positive_zopa"
    assert res["lower_bound"] == 55.0
    assert res["upper_bound"] == 66.67
    assert res["overlap_width"] == 11.67


def test_no_zopa_vendor_pricing():
    vendor = AgentConfigSchema(
        id="v1", agent_template_id="t1", name="Sarah", role="Enterprise Sales VP", avatar="SC", personality="Aggressive",
        goals=[], constraints=[], negotiation_parameters={"minPrice": "$75/user/month"}
    )
    buyer = AgentConfigSchema(
        id="b1", agent_template_id="t2", name="Alex", role="Procurement Director", avatar="AR", personality="Collaborative",
        goals=[], constraints=[], negotiation_parameters={"maxBudget": "$90,000 / year"}  # $50/mo for 150 users
    )

    res = ZOPAService.calculate_zopa("vendor-pricing", [vendor, buyer])

    assert res["zopa_exists"] is False
    assert res["status"] == "no_zopa"
    assert res["lower_bound"] == 75.0
    assert res["upper_bound"] == 50.0
    assert res["overlap_width"] == 0.0


def test_zopa_job_offer():
    candidate = AgentConfigSchema(
        id="c1", agent_template_id="t1", name="Elena", role="Senior Developer Candidate", avatar="ER", personality="Collaborative",
        goals=[], constraints=[], negotiation_parameters={"minSalary": "$165,000"}
    )
    recruiter = AgentConfigSchema(
        id="r1", agent_template_id="t2", name="Marcus", role="Lead HR Partner", avatar="MB", personality="Risk-Averse",
        goals=[], constraints=[], negotiation_parameters={"maxSalary": "$170,000"}
    )

    res = ZOPAService.calculate_zopa("job-offer", [candidate, recruiter])

    assert res["zopa_exists"] is True
    assert res["status"] == "positive_zopa"
    assert res["lower_bound"] == 165000.0
    assert res["upper_bound"] == 170000.0
    assert res["overlap_width"] == 5000.0


def test_boundary_distance_calculation():
    vendor = AgentConfigSchema(
        id="v1", agent_template_id="t1", name="Sarah", role="Enterprise Sales VP", avatar="SC", personality="Aggressive",
        goals=[], constraints=[], negotiation_parameters={"targetPrice": "$65/user/month", "minPrice": "$55/user/month"}
    )

    dist = ZOPAService.calculate_boundary_distance("vendor-pricing", vendor, {"price": "$60/user/month"})

    assert dist["distance_to_target"] == 5.0  # |60 - 65| = 5
    assert dist["distance_to_limit"] == 5.0   # |60 - 55| = 5
    assert dist["inside_boundary"] is True
