from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any

@dataclass
class VoiceNegotiationState:
    scenario_title: str
    custom_scenario_text: str
    mode: str
    current_round: int = 1
    last_offered_price: Optional[float] = None
    transcript_history: List[Dict[str, str]] = field(default_factory=list)

    def add_speech_turn(self, speaker: str, transcript: str, price_offer: Optional[float] = None):
        if price_offer is not None:
            self.last_offered_price = price_offer
        
        self.transcript_history.append({
            "round": str(self.current_round),
            "speaker": speaker,
            "transcript": transcript,
            "price_offer": str(price_offer) if price_offer is not None else "N/A"
        })