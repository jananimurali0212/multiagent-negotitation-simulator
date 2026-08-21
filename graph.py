import os
from typing import TypedDict, Annotated
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, END
from agent_schema import AgentActionResponse

class AgentState(TypedDict):
    user_transcript: str
    scenario_id: str
    mode: str
    agent_output: dict

def negotiation_node(state: AgentState) -> dict:
    api_key = os.getenv("GEMINI_API_KEY")
    
    if not api_key:
        # Fallback response if API key is unconfigured
        return {
            "agent_output": {
                "action": "COUNTER",
                "proposed_price": 100000,
                "spoken_dialogue": "I hear your proposal, but let's discuss a target closer to $100,000."
            }
        }
    
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.4)
    structured_llm = llm.with_structured_output(AgentActionResponse)
    
    prompt = f"""
    You are an expert negotiator in scenario '{state['scenario_id']}' playing in '{state['mode']}' mode.
    The opponent says: "{state['user_transcript']}".
    Provide your decision (ACCEPT, REJECT, COUNTER, ASK_INFO), proposed price target, and spoken dialogue.
    """
    
    result = structured_llm.invoke(prompt)
    return {"agent_output": result.model_dump()}

# Build workflow graph
workflow = StateGraph(AgentState)
workflow.add_node("negotiator", negotiation_node)
workflow.set_entry_point("negotiator")
workflow.add_edge("negotiator", END)

negotiation_graph = workflow.compile()