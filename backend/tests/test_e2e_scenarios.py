import sys
sys.stdout.reconfigure(encoding='utf-8')
import asyncio
import json
import urllib.request
import urllib.error
import jwt

BASE_URL = "http://127.0.0.1:8000/api/v1"
TEST_TOKEN = jwt.encode({"sub": "test-user-e2e-001", "email": "e2e@test.com"}, "testsecret_long_enough_for_sha256_32bytes", algorithm="HS256")

def api_call(path, method="GET", data=None):
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

def test_vendor_pricing_real_input():
    print("\n=======================================================")
    print("TEST 1: VENDOR PRICING REAL INPUT")
    print("=======================================================")
    payload = {
        "scenario_id": "vendor-pricing",
        "mode": "ai-ai",
        "scenario_data": {
            "product": "Wooden Chair",
            "quantity": "50",
            "initial_vendor_price": "₹2500",
            "target_price": "₹1800",
            "maximum_budget": "₹2000",
            "minimum_acceptable_price": "₹1900",
            "delivery_requirements": "15 business days",
            "quality_requirements": "Teak Wood, ISO certified",
            "payment_terms": "30% advance, 70% delivery",
            "other_requirements": "Free doorstep shipping"
        }
    }
    session = api_call("/negotiations", method="POST", data=payload)
    session_id = session["id"]
    print(f"Session created: {session_id}")

    # Start session
    api_call(f"/negotiations/{session_id}/start", method="POST")
    print("Session started.")

    # Execute turns
    for r in range(1, 6):
        step_res = api_call(f"/negotiations/{session_id}/step", method="POST")
        status = step_res["status"]
        msg = step_res.get("message")
        sender = msg.get("sender") if msg else "System"
        content = msg.get("content") if msg else ""
        print(f"Turn {r} | Status: {status} | Speaker: {sender} | Content: {content[:100]}...")
        if step_res.get("agreement_reached") or status in ["finished", "deadlock"]:
            print(f"Terminal status reached at round {r}: {status}")
            break

    # Complete negotiation and verify report
    complete_res = api_call(f"/negotiations/{session_id}/complete", method="POST")
    print(f"Negotiation completed. Final status: {complete_res['status']}")

    report = api_call(f"/negotiations/{session_id}/report")
    print(f"Report generated! Outcome: {report['outcome']}, Score: {report.get('overall_score')}")
    print("Scenario analysis:", json.dumps(report.get("scenario_analysis", {}), indent=2))
    assert report.get("initial_data", {}).get("product") == "Wooden Chair"
    print(">>> TEST 1 PASSED: Real User Input successfully preserved and analyzed!")
    return session_id

def test_guaranteed_deadlock():
    print("\n=======================================================")
    print("TEST 2: GUARANTEED DEADLOCK (Buyer Max = 1000, Vendor Min = 3000)")
    print("=======================================================")
    payload = {
        "scenario_id": "vendor-pricing",
        "mode": "ai-ai",
        "scenario_data": {
            "product": "Custom Titanium Valve",
            "quantity": "10",
            "initial_vendor_price": "₹3500",
            "target_price": "₹800",
            "maximum_budget": "₹1000",
            "minimum_acceptable_price": "₹3000",
            "delivery_requirements": "Immediate",
            "quality_requirements": "Military spec",
            "payment_terms": "Net-0"
        }
    }
    session = api_call("/negotiations", method="POST", data=payload)
    session_id = session["id"]
    print(f"Session created for deadlock test: {session_id}")

    api_call(f"/negotiations/{session_id}/start", method="POST")
    print("Deadlock session started.")

    deadlock_detected = False
    deadlock_reason = None
    for r in range(1, 8):
        step_res = api_call(f"/negotiations/{session_id}/step", method="POST")
        status = step_res["status"]
        deadlock_reason = step_res.get("deadlock_reason")
        msg = step_res.get("message")
        sender = msg.get("sender") if msg else "System"
        print(f"Turn {r} | Status: {status} | Deadlock Reason: {deadlock_reason}")
        if status == "deadlock":
            deadlock_detected = True
            print(f"Deadlock successfully detected at round {r}! Reason: {deadlock_reason}")
            break

    assert deadlock_detected, f"Expected deadlock but status was {status}"

    # Complete and verify report contains deadlock analysis
    complete_res = api_call(f"/negotiations/{session_id}/complete", method="POST")
    report = api_call(f"/negotiations/{session_id}/report")
    print(f"Report outcome: {report['outcome']}")
    sc_analysis = report.get("scenario_analysis", {})
    dl_analysis = sc_analysis.get("deadlock_analysis")
    print("Deadlock analysis in report:", json.dumps(dl_analysis, indent=2))
    assert dl_analysis is not None, "Report missing deadlock_analysis!"
    assert "deadlock_reason" in dl_analysis
    print(">>> TEST 2 PASSED: Guaranteed deadlock accurately recognized, halted, and recorded!")
    return session_id

