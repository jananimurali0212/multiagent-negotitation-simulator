from pydantic import BaseModel
from typing import Optional, Literal

class UserSpeechInput(BaseModel):
    """Schema for processing incoming spoken user transcripts."""
    raw_transcript: str
    extracted_price_offer: Optional[float] = None

class AgentResponseProtocol(BaseModel):
    """Schema for AI turn outputs optimized for Text-to-Speech (TTS)."""
    action: Literal["ACCEPT", "COUNTER", "REJECT"]
    proposed_price: Optional[float] = None
    reasoning: str
    spoken_dialogue: str  # Conversational text formatted specifically for TTS synthesis