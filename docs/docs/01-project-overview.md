# Project Overview

## What It Is

The Multi-Agent Negotiation Simulator is a web application for practicing and analyzing business negotiations. A user configures a scenario and its participants, then runs either an autonomous AI-versus-AI negotiation or a human-versus-AI practice session.

The application combines two kinds of behavior:

- **LLM reasoning** produces a proposed message, offer, rationale, and action.
- **Deterministic backend rules** decide whether that proposal is valid and whether the negotiation can continue.

The LLM is therefore a decision proposal service, not the final authority over the negotiation state.

## Main Use Cases

- Explore how different agent personalities negotiate.
- Practice responding to an AI participant.
- Test offers, counteroffers, concessions, and constraints.
- Detect agreements, deadlocks, and safety-limit exits.
- Review stored transcripts, usage information, and outcome reports.

## Supported Preset Scenarios

The backend seeds these scenario identifiers:

- `vendor-pricing`
- `job-offer`
- `budget-allocation`

A scenario supplies expected participant roles and the negotiable dimensions used during setup and execution.

## Negotiation Modes

- **AI vs AI (`ai-ai`)**: the backend runner advances turns between configured AI agents.
- **Human vs AI (`human-ai`)**: the backend waits for the human participant when it is their turn and evaluates the submitted user offer or message.

## Key Concepts

- **Agent**: a participant with a role, personality, experience, goals, constraints, and private negotiation parameters.
- **Offer**: structured terms proposed during a turn.
- **ZOPA**: the zone in which the participants' constraints may allow an agreement.
- **Concession**: a movement from a previous position, checked against the configured strategy and rules.
- **Deadlock**: a terminal condition where progress is no longer possible or repeated/invalid behavior prevents agreement.
- **Outcome report**: durable analysis generated after a negotiation reaches a terminal state.

## User Journey

```text
Choose scenario
  -> Choose mode
  -> Configure agents
  -> Set goals and constraints
  -> Review and confirm
  -> Start negotiation
  -> Execute turns
  -> Open outcome report
```

The frontend presents this journey, but the backend also validates the required order so that direct API calls cannot skip setup requirements.

## Important Boundary

The current implementation uses REST requests for setup and turn execution. The repository contains planning language about WebSockets and live streams, but the active route surface is REST-based and the AI-versus-AI loop runs in-process.
