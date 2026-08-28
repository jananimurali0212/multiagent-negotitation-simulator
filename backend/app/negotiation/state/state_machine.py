import logging
from typing import Set, Dict

logger = logging.getLogger("backend.state.machine")


class StateMachine:
    """Enforces legal negotiation state status transitions."""

    VALID_TRANSITIONS: Dict[str, Set[str]] = {
        "setup": {"setup", "ready", "running", "terminated"},
        "ready": {"setup", "ready", "running", "finished", "deadlock", "terminated"},
        "running": {"running", "finished", "deadlock", "terminated"},
        "finished": {"finished"},
        "deadlock": {"deadlock"},
        "terminated": {"terminated"},
    }

    @classmethod
    def can_transition(cls, current_status: str, target_status: str) -> bool:
        """Returns True if transition from current_status to target_status is legally allowed."""
        curr = current_status.lower().strip()
        target = target_status.lower().strip()
        allowed = cls.VALID_TRANSITIONS.get(curr, set())
        return target in allowed
