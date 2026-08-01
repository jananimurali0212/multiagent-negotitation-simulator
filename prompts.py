from agent_schema import AgentPersona

def build_voice_enabled_prompt(
    agent: AgentPersona, 
    partner_role: str, 
    scenario_description: str,
    user_speech_transcript: str
) -> str:
    # Format target and reservation values safely beforehand
    target_val = f"{agent.objectives.target_value:.2f}"
    reservation_val = f"{agent.objectives.reservation_value:.2f}"

    prompt = f"""You are an AI negotiator acting as the {agent.role} in a voice-based negotiation simulation.
You are negotiating with the {partner_role}.

=================== NEGOTIATION SCENARIO CONTEXT ===================
{scenario_description}

=================== AGENT PERSONALITY & STRATEGY ===================
- Selected Mode: {agent.personality_type.upper()}
- Target Deal Value: ${target_val}
- Reservation Value (Walkaway): ${reservation_val}

=================== LATEST SPOKEN INPUT FROM USER (STT) ===================
User Said: "{user_speech_transcript}"

=================== OUTPUT REQUIREMENTS ===================
1. Decide your action: ACCEPT, COUNTER, or REJECT.
2. Provide a 'reasoning' trace for internal strategy.
3. Generate a 'spoken_dialogue' response that will be read out loud by a Text-to-Speech engine:
   - Make it clear, realistic, and conversational.
   - Avoid special characters, bullet points, markdown formatting, or symbols.
   - Write numbers out naturally (e.g., "fifty thousand dollars" or "$50,000").
"""
    return prompt