import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, Integer, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class NegotiationSession(Base):
    __tablename__ = "negotiation_sessions"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    scenario_id: Mapped[str] = mapped_column(
        String(100), ForeignKey("scenarios.id"), nullable=False
    )
    mode: Mapped[str] = mapped_column(String(50), nullable=False)  # 'ai-ai' or 'human-ai'
    human_role: Mapped[str] = mapped_column(String(50), nullable=True)  # 'buyer' or 'vendor'
    current_step: Mapped[str] = mapped_column(
        String(50), default="SCENARIO", nullable=False
    )  # SCENARIO, MODE, AGENTS, GOALS, REVIEW, NEGOTIATION, OUTCOME
    review_confirmed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    status: Mapped[str] = mapped_column(
        String(50), default="setup", nullable=False
    )  # setup, ready, running, paused, finished, deadlock, terminated
    current_round: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    max_rounds: Mapped[int] = mapped_column(Integer, default=20, nullable=False)  # System Safety Ceiling
    agreement_reached: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    final_terms: Mapped[dict] = mapped_column(JSON, default=dict, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    user = relationship("User", back_populates="sessions")
    scenario = relationship("Scenario")
    agents = relationship("AgentConfiguration", back_populates="session", cascade="all, delete-orphan")
    messages = relationship("NegotiationMessage", back_populates="session", cascade="all, delete-orphan")
    report = relationship("OutcomeReport", back_populates="session", uselist=False, cascade="all, delete-orphan")


class NegotiationMessage(Base):
    __tablename__ = "negotiation_messages"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    session_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("negotiation_sessions.id", ondelete="CASCADE"), index=True, nullable=False
    )
    sender: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(255), nullable=False)
    avatar: Mapped[str] = mapped_column(String(50), nullable=False, default="AG")
    content: Mapped[str] = mapped_column(Text, nullable=False)
    rationale_summary: Mapped[str] = mapped_column(Text, nullable=True)
    offer_data: Mapped[dict] = mapped_column(JSON, default=dict, nullable=True)
    round: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    turn_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_user: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Relationships
    session = relationship("NegotiationSession", back_populates="messages")
