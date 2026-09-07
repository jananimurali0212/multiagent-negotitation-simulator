import logging
import json
from datetime import datetime, timezone
from typing import Dict, Any, Optional

logger = logging.getLogger("backend.negotiation.telemetry")

# Privacy-sensitive keys that must NEVER appear in telemetry output
_REDACTED_KEYS = {
    "api_key", "apikey", "secret", "password", "token",
    "targetPrice", "target_price", "targetSalary", "target_salary",
    "minPrice", "min_price", "minSalary", "min_salary",
    "maxBudget", "max_budget", "maxSalary", "max_salary",
    "maxAllocation", "max_allocation", "minAllocation", "min_allocation",
}


def _sanitize_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Recursively redacts privacy-sensitive keys from telemetry payloads."""
    sanitized = {}
    for key, val in payload.items():
        if key.lower() in {k.lower() for k in _REDACTED_KEYS}:
            sanitized[key] = "[REDACTED]"
        elif isinstance(val, dict):
            sanitized[key] = _sanitize_payload(val)
        else:
            sanitized[key] = val
    return sanitized


class NegotiationTelemetry:
    """Structured telemetry event logger for negotiation pipeline audit trail."""

    @classmethod
    def emit(
        cls,
        event_type: str,
        session_id: str,
        agent_name: Optional[str] = None,
        current_round: Optional[int] = None,
        payload: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Emits a structured telemetry event with privacy sanitization."""
        safe_payload = _sanitize_payload(payload) if payload else {}

        event = {
            "event_type": event_type,
            "session_id": session_id,
            "agent_name": agent_name or "system",
            "round": current_round,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "payload": safe_payload,
        }

        logger.info(f"[TELEMETRY] {event_type}: {json.dumps(event, default=str)}")
        return event
