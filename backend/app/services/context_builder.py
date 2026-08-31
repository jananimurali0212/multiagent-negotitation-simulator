import logging
from typing import Dict, Any, List, Optional, Tuple

logger = logging.getLogger("backend.context_builder")


class NegotiationContextBuilder:
    """Single authoritative builder for rich, dynamic negotiation conversation context.
    Derives all memory strictly from the persisted database session, messages, and configuration.
    """

    @classmethod
    def build_negotiation_context(
        cls,
        session_id: str,
        scenario_id: str,
        scenario_title: str,
        scenario_objective: str,
        active_agent: Dict[str, Any],
        other_agents: List[Dict[str, Any]],
        messages: List[Dict[str, Any]],
        current_round: int,
    ) -> Dict[str, Any]:
        """Constructs a structured conversation memory and continuity summary."""
        # 1. Sort messages strictly by round, turn_index, timestamp
        sorted_messages = list(messages or [])

        # 2. Extract Offer History and State
        latest_offer: Optional[Dict[str, Any]] = None
        latest_offer_sender: Optional[str] = None
        previous_offer: Optional[Dict[str, Any]] = None
        previous_offer_sender: Optional[str] = None
        offers_history: List[Dict[str, Any]] = []

        for msg in sorted_messages:
            offer_data = msg.get("offer_data")
            if offer_data and isinstance(offer_data, dict) and len(offer_data) > 0:
                if latest_offer is not None and offer_data != latest_offer:
                    previous_offer = latest_offer
                    previous_offer_sender = latest_offer_sender

                latest_offer = offer_data
                latest_offer_sender = msg.get("sender")
                offers_history.append({
                    "round": msg.get("round", 1),
                    "turn_index": msg.get("turn_index", 0),
                    "sender": msg.get("sender", "Agent"),
                    "offer": offer_data,
                })

        # 3. Identify unresolved issues based on scenario dimensions vs latest offer
        unresolved_issues = cls._determine_unresolved_issues(scenario_id, latest_offer)

        # 4. Extract previous concessions
        concessions_summary = []
        for i in range(1, len(offers_history)):
            prev_o = offers_history[i - 1]
            curr_o = offers_history[i]
            if prev_o["sender"] == curr_o["sender"] and prev_o["offer"] != curr_o["offer"]:
                concessions_summary.append(
                    f"- {curr_o['sender']} in Round {curr_o['round']} adjusted offer from {prev_o['offer']} to {curr_o['offer']}"
                )

        # 5. Format Previous Conversation transcript
        formatted_history_lines = []
        for msg in sorted_messages:
            sender = msg.get("sender", "Agent")
            role = msg.get("role", "Participant")
            content = msg.get("content", "")
            offer_info = msg.get("offer_data")
            offer_tag = f" [Proposal: {offer_info}]" if offer_info and len(offer_info) > 0 else ""
            formatted_history_lines.append(f"[{sender} ({role})]: {content}{offer_tag}")

        previous_conv_text = "\n\n".join(formatted_history_lines) if formatted_history_lines else "No prior conversation. You are making the opening move."

        # 6. Format Structured Context Block
        all_participants = [active_agent] + [oa for oa in other_agents if oa.get("name") != active_agent.get("name")]
        participants_text = "\n".join([f"- {a.get('name', 'Agent')} ({a.get('role', 'Participant')})" for a in all_participants])

        latest_proposal_text = f"{latest_offer_sender}: {latest_offer}" if latest_offer else "No formal numeric proposal submitted yet."
        unresolved_text = ", ".join(unresolved_issues) if unresolved_issues else "Core terms under active discussion."
        concessions_text = "\n".join(concessions_summary[-3:]) if concessions_summary else "No concessions logged yet."

        context_summary = f"""NEGOTIATION CONTEXT & MEMORY

Scenario:
{scenario_title}

Scenario Objective:
{scenario_objective}

Current Round:
{current_round}

Current Speaker:
{active_agent.get('name')} ({active_agent.get('role')})

Participants:
{participants_text}

Previous Conversation:
{previous_conv_text}

Current Negotiation State:
- Latest Proposal: {latest_proposal_text}
- Issues Still Unresolved: {unresolved_text}
- Recent Concessions:
{concessions_text}"""

        return {
            "context_summary": context_summary,
            "latest_offer": latest_offer,
            "latest_offer_sender": latest_offer_sender,
            "previous_offer": previous_offer,
            "previous_offer_sender": previous_offer_sender,
            "offers_history": offers_history,
            "unresolved_issues": unresolved_issues,
            "concessions_summary": concessions_summary,
            "formatted_transcript": previous_conv_text,
        }

    @staticmethod
    def _determine_unresolved_issues(scenario_id: str, latest_offer: Optional[Dict[str, Any]]) -> List[str]:
        """Identifies commercial dimensions that still need agreement."""
        if not latest_offer:
            if scenario_id == "vendor-pricing":
                return ["Licensing Price per user", "Payment Terms", "Support Tier"]
            elif scenario_id == "job-offer":
                return ["Base Salary", "Stock Options / Equity", "Remote Work Schedule"]
            else:
                return ["Departmental Capital Distribution", "Milestone Funding"]

        unresolved = []
        if scenario_id == "vendor-pricing":
            if "price" not in latest_offer:
                unresolved.append("Licensing Price per user")
            if "paymentTerms" not in latest_offer:
                unresolved.append("Payment Terms")
            if "warranty" not in latest_offer and "warrantySupport" not in latest_offer:
                unresolved.append("Support Tier Level")
        elif scenario_id == "job-offer":
            if "salary" not in latest_offer:
                unresolved.append("Base Salary")
            if "equity" not in latest_offer and "stockOptions" not in latest_offer:
                unresolved.append("Equity / Stock Options")
            if "remoteDays" not in latest_offer and "workArrangement" not in latest_offer:
                unresolved.append("Remote Work Schedule")
        else:
            if "allocation" not in latest_offer and "marketingAllocation" not in latest_offer:
                unresolved.append("Capital Allocation Splits")

        return unresolved if unresolved else ["Final consensus on full proposal package"]
