import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, Integer, ForeignKey, JSON, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class OutcomeReport(Base):
    __tablename__ = "outcome_reports"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    session_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("negotiation_sessions.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    scenario_id: Mapped[str] = mapped_column(String(100), nullable=False)
    scenario_title: Mapped[str] = mapped_column(String(255), nullable=False)
    mode: Mapped[str] = mapped_column(String(50), nullable=False)  # 'ai-ai' or 'human-ai'
    outcome: Mapped[str] = mapped_column(String(100), nullable=False)  # 'Agreement Reached', 'Deadlock', 'Stopped by User', 'Unresolved / Terminated'
    rounds_completed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    final_terms: Mapped[dict] = mapped_column(JSON, default=dict, nullable=True)
    metrics: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)  # concessionControl, argumentStrength, activeListening, dealProgress
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    recommendations: Mapped[str] = mapped_column(Text, nullable=False)
    analysis: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Relationships
    session = relationship("NegotiationSession", back_populates="report")
    user = relationship("User", back_populates="reports")
