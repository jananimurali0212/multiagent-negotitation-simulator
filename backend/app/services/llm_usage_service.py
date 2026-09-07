import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.llm_usage import LLMUsageRecord

logger = logging.getLogger("backend.services.llm_usage")


class LLMUsageService:
    """Centralized normalization, persistence, and telemetry aggregation service

    for LLM provider token usage across negotiation sessions.
    """

    @staticmethod
    def normalize_gemini_usage(response: Any) -> Dict[str, Any]:
        """Normalizes Google GenAI Gemini response metadata into internal token representation.

        Authoritative metadata fields: prompt_token_count, candidates_token_count, total_token_count.
        """
        if not response:
            return {
                "input_tokens": None,
                "output_tokens": None,
                "total_tokens": None,
                "usage_available": False,
            }

        usage_meta = getattr(response, "usage_metadata", None)
        if not usage_meta:
            return {
                "input_tokens": None,
                "output_tokens": None,
                "total_tokens": None,
                "usage_available": False,
            }

        try:
            # Handle object attributes or dict access
            prompt_tokens = getattr(usage_meta, "prompt_token_count", None)
            if prompt_tokens is None and isinstance(usage_meta, dict):
                prompt_tokens = usage_meta.get("prompt_token_count")

            completion_tokens = getattr(usage_meta, "candidates_token_count", None)
            if completion_tokens is None and isinstance(usage_meta, dict):
                completion_tokens = usage_meta.get("candidates_token_count")

            total_tokens = getattr(usage_meta, "total_token_count", None)
            if total_tokens is None and isinstance(usage_meta, dict):
                total_tokens = usage_meta.get("total_token_count")

            if prompt_tokens is not None or completion_tokens is not None or total_tokens is not None:
                p_int = int(prompt_tokens) if prompt_tokens is not None else 0
                c_int = int(completion_tokens) if completion_tokens is not None else 0
                t_int = int(total_tokens) if total_tokens is not None else (p_int + c_int)
                return {
                    "input_tokens": p_int,
                    "output_tokens": c_int,
                    "total_tokens": t_int,
                    "usage_available": True,
                }
        except Exception as e:
            logger.warning(f"Error parsing Gemini token metadata: {e}")

        return {
            "input_tokens": None,
            "output_tokens": None,
            "total_tokens": None,
            "usage_available": False,
        }

    @staticmethod
    def normalize_openai_usage(usage_dict: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Normalizes OpenAI-compatible (Groq, OpenRouter, OpenAI) usage payload."""
        if not usage_dict or not isinstance(usage_dict, dict):
            return {
                "input_tokens": None,
                "output_tokens": None,
                "total_tokens": None,
                "usage_available": False,
            }

        prompt_tokens = usage_dict.get("prompt_tokens")
        completion_tokens = usage_dict.get("completion_tokens")
        total_tokens = usage_dict.get("total_tokens")

        if prompt_tokens is not None or completion_tokens is not None or total_tokens is not None:
            p_int = int(prompt_tokens) if prompt_tokens is not None else 0
            c_int = int(completion_tokens) if completion_tokens is not None else 0
            t_int = int(total_tokens) if total_tokens is not None else (p_int + c_int)
            return {
                "input_tokens": p_int,
                "output_tokens": c_int,
                "total_tokens": t_int,
                "usage_available": True,
            }

        return {
            "input_tokens": None,
            "output_tokens": None,
            "total_tokens": None,
            "usage_available": False,
        }

    @classmethod
    async def record_usage(
        cls,
        db: AsyncSession,
        session_id: str,
        provider: str,
        model: str,
        usage_data: Dict[str, Any],
        agent_id: Optional[str] = None,
        agent_name: Optional[str] = None,
        agent_role: Optional[str] = None,
        round_number: Optional[int] = None,
        turn_index: Optional[int] = None,
        operation_type: str = "negotiation_turn",
        status: str = "success",
        message_id: Optional[str] = None,
    ) -> LLMUsageRecord:
        """Persists an authoritative LLM invocation token record with idempotency protection."""
        # Idempotency check: if a success record already exists for the exact session, turn, provider, model
        if turn_index is not None:
            stmt = select(LLMUsageRecord).where(
                LLMUsageRecord.session_id == session_id,
                LLMUsageRecord.turn_index == turn_index,
                LLMUsageRecord.provider == provider,
                LLMUsageRecord.model == model,
                LLMUsageRecord.operation_type == operation_type,
                LLMUsageRecord.status == "success",
            )
            res = await db.execute(stmt)
            existing = res.scalar_one_or_none()
            if existing:
                return existing

        record = LLMUsageRecord(
            session_id=session_id,
            message_id=message_id,
            agent_id=agent_id,
            agent_name=agent_name,
            agent_role=agent_role,
            round_number=round_number,
            turn_index=turn_index,
            operation_type=operation_type,
            provider=provider,
            model=model,
            input_tokens=usage_data.get("input_tokens"),
            output_tokens=usage_data.get("output_tokens"),
            total_tokens=usage_data.get("total_tokens"),
            usage_available=bool(usage_data.get("usage_available", False)),
            status=status,
        )
        db.add(record)
        await db.flush()
        return record

    @classmethod
    async def get_session_token_summary(
        cls, session_id: str, db: AsyncSession
    ) -> Dict[str, Any]:
        """Calculates dynamic session-wide token usage telemetry, agent breakdowns,

        round evolutions, and model allocations.
        """
        stmt = (
            select(LLMUsageRecord)
            .where(LLMUsageRecord.session_id == session_id)
            .order_by(LLMUsageRecord.created_at.asc())
        )
        res = await db.execute(stmt)
        records = res.scalars().all()

        if not records:
            return {
                "available": False,
                "reason": "Token usage unavailable for historical session",
                "input_tokens": None,
                "output_tokens": None,
                "total_tokens": None,
                "llm_calls": 0,
                "input_percentage": 0.0,
                "output_percentage": 0.0,
                "by_agent": [],
                "by_round": [],
                "by_model": [],
                "turn_usage": [],
            }

        valid_records = [r for r in records if r.usage_available and r.total_tokens is not None]
        has_authoritative = len(valid_records) > 0

        total_input = sum(r.input_tokens or 0 for r in valid_records)
        total_output = sum(r.output_tokens or 0 for r in valid_records)
        total_tokens = sum(r.total_tokens or 0 for r in valid_records)
        total_calls = len(records)

        input_pct = round((total_input / total_tokens * 100), 1) if total_tokens > 0 else 0.0
        output_pct = round((total_output / total_tokens * 100), 1) if total_tokens > 0 else 0.0

        # Group by agent
        agent_map: Dict[str, Dict[str, Any]] = {}
        for r in records:
            key = r.agent_name or r.agent_role or "Agent"
            if key not in agent_map:
                agent_map[key] = {
                    "agent_name": key,
                    "role": r.agent_role or key,
                    "input_tokens": 0,
                    "output_tokens": 0,
                    "total_tokens": 0,
                    "calls": 0,
                    "usage_available": False,
                }
            agent_map[key]["calls"] += 1
            if r.usage_available and r.total_tokens is not None:
                agent_map[key]["input_tokens"] += (r.input_tokens or 0)
                agent_map[key]["output_tokens"] += (r.output_tokens or 0)
                agent_map[key]["total_tokens"] += (r.total_tokens or 0)
                agent_map[key]["usage_available"] = True

        # Group by round
        round_map: Dict[int, Dict[str, Any]] = {}
        for r in records:
            rnd = r.round_number or 1
            if rnd not in round_map:
                round_map[rnd] = {
                    "round_number": rnd,
                    "input_tokens": 0,
                    "output_tokens": 0,
                    "total_tokens": 0,
                    "calls": 0,
                }
            round_map[rnd]["calls"] += 1
            if r.usage_available and r.total_tokens is not None:
                round_map[rnd]["input_tokens"] += (r.input_tokens or 0)
                round_map[rnd]["output_tokens"] += (r.output_tokens or 0)
                round_map[rnd]["total_tokens"] += (r.total_tokens or 0)

        # Group by model
        model_map: Dict[str, Dict[str, Any]] = {}
        for r in records:
            key = f"{r.provider}:{r.model}"
            if key not in model_map:
                model_map[key] = {
                    "provider": r.provider,
                    "model": r.model,
                    "input_tokens": 0,
                    "output_tokens": 0,
                    "total_tokens": 0,
                    "calls": 0,
                }
            model_map[key]["calls"] += 1
            if r.usage_available and r.total_tokens is not None:
                model_map[key]["input_tokens"] += (r.input_tokens or 0)
                model_map[key]["output_tokens"] += (r.output_tokens or 0)
                model_map[key]["total_tokens"] += (r.total_tokens or 0)

        # Per turn summary
        turn_usage = [
            {
                "id": r.id,
                "round": r.round_number or 1,
                "turn_index": r.turn_index if r.turn_index is not None else 0,
                "agent_name": r.agent_name,
                "agent_role": r.agent_role,
                "provider": r.provider,
                "model": r.model,
                "input_tokens": r.input_tokens,
                "output_tokens": r.output_tokens,
                "total_tokens": r.total_tokens,
                "usage_available": r.usage_available,
                "status": r.status,
                "operation_type": r.operation_type,
            }
            for r in records
        ]

        return {
            "available": has_authoritative,
            "reason": None if has_authoritative else "Token usage unavailable for provider calls",
            "input_tokens": total_input if has_authoritative else None,
            "output_tokens": total_output if has_authoritative else None,
            "total_tokens": total_tokens if has_authoritative else None,
            "llm_calls": total_calls,
            "input_percentage": input_pct,
            "output_percentage": output_pct,
            "by_agent": list(agent_map.values()),
            "by_round": sorted(list(round_map.values()), key=lambda x: x["round_number"]),
            "by_model": list(model_map.values()),
            "turn_usage": turn_usage,
        }
