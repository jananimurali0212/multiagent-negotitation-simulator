from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from agent_schema import UserInput
from database import save_session_turn, get_session_summary
from guardrails import validate_user_input
from graph import negotiation_graph

app = FastAPI(title="Multi-Agent Negotiation Simulator API")

# Configure CORS for Frontend Integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "Active", "service": "Negotiation Simulator API"}

@app.get("/api/negotiation/{session_id}/summary")
async def get_summary(session_id: str):
    summary = get_session_summary(session_id)
    if not summary:
        raise HTTPException(status_code=404, detail="Session not found")
    return summary

@app.websocket("/ws/negotiate/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept()
    print(f"[WEBSOCKET] Client connected: {session_id}")
    
    try:
        while True:
            # Receive payload
            data = await websocket.receive_json()
            transcript = data.get("stt_transcript", "")
            scenario_id = data.get("scenario_id", "job_offer")
            mode = data.get("mode", "collaborative")
            
            # Guardrails check
            is_valid, error_msg = validate_user_input(transcript)
            if not is_valid:
                await websocket.send_json({"error": error_msg})
                continue
                
            # Invoke LangGraph Engine
            initial_state = {
                "user_transcript": transcript,
                "scenario_id": scenario_id,
                "mode": mode,
                "agent_output": {}
            }
            
            graph_result = negotiation_graph.invoke(initial_state)
            agent_response = graph_result.get("agent_output", {})
            
            # Save turn persistence
            save_session_turn(session_id, transcript, agent_response)
            
            # Send result back to WebSocket client
            await websocket.send_json({
                "session_id": session_id,
                "status": "IN_PROGRESS",
                "agent_response": agent_response
            })

    except WebSocketDisconnect:
        print(f"[WEBSOCKET] Client disconnected: {session_id}")
    except Exception as e:
        print(f"[ERROR] WebSocket Exception: {e}")