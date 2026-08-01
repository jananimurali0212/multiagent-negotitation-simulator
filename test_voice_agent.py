from scenarios import create_user_scenario
from agent_schema import AgentPersona, PersonalityTraits, NegotiationObjectives
from negotiation_state import VoiceNegotiationState
from prompts import build_voice_enabled_prompt
from protocol import AgentResponseProtocol

def run_test():
    # 1. User inputs ANY custom scenario dynamically
    user_scenario = create_user_scenario(
        title="Freelance Web Development Contract",
        description="Negotiating a custom web design project for a local coffee shop business.",
        user_role="Business Owner",
        agent_role="Freelance Developer",
        starting_offer=3000.0,
        target_price=5000.0,
        reservation_price=4000.0
    )

    # 2. Selected mode
    selected_mode = "collaborative"

    agent = AgentPersona(
        agent_id="agent_01",
        name="Developer Agent",
        role=user_scenario.agent_role,
        personality_type=selected_mode,
        traits=PersonalityTraits(aggression=0.3, flexibility=0.7, patience=0.8),
        objectives=NegotiationObjectives(
            primary_goal="Secure fair project pricing with timeline flexibility",
            target_value=5000.0,
            reservation_value=4000.0
        ),
        voice_id="echo"
    )

    # 3. Simulate Speech-to-Text (STT) input from the user
    user_speech_transcript = "We really like your portfolio, but our budget is capped at thirty-five hundred dollars."

    # 4. Initialize session state & record turn
    state = VoiceNegotiationState(
        scenario_title=user_scenario.title,
        custom_scenario_text=user_scenario.description,
        mode=selected_mode
    )
    state.add_speech_turn(speaker=user_scenario.user_role, transcript=user_speech_transcript, price_offer=3500.0)

    # 5. Build prompt
    prompt = build_voice_enabled_prompt(
        agent=agent,
        partner_role=user_scenario.user_role,
        scenario_description=f"{user_scenario.title}: {user_scenario.description}",
        user_speech_transcript=user_speech_transcript
    )

    print("=================== SYSTEM PROMPT GENERATED ===================")
    print(prompt)

    # 6. Simulated structured response for Text-to-Speech (TTS)
    simulated_response = AgentResponseProtocol(
        action="COUNTER",
        proposed_price=4200.0,
        reasoning="User offer of $3,500 is below $4,000 reservation price. Propose counter-offer at $4,200 with minor scope reduction.",
        spoken_dialogue="I understand your budget constraints! Thirty-five hundred is a bit low for the full scope, but I can do forty-two hundred dollars if we simplify the initial page animations."
    )

    print("\n=================== SIMULATED AGENT RESPONSE ===================")
    print(f"Action: {simulated_response.action}")
    print(f"Selected TTS Voice: {agent.voice_id}")
    print(f"Spoken Dialogue (TTS Output): {simulated_response.spoken_dialogue}")

if __name__ == "__main__":
    run_test()