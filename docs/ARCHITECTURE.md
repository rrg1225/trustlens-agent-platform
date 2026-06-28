# Architecture

TrustLens is a deterministic full-stack AI governance agent platform. It models the agent as an explicit workflow rather than a hidden chat transcript.

## Agent Loop

1. Observe: classify intake for unsafe, regulated, or sensitive patterns.
2. Decide: select the next narrow tool from the fixed workflow.
3. Act: normalize intake, retrieve evidence, map controls, score risk, draft mitigations, compose handoff.
4. Validate: each tool output is checked before it can influence later state.
5. Finish: return a decision status, risk drivers, mapped controls, quality metrics, and audit trace.

## State Boundaries

- Durable state: assessment summaries and audit events in `data/assessments.local.json`.
- Transient state: full run trace and intermediate tool outputs returned to the UI.
- Sensitive data: no external model calls are made by default; `.env.example` reserves `OPENAI_API_KEY` for future optional integrations.
- External writes: mitigation and handoff tools are draft-only and expose `externalWritePerformed: false`.

## Backend

- Express API with request IDs, hardened baseline headers, runtime counters, and an operational scorecard.
- Local JSON store for demo portability.
- `node:test` coverage for high-risk assessment, blocked unsafe instructions, metrics, and tool registry.

## Frontend

- React/Vite operational console.
- JSON intake editor, example scenarios, tool registry, risk results, decision handoff, agent trace, and recent assessments.

## Extension Points

- Replace `server/agent/knowledge.js` with a vector store or database-backed RAG layer.
- Add model calls inside individual tools while keeping schema validation and dry-run safeguards.
- Add authenticated reviewer actions for final approval, rejection, and evidence attachment.
