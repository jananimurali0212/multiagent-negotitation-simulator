import uuid
from sqlalchemy import String, Text, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class AgentConfiguration(Base):
    __tablename__ = "agent_configurations"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    session_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("negotiation_sessions.id", ondelete="CASCADE"), index=True, nullable=False
    )
    agent_template_id: Mapped[str] = mapped_column(String(100), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(255), nullable=False)
    avatar: Mapped[str] = mapped_column(String(50), nullable=False, default="AG")
    personality: Mapped[str] = mapped_column(String(50), nullable=False)  # Aggressive, Collaborative, Risk-Averse
    experience: Mapped[str] = mapped_column(String(50), nullable=False, default="Medium")  # Low, Medium, High
    negotiation_parameters: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    # Relationships
    session = relationship("NegotiationSession", back_populates="agents")
    goals = relationship("AgentGoal", back_populates="agent", cascade="all, delete-orphan")
    constraints = relationship("AgentConstraint", back_populates="agent", cascade="all, delete-orphan")


class AgentGoal(Base):
    __tablename__ = "agent_goals"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    agent_config_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("agent_configurations.id", ondelete="CASCADE"), index=True, nullable=False
    )
    text: Mapped[str] = mapped_column(Text, nullable=False)
    priority: Mapped[str] = mapped_column(String(50), nullable=False, default="Medium")  # High, Medium, Low

    # Relationships
    agent = relationship("AgentConfiguration", back_populates="goals")


class AgentConstraint(Base):
    __tablename__ = "agent_constraints"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    agent_config_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("agent_configurations.id", ondelete="CASCADE"), index=True, nullable=False
    )
    label: Mapped[str] = mapped_column(String(255), nullable=False)
    value: Mapped[str] = mapped_column(String(255), nullable=False)

    # Relationships
    agent = relationship("AgentConfiguration", back_populates="constraints")
