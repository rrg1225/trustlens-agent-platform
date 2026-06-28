import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const seed = {
  assessments: [],
  auditLog: []
};

export async function createStore(filePath) {
  async function ensureFile() {
    await mkdir(dirname(filePath), { recursive: true });
    try {
      await readFile(filePath, "utf8");
    } catch {
      await write(seed);
    }
  }

  async function read() {
    await ensureFile();
    return JSON.parse(await readFile(filePath, "utf8"));
  }

  async function write(data) {
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(data, null, 2));
    return data;
  }

  return {
    async saveAssessment(run) {
      const data = await read();
      const record = {
        id: run.runId,
        at: run.completedAt,
        vendor: run.normalized?.vendor || "Unknown",
        useCase: run.normalized?.useCase || "Unknown",
        status: run.status,
        riskScore: run.final.risk?.score || 0,
        riskTier: run.final.risk?.tier || "blocked",
        mappedControls: run.final.quality.mappedControls,
        handoff: run.final.handoff
      };
      data.assessments.unshift(record);
      data.assessments = data.assessments.slice(0, 100);
      data.auditLog.unshift({ id: run.runId, at: run.completedAt, action: "assessment.completed", target: record.vendor, status: run.status });
      data.auditLog = data.auditLog.slice(0, 100);
      await write(data);
      return record;
    },

    async listAssessments() {
      return (await read()).assessments;
    },

    async metrics() {
      const assessments = (await read()).assessments;
      const reviewQueue = assessments.filter((item) => ["executive-review", "control-owner-review"].includes(item.status));
      const criticalTier = assessments.filter((item) => item.riskTier === "critical");
      const blocked = assessments.filter((item) => item.status === "blocked");
      return {
        total: assessments.length,
        executiveReview: assessments.filter((item) => item.status === "executive-review").length,
        controlOwnerReview: assessments.filter((item) => item.status === "control-owner-review").length,
        averageRisk: assessments.length ? Math.round(assessments.reduce((sum, item) => sum + item.riskScore, 0) / assessments.length) : 0,
        mappedControls: assessments.reduce((sum, item) => sum + item.mappedControls, 0),
        reviewQueue: reviewQueue.length,
        criticalTier: criticalTier.length,
        blocked: blocked.length,
        approvalDebt: reviewQueue.reduce((sum, item) => sum + Math.max(1, item.mappedControls), 0),
        byTier: groupCount(assessments, "riskTier")
      };
    },

    async auditLog() {
      return (await read()).auditLog;
    }
  };
}

function groupCount(items, field) {
  return items.reduce((result, item) => {
    result[item[field]] = (result[item[field]] || 0) + 1;
    return result;
  }, {});
}
