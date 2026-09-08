from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger("backend.turn_resolver")


class TurnResolver:
    """Authoritative single source of truth for scenario agent ordering, human role resolution, and turn determination."""

    ROLE_MAPPINGS = {
        "vendor-pricing": {
            "vendor": {
                "role_aliases": ["vendor", "seller", "sales", "supplier", "account", "sarah", "enterprise-sales", "enterprise sales vp", "vendor-sales", "seller-crm"],
                "target_keywords": ["vendor", "sales", "seller", "account", "sarah"],
            },
            "buyer": {
                "role_aliases": ["buyer", "procurement", "purchas", "client", "alex", "procurement director", "buyer-proc", "buyer-crm"],
                "target_keywords": ["buyer", "procurement", "purchas", "alex"],
            },
        },
        "job-offer": {
            "recruiter": {
                "role_aliases": ["recruiter", "hr", "hiring", "employer", "lead", "marcus", "lead hr partner", "recruiter-hr", "hiring-manager"],
                "target_keywords": ["recruiter", "hr", "hiring", "talent", "partner", "marcus"],
            },
            "candidate": {
                "role_aliases": ["candidate", "developer", "engineer", "applicant", "seeker", "elena", "senior developer candidate", "candidate-hr"],
                "target_keywords": ["candidate", "developer", "engineer", "applicant", "elena"],
            },
        },
        "budget-allocation": {
            "department-head": {
                "role_aliases": ["department-head", "dept-head", "department", "dept", "marketing", "cmo", "liam", "cmo / marketing lead", "cmo-marketing-lead"],
                "target_keywords": ["department", "dept", "marketing", "cmo", "liam"],
            },
            "project-manager": {
                "role_aliases": ["project-manager", "pm-lead", "pm", "project", "engineering", "engineer", "priya", "engineering director", "engineering-director"],
                "target_keywords": ["project", "pm", "engineering", "r&d", "priya"],
            },
            "finance-director": {
                "role_aliases": ["finance-director", "finance-manager", "finance-mgr", "vp-finance", "vp of finance", "vp-of-finance", "david", "cfo", "finance"],
                "target_keywords": ["finance", "cfo", "vance", "david"],
            },
        },
    }

    @staticmethod
    def normalize_scenario_id(scenario_id: Optional[str]) -> str:
        """Normalizes scenario identifier to canonical string."""
        s = (scenario_id or "").lower().strip()
        if "vendor" in s or "pricing" in s:
            return "vendor-pricing"
        if "job" in s or "offer" in s or "hiring" in s:
            return "job-offer"
        if "budget" in s or "allocation" in s:
            return "budget-allocation"
        return s

    @staticmethod
    def resolve_human_agent(
        scenario_id: str,
        human_role: Optional[str],
        agents: List[Any],
    ) -> Any:
        """Determines the authoritative human agent configuration object based on scenario, human_role, and agent configs."""
        if not agents:
            return None

        clean_role = (human_role or "").lower().strip().replace("_", "-").replace(" ", "-")
        canonical_scenario = TurnResolver.normalize_scenario_id(scenario_id)

        # Helper to test if agent matches any given keyword list
        def agent_matches(agent: Any, keywords: List[str]) -> bool:
            r = (getattr(agent, "role", "") or "").lower()
            t = (getattr(agent, "agent_template_id", "") or "").lower()
            n = (getattr(agent, "name", "") or "").lower()
            return any(k in r or k in t or k in n for k in keywords)

        # 1. Authoritative Canonical Scenario Role Bucket Mapping
        mapping = TurnResolver.ROLE_MAPPINGS.get(canonical_scenario)
        if mapping and clean_role:
            # Pass 1: Exact alias match
            for bucket_name, bucket_info in mapping.items():
                aliases = bucket_info["role_aliases"]
                if any(alias == clean_role for alias in aliases):
                    matched_ag = next((a for a in agents if agent_matches(a, bucket_info["target_keywords"])), None)
                    if matched_ag:
                        return matched_ag

            # Pass 2: Exact token match (split by hyphen)
            clean_tokens = set(clean_role.split("-"))
            for bucket_name, bucket_info in mapping.items():
                aliases = bucket_info["role_aliases"]
                if any(alias in clean_tokens for alias in aliases):
                    matched_ag = next((a for a in agents if agent_matches(a, bucket_info["target_keywords"])), None)
                    if matched_ag:
                        return matched_ag

        # 2. Direct exact or substring match across all agents
        if clean_role:
            for agent in agents:
                role_lower = (getattr(agent, "role", "") or "").lower().replace("_", "-").replace(" ", "-")
                tmpl_id = (getattr(agent, "agent_template_id", "") or "").lower().replace("_", "-")
                name_lower = (getattr(agent, "name", "") or "").lower().replace("_", "-").replace(" ", "-")

                if clean_role == role_lower or clean_role == tmpl_id or clean_role in role_lower or clean_role in tmpl_id or clean_role in name_lower:
                    return agent

        # 3. Default Human Role Fallback for Scenario
        if canonical_scenario == "vendor-pricing":
            buyer_ag = next((a for a in agents if agent_matches(a, ["buyer", "procurement", "purchas", "alex"])), None)
            if buyer_ag:
                return buyer_ag
        elif canonical_scenario == "job-offer":
            cand_ag = next((a for a in agents if agent_matches(a, ["candidate", "developer", "engineer", "elena"])), None)
            if cand_ag:
                return cand_ag
        elif canonical_scenario == "budget-allocation":
            dh_ag = next((a for a in agents if agent_matches(a, ["department", "dept", "marketing", "cmo", "liam"])), None)
            if dh_ag:
                return dh_ag

        return agents[0]

    @staticmethod
    def get_ordered_agents(scenario_id: str, agents: List[Any]) -> List[Any]:
        """Returns the authoritative scenario-specific turn sequence of agents."""
        if not agents:
            return []

        canonical_scenario = TurnResolver.normalize_scenario_id(scenario_id)

        # Helper to find agent by keywords
        def find_agent(keywords: List[str]) -> Optional[Any]:
            for ag in agents:
                role_l = (getattr(ag, "role", "") or "").lower()
                tmpl_l = (getattr(ag, "agent_template_id", "") or "").lower()
                name_l = (getattr(ag, "name", "") or "").lower()
                if any(k in role_l or k in tmpl_l or k in name_l for k in keywords):
                    return ag
            return None

        if canonical_scenario == "vendor-pricing":
            # Vendor speaks first with anchor / pitch, then Buyer responds
            vendor_ag = find_agent(["vendor", "sales", "seller", "sarah"])
            buyer_ag = find_agent(["buyer", "procurement", "purchas", "alex"])
            if vendor_ag and buyer_ag:
                return [vendor_ag, buyer_ag]

        elif canonical_scenario == "job-offer":
            # Recruiter / Hiring Manager speaks first with offer, then Candidate responds
            recruiter_ag = find_agent(["recruiter", "hr", "hiring", "marcus"])
            candidate_ag = find_agent(["candidate", "developer", "engineer", "elena"])
            if recruiter_ag and candidate_ag:
                return [recruiter_ag, candidate_ag]

        elif canonical_scenario == "budget-allocation":
            # Sequence: Department Head -> Project Manager -> Finance Manager
            dh_ag = find_agent(["department", "dept", "marketing", "cmo", "liam"])
            pm_ag = find_agent(["project", "pm", "engineering", "r&d", "priya"])
            fm_ag = find_agent(["finance", "cfo", "vance", "david"])
            ordered = [ag for ag in [dh_ag, pm_ag, fm_ag] if ag is not None]
            if len(ordered) == len(agents):
                return ordered

        # Default: Return agents in existing database order
        return list(agents)

    @staticmethod
    def get_current_speaker(scenario_id: str, agents: List[Any], message_count: int) -> Any:
        """Determines the current active speaker based on authoritative scenario ordering."""
        ordered = TurnResolver.get_ordered_agents(scenario_id, agents)
        if not ordered:
            return None
        return ordered[message_count % len(ordered)]

    @staticmethod
    def get_next_speaker(scenario_id: str, agents: List[Any], message_count: int) -> Any:
        """Determines the next active speaker following the current turn."""
        return TurnResolver.get_current_speaker(scenario_id, agents, message_count + 1)

    @staticmethod
    def is_human_turn(
        scenario_id: str,
        mode: str,
        human_role: Optional[str],
        agents: List[Any],
        message_count: int,
    ) -> bool:
        """Determines if the current turn belongs to the human player."""
        if mode != "human-ai":
            return False

        human_ag = TurnResolver.resolve_human_agent(scenario_id, human_role, agents)
        current_speaker = TurnResolver.get_current_speaker(scenario_id, agents, message_count)

        if not human_ag or not current_speaker:
            return False

        human_id = getattr(human_ag, "id", None)
        speaker_id = getattr(current_speaker, "id", None)
        if human_id and speaker_id:
            return human_id == speaker_id

        # Fallback comparison by template or reference
        return (
            human_ag == current_speaker
            or getattr(human_ag, "agent_template_id", "h") == getattr(current_speaker, "agent_template_id", "s")
            or getattr(human_ag, "name", "h") == getattr(current_speaker, "name", "s")
        )

    # =========================================================================
    # CONVENIENCE SESSION METHODS
    # =========================================================================

    @classmethod
    def get_ordered_agents_for_session(cls, session: Any) -> List[Any]:
        return cls.get_ordered_agents(session.scenario_id, session.agents or [])

    @classmethod
    def resolve_human_agent_for_session(cls, session: Any) -> Any:
        ordered = cls.get_ordered_agents(session.scenario_id, session.agents or [])
        return cls.resolve_human_agent(session.scenario_id, getattr(session, "human_role", None), ordered)

    @classmethod
    def get_current_speaker_for_session(cls, session: Any) -> Any:
        msg_count = len(session.messages) if session.messages else 0
        return cls.get_current_speaker(session.scenario_id, session.agents or [], msg_count)

    @classmethod
    def get_next_speaker_for_session(cls, session: Any) -> Any:
        msg_count = len(session.messages) if session.messages else 0
        return cls.get_next_speaker(session.scenario_id, session.agents or [], msg_count)

    @classmethod
    def is_human_turn_for_session(cls, session: Any) -> bool:
        msg_count = len(session.messages) if session.messages else 0
        return cls.is_human_turn(
            session.scenario_id,
            session.mode,
            getattr(session, "human_role", None),
            session.agents or [],
            msg_count,
        )
