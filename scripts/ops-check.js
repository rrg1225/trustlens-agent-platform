import { readFileSync } from "node:fs";

const checks = [
  {
    name: "request correlation",
    ok: readFileSync("server/runtime.js", "utf8").includes("x-request-id")
  },
  {
    name: "security headers",
    ok: readFileSync("server/runtime.js", "utf8").includes("content-security-policy")
  },
  {
    name: "guardrail classifier",
    ok: readFileSync("server/agent/policies.js", "utf8").includes("classifyIntake")
  },
  {
    name: "draft-only tool writes",
    ok: readFileSync("server/agent/tools.js", "utf8").includes("externalWritePerformed: false")
  },
  {
    name: "scenario evals",
    ok: readFileSync("package.json", "utf8").includes("\"eval\"")
  }
];

const failed = checks.filter((check) => !check.ok);
if (failed.length) {
  console.error(failed.map((check) => `[ops] failed: ${check.name}`).join("\n"));
  process.exit(1);
}

console.log(`[ops] ${checks.length} operational checks passed`);
