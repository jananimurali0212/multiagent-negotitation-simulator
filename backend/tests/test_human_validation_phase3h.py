import pytest
from app.schemas.agent import AgentConfigSchema, ConstraintSchema
from app.negotiation.rules.offer_rules import OfferRules
from app.negotiation.rules.constraint_rules import ConstraintRules
from app.negotiation.rules.acceptance_rules import AcceptanceRules


def test_human_offer_valid():
    """Valid human offer passes structural and constraint validation."""
    buyer = AgentConfigSchema(
        id="b1", agent_template_id="t1", name="Alex", role="Procurement Director", avatar="AR", personality="Collaborative",
        goals=[], constraints=[ConstraintSchema(label="Budget Cap", value="$120,000 / year")],
        negotiation_parameters={"maxBudget": "$120,000 / year"}
    )
    user_offer = {"price": "$50/user/month"}

    struct_res = OfferRules.validate_offer_structure("vendor-pricing", user_offer, action="counteroffer")
    assert struct_res.is_valid is True

    constraint_res = ConstraintRules.validate_agent_constraints(buyer, "vendor-pricing", user_offer, action="counteroffer")
    assert constraint_res.is_valid is True


def test_human_offer_violates_constraint():
    """Human offer exceeding budget cap is rejected by constraint validation."""
    buyer = AgentConfigSchema(
        id="b1", agent_template_id="t1", name="Alex", role="Procurement Director", avatar="AR", personality="Collaborative",
        goals=[], constraints=[ConstraintSchema(label="Budget Cap", value="$120,000 / year")],
        negotiation_parameters={"maxBudget": "$120,000 / year"}
    )
    # $90/user/month > buyer monthly cap of $66.66/mo
    user_offer = {"price": "$90/user/month"}

    struct_res = OfferRules.validate_offer_structure("vendor-pricing", user_offer, action="counteroffer")
    assert struct_res.is_valid is True

    constraint_res = ConstraintRules.validate_agent_constraints(buyer, "vendor-pricing", user_offer, action="counteroffer")
    assert constraint_res.is_valid is False
    assert constraint_res.human_safe_message is not None


def test_human_acceptance_with_valid_offer():
    """Human accepting a valid prior offer passes acceptance validation."""
    buyer = AgentConfigSchema(
        id="b1", agent_template_id="t1", name="Alex", role="Procurement Director", avatar="AR", personality="Collaborative",
        goals=[], constraints=[ConstraintSchema(label="Budget Cap", value="$120,000 / year")],
        negotiation_parameters={"maxBudget": "$120,000 / year"}
    )
    previous_msgs = [
        {"sender": "Sarah", "role": "Enterprise Sales VP", "content": "I offer $50/mo", "offer_data": {"price": "$50/user/month"}, "round": 1}
    ]

    acc_res = AcceptanceRules.validate_acceptance(buyer, "vendor-pricing", None, previous_msgs, status="running")
    assert acc_res.is_valid is True


def test_human_acceptance_no_prior_offer():
    """Human accepting when no prior offer exists is rejected."""
    buyer = AgentConfigSchema(
        id="b1", agent_template_id="t1", name="Alex", role="Procurement Director", avatar="AR", personality="Collaborative",
        goals=[], constraints=[], negotiation_parameters={}
    )
    acc_res = AcceptanceRules.validate_acceptance(buyer, "vendor-pricing", None, [], status="running")
    assert acc_res.is_valid is False
    assert "no proposal terms" in acc_res.human_safe_message.lower()
