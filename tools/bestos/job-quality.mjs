import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { isDeepStrictEqual } from 'node:util';
import { summarizeMeeCardRun } from './meecard-auto-match-report.mjs';
import { validateSnkrdunkDiscoveryCheckpoint } from './meecard-snkrdunk-discovery.mjs';
import { openSummary, prepareSummary } from './summary-delivery.mjs';

const JOBS = ['meecard-auto-match', 'meecard-snkrdunk-backfill'];
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const fail = message => { throw new Error(message); };
const expect = (condition, message) => { if (!condition) fail(message); };
const count = value => Number.isSafeInteger(value) && value >= 0;
const counts = (values, label) => expect(values.every(count), `${label}: จำนวนข้อมูลไม่ถูกต้อง`);
const equal = (left, right, label) => expect(isDeepStrictEqual(left, right), `${label} ไม่ตรงรายงาน`);
const sum = values => values.reduce((total, value) => total + value, 0);

export function qualityPath(env = process.env, job = env.BESTOS_JOB, runId = env.BESTOS_RUN_ID) {
  expect(env.BESTOS_BRAIN && JOBS.includes(job) && /^[\w-]{1,150}$/.test(runId ?? ''), 'ไม่มี job/runId ของรอบที่ตรวจ');
  return path.join(env.BESTOS_BRAIN, '.cache/meecard-quality', job, `${runId}.json`);
}
function readJsonFile(file, maxBytes = 32 * 1024 * 1024) {
  expect(typeof file === 'string' && path.isAbsolute(file) && file.endsWith('.json'), 'ตำแหน่งหลักฐานไม่ถูกต้อง');
  const stat = fs.lstatSync(file);
  expect(stat.isFile() && stat.size > 0 && stat.size <= maxBytes, 'หลักฐานไม่ใช่ไฟล์ปกติหรือขนาดเกินเพดาน');
  const raw = fs.readFileSync(file);
  return { data: JSON.parse(raw), sha256: hash(raw), mtimeMs: stat.mtimeMs };
}
function persist(proof, env) {
  const file = qualityPath(env);
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  fs.writeFileSync(file, JSON.stringify(proof) + '\n', { flag: 'wx', mode: 0o600 });
}
function checkReasons(reasons, total, label) {
  expect(reasons && typeof reasons === 'object' && !Array.isArray(reasons), `${label}: ไม่มีการแจกแจงเหตุผล`);
  counts(Object.values(reasons), label);
  equal(sum(Object.values(reasons)), total, `${label}: ยอดรวมเหตุผล`);
}

