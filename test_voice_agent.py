from scenarios import get_scenario
from agent_schema import AgentPersona, PersonalityTraits, NegotiationObjectives
from negotiation_state import VoiceNegotiationState
from prompts import build_voice_enabled_prompt
from protocol import SpeechToTextInput, AgentResponseProtocol

def run_simulation():
    # 1. Select scenario (job_offer, project_budget, vendor_pricing)
    selected_scenario_id = "job_offer"
    scenario = get_scenario(selected_scenario_id)

    # 2. Select Agent Mode
    selected_mode = "collaborative"

    agent = AgentPersona(
        agent_id="agent_01",
        name="Hiring Representative",
        role=scenario.agent_role,
        personality_type=selected_mode,
        traits=PersonalityTraits(aggression=0.3, flexibility=0.7, patience=0.8),
        objectives=NegotiationObjectives(
            primary_goal="Hire top tech candidate within budget bounds",
            target_value=125000.0,
            reservation_value=135000.0
        ),
        voice_id="alloy"
    )

    # 3. Simulate incoming user Speech-to-Text (STT) transcript
    stt_input = SpeechToTextInput(
        stt_transcript="Thank you for the offer of one hundred ten thousand. Given my experience, I was hoping for one hundred thirty thousand dollars.",
        extracted_price_offer=130000.0
    )

    # 4. Initialize session state
    state = VoiceNegotiationState(scenario_id=scenario.scenario_id, mode=selected_mode)
    state.add_speech_turn(
        speaker=scenario.user_role,
        stt_transcript=stt_input.stt_transcript,
        offer_price=stt_input.extracted_price_offer
    )

    # 5. Generate dynamic prompt
    prompt = build_voice_enabled_prompt(
        agent=agent,
        scenario=scenario,
        user_stt_transcript=stt_input.stt_transcript
    )

    print("=================== PROMPT GENERATED ===================")
    print(prompt)

    # 6. Simulated Agent TTS output response
    simulated_tts_response = AgentResponseProtocol(
        action="COUNTER",
        proposed_price=122000.0,
        reasoning="Candidate asked for $130k. Offer middle ground at $122k with performance review option.",
        spoken_dialogue="I completely understand where you are coming from. While one hundred thirty thousand is slightly above our base starting band, I can increase our offer to one hundred twenty-two thousand dollars with a performance review in six months."
    )

    print("\n=================== SIMULATED AI TTS RESPONSE ===================")
    print(f"Action: {simulated_tts_response.action}")
    print(f"Target Voice ID: {agent.voice_id}")
    print(f"Spoken Response (TTS Ready): {simulated_tts_response.spoken_dialogue}")

if __name__ == "__main__":
    run_simulation()