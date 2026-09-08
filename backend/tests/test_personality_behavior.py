import pytest
import os
import sys

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.negotiation.mode_strategy import get_personality_strategy
from app.prompts.scenario_prompts import build_system_prompt
from app.prompts.strategy_library import StrategyEngine
from app.providers.fallback_provider import FallbackRuleProvider


def test_personality_strategy_configs():
    """Verify distinct configuration parameters across the 3 personalities."""
    collab = get_personality_strategy("Collaborative")
    risk = get_personality_strategy("Risk-Averse")
    aggr = get_personality_strategy("Aggressive")

    assert collab.concession_curve == "reciprocal"
    assert risk.concession_curve == "decaying_small"
    assert aggr.concession_curve == "minimal_anchored"

    # Concession rate hierarchy: Collaborative > Risk-Averse > Aggressive
    assert collab.concession_step_pct > risk.concession_step_pct > aggr.concession_step_pct


def test_system_prompt_reflects_personality_behavioral_rules():
    """Verify build_system_prompt generates deep distinct behavioral instructions per personality."""
    base_args = {
        "scenario_title": "Vendor Pricing",
        "scenario_objective": "Procure software",
        "agent_name": "Sarah",
        "agent_role": "Enterprise Sales VP",
        "experience": "Senior",
        "goals": [{"priority": "High", "text": "Maximize margin"}],
        "constraints": [{"label": "Price Floor", "value": "$90/user/month"}],
        "negotiation_parameters": {},
        "public_transcript": [{"sender": "Buyer", "role": "Buyer", "content": "I offer $85/user/month.", "round": 1}],
        "scenario_id": "vendor-pricing",
        "current_round": 1,
    }

    prompt_collab = build_system_prompt(**base_args, personality="Collaborative")
    prompt_risk = build_system_prompt(**base_args, personality="Risk-Averse")
    prompt_aggr = build_system_prompt(**base_args, personality="Aggressive")

    # Verify Section 2 headings
    assert "SECTION 2 — PERSONALITY & BEHAVIORAL STRATEGY: COLLABORATIVE" in prompt_collab
    assert "SECTION 2 — PERSONALITY & BEHAVIORAL STRATEGY: RISK-AVERSE" in prompt_risk
    assert "SECTION 2 — PERSONALITY & BEHAVIORAL STRATEGY: AGGRESSIVE" in prompt_aggr

    # Verify distinct behavioral instructions
    assert "WIN-WIN COOPERATIVE NEGOTIATOR" in prompt_collab
    assert "Reciprocate good-faith movement" in prompt_collab
    assert "MODERATE (5-8% per round)" in prompt_collab

    assert "PRUDENT & CONSTRAINT-PROTECTIVE NEGOTIATOR" in prompt_risk
    assert "safety buffer" in prompt_risk
    assert "SMALL AND CONTROLLED (2-3% per round)" in prompt_risk

    assert "ASSERTIVE & VALUE-MAXIMIZING NEGOTIATOR" in prompt_aggr
    assert "MINIMAL AND STRATEGIC (1-2% per round)" in prompt_aggr
    assert "Strong anchoring" in prompt_aggr


def test_strategy_engine_prioritizes_personality_techniques():
    """Verify StrategyEngine selects techniques aligned with the specified personality."""
    collab_techs = StrategyEngine.select_techniques(
        scenario_id="vendor-pricing",
        role="Buyer",
        personality="Collaborative",
        current_round=2,
    )
    aggr_techs = StrategyEngine.select_techniques(
        scenario_id="vendor-pricing",
        role="Buyer",
        personality="Aggressive",
        current_round=2,
    )

    collab_names = [t.name for t in collab_techs]
    aggr_names = [t.name for t in aggr_techs]

    assert "Payment-Term Tradeoff" in collab_names
    assert "Cost Comparison & Alternatives" in aggr_names


