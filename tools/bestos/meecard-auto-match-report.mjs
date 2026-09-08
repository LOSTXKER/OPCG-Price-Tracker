import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";

const REPORT_SCHEMA_VERSION = 1;

function safeTimestamp(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) throw new TypeError("report timestamp is invalid");
  return date.toISOString().replace(/[:.]/g, "-");
}

export function defaultMeeCardReportDir(env = process.env) {
  const configured = String(env.MEECARD_AUTO_MATCH_REPORT_DIR ?? "").trim();
  return configured || path.join(os.homedir(), ".cache", "bestos-meecard-auto-match", "reports");
}

export function prepareMeeCardRunReport(report, { runId = randomUUID(), writtenAt = new Date() } = {}) {
  if (!report || typeof report !== "object" || Array.isArray(report)) {
    throw new TypeError("report must be an object");
  }
  if (!/^[a-zA-Z0-9_-]{8,100}$/.test(runId)) throw new TypeError("runId is invalid");
  return {
    reportSchemaVersion: REPORT_SCHEMA_VERSION,
    runId,
    writtenAt: writtenAt.toISOString(),
    ...report,
  };
}

export function writeMeeCardRunReport(
  report,
  { env = process.env, reportDir = defaultMeeCardReportDir(env), runId, writtenAt = new Date() } = {},
) {
  const prepared = prepareMeeCardRunReport(report, { runId, writtenAt });
  fs.mkdirSync(reportDir, { recursive: true, mode: 0o700 });

  const filename = `${safeTimestamp(prepared.startedAt ?? prepared.writtenAt)}-${prepared.runId}.json`;
  const destination = path.join(reportDir, filename);
  const temporary = path.join(reportDir, `.${filename}.${process.pid}.tmp`);
  const latest = path.join(reportDir, "latest.json");
  const latestTemporary = path.join(reportDir, `.latest.${process.pid}.tmp`);
  const payload = `${JSON.stringify(prepared, null, 2)}\n`;

  fs.writeFileSync(temporary, payload, { encoding: "utf8", mode: 0o600, flag: "wx" });
  try {
    fs.linkSync(temporary, destination);
    fs.unlinkSync(temporary);
  } catch (error) {
    try { fs.unlinkSync(temporary); } catch {}
    throw error;
  }
  fs.writeFileSync(latestTemporary, payload, { encoding: "utf8", mode: 0o600 });
  fs.renameSync(latestTemporary, latest);

  return { report: prepared, path: destination, latestPath: latest };
}

export function summarizeMeeCardRun(report) {
  const yuyu = report?.reconciliation?.yuyuteiPending ?? {};
  const snkrPending = report?.reconciliation?.snkrdunkPending ?? {};
  const discovery = report?.snkrdunkDiscovery ?? {};
  const apply = report?.apply ?? {};
  return {
    runId: report?.runId ?? null,
    status: report?.status ?? "unknown",
    mode: report?.mode ?? "unknown",
    yuyutei: {
      pending: yuyu.total ?? 0,
      ready: yuyu.shadowCandidates ?? 0,
      approved:
        apply.yuyutei?.approved
        ?? apply.approved
        ?? apply.yuyutei?.succeeded
        ?? apply.yuyuteiSucceeded
        ?? 0,
    },
    snkrdunk: {
      pending: snkrPending.total ?? 0,
      readyExisting: snkrPending.approvalReady ?? 0,
      candidatesExisting: snkrPending.requiresLocaleAudit ?? snkrPending.exactShadowCandidates ?? snkrPending.shadowCandidates ?? 0,
      discoveredUnmapped: discovery.unmappedAgainstMcp ?? 0,
      readyNew: discovery.approvalReady ?? 0,
      candidatesNew: discovery.requiresLocaleAudit ?? discovery.exactShadowCandidates ?? 0,
      approved: apply.snkrdunk?.succeeded ?? apply.snkrdunkSucceeded ?? 0,
      pricesVerified: apply.pricesVerified ?? 0,
    },
    blocked: apply.preflightBlocked ?? 0,
    failed: apply.failed ?? 0,
  };
}
