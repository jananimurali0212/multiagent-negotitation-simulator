import pytest
from app.negotiation.rules.concession_rules import ConcessionRules


def test_vendor_concession_direction():
    # Vendor price decrease ($65 -> $60) = positive concession
    prev_offer = {"price": "$65/user/month"}
    curr_offer = {"price": "$60/user/month"}

    res = ConcessionRules.calculate_concession("vendor-pricing", "Enterprise Sales VP", prev_offer, curr_offer, reported_percentage=5.0)

    assert res["is_concession"] is True
    assert res["concession_amount"] == 5.0
    assert res["calculated_percentage"] == 7.69
    assert res["normalized_percentage"] == 7.69
    assert res["discrepancy"] == 2.69  # 7.69 - 5.0


def test_buyer_concession_direction():
    # Buyer price increase ($42 -> $48) = positive concession
    prev_offer = {"price": "$42/user/month"}
    curr_offer = {"price": "$48/user/month"}

    res = ConcessionRules.calculate_concession("vendor-pricing", "Procurement Director", prev_offer, curr_offer, reported_percentage=14.29)

    assert res["is_concession"] is True
    assert res["concession_amount"] == 6.0
    assert res["calculated_percentage"] == 14.29
    assert res["discrepancy"] == 0.0


def test_candidate_concession_direction():
    # Candidate salary decrease ($175k -> $168k) = positive concession
    prev_offer = {"salary": "$175,000"}
    curr_offer = {"salary": "$168,000"}

    res = ConcessionRules.calculate_concession("job-offer", "Senior Developer Candidate", prev_offer, curr_offer, reported_percentage=4.0)

    assert res["is_concession"] is True
    assert res["concession_amount"] == 7000.0
    assert res["calculated_percentage"] == 4.0


def test_recruiter_concession_direction():
    # Recruiter salary increase ($155k -> $160k) = positive concession
    prev_offer = {"salary": "$155,000"}
    curr_offer = {"salary": "$160,000"}

    res = ConcessionRules.calculate_concession("job-offer", "Lead HR Partner", prev_offer, curr_offer, reported_percentage=3.23)

    assert res["is_concession"] is True
    assert res["concession_amount"] == 5000.0
    assert res["calculated_percentage"] == 3.23
