# TrustLens Agent Platform

Full-stack AI governance agent platform for vendor intake, evidence-grounded risk scoring, control mapping, and auditable approval handoffs.

This project is built as a portfolio-grade AI agent application: it has a deterministic agent loop, explicit tool contracts, policy guardrails, RAG-style evidence retrieval, explainable risk scoring, operational metrics, a React console, API tests, scenario evals, and GitHub Actions CI.

## Why it matters

Companies adopting AI tools need a repeatable way to answer: What data does this vendor touch? Which controls apply? Is this regulated? Who must approve it? What evidence supports the decision? TrustLens turns that process into a transparent agent workflow with traceable state and human review gates.

## Features

- Agent loop: observe, decide, act, validate, finish.
- Guardrails: blocks approval-bypass and secret-exfiltration instructions before tool execution.
- Evidence retrieval: local control library maps intake details to governance obligations.
- Risk engine: explainable risk score, tier, decision route, and drivers.
- Draft-only actions: mitigation and handoff tools never perform external writes.
- Auditability: every run returns trace events, validation results, quality metrics, and saved assessment summaries.
- Operations: request IDs, security headers, runtime metrics, operational scorecard.
- Frontend: React dashboard for intake, tools, decision handoff, trace, metrics, and history.

## Quick Start

```bash
npm install
npm run ci:local
npm run dev
```

Frontend: `http://127.0.0.1:5177`

API: `http://127.0.0.1:4100`

No secrets are required for the default deterministic demo. `.env.example` includes an optional `OPENAI_API_KEY` placeholder for future model-backed tool implementations.

## API

- `POST /api/assessments` runs a vendor risk assessment.
- `GET /api/assessments` lists saved assessment summaries.
- `GET /api/tools` returns tool contracts and permissions.
- `GET /api/metrics` returns product metrics.
- `GET /api/metrics/runtime` returns runtime counters.
- `GET /api/metrics/scorecard` returns operational readiness checks.

## Verification

```bash
npm test
npm run eval
npm run build
```

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
