import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  defaultMeeCardReportDir,
  prepareMeeCardRunReport,
  summarizeMeeCardRun,
  writeMeeCardRunReport,
} from "./meecard-auto-match-report.mjs";

test("configured report directory wins without embedding credentials", () => {
  assert.equal(defaultMeeCardReportDir({ MEECARD_AUTO_MATCH_REPORT_DIR: "/tmp/meecard-reports" }), "/tmp/meecard-reports");
  assert.match(defaultMeeCardReportDir({}), /\.cache\/bestos-meecard-auto-match\/reports$/);
});

test("prepared report carries a stable run identity", () => {
  const report = prepareMeeCardRunReport(
    { job: "meecard-auto-match", startedAt: "2026-09-02T01:02:03.000Z" },
    { runId: "run_20260902_010203", writtenAt: new Date("2026-09-02T01:03:00.000Z") },
  );
  assert.equal(report.runId, "run_20260902_010203");
  assert.equal(report.reportSchemaVersion, 1);
  assert.equal(report.writtenAt, "2026-09-02T01:03:00.000Z");
});

test("writer keeps an immutable report and an atomic latest snapshot", () => {
  const reportDir = fs.mkdtempSync(path.join(os.tmpdir(), "meecard-report-test-"));
  const result = writeMeeCardRunReport(
    { job: "meecard-auto-match", status: "warn", startedAt: "2026-09-02T01:02:03.000Z" },
    {
      reportDir,
      runId: "run_20260902_010203",
      writtenAt: new Date("2026-09-02T01:03:00.000Z"),
    },
  );
  assert.equal(path.basename(result.path), "2026-09-02T01-02-03-000Z-run_20260902_010203.json");
  assert.deepEqual(JSON.parse(fs.readFileSync(result.path, "utf8")), result.report);
  assert.deepEqual(JSON.parse(fs.readFileSync(result.latestPath, "utf8")), result.report);
  assert.equal(fs.statSync(result.path).mode & 0o777, 0o600);
  assert.throws(() => writeMeeCardRunReport(
    { job: "changed", status: "ok", startedAt: "2026-09-02T01:02:03.000Z" },
    {
      reportDir,
      runId: "run_20260902_010203",
      writtenAt: new Date("2026-09-02T01:03:00.000Z"),
    },
  ));
  assert.equal(JSON.parse(fs.readFileSync(result.path, "utf8")).job, "meecard-auto-match");
});

test("summary exposes what changed and what still needs review", () => {
  const summary = summarizeMeeCardRun({
    runId: "run_20260902_010203",
    status: "warn",
    mode: "apply",
    reconciliation: {
      yuyuteiPending: { total: 8, shadowCandidates: 3 },
      snkrdunkPending: { total: 12, exactShadowCandidates: 4 },
    },
    snkrdunkDiscovery: { unmappedAgainstMcp: 9, exactShadowCandidates: 2 },
    apply: {
      yuyutei: { approved: 3, succeeded: 2 },
      snkrdunk: { succeeded: 4 },
      pricesVerified: 4,
      preflightBlocked: 1,
      failed: 0,
    },
  });
  assert.deepEqual(summary, {
    runId: "run_20260902_010203",
    status: "warn",
    mode: "apply",
    yuyutei: { pending: 8, ready: 3, approved: 3 },
    snkrdunk: {
      pending: 12,
      readyExisting: 0,
      candidatesExisting: 4,
      discoveredUnmapped: 9,
      readyNew: 0,
      candidatesNew: 2,
      approved: 4,
      pricesVerified: 4,
    },
    blocked: 1,
    failed: 0,
  });
});
