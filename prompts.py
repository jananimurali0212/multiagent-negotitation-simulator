from agent_schema import AgentPersona
from scenarios import NegotiationScenario

def build_voice_enabled_prompt(
    agent: AgentPersona,
    scenario: NegotiationScenario,
    user_stt_transcript: str
) -> str:
    target_val = f"{agent.objectives.target_value:.2f}"
    reservation_val = f"{agent.objectives.reservation_value:.2f}"

    prompt = f"""You are an AI negotiator acting as the {agent.role} in a voice-based negotiation simulation.
You are negotiating with the {scenario.user_role}.

=================== SCENARIO CONTEXT ===================
Scenario: {scenario.title}
Description: {scenario.description}

=================== AGENT STRATEGY & MODE ===================
- Mode: {agent.personality_type.upper()}
- Target Value: ${target_val}
- Reservation Price (Walkaway): ${reservation_val}

=================== USER SPOKEN INPUT (STT TRANSCRIPT) ===================
User Said: "{user_stt_transcript}"

=================== OUTPUT REQUIREMENTS ===================
1. Decide your action: ACCEPT, COUNTER, or REJECT.
2. Provide internal 'reasoning' for logic tracking.
3. Write a 'spoken_dialogue' response meant to be read aloud by Text-to-Speech (TTS):
   - Keep it natural, realistic, and conversational.
   - Do NOT use markdown, bullet points, or special symbols.
   - Spell out monetary figures clearly.
"""
    return prompt