function checkAuto(report) {
  expect(report.reportSchemaVersion === 1 && report.mode === 'dry-run' && ['ok', 'warn'].includes(report.status), 'รายงานจับคู่ไม่ได้ตรวจอย่างเดียวหรือรันล้ม');
  expect(report.safeguards?.defaultReadOnly === true && report.safeguards?.snkrdunkShadowOnly === true && report.safeguards?.snkrdunkMutationAvailable === false, 'รายงานไม่มีขอบเขตอ่านอย่างเดียว');
  expect(report.apply?.enabled === false && Array.isArray(report.apply?.results) && report.apply.results.length === 0, 'รอบนี้มีการเปิดเขียนข้อมูล');
  for (const key of ['selected', 'attempted', 'approved', 'succeeded', 'failed', 'ambiguous', 'journalIntents', 'journalOutcomes', 'journalFailures']) equal(report.apply[key], 0, `apply.${key}`);
  const rec = report.reconciliation, fetched = report.fetched;
  expect(rec?.snapshotTiming === 'before-apply', 'ไม่มีเวลาของข้อมูลที่ใช้จับคู่');
  for (const [provider, title] of [['yuyutei', 'yuyutei'], ['snkrdunk', 'snkrdunk']]) {
    const pending = rec[`${title}Pending`], matched = rec[`${title}Matched`];
    counts([fetched?.[provider]?.pending, fetched?.[provider]?.matched, pending?.total, matched?.total], provider);
    equal(pending.total, fetched[provider].pending, `${provider}: pending`);
    equal(matched.total, fetched[provider].matched, `${provider}: matched`);
    checkReasons(pending.reasons, pending.total, `${provider}: pending`);
    counts([matched.structuralAudit?.checked, matched.structuralAudit?.violations], `${provider}: structural audit`);
    equal(matched.structuralAudit.checked, matched.total, `${provider}: checked`);
    expect(matched.structuralAudit.violations <= matched.total, `${provider}: ผลตรวจเกินจำนวนรายการ`);
  }
  const yuyu = rec.yuyuteiPending, snkr = rec.snkrdunkPending, discovery = report.snkrdunkDiscovery;
  counts([yuyu.shadowCandidates, snkr.exactShadowCandidates, snkr.approvalReady, snkr.requiresLocaleAudit], 'candidates');
  expect(Array.isArray(yuyu.shadowPlan) && yuyu.shadowPlan.length === yuyu.shadowCandidates && yuyu.shadowCandidates <= yuyu.total, 'Yuyutei: จำนวนแผนไม่ตรง');
  expect(Array.isArray(snkr.plan) && snkr.plan.length === snkr.exactShadowCandidates && snkr.exactShadowCandidates <= snkr.total, 'SNKRDUNK: จำนวนแผนไม่ตรง');
  equal(snkr.approvalReady, 0, 'SNKRDUNK: approvalReady');
  equal(snkr.requiresLocaleAudit, snkr.exactShadowCandidates, 'SNKRDUNK: locale audit');
  counts([fetched.snkrdunk.catalogCards, fetched.snkrdunk.catalogSets, fetched.snkrdunk.catalogTotalSnapshot], 'catalog');
  equal(fetched.snkrdunk.catalogCards, fetched.snkrdunk.catalogTotalSnapshot, 'catalog: จำนวนการ์ด');
  counts([fetched.images?.requested, fetched.images?.loaded, fetched.images?.placeholders, fetched.images?.errors], 'images');
  expect(fetched.images.deadlineExceeded === false, 'อ่านภาพเกินเวลาของงาน');
  equal(fetched.images.loaded + fetched.images.placeholders + fetched.images.errors, fetched.images.requested, 'images: ยอดรวม');
  expect(discovery?.status === 'ok', 'อ่านรายการใหม่ SNKRDUNK ไม่สำเร็จ');
  counts([discovery.scanned, discovery.unmappedAgainstMcp, discovery.exactShadowCandidates, discovery.approvalReady, discovery.requiresLocaleAudit], 'discovery');
  expect(discovery.unmappedAgainstMcp <= discovery.scanned && discovery.exactShadowCandidates <= discovery.unmappedAgainstMcp, 'discovery: ยอดรวมขัดแย้ง');
  checkReasons(discovery.reasons, discovery.unmappedAgainstMcp, 'discovery');
  expect(Array.isArray(discovery.plan) && discovery.plan.length === discovery.exactShadowCandidates, 'discovery: แผนไม่ครบ');
  equal(discovery.approvalReady, 0, 'discovery: approvalReady');
  equal(discovery.requiresLocaleAudit, discovery.exactShadowCandidates, 'discovery: locale audit');
  equal(discovery.priceLookup?.attempted, discovery.exactShadowCandidates, 'discovery: lookup attempted');
  equal(discovery.priceLookup?.succeeded, discovery.exactShadowCandidates, 'discovery: lookup succeeded');
  equal(discovery.priceLookup?.failed, 0, 'discovery: lookup failed');
  const summary = summarizeMeeCardRun(report);
  return { summary, snapshot: { status: report.status, mode: report.mode, summary, fetched, discovery: { status: discovery.status, scanned: discovery.scanned, stats: discovery.stats }, structuralViolations: { yuyutei: rec.yuyuteiMatched.structuralAudit.violations, snkrdunk: rec.snkrdunkMatched.structuralAudit.violations } } };
}

