import pytest
from app.negotiation.rules.offer_rules import OfferRules
from app.reports.report_generator import ReportGenerator
from app.negotiation.state_tracker import NegotiationStateTracker
from app.providers.fallback_provider import FallbackRuleProvider

def test_offer_rules_parse_numeric_value_indian_and_western():
    # Test Rs. formats where trailing dot previously broke parsing
    assert OfferRules.parse_numeric_value("Rs.18,00,000/year") == 1800000.0
    assert OfferRules.parse_numeric_value("Rs. 20,00,000/year") == 2000000.0
    assert OfferRules.parse_numeric_value("Rs.18,00,000") == 1800000.0
    assert OfferRules.parse_numeric_value("₹18,00,000") == 1800000.0
    assert OfferRules.parse_numeric_value("₹20,00,000/year") == 2000000.0

    # Multipliers
    assert OfferRules.parse_numeric_value("18 LPA") == 1800000.0
    assert OfferRules.parse_numeric_value("20 Lakhs") == 2000000.0
    assert OfferRules.parse_numeric_value("160k") == 160000.0
    assert OfferRules.parse_numeric_value("$160,000 / year") == 160000.0

    # Edge cases
    assert OfferRules.parse_numeric_value("0") == 0.0
    assert OfferRules.parse_numeric_value("Rs.0") == 0.0
    assert OfferRules.parse_numeric_value("Not finalized") is None

def test_report_generator_parse_num():
    assert ReportGenerator._parse_num("Rs.18,00,000/year") == 1800000.0
    assert ReportGenerator._parse_num("Rs. 20,00,000/year") == 2000000.0
    assert ReportGenerator._parse_num("₹20,00,000") == 2000000.0
    assert ReportGenerator._parse_num("18 LPA") == 1800000.0
    assert ReportGenerator._parse_num("$140,000") == 140000.0

def test_state_tracker_and_fallback_provider():
    assert NegotiationStateTracker.parse_numeric("Rs.18,00,000/year") == 1800000.0
    assert NegotiationStateTracker.parse_numeric("₹20,00,000") == 2000000.0
    assert FallbackRuleProvider._parse_numeric("Rs.18,00,000/year") == 1800000.0
    assert FallbackRuleProvider._parse_numeric("20 LPA") == 2000000.0
