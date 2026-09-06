import pytest
from httpx import AsyncClient
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.report import OutcomeReport
from app.models.negotiation import NegotiationSession


@pytest.mark.asyncio
async def test_create_session_without_outcome_report(client: AsyncClient, auth_headers: dict):
    """Regression test: verify that creating a new negotiation session succeeds without

    UndefinedColumnError for outcome_reports.analysis.
    """
    create_res = await client.post(
        "/api/v1/negotiations",
        json={"scenario_id": "vendor-pricing", "mode": "ai-ai"},
        headers=auth_headers,
    )
    assert create_res.status_code == 201, f"Expected 201, got {create_res.status_code}: {create_res.text}"
    data = create_res.json()
    assert "id" in data
    assert data["scenario_id"] == "vendor-pricing"
    assert data["mode"] == "ai-ai"
    assert data["status"] == "setup"
    assert data["report_id"] is None
    assert data["report_status"] == "not_generated"


@pytest.mark.asyncio
async def test_load_session_with_existing_outcome_report_analysis(client: AsyncClient, auth_headers: dict):
    """Regression test: verify that when a session has an associated OutcomeReport with analysis JSON,

    loading the session via GET /api/v1/negotiations/{id} successfully hydrates report and report.analysis.
    """
    # 1. Create session
    create_res = await client.post(
        "/api/v1/negotiations",
        json={"scenario_id": "job-offer", "mode": "ai-ai"},
        headers=auth_headers,
    )
    assert create_res.status_code == 201
    sess_id = create_res.json()["id"]

    # 2. Directly attach an OutcomeReport with rich analysis dict
    async with AsyncSessionLocal() as db:
        sess_stmt = select(NegotiationSession).where(NegotiationSession.id == sess_id)
        sess = (await db.execute(sess_stmt)).scalar_one()

        report = OutcomeReport(
            session_id=sess.id,
            user_id=sess.user_id,
            scenario_id="job-offer",
            scenario_title="Job Offer Negotiation",
            mode="ai-ai",
            outcome="Agreement Reached",
            rounds_completed=4,
            final_terms={"salary": 125000, "remote": "yes"},
            metrics={"dealProgress": 100, "concessionControl": 88},
            summary="Candidate and Recruiter agreed on competitive package.",
            recommendations="Ensure equity vesting aligns with schedule.",
            analysis={
                "executive_summary": "Successful negotiation reached in 4 rounds.",
                "overview": {"deal_status": "Deal Closed", "rounds": 4},
                "agreement_breakdown": {"salary": "$125,000", "remote": "Full"},
            },
        )
        db.add(report)
        await db.commit()

    # 3. Fetch session through API, which triggers selectinload(NegotiationSession.report)
    get_res = await client.get(f"/api/v1/negotiations/{sess_id}", headers=auth_headers)
    assert get_res.status_code == 200, f"Expected 200, got {get_res.status_code}: {get_res.text}"
    sess_data = get_res.json()
    assert sess_data["report_id"] is not None
    assert sess_data["report_status"] == "generated"

    # 4. Fetch the report directly through reports route
    rep_res = await client.get(f"/api/v1/reports/session/{sess_id}", headers=auth_headers)
    assert rep_res.status_code == 200
    rep_data = rep_res.json()
    assert rep_data["session_id"] == sess_id
    assert rep_data["analysis"] is not None
    assert rep_data["analysis"]["executive_summary"] == "Successful negotiation reached in 4 rounds."
    assert rep_data["analysis"]["overview"]["deal_status"] == "Deal Closed"