function checkBackfill(report) {
  expect(report.mode === 'read-only' && ['partial', 'complete', 'blocked', 'tail-refresh'].includes(report.status), 'รายงาน backfill ไม่ใช่งานอ่านหรือสถานะไม่ถูกต้อง');
  const source = report.source, c = report.counts;
  counts([source?.pageStart, source?.pageEnd, source?.stats?.pagesFetched, c?.total, c?.known, c?.unmapped], 'backfill');
  expect(source.pageStart > 0 && source.pageEnd >= source.pageStart, 'ช่วงหน้าที่อ่านไม่ถูกต้อง');
  const pageCount = source.pageEnd - source.pageStart + 1;
  expect(pageCount <= 25, 'จำนวนหน้าที่อ่านเกินขอบเขต');
  const pages = Array.from({ length: pageCount }, (_, i) => source.pageStart + i);
  equal(source.pagesRequested, pages, 'หน้าที่อ่าน');
  equal(source.stats.pagesFetched, pages.length, 'จำนวนหน้าที่อ่าน');
  equal(source.stats.startPage, source.pageStart, 'หน้าแรก');
  equal(source.stats.lastPageFetched, source.pageEnd, 'หน้าสุดท้าย');
  const listings = report.listings;
  expect(Array.isArray(listings) && listings.length === c.total, 'จำนวนรายการไม่ตรงรายงาน');
  const ids = listings.map(row => row.snkrdunkId);
  expect(ids.every(id => Number.isSafeInteger(id) && id > 0) && new Set(ids).size === ids.length, 'source ID ไม่ถูกต้องหรือซ้ำ');
  expect(listings.every(row => typeof row.known === 'boolean' && row.unmapped === !row.known && typeof row.reason === 'string'), 'สถานะรายการไม่ครบ');
  equal(listings.filter(row => row.known).length, c.known, 'รายการที่รู้จัก');
  equal(c.known + c.unmapped, c.total, 'ยอดรวมรายการ');
  const reasons = {}; for (const row of listings) reasons[row.reason] = (reasons[row.reason] ?? 0) + 1;
  equal(reasons, c.reasons, 'เหตุผลของรายการ');
  const statuses = report.mcp?.statuses;
  expect(statuses && ['pending', 'matched', 'rejected', 'skipped'].every(key => count(statuses[key])), 'อ่านสถานะ mapping ไม่ครบ');
  counts([report.mcp.knownSourceIds], 'mapping');
  expect(report.mcp.knownSourceIds <= sum(Object.values(statuses)) && report.mcp.knownSourceIds >= c.known, 'mapping: จำนวน ID ขัดแย้ง');
  expect(report.checkpointBefore?.job === report.job && report.checkpointAfter?.job === report.job && report.checkpointBefore.schemaVersion === 1 && report.checkpointAfter.schemaVersion === 1, 'ไม่มี checkpoint ที่ตรงงาน');
  const before = report.checkpointBefore, after = report.checkpointAfter;
  const beforeDiscovery = validateSnkrdunkDiscoveryCheckpoint(before.discovery), afterDiscovery = validateSnkrdunkDiscoveryCheckpoint(after.discovery);
  counts([before.pagesProcessed, after.pagesProcessed], 'checkpoint');
  if (report.status === 'tail-refresh') {
    expect(beforeDiscovery.complete || beforeDiscovery.blockedReason, 'tail refresh ไม่มี checkpoint ประวัติที่หยุดแล้ว');
    equal(after, before, 'tail refresh: checkpoint ต้องคงเดิม');
    equal(source.pageStart, 1, 'tail refresh: หน้าแรก');
    equal(report.reason, beforeDiscovery.complete ? 'checkpoint_complete_tail_refresh' : 'checkpoint_blocked_tail_refresh', 'tail refresh: เหตุผล');
  } else {
    expect(!beforeDiscovery.complete && beforeDiscovery.blockedReason === null, 'checkpoint ต้นทางหยุดแล้ว');
    equal(source.pageStart, beforeDiscovery.nextPage, 'checkpoint: หน้าที่อ่านต่อ');
    equal(report.status, afterDiscovery.complete ? 'complete' : afterDiscovery.blockedReason ? 'blocked' : 'partial', 'checkpoint: สถานะ');
    if (report.status === 'partial') equal(afterDiscovery.nextPage, source.pageEnd + 1, 'checkpoint: หน้าถัดไป');
    if (report.status === 'blocked') equal(source.pageEnd, 100, 'checkpoint: เพดานหน้า');
    equal(after.pagesProcessed, before.pagesProcessed + pages.length, 'checkpoint: จำนวนหน้าที่สะสม');
    for (const [key, value] of Object.entries({ lastRunId: report.runId, lastReportPath: report.reportPath, lastPageStart: source.pageStart, lastPageEnd: source.pageEnd, updatedAt: report.finishedAt })) equal(after[key], value, `checkpoint: ${key}`);
    const expectedIds = [...beforeDiscovery.seenSnkrdunkIds, ...ids].sort((a, b) => a - b);
    equal([...afterDiscovery.seenSnkrdunkIds].sort((a, b) => a - b), expectedIds, 'checkpoint: รายการที่อ่านสะสม');
  }
  const summary = { status: report.status, counts: c, pageStart: source.pageStart, pageEnd: source.pageEnd, checkpointAdvanced: report.status !== 'tail-refresh' };
  return { summary, snapshot: { status: report.status, mode: report.mode, counts: c, source: { pagesRequested: pages, stats: source.stats }, mcp: report.mcp, historicalCheckpoint: { complete: report.checkpointAfter.discovery?.complete, blockedReason: report.checkpointAfter.discovery?.blockedReason ?? null } } };
}

