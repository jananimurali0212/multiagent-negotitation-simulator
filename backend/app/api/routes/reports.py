from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import ResourceNotFoundError, ForbiddenError
from app.models.user import User
from app.models.report import OutcomeReport
from app.schemas.report import ReportResponse
from app.api.dependencies import get_current_user

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("", response_model=List[ReportResponse])
@router.get("/", response_model=List[ReportResponse])
async def list_reports(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Lists all completed negotiation reports for the authenticated user."""
    stmt = select(OutcomeReport).where(OutcomeReport.user_id == current_user.id).order_by(OutcomeReport.created_at.desc())
    result = await db.execute(stmt)
    reports = result.scalars().all()
    return reports


@router.get("/{report_id}", response_model=ReportResponse)
async def get_report_by_id(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves a single outcome report by report ID or session ID."""
    stmt = select(OutcomeReport).where(
        (OutcomeReport.id == report_id) | (OutcomeReport.session_id == report_id)
    )
    result = await db.execute(stmt)
    report = result.scalar_one_or_none()

    if not report:
        raise ResourceNotFoundError("OutcomeReport", report_id)

    if report.user_id != current_user.id:
        raise ForbiddenError("You do not have permission to access this negotiation report.")

    return report


@router.get("/session/{session_id}", response_model=ReportResponse)
async def get_report_by_session_id(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves an outcome report by negotiation session ID."""
    stmt = select(OutcomeReport).where(OutcomeReport.session_id == session_id)
    result = await db.execute(stmt)
    report = result.scalar_one_or_none()

    if not report:
        raise ResourceNotFoundError("OutcomeReport for session", session_id)

    if report.user_id != current_user.id:
        raise ForbiddenError()

    return report


from pydantic import BaseModel
from typing import Optional


class BulkDeleteReportsPayload(BaseModel):
    report_ids: Optional[List[str]] = None
    delete_all: bool = False


@router.delete("/{report_id}", status_code=200)
async def delete_report(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Deletes a single outcome report by ID or session ID."""
    stmt = select(OutcomeReport).where(
        ((OutcomeReport.id == report_id) | (OutcomeReport.session_id == report_id))
        & (OutcomeReport.user_id == current_user.id)
    )
    result = await db.execute(stmt)
    report = result.scalar_one_or_none()
    if not report:
        raise ResourceNotFoundError("OutcomeReport", report_id)

    await db.delete(report)
    await db.commit()
    return {"status": "deleted", "report_id": report_id}


@router.post("/bulk-delete", status_code=200)
async def bulk_delete_reports(
    payload: BulkDeleteReportsPayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Deletes multiple or all reports for the current user."""
    stmt = select(OutcomeReport).where(OutcomeReport.user_id == current_user.id)
    if not payload.delete_all and payload.report_ids:
        stmt = stmt.where(
            (OutcomeReport.id.in_(payload.report_ids)) | (OutcomeReport.session_id.in_(payload.report_ids))
        )

    result = await db.execute(stmt)
    reports = result.scalars().all()
    deleted_count = len(reports)

    for report in reports:
        await db.delete(report)

    await db.commit()
    return {"status": "success", "deleted_count": deleted_count}
