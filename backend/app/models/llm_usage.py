import uuid
from typing import Optional
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class LLMUsageRecord(Base):
    __tablename__ = "llm_usage_records"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    session_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("negotiation_sessions.id", ondelete="CASCADE"), index=True, nullable=False
    )
    message_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    agent_id: Mapped[Optional[str]] = mapped_column(String(36), index=True, nullable=True)
    agent_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    agent_role: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    round_number: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    turn_index: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    operation_type: Mapped[str] = mapped_column(
        String(50), default="negotiation_turn", nullable=False
    )
    provider: Mapped[str] = mapped_column(String(50), nullable=False)
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    input_tokens: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    output_tokens: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    total_tokens: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    usage_available: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="success", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Relationships
    session = relationship("NegotiationSession", back_populates="llm_usages")

    __table_args__ = (
        Index("ix_llm_usage_session_turn", "session_id", "turn_index"),
        Index("ix_llm_usage_session_agent", "session_id", "agent_id"),
    )
