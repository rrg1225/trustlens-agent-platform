import { useEffect, useState } from "react";

const examples = [
  {
    label: "Clinical assistant",
    intake: {
      vendor: "Northstar Health AI",
      useCase: "Summarize patient visits and recommend follow-up tasks for nurses",
      owner: "Clinical Operations",
      dataClasses: ["patient data", "PII"],
      integrations: ["EHR read access", "task write access"],
      businessImpact: "high",
      notes: "Vendor says prompts may be retained for model improvement unless enterprise opt-out is enabled."
    }
  },
  {
    label: "Support copilot",
    intake: {
      vendor: "Helpdesk Copilot",
      useCase: "Draft support replies from internal knowledge base articles",
      owner: "Customer Success",
      dataClasses: ["internal", "customer data"],
      integrations: ["read-only knowledge base"],
      businessImpact: "medium",
      notes: "No autonomous customer notifications."
    }
  }
];

export default function App() {
  const [intakeText, setIntakeText] = useState(JSON.stringify(examples[0].intake, null, 2));
  const [result, setResult] = useState(null);
  const [tools, setTools] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [scorecard, setScorecard] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    const [toolsResponse, assessmentsResponse, metricsResponse, scorecardResponse] = await Promise.all([
      fetch("/api/tools"),
      fetch("/api/assessments"),
      fetch("/api/metrics"),
      fetch("/api/metrics/scorecard")
    ]);
    setTools(await toolsResponse.json());
    setAssessments(await assessmentsResponse.json());
    setMetrics(await metricsResponse.json());
    setScorecard(await scorecardResponse.json());
  }

  useEffect(() => {
    load().catch(() => setError("Failed to load platform metadata"));
  }, []);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const intake = JSON.parse(intakeText);
      const response = await fetch("/api/assessments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ intake })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "Assessment failed");
      setResult(payload.run);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">AI governance operations</p>
          <h1>TrustLens Agent Platform</h1>
          <p>Evidence-grounded vendor assessments with guardrails, control mapping, risk scoring, and auditable human handoffs.</p>
        </div>
        <div className="scorecard">
          <strong>{scorecard?.grade || "-"}</strong>
          <span>operational grade</span>
        </div>
      </section>

      {error && <div className="alert">{error}</div>}

      <section className="metric-grid">
        <Metric label="Assessments" value={metrics?.total ?? 0} />
        <Metric label="Review queue" value={metrics?.reviewQueue ?? 0} />
        <Metric label="Avg risk" value={metrics?.averageRisk ?? 0} />
        <Metric label="Approval debt" value={metrics?.approvalDebt ?? 0} />
      </section>

      <section className="workspace">
        <div className="panel">
          <h2>Vendor intake</h2>
          <form onSubmit={submit} className="form">
            <textarea value={intakeText} onChange={(event) => setIntakeText(event.target.value)} />
            <div className="examples">
              {examples.map((example) => (
                <button type="button" className="secondary" key={example.label} onClick={() => setIntakeText(JSON.stringify(example.intake, null, 2))}>
                  {example.label}
                </button>
              ))}
            </div>
            <button type="submit" disabled={loading}>{loading ? "Assessing..." : "Run assessment agent"}</button>
          </form>
        </div>

        <aside className="panel">
          <h2>Tool contracts</h2>
          <div className="tool-list">
            {tools.map((tool) => (
              <div key={tool.name}>
                <strong>{tool.name}</strong>
                <span>{tool.permission}</span>
                <p>{tool.description}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>

      {result && (
        <section className="results">
          <div className="panel status-panel">
            <span className={`status ${result.status}`}>{result.status}</span>
            <h2>{result.final.reason}</h2>
            <div className="metric-grid compact">
              <Metric label="Risk" value={result.final.risk?.score ?? 0} />
              <Metric label="Tier" value={result.final.risk?.tier ?? "blocked"} />
              <Metric label="Evidence" value={result.final.quality.evidenceCount} />
              <Metric label="Validation" value={`${result.final.quality.validationPassRate}%`} />
            </div>
          </div>
          <div className="panel">
            <h2>Decision handoff</h2>
            <pre>{JSON.stringify(result.final.handoff, null, 2)}</pre>
          </div>
          <div className="panel trace">
            <h2>Agent trace</h2>
            {result.trace.map((item, index) => (
              <article key={`${item.step}-${item.phase}-${index}`}>
                <span>{item.step}</span>
                <div>
                  <strong>{item.phase}</strong>
                  <pre>{JSON.stringify(item, null, 2)}</pre>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="panel">
        <h2>Recent assessments</h2>
        <div className="assessment-list">
          {assessments.map((item) => (
            <div key={item.id}>
              <strong>{item.vendor}</strong>
              <span>{item.status} / risk {item.riskScore} / {item.mappedControls} controls</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }) {
  return (
    <div className="metric">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
