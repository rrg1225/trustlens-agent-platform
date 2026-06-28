import { retrieveEvidence } from "./knowledge.js";
import { decisionFromScore } from "./policies.js";

export const toolCatalog = [
  { name: "intake.normalize", permission: "read", description: "Normalizes vendor, use case, data classes, integrations, and business impact." },
  { name: "evidence.retrieve", permission: "read", description: "Retrieves matching governance controls from the local evidence library." },
  { name: "controls.map", permission: "read", description: "Maps retrieved controls into assessment obligations and owners." },
  { name: "risk.score", permission: "read", description: "Scores inherent AI/vendor risk with explainable drivers." },
  { name: "mitigation.plan", permission: "write-draft", description: "Drafts mitigations without changing external systems." },
  { name: "handoff.compose", permission: "write-draft", description: "Creates an auditable decision handoff for reviewers." }
];

export async function runTool(name, input, state) {
  const handlers = {
    "intake.normalize": normalizeIntake,
    "evidence.retrieve": retrieve,
    "controls.map": mapControls,
    "risk.score": scoreRisk,
    "mitigation.plan": planMitigation,
    "handoff.compose": composeHandoff
  };
  const handler = handlers[name];
  if (!handler) throw new Error(`Unknown tool: ${name}`);
  return handler(input, state);
}

function normalizeIntake({ intake }) {
  return {
    vendor: String(intake.vendor || "Unnamed vendor").trim(),
    useCase: String(intake.useCase || "Unspecified AI workflow").trim(),
    owner: String(intake.owner || "AI Governance").trim(),
    dataClasses: normalizeList(intake.dataClasses, ["internal"]),
    integrations: normalizeList(intake.integrations, []),
    businessImpact: String(intake.businessImpact || "medium").toLowerCase(),
    notes: String(intake.notes || "").slice(0, 1200)
  };
}

function retrieve(_input, state) {
  const normalized = state.normalized;
  return retrieveEvidence(`${normalized.useCase} ${normalized.dataClasses.join(" ")} ${normalized.integrations.join(" ")} ${normalized.notes}`);
}

function mapControls(_input, state) {
  return {
    controls: state.evidence.map((item) => ({
      id: item.id,
      title: item.title,
      domain: item.domain,
      owner: ownerForDomain(item.domain),
      evidence: item.evidence
    }))
  };
}

function scoreRisk(_input, state) {
  const normalized = state.normalized;
  const drivers = [];
  let score = 25;

  if (normalized.dataClasses.some((item) => /pii|customer|patient|financial|secret/i.test(item))) {
    score += 22;
    drivers.push("Sensitive or regulated data classes");
  }
  if (normalized.integrations.some((item) => /write|production|oauth|api/i.test(item))) {
    score += 18;
    drivers.push("Production or write-capable integration");
  }
  if (/high|critical/.test(normalized.businessImpact)) {
    score += 18;
    drivers.push("High business impact workflow");
  }
  if (state.policy.level === "high") {
    score += 15;
    drivers.push("Regulated plus sensitive policy classification");
  }
  if (state.evidence.length === 0) {
    score += 10;
    drivers.push("No matching evidence controls found");
  }

  const bounded = Math.max(0, Math.min(100, score));
  return {
    score: bounded,
    tier: bounded >= 75 ? "critical" : bounded >= 50 ? "elevated" : "managed",
    decision: decisionFromScore(bounded, state.policy.level),
    drivers
  };
}

function planMitigation(_input, state) {
  const actions = [
    "Collect data-retention and training-use evidence before approval.",
    "Confirm least-privilege integration scopes and owner rotation.",
    "Require human review for high-impact recommendations.",
    "Attach fallback path and incident escalation owner."
  ];
  return {
    actions: state.risk.score >= 50 ? actions : actions.slice(0, 2),
    externalWritePerformed: false
  };
}

function composeHandoff(_input, state) {
  return {
    summary: `${state.normalized.vendor} assessment for ${state.normalized.useCase}`,
    decision: state.risk.decision,
    owner: state.normalized.owner,
    riskTier: state.risk.tier,
    controls: state.controls.controls.map((control) => control.id),
    nextReview: state.risk.score >= 75 ? "Executive risk council" : "AI governance owner",
    disclaimer: "Draft assessment only; final approval requires accountable human review."
  };
}

function normalizeList(value, fallback) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === "string") return value.split(",").map((item) => item.trim()).filter(Boolean);
  return fallback;
}

function ownerForDomain(domain) {
  const owners = {
    "data protection": "Privacy",
    "model governance": "AI Governance",
    security: "Security",
    resilience: "SRE",
    compliance: "Legal"
  };
  return owners[domain] || "AI Governance";
}