export function validateObservation(job, observation) {
  const saved = readJsonFile(observation?.report?.path);
  equal(saved.sha256, observation.report.sha256, 'hash รายงาน');
  const report = saved.data;
  expect(report.schemaVersion === 1 && report.job === job && /^[\w-]{8,100}$/.test(report.runId ?? ''), 'schema/job/runId ของรายงานไม่ถูกต้อง');
  const start = Date.parse(observation.startedAt), end = Date.parse(observation.finishedAt), reportStart = Date.parse(report.startedAt), reportEnd = Date.parse(report.finishedAt);
  expect([start, end, reportStart, reportEnd].every(Number.isFinite) && end >= start && end - start <= 26 * 60_000, 'ช่วงเวลารันงานไม่ถูกต้อง');
  expect(reportStart >= start - 2000 && reportEnd >= reportStart && reportEnd <= end + 2000 && saved.mtimeMs >= start - 2000 && saved.mtimeMs <= end + 2000, 'รายงานเก่าหรือไม่ได้สร้างภายในรอบที่เรียก');
  if (report.reportPath) equal(report.reportPath, observation.report.path, 'ตำแหน่งรายงาน');
  const checked = job === JOBS[0] ? checkAuto(report) : checkBackfill(report);
  const output = observation.producerSummary;
  expect(output?.ok === true, 'ตัวผลิตไม่ได้ยืนยันว่ารันสำเร็จ');
  for (const [key, value] of Object.entries(checked.summary)) equal(output[key], value, `สรุป ${key}`);
  equal(output.reportPath, observation.report.path, 'ตำแหน่งในสรุป');
  return { ...checked, producerRunId: report.runId, startedAt: report.startedAt, finishedAt: report.finishedAt, reportSha256: saved.sha256 };
}

