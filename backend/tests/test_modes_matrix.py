import sys
sys.stdout.reconfigure(encoding='utf-8')
import json
import urllib.request
import urllib.error
import jwt
import pytest

BASE_URL = "http://127.0.0.1:8000/api/v1"
TEST_TOKEN = jwt.encode(
    {"sub": "test-user-matrix-001", "email": "matrix@test.com"},
    "testsecret_long_enough_for_sha256_32bytes",
    algorithm="HS256"
)

def api_call(path: str, method: str = "GET", data=None):
    url = f"{BASE_URL}{path}"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {TEST_TOKEN}"
    }
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8")
        print(f"HTTP Error {e.code} on {path}: {err_msg}")
        raise e

def run_negotiation_flow(scenario_id: str, mode: str, real_scenario_data: dict, max_steps: int = 6):
    """Executes an end-to-end negotiation flow with real user input and verifies state, transcript, and report."""
    print(f"\n=======================================================")
    print(f"RUNNING: Scenario='{scenario_id}' | Mode='{mode}'")
    print(f"=======================================================")

    payload = {
        "scenario_id": scenario_id,
        "mode": mode,
        "scenario_data": real_scenario_data
    }

    # 1. Create Session
    session = api_call("/negotiations", method="POST", data=payload)
    session_id = session["id"]
    assert session["mode"] == mode, f"Expected mode {mode}, got {session['mode']}"
    assert session["scenario_id"] == scenario_id
    assert session["scenario_data"] == real_scenario_data

    # 2. Start Session
    start_res = api_call(f"/negotiations/{session_id}/start", method="POST")
    assert start_res["status"] == "running"

    messages_collected = []
    final_status = "running"
    agreement_reached = False
    deadlock_detected = False

    # 3. Execute negotiation steps
    for step_num in range(1, max_steps + 1):
        step_res = api_call(f"/negotiations/{session_id}/step", method="POST")
        final_status = step_res["status"]
        agreement_reached = step_res.get("agreement_reached", False)
        deadlock_detected = (final_status == "deadlock" or bool(step_res.get("deadlock_reason")))

        msg = step_res.get("message")
        if msg:
            messages_collected.append(msg)
            print(f"  Step {step_num} | Speaker: {msg.get('sender')} | Action: {msg.get('offer_data', {})} | Content: {msg.get('content')[:90]}...")

        if agreement_reached or final_status in ["finished", "deadlock"]:
            print(f"  [TERMINAL STATE] Step {step_num} -> Status: {final_status} | Agreement: {agreement_reached}")
            break

    # 4. Complete session
    complete_res = api_call(f"/negotiations/{session_id}/complete", method="POST")
    assert complete_res["status"] in ["finished", "deadlock", "ready", "running"]

    # 5. Fetch and verify Outcome Report
    report = api_call(f"/negotiations/{session_id}/report", method="GET")
    assert report["session_id"] == session_id
    assert report["scenario_id"] == scenario_id
    assert report["mode"] == mode
    assert len(report["participants"]) >= 2
    assert "scenario_analysis" in report
    
    # Check mode strategy analysis in report
    sc_analysis = report.get("scenario_analysis") or {}
    mode_analysis = sc_analysis.get("mode_strategy_analysis") or {}
    assert mode_analysis.get("selected_mode") == mode
    assert "strategy_goal" in mode_analysis

    print(f"  [REPORT OK] Outcome: {report['outcome']} | Mode: {report['mode']} | Score: {report['overall_score']}")
    return {
        "session_id": session_id,
        "mode": mode,
        "outcome": report["outcome"],
        "final_status": final_status,
        "agreement_reached": agreement_reached,
        "deadlock_detected": deadlock_detected,
        "deadlock_reason": report.get("scenario_analysis", {}).get("deadlock_analysis", {}).get("deadlock_reason") or complete_res.get("deadlock_reason"),
        "messages_count": len(messages_collected),
        "report": report
    }


# =========================================================================
# 9 SCENARIO × MODE COMBINATIONS
# =========================================================================

VENDOR_DATA = {
    "product": "Office Ergonomic Chairs",
    "quantity": "50 units",
    "initial_vendor_price": "₹3500",
    "target_price": "₹2200",
    "maximum_budget": "₹2800",
    "minimum_price": "₹2100",
    "delivery_requirements": "10 business days",
    "quality_requirements": "BIFMA Level 3 certified, 3-year warranty",
    "payment_terms": "Net-30",
    "other_requirements": "Doorstep assembly included"
}

JOB_DATA = {
    "job_role": "Senior AI Systems Architect",
    "company": "Cognitive Solutions Inc",
    "initial_salary_offer": "₹35,000",
    "expected_salary": "₹55,000",
    "minimum_acceptable_salary": "₹42,000",
    "experience": "7+ years",
    "location": "Bangalore",
    "work_mode": "Hybrid (2 days remote)",
    "benefits": "Comprehensive medical, stock options, learning budget",
    "joining_date": "1st October",
    "notice_period": "30 days"
}

BUDGET_DATA = {
    "project_name": "Project Apollo Autonomous Core",
    "total_budget": "₹5,000,000",
    "teams_departments": "AI Engineering, Platform Ops, Cyber Security",
    "initial_allocations": "AI: ₹2.2M, Ops: ₹1.8M, Sec: ₹1.0M",
    "requested_budget": "AI: ₹2.8M, Ops: ₹1.5M, Sec: ₹1.2M",
    "priorities": "Zero downtime rollout and automated failover",
    "deadline": "Q4 Enterprise Milestone",
    "resource_requirements": "GPU cluster instances and security audit",
    "constraints": "Zero expansion beyond ₹5,000,000 total budget"
}

