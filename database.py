import json

# In-memory storage fallback for session tracking
SESSION_DB = {}

def save_session_turn(session_id: str, user_speech: str, agent_response: dict):
    """Saves a turn to memory/DB."""
    if session_id not in SESSION_DB:
        SESSION_DB[session_id] = []
    
    turn_data = {
        "round": len(SESSION_DB[session_id]) + 1,
        "user_speech": user_speech,
        "agent_speech": agent_response.get("spoken_dialogue", ""),
        "proposed_price": agent_response.get("proposed_price")
    }
    SESSION_DB[session_id].append(turn_data)
    print(f"[DATABASE] Session {session_id} saved turn {turn_data['round']}")
    return True

def get_session_history(session_id: str) -> list:
    """Retrieves full conversation turns for a session."""
    return SESSION_DB.get(session_id, [])

def get_session_summary(session_id: str) -> dict:
    """Generates summary report object for REST endpoints."""
    history = get_session_history(session_id)
    return {
        "session_id": session_id,
        "status": "COMPLETED",
        "efficiency_score": 8,
        "collaboration_score": 9,
        "key_takeaways": "Good back-and-forth offer negotiation. Maintained strategic flexibility.",
        "turns": history
    }