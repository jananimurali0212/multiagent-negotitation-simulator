from datetime import datetime, timezone
from typing import Any, Dict, List
from sqlalchemy import String, Text, Integer, JSON, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Scenario(Base):
    __tablename__ = "scenarios"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)  # 'vendor-pricing', 'job-offer', 'budget-allocation'
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)  # 'Business', 'HR', 'Finance'
    description: Mapped[str] = mapped_column(Text, nullable=False)
    agent_count: Mapped[int] = mapped_column(Integer, nullable=False)
    estimated_duration: Mapped[str] = mapped_column(String(50), nullable=False)
    objective: Mapped[str] = mapped_column(Text, nullable=False)
    negotiable_dimensions: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list, nullable=False)
    default_agents_data: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
