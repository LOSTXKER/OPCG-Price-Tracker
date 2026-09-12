import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { summarizeMeeCardRun } from './meecard-auto-match-report.mjs';

export const qualityCases = [
  { job: 'meecard-auto-match', wrapper: 'run-auto-match.mjs', producer: 'meecard-auto-match-supervisor.mjs', key: JSON.stringify([2, 1, 3, 0, 1, 0, 0]) },
  { job: 'meecard-snkrdunk-backfill', wrapper: 'run-backfill.mjs', producer: 'meecard-snkrdunk-backfill.mjs', key: JSON.stringify({ counts: { total: 1, known: 0, unmapped: 1, reasons: { requires_exact_variant_review: 1 } }, pageEnd: 1, status: 'partial' }) },
];
export function makeQualityReport(job, { runId, reportPath, at = new Date().toISOString() }) {
  const base = { schemaVersion: 1, job, runId, startedAt: at, finishedAt: at };
  if (job === 'meecard-snkrdunk-backfill') return { ...base, mode: 'read-only', status: 'partial', reportPath,
    source: { pageStart: 1, pageEnd: 1, pagesRequested: [1], stats: { pagesFetched: 1, startPage: 1, lastPageFetched: 1 } },
    mcp: { statuses: { pending: 0, matched: 0, rejected: 0, skipped: 0 }, knownSourceIds: 0 },
    counts: { total: 1, known: 0, unmapped: 1, reasons: { requires_exact_variant_review: 1 } },
    listings: [{ snkrdunkId: 123, known: false, unmapped: true, reason: 'requires_exact_variant_review' }],
    checkpointBefore: { schemaVersion: 1, job, pagesProcessed: 0, discovery: { schemaVersion: 1, source: 'SNKRDUNK', complete: false, nextPage: 1, blockedReason: null, seenSnkrdunkIds: [] } },
    checkpointAfter: { schemaVersion: 1, job, pagesProcessed: 1, updatedAt: at, lastRunId: runId, lastReportPath: reportPath, lastPageStart: 1, lastPageEnd: 1, discovery: { schemaVersion: 1, source: 'SNKRDUNK', complete: false, nextPage: 2, blockedReason: null, seenSnkrdunkIds: [123] } },
  };
  return { ...base, reportSchemaVersion: 1, writtenAt: at, mode: 'dry-run', status: 'warn',
    safeguards: { defaultReadOnly: true, snkrdunkShadowOnly: true, snkrdunkMutationAvailable: false },
    fetched: { yuyutei: { pending: 2, matched: 0 }, snkrdunk: { pending: 3, matched: 0, catalogCards: 1, catalogSets: 1, catalogTotalSnapshot: 1 }, images: { requested: 1, loaded: 1, placeholders: 0, errors: 0, deadlineExceeded: false } },
    reconciliation: { snapshotTiming: 'before-apply', yuyuteiPending: { total: 2, shadowCandidates: 1, shadowPlan: [{}], reasons: { candidate: 1, review: 1 } }, snkrdunkPending: { total: 3, exactShadowCandidates: 1, approvalReady: 0, requiresLocaleAudit: 1, plan: [{}], reasons: { candidate: 1, review: 2 } }, yuyuteiMatched: { total: 0, structuralAudit: { checked: 0, violations: 0 } }, snkrdunkMatched: { total: 0, structuralAudit: { checked: 0, violations: 0 } } },
    snkrdunkDiscovery: { status: 'ok', scanned: 1, unmappedAgainstMcp: 1, exactShadowCandidates: 0, approvalReady: 0, requiresLocaleAudit: 0, reasons: { review: 1 }, plan: [], priceLookup: { attempted: 0, succeeded: 0, failed: 0 }, stats: { pagesFetched: 1 } },
    apply: { enabled: false, selected: 0, attempted: 0, approved: 0, succeeded: 0, failed: 0, ambiguous: 0, journalIntents: 0, journalOutcomes: 0, journalFailures: 0, results: [], preflightBlocked: 0, pricesVerified: 0 },
  };
}
export function fixtureProducer(job, root, runId) {
  fs.appendFileSync(path.join(root, 'calls'), 'run\n');
  const behaviorFile = path.join(root, 'behavior.json');
  const behavior = fs.existsSync(behaviorFile) ? JSON.parse(fs.readFileSync(behaviorFile, 'utf8')) : {};
  if (behavior.failure) { process.exitCode = 1; console.log(JSON.stringify({ ok: true })); return; }
  const reportPath = path.join(root, 'reports', `${runId}.json`);
  const report = makeQualityReport(job, { reportPath, runId: `producer_${runId}`, ...(behavior.stale ? { at: '2020-01-01T00:00:00.000Z' } : {}) });
  if (behavior.empty && job === 'meecard-snkrdunk-backfill') { report.listings = []; report.counts = { total: 0, known: 0, unmapped: 0, reasons: {} }; report.checkpointAfter.discovery.seenSnkrdunkIds = []; }
  if (behavior.status === 'complete') { report.status = 'complete'; report.checkpointAfter.discovery.complete = true; report.checkpointAfter.discovery.nextPage = null; }
  if (behavior.status === 'blocked') {
    report.status = 'blocked'; report.source = { pageStart: 100, pageEnd: 100, pagesRequested: [100], stats: { pagesFetched: 1, startPage: 100, lastPageFetched: 100 } };
    report.checkpointBefore.discovery.nextPage = 100;
    Object.assign(report.checkpointAfter, { lastPageStart: 100, lastPageEnd: 100 });
    Object.assign(report.checkpointAfter.discovery, { nextPage: null, blockedReason: 'hard-page-cap' });
  }
  if (behavior.status === 'tail-refresh') {
    report.status = 'tail-refresh'; report.reason = 'checkpoint_complete_tail_refresh';
    Object.assign(report.checkpointBefore.discovery, { complete: true, nextPage: null });
    report.checkpointAfter = structuredClone(report.checkpointBefore);
  }
  if (behavior.badCheckpoint === 'complete') report.status = 'complete';
  if (behavior.badCheckpoint === 'no-advance') report.checkpointAfter = structuredClone(report.checkpointBefore);
  if (behavior.badCheckpoint === 'another-run') report.checkpointAfter.lastRunId = 'another-run';
  if (behavior.badCounts) { if (job === 'meecard-auto-match') report.fetched.yuyutei.pending++; else report.counts.total++; }
  if (behavior.badSource) { if (job === 'meecard-auto-match') report.snkrdunkDiscovery.status = 'failed'; else delete report.mcp.statuses.skipped; }
  if (behavior.mutation) { if (job === 'meecard-auto-match') report.apply.enabled = true; else report.mode = 'apply'; }
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  if (!behavior.missing) fs.writeFileSync(reportPath, JSON.stringify(report));
  const summary = job === 'meecard-auto-match' ? { ok: true, ...summarizeMeeCardRun(report), reportPath } : { ok: true, status: report.status, counts: report.counts, pageStart: report.source.pageStart, pageEnd: report.source.pageEnd, checkpointAdvanced: report.status !== 'tail-refresh', reportPath };
  if (behavior.mismatch) { if (job === 'meecard-auto-match') summary.yuyutei.pending++; else summary.pageEnd++; }
  console.log(JSON.stringify(summary));
}
export function qualityFixture(t, c) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'meecard-quality-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const state = path.join(root, 'state.json');
  const source = fs.readFileSync(path.join(import.meta.dirname, c.wrapper), 'utf8').replace(/^const STATE = .+;$/m, `const STATE = ${JSON.stringify(state)};`);
  fs.writeFileSync(path.join(root, c.wrapper), source);
  for (const helper of ['summary-delivery.mjs', 'job-quality.mjs', 'verify-job-quality.mjs', 'meecard-auto-match-report.mjs', 'meecard-snkrdunk-discovery.mjs']) fs.copyFileSync(path.join(import.meta.dirname, helper), path.join(root, helper));
  fs.writeFileSync(path.join(root, c.producer), `import {fixtureProducer} from ${JSON.stringify(import.meta.url)};fixtureProducer(${JSON.stringify(c.job)},${JSON.stringify(root)},process.env.BESTOS_RUN_ID||'direct_fixture');`);
  const envFor = (runId = 'fixture-1', managed = true) => ({ ...process.env, BESTOS_BRAIN: root, BESTOS_JOB: managed ? c.job : '', BESTOS_RUN_ID: managed ? runId : '' });
  const receipt = (text, overrides = {}, runId = 'fixture-1') => {
    const dir = path.join(root, 'records/_receipts', c.job); fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `2026-09-12-${runId}.json`), JSON.stringify({ job: c.job, run_id: runId, state: 'completed', delivered: true, delivery_status: 'delivered', message_id: '456', output: { sha256: crypto.createHash('sha256').update(text.trim() + '\n').digest('hex') }, ...overrides }));
  };
  return { root, state, receipt, envFor,
    run: (runId = 'fixture-1', managed = true) => spawnSync(process.execPath, [path.join(root, c.wrapper)], { encoding: 'utf8', env: envFor(runId, managed) }),
    verify: (text, runId = 'fixture-1') => { const r = spawnSync(process.execPath, [path.join(root, 'verify-job-quality.mjs')], { input: text, encoding: 'utf8', env: envFor(runId) }); if (r.status !== 0) throw Error(r.stderr); return JSON.parse(r.stdout); },
    calls: () => fs.readFileSync(path.join(root, 'calls'), 'utf8'),
    read: () => JSON.parse(fs.readFileSync(state, 'utf8')),
    proof: (runId = 'fixture-1') => path.join(root, '.cache/meecard-quality', c.job, `${runId}.json`),
    behavior: value => fs.writeFileSync(path.join(root, 'behavior.json'), JSON.stringify(value)),
  };
}
