# Negotiation Engine

## Design Principle

```text
LLM proposes
  -> schema and rule validation
  -> state transition
  -> persistence
  -> outcome evaluation
```

This separation keeps creative language and strategy suggestions flexible while keeping offer boundaries, turn order, and terminal states deterministic.

## Turn Selection

The orchestrator loads the current session and messages, then selects the next participant according to the session's turn state and configured agent order. It records the current speaker and turn index so a request can be resumed consistently.

Human turns are validated before they are treated as negotiation messages. AI turns use the current agent's prompt context and the public transcript.

## Structured Decisions

The provider layer returns a structured decision rather than untrusted free-form text. A decision can contain:

- Action, such as offer, counteroffer, accept, reject, or continue.
- Message text.
- Structured offer terms.
- Rationale.
- Concession information.
- Confidence and provider/model metadata.
- Token usage where available.

The decision validator checks that the result is usable and compatible with the current session.

## Rules and Evaluation

The negotiation package contains separate areas for:

- Offer and constraint validation.
- Concession strategy rules.
- ZOPA calculation.
- Agreement detection.
- Deadlock detection.
- State transitions.
- Telemetry.

The evaluator compares the proposed terms with the participants' boundaries and the current negotiation history. Invalid or impossible decisions must not directly mutate the persisted session into an agreement.

## ZOPA

The Zone of Possible Agreement represents the overlap between the participants' acceptable ranges. For a simple price negotiation, the overlap exists when the buyer's maximum acceptable price is at least the seller's minimum acceptable price. Multi-dimensional negotiations evaluate the configured dimensions and constraints together.

ZOPA is an evaluation aid; it does not by itself decide how an agent communicates or which concession strategy to use.

## Concessions

A concession is measured against an earlier position. The rules check whether movement is allowed for the agent's strategy and whether it violates hard constraints. Strategies represented in the project include aggressive, collaborative, and risk-averse behavior.

## Terminal States

A negotiation can terminate because of:

- Agreement reached.
- Deadlock detected.
- User stop or termination.
- Safety limit reached.
- Another validation or execution failure that requires the session to stop safely.

After a terminal state, the report service generates and stores an outcome report. The report can then be retrieved by session or report identifier.

## Provider Failover

The provider manager can select configured providers such as Gemini, Groq, or OpenRouter. A rule-based fallback exists for cases where an external provider is unavailable or cannot return a valid structured decision. Provider and token information is recorded for later analysis.

## Safety and Consistency

- A per-session async lock protects concurrent turn requests.
- Rules validate offers before persistence.
- Agent private constraints should remain private in prompts.
- Round/turn ceilings prevent an unbounded runner.
- Terminal report creation should be idempotent for a completed session.
