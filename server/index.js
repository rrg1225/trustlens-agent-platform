import express from "express";
import cors from "cors";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { runAssessment } from "./agent/loop.js";
import { toolCatalog } from "./agent/tools.js";
import { createStore } from "./store.js";
import { asyncRoute, errorHandler, notFound, requireObjectBody } from "./http.js";
import { createRuntimeState, installRuntimeControls, operationalScorecard, runtimeMetrics } from "./runtime.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");

export async function createApp(options = {}) {
  const app = express();
  const runtime = createRuntimeState("trustlens-agent-platform");
  const store = await createStore(options.dataFile || join(rootDir, "data", "assessments.local.json"));

  installRuntimeControls(app, runtime);
  app.use(cors());
  app.use(express.json({ limit: "128kb" }));

  app.get("/api/health", (_req, res) => res.json({ ok: true, service: "trustlens-agent-platform" }));
  app.get("/api/tools", (_req, res) => res.json(toolCatalog));
  app.get("/api/metrics/runtime", (_req, res) => res.json(runtimeMetrics(runtime)));
  app.get("/api/metrics/scorecard", (_req, res) => res.json(operationalScorecard(runtime)));
  app.get("/api/metrics", asyncRoute(async (_req, res) => res.json(await store.metrics())));
  app.get("/api/assessments", asyncRoute(async (_req, res) => res.json(await store.listAssessments())));
  app.get("/api/audit", asyncRoute(async (_req, res) => res.json(await store.auditLog())));

  app.post("/api/assessments", asyncRoute(async (req, res) => {
    const body = requireObjectBody(req.body);
    const run = await runAssessment(requireObjectBody(body.intake || body), { mode: body.mode });
    const record = await store.saveAssessment(run);
    res.status(run.status === "blocked" ? 200 : 201).json({ run, record });
  }));

  if (process.env.NODE_ENV === "production") {
    app.use(express.static(join(rootDir, "dist")));
    app.get(/.*/, (_req, res) => res.sendFile(join(rootDir, "dist", "index.html")));
  }

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 4100);
  const app = await createApp();
  app.listen(port, () => console.log(`TrustLens Agent Platform listening on http://127.0.0.1:${port}`));
}