# 1. Vendor Pricing x 3 Modes
def test_vendor_pricing_collaborative():
    res = run_negotiation_flow("vendor-pricing", "collaborative", VENDOR_DATA)
    assert res["messages_count"] >= 1

def test_vendor_pricing_risk_averse():
    res = run_negotiation_flow("vendor-pricing", "risk_averse", VENDOR_DATA)
    assert res["messages_count"] >= 1

def test_vendor_pricing_aggressive():
    res = run_negotiation_flow("vendor-pricing", "aggressive", VENDOR_DATA)
    assert res["messages_count"] >= 1

# 2. Job Offer x 3 Modes
def test_job_offer_collaborative():
    res = run_negotiation_flow("job-offer", "collaborative", JOB_DATA)
    assert res["messages_count"] >= 1

def test_job_offer_risk_averse():
    res = run_negotiation_flow("job-offer", "risk_averse", JOB_DATA)
    assert res["messages_count"] >= 1

def test_job_offer_aggressive():
    res = run_negotiation_flow("job-offer", "aggressive", JOB_DATA)
    assert res["messages_count"] >= 1

# 3. Project Budget x 3 Modes
def test_budget_allocation_collaborative():
    res = run_negotiation_flow("budget-allocation", "collaborative", BUDGET_DATA)
    assert res["messages_count"] >= 1

def test_budget_allocation_risk_averse():
    res = run_negotiation_flow("budget-allocation", "risk_averse", BUDGET_DATA)
    assert res["messages_count"] >= 1

def test_budget_allocation_aggressive():
    res = run_negotiation_flow("budget-allocation", "aggressive", BUDGET_DATA)
    assert res["messages_count"] >= 1


# =========================================================================
# MANDATORY DEADLOCK TEST
# =========================================================================
def test_mandatory_deadlock_impossible_constraints():
    """
    Mandatory test:
    Buyer maximum = ₹1000
    Vendor minimum = ₹3000
    No feasible agreement can exist (No ZOPA).
    Expected: Deadlock detected, negotiation terminates, reason recorded, report contains deadlock analysis.
    """
    impossible_vendor_data = {
        "product": "Enterprise Industrial Servers",
        "quantity": "10 racks",
        "initial_vendor_price": "₹3500",
        "target_price": "₹900",
        "maximum_budget": "₹1000",
        "minimum_price": "₹3000",  # Vendor floor (₹3000) > Buyer ceiling (₹1000)
        "delivery_requirements": "Express",
        "quality_requirements": "Tier-4 datacenter spec",
        "payment_terms": "Net-30"
    }

    res = run_negotiation_flow("vendor-pricing", "risk_averse", impossible_vendor_data, max_steps=5)
    
    # Must reach deadlock
    assert res["deadlock_detected"] or res["outcome"] == "Deadlock" or res["final_status"] == "deadlock", (
        f"Deadlock expected for impossible constraints, but outcome was {res['outcome']}, status was {res['final_status']}"
    )
    
    # Verify deadlock analysis in report
    report = res["report"]
    assert report["outcome"] in ["Deadlock", "Unresolved / Terminated"]
    deadlock_analysis = report.get("scenario_analysis", {}).get("deadlock_analysis")
    assert deadlock_analysis is not None, "Report must contain deadlock_analysis"
    assert "deadlock_reason" in deadlock_analysis
    assert "why_impossible" in deadlock_analysis
    print(f"  [DEADLOCK VERIFIED] Reason: {deadlock_analysis['deadlock_reason']}")


# =========================================================================
# MANDATORY AGREEMENT TEST
# =========================================================================
def test_mandatory_agreement_feasible_terms():
    """
    Mandatory test:
    Realistic overlapping parameters where mutual agreement is feasible.
    Expected: Agreement reached, final terms recorded, report contains final agreement terms.
    """
    feasible_data = {
        "product": "Bulk Office Desks",
        "quantity": "30 units",
        "initial_vendor_price": "₹2000",
        "target_price": "₹1800",
        "maximum_budget": "₹2100",
        "minimum_price": "₹1700",
        "delivery_requirements": "Standard delivery",
        "quality_requirements": "Solid Pine Wood",
        "payment_terms": "Net-30"
    }

    res = run_negotiation_flow("vendor-pricing", "collaborative", feasible_data, max_steps=6)
    report = res["report"]

    assert report["outcome"] in ["Agreement Reached", "Agreement"] or res["agreement_reached"], (
        f"Agreement expected, but got outcome: {report['outcome']}"
    )
    assert report["final_terms"] is not None
    print(f"  [AGREEMENT VERIFIED] Final Terms: {report['final_terms']}")


if __name__ == "__main__":
    print("\n--- RUNNING FULL MODES MATRIX TEST SUITE ---")
    test_vendor_pricing_collaborative()
    test_vendor_pricing_risk_averse()
    test_vendor_pricing_aggressive()
    test_job_offer_collaborative()
    test_job_offer_risk_averse()
    test_job_offer_aggressive()
    test_budget_allocation_collaborative()
    test_budget_allocation_risk_averse()
    test_budget_allocation_aggressive()
    test_mandatory_deadlock_impossible_constraints()
    test_mandatory_agreement_feasible_terms()
    print("\n=======================================================")
    print("ALL 11 END-TO-END TESTS PASSED SUCCESSFULLY!")
    print("=======================================================")
