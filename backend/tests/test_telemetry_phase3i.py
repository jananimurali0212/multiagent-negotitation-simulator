import pytest
from app.negotiation.telemetry import NegotiationTelemetry, _sanitize_payload


def test_telemetry_emit_event_structure():
    """Verify emitted events have correct structure."""
    event = NegotiationTelemetry.emit(
        "decision_validated", "sess-telemetry-1", agent_name="Alex", current_round=3,
        payload={"action": "counteroffer", "is_concession": True}
    )

    assert event["event_type"] == "decision_validated"
    assert event["session_id"] == "sess-telemetry-1"
    assert event["agent_name"] == "Alex"
    assert event["round"] == 3
    assert "timestamp" in event
    assert event["payload"]["action"] == "counteroffer"
    assert event["payload"]["is_concession"] is True


def test_telemetry_privacy_redaction():
    """Verify privacy-sensitive keys are redacted."""
    payload = {
        "action": "counteroffer",
        "targetPrice": "$65/user/month",
        "minPrice": "$55/user/month",
        "api_key": "sk-secret-1234",
        "maxBudget": "$120,000",
        "safe_field": "visible",
    }

    sanitized = _sanitize_payload(payload)

    assert sanitized["action"] == "counteroffer"
    assert sanitized["targetPrice"] == "[REDACTED]"
    assert sanitized["minPrice"] == "[REDACTED]"
    assert sanitized["api_key"] == "[REDACTED]"
    assert sanitized["maxBudget"] == "[REDACTED]"
    assert sanitized["safe_field"] == "visible"


def test_telemetry_nested_redaction():
    """Verify nested dictionaries are also sanitized."""
    payload = {
        "agent_params": {
            "targetSalary": "$175,000",
            "role": "Candidate",
        },
        "round": 2,
    }

    sanitized = _sanitize_payload(payload)
    assert sanitized["agent_params"]["targetSalary"] == "[REDACTED]"
    assert sanitized["agent_params"]["role"] == "Candidate"
    assert sanitized["round"] == 2


def test_telemetry_default_agent_name():
    """Verify default agent name when none provided."""
    event = NegotiationTelemetry.emit("state_transition", "sess-t2", payload={"status": "running"})
    assert event["agent_name"] == "system"
