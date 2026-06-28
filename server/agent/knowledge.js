export const controlLibrary = [
  {
    id: "CTRL-AI-001",
    domain: "data protection",
    title: "Sensitive data boundary",
    evidence: "Vendors must document whether prompts, files, telemetry, or outputs are retained or used for training.",
    keywords: ["pii", "customer data", "training", "retention", "prompt", "files"]
  },
  {
    id: "CTRL-AI-002",
    domain: "model governance",
    title: "Human approval for high-impact decisions",
    evidence: "High-impact recommendations require human review, override capture, and audit-friendly rationale.",
    keywords: ["automated decision", "approval", "review", "override", "high impact", "recommend", "recommendation"]
  },
  {
    id: "CTRL-AI-003",
    domain: "security",
    title: "Integration permission minimization",
    evidence: "Production integrations should use least-privilege scopes, rotation, and environment isolation.",
    keywords: ["oauth", "api key", "scope", "write access", "production", "integration"]
  },
  {
    id: "CTRL-AI-004",
    domain: "resilience",
    title: "Fallback and incident response",
    evidence: "Business-critical AI workflows need fallback paths, owner escalation, and post-incident trace review.",
    keywords: ["fallback", "incident", "sla", "business critical", "outage"]
  },
  {
    id: "CTRL-AI-005",
    domain: "compliance",
    title: "Regulated-use review",
    evidence: "Healthcare, financial, employment, education, and housing use cases require additional compliance review.",
    keywords: ["healthcare", "patient", "finance", "employment", "education", "housing", "regulated"]
  }
];

export function retrieveEvidence(text) {
  const query = String(text || "").toLowerCase();
  return controlLibrary
    .map((control) => ({
      ...control,
      matchScore: control.keywords.reduce((score, keyword) => score + (query.includes(keyword) ? 1 : 0), 0)
    }))
    .filter((control) => control.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 4);
}
