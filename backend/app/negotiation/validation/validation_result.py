from enum import Enum
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.arena import AgentDecision


class ValidationErrorCategory(str, Enum):
    SCHEMA_ERROR = "SCHEMA_ERROR"
    INVALID_ACTION = "INVALID_ACTION"
    INVALID_OFFER = "INVALID_OFFER"
    MISSING_REQUIRED_TERM = "MISSING_REQUIRED_TERM"
    HARD_CONSTRAINT_VIOLATION = "HARD_CONSTRAINT_VIOLATION"
    CONCESSION_LIMIT_VIOLATION = "CONCESSION_LIMIT_VIOLATION"
    ACCEPTANCE_INVALID = "ACCEPTANCE_INVALID"
    DEADLOCK_CONDITION = "DEADLOCK_CONDITION"
    INVALID_STATE_TRANSITION = "INVALID_STATE_TRANSITION"
    INVALID_SCENARIO_PARAMETER = "INVALID_SCENARIO_PARAMETER"
    INVALID_NUMERIC_VALUE = "INVALID_NUMERIC_VALUE"


class ValidationResult(BaseModel):
    is_valid: bool = True
    error_code: Optional[str] = None
    error_category: Optional[ValidationErrorCategory] = None
    human_safe_message: Optional[str] = None
    internal_reason: Optional[str] = None
    corrected_decision: Optional[AgentDecision] = None
    rule_name: Optional[str] = None
    severity: str = Field(default="ERROR", description="Severity level: INFO, WARNING, ERROR, CRITICAL")

    @classmethod
    def valid_result(cls, rule_name: Optional[str] = None) -> "ValidationResult":
        return cls(is_valid=True, rule_name=rule_name, severity="INFO")

    @classmethod
    def invalid_result(
        cls,
        error_code: str,
        error_category: ValidationErrorCategory,
        human_safe_message: str,
        internal_reason: str,
        rule_name: Optional[str] = None,
        corrected_decision: Optional[AgentDecision] = None,
        severity: str = "ERROR",
    ) -> "ValidationResult":
        return cls(
            is_valid=False,
            error_code=error_code,
            error_category=error_category,
            human_safe_message=human_safe_message,
            internal_reason=internal_reason,
            rule_name=rule_name,
            corrected_decision=corrected_decision,
            severity=severity,
        )
