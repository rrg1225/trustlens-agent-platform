import { randomUUID } from "node:crypto";
import { classifyIntake, validateToolOutput } from "./policies.js";
import { runTool } from "./tools.js";

export async function runAssessment(intake, options = {}) {
  const state = {
    runId: `asm_${Date.now()}_${randomUUID().slice(0, 8)}`,
    startedAt: new Date().toISOString(),
    mode: options.mode || process.env.AGENT_MODE || "dry-run",
    maxSteps: clampSteps(options.maxSteps || process.env.AGENT_MAX_STEPS || 8),
    intake,
    policy: classifyIntake(intake),
    normalized: null,
    evidence: [],
    controls: { controls: [] },
    risk: null,
    mitigation: null,
    trace: [],
    observations: []
  };

  state.trace.push(event(1, "observe", { policy: state.policy }));
  if (state.policy.level === "blocked") return finish(state, "blocked", state.policy.reason);

  const sequence = ["intake.normalize", "evidence.retrieve", "controls.map", "risk.score", "mitigation.plan", "handoff.compose"];
  for (let index = 0; index < Math.min(sequence.length, state.maxSteps); index += 1) {
    const tool = sequence[index];
    state.trace.push(event(index + 2, "decide", { tool }));
    const started = performance.now();
    const output = await runTool(tool, { intake }, state);
    const observation = { tool, output, latencyMs: Math.round(performance.now() - started) };
    state.observations.push(observation);
    if (tool === "intake.normalize") state.normalized = output;
    if (tool === "evidence.retrieve") state.evidence = output;
    if (tool === "controls.map") state.controls = output;
    if (tool === "risk.score") state.risk = output;
    if (tool === "mitigation.plan") state.mitigation = output;
    state.trace.push(event(index + 2, "act", { observation }));
    const ok = validateToolOutput(tool, output);
    state.trace.push(event(index + 2, "validate", { tool, ok }));
    if (!ok) return finish(state, "failed", `Tool output failed validation: ${tool}`);
  }

  return finish(state, state.risk.decision, "assessment_handoff_ready");
}

function finish(state, status, reason) {
  const handoff = state.observations.find((item) => item.tool === "handoff.compose")?.output;
  const validations = state.trace.filter((item) => item.phase === "validate");
  state.status = status;
  state.completedAt = new Date().toISOString();
  state.final = {
    status,
    reason,
    policy: state.policy,
    risk: state.risk,
    handoff,
    quality: {
      evidenceCount: state.evidence.length,
      mappedControls: state.controls.controls.length,
      externalWrites: state.observations.filter((item) => item.output?.externalWritePerformed).length,
      validationPassRate: validations.length ? Math.round((validations.filter((item) => item.ok).length / validations.length) * 100) : 0,
      dryRunOnly: state.mode === "dry-run"
    }
  };
  return state;
}

function event(step, phase, payload) {
  return { step, phase, at: new Date().toISOString(), ...payload };
}

function clampSteps(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 8;
  return Math.max(3, Math.min(10, Math.round(parsed)));
}
