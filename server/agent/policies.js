const blockedPatterns = [
  /ignore\s+(policy|system|developer|previous)\s+instructions/i,
  /steal|exfiltrate|leak\s+(secret|token|customer)/i,
  /approve\s+without\s+(review|evidence|controls)/i,
  /bypass\s+(security|legal|compliance|approval)/i
];

const regulatedPatterns = [/healthcare|patient|finance|credit|employment|student|housing|biometric/i];
const sensitivePatterns = [/pii|customer data|secret|api key|oauth|production|write access|training data/i];

export function classifyIntake(input) {
  const text = JSON.stringify(input || {});
  const blocked = blockedPatterns.find((pattern) => pattern.test(text));
  if (blocked) {
    return {
      level: "blocked",
      reason: "Unsafe instruction or approval bypass detected.",
      matchedPolicy: String(blocked)
    };
  }

  const regulated = regulatedPatterns.some((pattern) => pattern.test(text));
  const sensitive = sensitivePatterns.some((pattern) => pattern.test(text));
  if (regulated && sensitive) {
    return { level: "high", reason: "Regulated use case with sensitive data or production permissions.", matchedPolicy: "regulated+sensitive" };
  }
  if (regulated || sensitive) {
    return { level: "review", reason: "The assessment requires control owner review before approval.", matchedPolicy: regulated ? "regulated" : "sensitive" };
  }
  return { level: "standard", reason: "No regulated or sensitive pattern detected.", matchedPolicy: null };
}

export function validateToolOutput(tool, output) {
  if (tool === "intake.normalize") return Boolean(output?.vendor && output?.useCase);
  if (tool === "evidence.retrieve") return Array.isArray(output);
  if (tool === "controls.map") return Array.isArray(output?.controls);
  if (tool === "risk.score") return Number.isFinite(output?.score) && Array.isArray(output?.drivers);
  if (tool === "mitigation.plan") return Array.isArray(output?.actions);
  if (tool === "handoff.compose") return Boolean(output?.summary && output?.decision);
  return false;
}

export function decisionFromScore(score, policyLevel) {
  if (policyLevel === "blocked") return "blocked";
  if (score >= 75) return "executive-review";
  if (score >= 50) return "control-owner-review";
  return "standard-approval";
}
