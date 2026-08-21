import os
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel, Field

class NegotiationEvaluation(BaseModel):
    efficiency_score: int = Field(description="Score from 1 to 10 on negotiation speed")
    collaboration_score: int = Field(description="Score from 1 to 10 on collaboration")
    final_outcome: str = Field(description="AGREED, REJECTED, or DEADLOCK")
    key_takeaways: str = Field(description="Feedback summary for user improvement")

def evaluate_session_history(history: list) -> NegotiationEvaluation:
    """Invokes Gemini model to rate the negotiation."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return NegotiationEvaluation(
            efficiency_score=5,
            collaboration_score=5,
            final_outcome="COMPLETED",
            key_takeaways="API key not provided for auto-evaluation."
        )

    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.2)
    structured_llm = llm.with_structured_output(NegotiationEvaluation)
    
    prompt = f"Analyze this negotiation history and provide a summary evaluation:\n{history}"
    return structured_llm.invoke(prompt)