// Old immutable proofs retain their exact text contract during delivery recovery.
function legacyPresentation(job, j) {
  if (job === JOBS[0]) return {
    key: JSON.stringify([j.yuyutei.pending, j.yuyutei.ready, j.snkrdunk.pending, j.snkrdunk.readyExisting, j.snkrdunk.discoveredUnmapped, j.snkrdunk.readyNew, j.blocked]),
    text: [`🃏 MeeCard จับคู่การ์ด (ตรวจอย่างเดียว · ${j.mode})`, `Yuyutei: รอตรวจ ${j.yuyutei.pending} · พร้อมอนุมัติ ${j.yuyutei.ready}`, `SNKRDUNK: รอตรวจ ${j.snkrdunk.pending} · พร้อมอนุมัติ ${j.snkrdunk.readyExisting} · เจอใหม่ยังไม่มีในระบบ ${j.snkrdunk.discoveredUnmapped} (พร้อมอนุมัติ ${j.snkrdunk.readyNew})`, j.blocked ? `⛔ ติดด่านก่อนอนุมัติ ${j.blocked}` : null, `รายงานเต็ม: ${j.reportPath}`].filter(Boolean).join('\n'),
  };
  return { key: JSON.stringify({ counts: j.counts, pageEnd: j.pageEnd, status: j.status }), text: `🃏 MeeCard ไล่รายการ SNKRDUNK หน้า ${j.pageStart}–${j.pageEnd} (${j.status})\n${Object.entries(j.counts).filter(([key]) => key !== 'reasons').map(([key, value]) => `• ${key}: ${value}`).join('\n')}\nรายงานเต็ม: ${j.reportPath}` };
}
const thaiTime = value => new Intl.DateTimeFormat('th-TH', { timeZone: 'Asia/Bangkok', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
function replayHeading(proof, finishedAt) {
  return proof.presentationVersion === 2 ? `♻️ ส่งสรุปที่ตรวจไว้แล้วอีกครั้ง · ข้อมูล ณ ${thaiTime(finishedAt)} น. (เวลาไทย)`
    : `♻️ สรุปเดิมจากรอบ ${proof.origin.runId} · อ่านข้อมูลเมื่อ ${finishedAt}`;
}
function presentation(job, j, version = 2) {
  const old = legacyPresentation(job, j);
  if (version !== 2) return old;
  if (job === JOBS[0]) return { key: old.key, text: [
    '🃏 ผลตรวจการจับคู่การ์ด MeeCard',
    `Yuyutei: รอตรวจ ${j.yuyutei.pending} รายการ · พร้อมอนุมัติ ${j.yuyutei.ready} รายการ`,
    `SNKRDUNK: รอตรวจ ${j.snkrdunk.pending} รายการ · พร้อมอนุมัติ ${j.snkrdunk.readyExisting} รายการ`,
    `พบการ์ดใหม่ที่ยังไม่มีในระบบ ${j.snkrdunk.discoveredUnmapped} รายการ · พร้อมอนุมัติ ${j.snkrdunk.readyNew} รายการ`,
    j.blocked ? `ยังติดเงื่อนไขก่อนอนุมัติ ${j.blocked} รายการ` : null,
    'รอบนี้ตรวจอย่างเดียว ยังไม่ได้เปลี่ยนการจับคู่',
  ].filter(Boolean).join('\n') };
  const status = { partial: 'ยังอ่านรายการย้อนหลังไม่ครบ', complete: 'อ่านรายการย้อนหลังครบแล้ว', blocked: 'การอ่านรายการย้อนหลังยังติดข้อจำกัด', 'tail-refresh': 'ตรวจรายการล่าสุดอีกครั้ง ไม่ใช่การยืนยันว่าอ่านย้อนหลังครบ' }[j.status];
  return { key: old.key, text: [
    `🃏 ผลตรวจรายการ SNKRDUNK หน้า ${j.pageStart}–${j.pageEnd}`,
    `อ่านทั้งหมด ${j.counts.total} รายการ · มีในระบบแล้ว ${j.counts.known} รายการ · ยังไม่มีในระบบ ${j.counts.unmapped} รายการ`,
    status, 'รอบนี้อ่านข้อมูลอย่างเดียว ยังไม่ได้เพิ่มการ์ดหรือเปลี่ยนการจับคู่',
  ].join('\n') };
}
function readReceipt(env, job, runId) {
  const dir = path.join(env.BESTOS_BRAIN, 'records/_receipts', job);
  const files = fs.readdirSync(dir).filter(file => file.endsWith(`-${runId}.json`));
  expect(files.length === 1, 'ไม่มีใบเสร็จต้นทางที่ระบุรอบได้แน่นอน');
  const receipt = readJsonFile(path.join(dir, files[0]), 128 * 1024).data;
  expect(receipt.job === job && receipt.run_id === runId && receipt.state === 'failed' && receipt.delivered !== true && receipt.delivery_status === 'pending', 'รอบต้นทางยังส่งไม่ชัดหรือไม่ใช่การล้มก่อนส่ง');
}
function replaySource(proof, env) {
  const ref = proof.replay;
  expect(ref?.job === proof.job, 'replay เป็นคนละงาน');
  const saved = readJsonFile(qualityPath(env, ref.job, ref.runId), 128 * 1024);
  equal(saved.sha256, ref.sha256, 'hash หลักฐานต้นทาง replay');
  expect(saved.data.job === ref.job && saved.data.runId === ref.runId && ['current', 'replay'].includes(saved.data.kind), 'ไม่มีผลอ่านต้นทางที่ใช้ replay ได้');
  readReceipt(env, ref.job, ref.runId);
  equal(saved.data.observation, proof.observation, 'ข้อมูลต้นทาง replay');
  equal(saved.data.origin ?? { job: ref.job, runId: ref.runId }, proof.origin, 'ที่มาของ replay');
}

export function verifyJobQuality(stdout, env = process.env, now = Date.now()) {
  try {
    const file = qualityPath(env), saved = readJsonFile(file, 128 * 1024), proof = saved.data;
    expect(proof.version === 1 && proof.job === env.BESTOS_JOB && proof.runId === env.BESTOS_RUN_ID, 'หลักฐานเป็นคนละ job/runId');
    expect(['current', 'replay'].includes(proof.kind), proof.error ?? 'ไม่มีรายงานจากการรันสำเร็จ');
    const age = now - Date.parse(proof.createdAt);
    expect(Number.isFinite(age) && age >= -2000 && age <= 5 * 60_000, 'หลักฐานรอบนี้เก่าหรือเวลาไม่ถูกต้อง');
    equal(hash(String(stdout).trim()), proof.output?.sha256, 'hash ข้อความที่ตัวรันได้รับ');
    equal(String(stdout).trim(), proof.output?.text, 'ข้อความที่ตัวรันได้รับ');
    const checked = validateObservation(proof.job, proof.observation);
    expect(proof.presentationVersion == null || proof.presentationVersion === 2, 'รูปแบบสรุปไม่ถูกต้อง');
    const view = presentation(proof.job, proof.observation.producerSummary, proof.presentationVersion ?? 1);
    equal(proof.key, view.key, 'key ของสรุป');
    let expectedText = view.text;
    if (proof.kind === 'replay') {
      replaySource(proof, env);
      expectedText = `${replayHeading(proof, checked.finishedAt)}\n${view.text}`;
      expect(proof.output.mode === 'summary', 'replay ต้องแสดงที่มาของสรุป');
    } else if (proof.output.mode === 'quiet') {
      expect((proof.quiet?.reason === 'unchanged' && proof.quiet.previousKey === view.key) || (proof.quiet?.reason === 'empty' && proof.job === JOBS[1] && checked.summary.counts.total === 0 && checked.summary.status !== 'blocked'), 'ความเงียบไม่มีผลอ่านใหม่รองรับ');
      expectedText = '';
    } else expect(proof.output.mode === 'summary', 'ชนิดข้อความไม่ถูกต้อง');
    equal(proof.output.text, expectedText, 'ข้อความสรุป');
    return { pass: true, reason: proof.kind === 'replay' ? `ตรวจสรุปรอบเดิม ${proof.origin.runId} จากหลักฐานเดิมแล้ว ไม่ได้อ่านข้อมูลใหม่` : 'ตรวจรายงานจริงของรอบนี้ โหมดอ่านอย่างเดียว จำนวนข้อมูลและสรุปตรงกัน', evidence: { job: proof.job, runId: proof.runId, currentRead: proof.kind === 'current', replay: proof.origin ?? null, proofSha256: saved.sha256, reportSha256: checked.reportSha256, producerRunId: checked.producerRunId, readStartedAt: checked.startedAt, readFinishedAt: checked.finishedAt, outputMode: proof.output.mode, snapshot: checked.snapshot } };
  } catch (error) { return { pass: false, reason: String(error.message ?? error).slice(0, 300) }; }
}

export function runBusinessWrapper({ job, producer, stateFile, argv = process.argv.slice(2), env = process.env }) {
  const managed = Boolean(env.BESTOS_JOB || env.BESTOS_RUN_ID);
  const base = { version: 1, presentationVersion: 2, job, runId: env.BESTOS_RUN_ID, createdAt: new Date().toISOString() };
  try {
    if (managed) { expect(env.BESTOS_JOB === job, 'ตัวห่อเป็นคนละงานกับตัวรัน'); qualityPath(env); }
    const delivery = openSummary(stateFile, env);
    let proof, view;
    if (delivery.replay) {
      const pending = delivery.replay, source = readJsonFile(qualityPath(env, pending.job, pending.runId), 128 * 1024);
      expect(source.data.output?.text === pending.text && source.data.key === pending.key, 'สรุปรอส่งไม่ตรงหลักฐานต้นทาง');
      const checked = validateObservation(job, source.data.observation);
      view = presentation(job, source.data.observation.producerSummary);
      const origin = source.data.origin ?? { job: pending.job, runId: pending.runId };
      const text = `${replayHeading({ ...base, origin }, checked.finishedAt)}\n${view.text}`;
      proof = { ...base, kind: 'replay', origin, replay: { job: pending.job, runId: pending.runId, sha256: source.sha256 }, observation: source.data.observation, key: view.key, output: { mode: 'summary', text, sha256: hash(text) } };
      replaySource(proof, env);
    } else {
      const startedAt = new Date().toISOString();
      const result = spawnSync(process.execPath, [producer, ...argv.filter(arg => arg !== '--always')], { encoding: 'utf8', timeout: 25 * 60_000, maxBuffer: 32 * 1024 * 1024, env });
      const finishedAt = new Date().toISOString();
      expect(result.status === 0 && !result.error, `ตัวผลิตรายงานล้ม (exit=${result.status}, signal=${result.signal ?? '-'})`);
      const j = JSON.parse((result.stdout ?? '').trim().split('\n').filter(Boolean).at(-1) ?? 'null');
      const saved = readJsonFile(j?.reportPath);
      const observation = { startedAt, finishedAt, report: { path: j.reportPath, sha256: saved.sha256 }, producerSummary: j };
      validateObservation(job, observation);
      view = presentation(job, j);
      const previousKey = delivery.state.delivery_confirmed === true ? delivery.state.key : null;
      const empty = job === JOBS[1] && j.counts.total === 0 && j.status !== 'blocked';
      const unchanged = previousKey === view.key && !(job === JOBS[0] && argv.includes('--always')) && !(job === JOBS[1] && j.status === 'blocked');
      const quiet = empty ? { reason: 'empty' } : unchanged ? { reason: 'unchanged', previousKey } : null;
      const text = quiet ? '' : view.text;
      proof = { ...base, createdAt: new Date().toISOString(), kind: 'current', observation, key: view.key, quiet, output: { mode: quiet ? 'quiet' : 'summary', text, sha256: hash(text) } };
    }
    if (managed) persist(proof, env);
    if (proof.output.text) console.log(prepareSummary(stateFile, delivery.state, view.key, proof.output.text, env));
  } catch (error) {
    if (managed) { try { persist({ ...base, kind: 'failed', error: String(error.message).slice(0, 300) }, env); } catch { /* Existing evidence stays immutable. */ } }
    console.error(`⚠️ MeeCard ยังไม่ผ่านการตรวจคุณภาพ: ${String(error.message).slice(0, 300)}`);
    process.exitCode = 1;
  }
}
