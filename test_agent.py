import json
import os
from dotenv import load_dotenv
from agent_schema import AgentPersona, PersonalityTraits, NegotiationObjectives
from prompts import build_agent_system_prompt

load_dotenv()

def run_interactive_agent_test():
    # 1. Load pre-built scenario data
    with open("scenarios.json", "r") as f:
        data = json.load(f)
    
    scenarios = data["scenarios"]
    
    print("=== MULTI-AGENT NEGOTIATION SIMULATOR: MILESTONE 1 TEST ===")
    print("\nAvailable Scenarios:")
    for idx, sc in enumerate(scenarios):
        print(f" [{idx + 1}] {sc['title']} ({sc['scenario_id']})")
    
    # Input 1: Select Scenario
    scenario_choice = int(input("\nSelect a scenario number (1-3): ")) - 1
    selected_scenario = scenarios[scenario_choice]
    
    print(f"\nAgents in '{selected_scenario['title']}':")
    for idx, ag in enumerate(selected_scenario['agents']):
        print(f" [{idx + 1}] {ag['name']} - {ag['role']} ({ag['personality_type']})")
        
    # Input 2: Select Agent
    agent_choice = int(input("\nSelect an agent number (1-2): ")) - 1
    agent_data = selected_scenario['agents'][agent_choice]
    partner_data = selected_scenario['agents'][1 if agent_choice == 0 else 0]
    
    # 2. Build the Agent Persona object from the inputs
    agent = AgentPersona(
        agent_id=agent_data["agent_id"],
        name=agent_data["name"],
        role=agent_data["role"],
        personality_type=agent_data["personality_type"],
        traits=PersonalityTraits(**agent_data["traits"]),
        objectives=NegotiationObjectives(**agent_data["objectives"]),
        constraints=agent_data["constraints"]
    )
    
    # 3. Generate system prompt based on selected inputs
    system_prompt = build_agent_system_prompt(agent, partner_role=partner_data["role"])
    
    print("\n" + "=" * 60)
    print(f" GENERATED SYSTEM PROMPT FOR: {agent.name} ({agent.role})")
    print("=" * 60)
    print(system_prompt)

if __name__ == "__main__":
    run_interactive_agent_test()