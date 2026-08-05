from pydantic import BaseModel
from typing import Optional, Literal

class SpeechToTextInput(BaseModel):
    """Schema for processing audio-transcribed text received from user STT."""
    stt_transcript: str
    audio_confidence: Optional[float] = 1.0
    extracted_price_offer: Optional[float] = None

class AgentResponseProtocol(BaseModel):
    """Schema for AI turn outputs ready for Text-to-Speech (TTS) synthesis."""
    action: Literal["ACCEPT", "COUNTER", "REJECT"]
    proposed_price: Optional[float] = None
    reasoning: str
    spoken_dialogue: str  # Conversational text formatted cleanly for TTS audio synthesis