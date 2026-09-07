import asyncio
import logging
from typing import Dict, Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import AsyncSessionLocal
from app.models.negotiation import NegotiationSession
from app.models.agent import AgentConfiguration
from app.orchestration.orchestrator import OrchestratorService

logger = logging.getLogger("backend.simulation_runner")

import time

# Global registry of running background simulation tasks
_active_runners: Dict[str, asyncio.Task] = {}
_runner_locks: Dict[str, asyncio.Lock] = {}
_last_api_step_time: Dict[str, float] = {}


def record_api_step(session_id: str):
    """Records that an API client (e.g. frontend) is actively stepping this session."""
    _last_api_step_time[session_id] = time.time()


def get_session_lock(session_id: str) -> asyncio.Lock:
    if session_id not in _runner_locks:
        _runner_locks[session_id] = asyncio.Lock()
    return _runner_locks[session_id]


async def run_simulation_loop(session_id: str, turn_delay_seconds: float = 2.5):
    """Continuously advances an AI vs AI simulation session until completion or pause."""
    orchestrator = OrchestratorService()
    logger.info(f"[SIMULATION RUNNER] Starting background loop for session {session_id}")

    try:
        while True:
            # If an API client (e.g. Web App UI) is actively stepping this session, yield control
            # to avoid lock contention, slow response times, and duplicate turn execution.
            last_step = _last_api_step_time.get(session_id, 0)
            if time.time() - last_step < 5.0:
                await asyncio.sleep(1.0)
                continue

            # Pacing delay between turns
            await asyncio.sleep(turn_delay_seconds)

            async with AsyncSessionLocal() as db:
                stmt = (
                    select(NegotiationSession)
                    .where(NegotiationSession.id == session_id)
                    .options(
                        selectinload(NegotiationSession.agents).selectinload(AgentConfiguration.goals),
                        selectinload(NegotiationSession.agents).selectinload(AgentConfiguration.constraints),
                        selectinload(NegotiationSession.messages),
                    )
                )
                res = await db.execute(stmt)
                session = res.scalar_one_or_none()

                if not session:
                    logger.warning(f"[SIMULATION RUNNER] Session {session_id} not found. Exiting loop.")
                    break

                # Check status and mode
                if session.status != "running":
                    logger.info(f"[SIMULATION RUNNER] Session {session_id} status is '{session.status}'. Exiting loop.")
                    break

                if session.mode != "ai-ai":
                    logger.info(f"[SIMULATION RUNNER] Session {session_id} mode is '{session.mode}'. Manual turns required. Exiting loop.")
                    break

                if session.current_round > session.max_rounds:
                    logger.info(f"[SIMULATION RUNNER] Session {session_id} reached max rounds ({session.max_rounds}). Exiting loop.")
                    break

                # Execute one AI turn
                try:
                    turn_result = await orchestrator.execute_turn(session_id=session.id, db=db)
                    logger.info(
                        f"[SIMULATION RUNNER] Turn executed for session {session_id}: "
                        f"status={turn_result.get('status')} | round={turn_result.get('round')}"
                    )
                    
                    if turn_result.get("status") in ["finished", "deadlock", "terminated", "paused"]:
                        logger.info(f"[SIMULATION RUNNER] Session {session_id} reached terminal/paused state: {turn_result.get('status')}")
                        break
                except Exception as e:
                    logger.error(f"[SIMULATION RUNNER] Error executing turn for session {session_id}: {e}", exc_info=True)
                    break

    except asyncio.CancelledError:
        logger.info(f"[SIMULATION RUNNER] Background task cancelled for session {session_id}")
    except Exception as e:
        logger.error(f"[SIMULATION RUNNER] Unexpected error in loop for session {session_id}: {e}", exc_info=True)
    finally:
        _active_runners.pop(session_id, None)
        logger.info(f"[SIMULATION RUNNER] Cleaned up background loop for session {session_id}")


def start_background_simulation(session_id: str, turn_delay_seconds: float = 2.5):
    """Spawns a background task to drive the simulation if not already running."""
    existing_task = _active_runners.get(session_id)
    if existing_task and not existing_task.done():
        logger.info(f"[SIMULATION RUNNER] Background task already running for session {session_id}")
        return

    task = asyncio.create_task(run_simulation_loop(session_id, turn_delay_seconds))
    _active_runners[session_id] = task
    logger.info(f"[SIMULATION RUNNER] Registered background task for session {session_id}")


def stop_background_simulation(session_id: str):
    """Cancels and stops the background simulation task for a session."""
    task = _active_runners.pop(session_id, None)
    if task and not task.done():
        task.cancel()
        logger.info(f"[SIMULATION RUNNER] Cancelled active background task for session {session_id}")
