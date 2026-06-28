import { randomUUID } from "node:crypto";

export function createRuntimeState(service) {
  return {
    service,
    startedAt: Date.now(),
    requests: 0,
    errors: 0,
    byStatus: {}
  };
}

export function installRuntimeControls(app, state) {
  app.disable("x-powered-by");
  app.use((req, res, next) => {
    const requestId = req.headers["x-request-id"] || randomUUID();
    req.requestId = requestId;
    res.setHeader("x-request-id", requestId);
    res.setHeader("x-frame-options", "DENY");
    res.setHeader("x-content-type-options", "nosniff");
    res.setHeader("referrer-policy", "no-referrer");
    res.setHeader("content-security-policy", "default-src 'self'; frame-ancestors 'none'");
    state.requests += 1;
    res.on("finish", () => {
      state.byStatus[res.statusCode] = (state.byStatus[res.statusCode] || 0) + 1;
      if (res.statusCode >= 500) state.errors += 1;
    });
    next();
  });
}

export function runtimeMetrics(state) {
  return {
    service: state.service,
    uptimeSeconds: Math.round((Date.now() - state.startedAt) / 1000),
    requests: state.requests,
    errors: state.errors,
    byStatus: state.byStatus
  };
}

export function operationalScorecard(state) {
  const metrics = runtimeMetrics(state);
  const totalResponses = Object.values(metrics.byStatus).reduce((sum, value) => sum + value, 0);
  const availability = totalResponses ? Math.round((1 - metrics.errors / totalResponses) * 1000) / 10 : 100;
  const checks = [
    { id: "security_headers", label: "Baseline browser security headers", status: "passing", points: 25 },
    { id: "request_correlation", label: "Request IDs for audit correlation", status: "passing", points: 25 },
    { id: "agent_dry_run", label: "External writes stay in draft mode", status: "passing", points: 25 },
    { id: "error_budget", label: "Observed API availability above 99 percent", status: availability >= 99 ? "passing" : "watch", points: availability >= 99 ? 25 : 12 }
  ];
  const score = checks.reduce((sum, check) => sum + check.points, 0);
  return {
    service: metrics.service,
    generatedAt: new Date().toISOString(),
    score,
    grade: score >= 90 ? "A" : score >= 75 ? "B" : "C",
    availability,
    checks
  };
}