def test_job_offer_real_input():
    print("\n=======================================================")
    print("TEST 3: JOB OFFER NEGOTIATION WITH REAL INPUT")
    print("=======================================================")
    payload = {
        "scenario_id": "job-offer",
        "mode": "ai-ai",
        "scenario_data": {
            "job_role": "Lead Architect",
            "company": "DeepMind Innovations",
            "initial_salary_offer": "$140,000",
            "expected_salary": "$175,000",
            "minimum_acceptable_salary": "$155,000",
            "maximum_budget": "$180,000",
            "experience": "8 years distributed systems",
            "location": "San Francisco / Remote",
            "work_mode": "Hybrid (1 day office)",
            "benefits": "401k match, health insurance, equity",
            "joining_date": "November 1st",
            "notice_period": "30 days"
        }
    }
    session = api_call("/negotiations", method="POST", data=payload)
    session_id = session["id"]
    print(f"Job offer session created: {session_id}")

    api_call(f"/negotiations/{session_id}/start", method="POST")

    for r in range(1, 6):
        step_res = api_call(f"/negotiations/{session_id}/step", method="POST")
        status = step_res["status"]
        msg = step_res.get("message")
        content = msg.get("content", "") if msg else ""
        print(f"Turn {r} | Status: {status} | Content: {content[:100]}...")
        if step_res.get("agreement_reached") or status in ["finished", "deadlock"]:
            break

    api_call(f"/negotiations/{session_id}/complete", method="POST")
    report = api_call(f"/negotiations/{session_id}/report")
    print(f"Job offer report generated! Outcome: {report['outcome']}")
    sc_analysis = report.get("scenario_analysis", {})
    print("Job offer scenario analysis:", json.dumps(sc_analysis, indent=2))
    assert sc_analysis.get("initial_salary") == "$140,000"
    print(">>> TEST 3 PASSED: Job Offer scenario verified end-to-end!")
    return session_id

def test_budget_allocation_real_input():
    print("\n=======================================================")
    print("TEST 4: PROJECT BUDGET ALLOCATION WITH REAL INPUT")
    print("=======================================================")
    payload = {
        "scenario_id": "budget-allocation",
        "mode": "ai-ai",
        "scenario_data": {
            "project_name": "Project Apollo Launch",
            "total_budget": "$850,000",
            "teams_departments": "Engineering, Marketing, Design",
            "initial_allocations": "Eng: $400k, Mkt: $250k, Design: $200k",
            "requested_budget": "Eng: $500k, Mkt: $300k, Design: $250k",
            "priorities": "Cloud stability, user acquisition, design system",
            "deadline": "Q4 Delivery",
            "resource_requirements": "12 senior contractors, GPU compute cluster",
            "constraints": "Zero overrun beyond $850,000"
        }
    }
    session = api_call("/negotiations", method="POST", data=payload)
    session_id = session["id"]
    print(f"Budget allocation session created: {session_id}")

    api_call(f"/negotiations/{session_id}/start", method="POST")

    for r in range(1, 6):
        step_res = api_call(f"/negotiations/{session_id}/step", method="POST")
        status = step_res["status"]
        msg = step_res.get("message")
        content = msg.get("content", "") if msg else ""
        print(f"Turn {r} | Status: {status} | Content: {content[:100]}...")
        if step_res.get("agreement_reached") or status in ["finished", "deadlock"]:
            break

    api_call(f"/negotiations/{session_id}/complete", method="POST")
    report = api_call(f"/negotiations/{session_id}/report")
    print(f"Budget allocation report generated! Outcome: {report['outcome']}")
    sc_analysis = report.get("scenario_analysis", {})
    print("Budget scenario analysis:", json.dumps(sc_analysis, indent=2))
    assert sc_analysis.get("total_budget") == "$850,000"
    print(">>> TEST 4 PASSED: Project Budget scenario verified end-to-end!")
    return session_id

if __name__ == "__main__":
    try:
        test_vendor_pricing_real_input()
        test_guaranteed_deadlock()
        test_job_offer_real_input()
        test_budget_allocation_real_input()
        print("\n=======================================================")
        print("ALL 4 END-TO-END VALIDATION SUITES PASSED SUCCESSFULLY!")
        print("=======================================================")
    except Exception as e:
        print(f"\nTEST RUNNER ERROR: {e}")
        raise e