def test_vendor_pricing_personality_differentiation():
    """Verify identical input produces distinct counteroffers and concession rates across personalities."""
    provider = FallbackRuleProvider()
    scenario_data = {
        "product": "CRM Platform",
        "quantity": "500 users",
        "current_vendor_price": "$120/user/month",
        "target_price": "$80/user/month",
        "vendor_minimum_price": "$90/user/month",
        "maximum_budget": "$100/user/month",
    }
    ctx = {
        "currency": "$",
        "last_message": "We can offer $85/user/month for 500 users.",
        "proposed_number": 85.0,
    }

    dec_collab = provider._generate_scenario_decision(
        personality="Collaborative",
        role="Enterprise Sales VP",
        current_round=2,
        scenario_id="vendor-pricing",
        ctx=ctx,
        sc_data=scenario_data,
        mode="ai-ai",
        strategy=get_personality_strategy("Collaborative"),
    )

    dec_risk = provider._generate_scenario_decision(
        personality="Risk-Averse",
        role="Enterprise Sales VP",
        current_round=2,
        scenario_id="vendor-pricing",
        ctx=ctx,
        sc_data=scenario_data,
        mode="ai-ai",
        strategy=get_personality_strategy("Risk-Averse"),
    )

    dec_aggr = provider._generate_scenario_decision(
        personality="Aggressive",
        role="Enterprise Sales VP",
        current_round=2,
        scenario_id="vendor-pricing",
        ctx=ctx,
        sc_data=scenario_data,
        mode="ai-ai",
        strategy=get_personality_strategy("Aggressive"),
    )

    # 1. Counteroffer prices must differ
    p_collab = provider._parse_numeric(dec_collab.offer.get("price"))
    p_risk = provider._parse_numeric(dec_risk.offer.get("price"))
    p_aggr = provider._parse_numeric(dec_aggr.offer.get("price"))

    assert p_collab is not None and p_risk is not None and p_aggr is not None
    assert p_collab < p_risk <= p_aggr, f"Expected p_collab ({p_collab}) < p_risk ({p_risk}) <= p_aggr ({p_aggr})"

    # 2. Concession percentages must follow Collaborative > Risk-Averse > Aggressive
    assert dec_collab.concession_percentage > dec_risk.concession_percentage >= dec_aggr.concession_percentage

    # 3. Tone and messaging must reflect personality
    assert "collaborative" in dec_collab.message.lower() or "trade-off" in dec_collab.rationale_summary.lower()
    assert "risk" in dec_risk.message.lower() or "safe" in dec_risk.rationale_summary.lower()
    assert "firm" in dec_aggr.message.lower() or "leverage" in dec_aggr.rationale_summary.lower()


def test_job_offer_personality_differentiation():
    """Verify Job Offer scenario produces distinct counteroffers and concession curves across personalities."""
    provider = FallbackRuleProvider()
    scenario_data = {
        "job_role": "Lead Architect",
        "company": "Tech Corp",
        "initial_salary_offer": "₹30,000",
        "expected_salary": "₹45,000",
        "minimum_acceptable_salary": "₹36,000",
    }
    ctx = {
        "currency": "₹",
        "last_message": "I am looking for ₹42,000.",
        "proposed_number": 42000.0,
    }

    dec_collab = provider._generate_scenario_decision(
        personality="Collaborative",
        role="Hiring Manager",
        current_round=2,
        scenario_id="job-offer",
        ctx=ctx,
        sc_data=scenario_data,
        mode="human-ai",
        strategy=get_personality_strategy("Collaborative"),
    )

    dec_risk = provider._generate_scenario_decision(
        personality="Risk-Averse",
        role="Hiring Manager",
        current_round=2,
        scenario_id="job-offer",
        ctx=ctx,
        sc_data=scenario_data,
        mode="human-ai",
        strategy=get_personality_strategy("Risk-Averse"),
    )

    dec_aggr = provider._generate_scenario_decision(
        personality="Aggressive",
        role="Hiring Manager",
        current_round=2,
        scenario_id="job-offer",
        ctx=ctx,
        sc_data=scenario_data,
        mode="human-ai",
        strategy=get_personality_strategy("Aggressive"),
    )

    s_collab = provider._parse_numeric(dec_collab.offer.get("salary"))
    s_risk = provider._parse_numeric(dec_risk.offer.get("salary"))
    s_aggr = provider._parse_numeric(dec_aggr.offer.get("salary"))

    # Recruiter counteroffers: Collaborative concedes more (higher salary offer to candidate)
    assert s_collab > s_risk >= s_aggr, f"Expected s_collab ({s_collab}) > s_risk ({s_risk}) >= s_aggr ({s_aggr})"
    assert dec_collab.concession_percentage > dec_risk.concession_percentage >= dec_aggr.concession_percentage
