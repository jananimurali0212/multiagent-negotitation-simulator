from dataclasses import dataclass, field
from typing import List, Dict, Optional

@dataclass
class VoiceNegotiationState:
    scenario_id: str
    mode: str
    current_round: int = 1
    last_offered_price: Optional[float] = None
    transcript_history: List[Dict[str, str]] = field(default_factory=list)

    def add_speech_turn(self, speaker: str, stt_transcript: str, offer_price: Optional[float] = None):
        if offer_price is not None:
            self.last_offered_price = offer_price
            
        self.transcript_history.append({
            "round": str(self.current_round),
            "speaker": speaker,
            "transcript": stt_transcript,
            "offer_price": str(offer_price) if offer_price is not None else "N/A"
        })