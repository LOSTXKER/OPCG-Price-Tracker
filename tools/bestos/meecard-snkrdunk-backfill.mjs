#!/usr/bin/env node
// SNKRDUNK backfill inventory for MeeCard — read-only by construction.
// It discovers one bounded page window, compares every source ID with all MCP
// mapping statuses, persists an immutable report, then advances its checkpoint.

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

import { McpClient, DEFAULT_MCP_URL } from "./meecard-auto-match-supervisor.mjs";
import {
  SNKRDUNK_CHECKPOINT_SCHEMA_VERSION,
  discoverSnkrdunkOnePieceCards,
  validateSnkrdunkDiscoveryCheckpoint,
} from "./meecard-snkrdunk-discovery.mjs";

export const BACKFILL_JOB = "meecard-snkrdunk-backfill";
export const BACKFILL_CHECKPOINT_SCHEMA_VERSION = 1;
export const BACKFILL_REPORT_SCHEMA_VERSION = 1;
export const DEFAULT_BATCH_PAGES = 5;
export const MAX_BATCH_PAGES = 25;

const MCP_STATUSES = ["pending", "matched", "rejected", "skipped"];
const MAX_CHECKPOINT_BYTES = 2 * 1024 * 1024;
const PRIVATE_DIR_MODE = 0o700;
const PRIVATE_FILE_MODE = 0o600;

export class BackfillUsageError extends Error {
  constructor(message) {
    super(message);
    this.name = "BackfillUsageError";
  }
}

function positiveInteger(value, label, max = Number.MAX_SAFE_INTEGER) {
  const parsed = typeof value === "number" ? value : Number(String(value ?? "").trim());
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > max) {
    throw new BackfillUsageError(`${label} ต้องเป็นจำนวนเต็ม 1-${max}`);
  }
  return parsed;
}

function parseValueOption(argv, index, name) {
  const current = argv[index];
  if (current === name) {
    if (index + 1 >= argv.length) throw new BackfillUsageError(`${name} ต้องมีค่า`);
    return { value: argv[index + 1], consumed: 2 };
  }
  if (current.startsWith(`${name}=`)) {
    const value = current.slice(name.length + 1);
    if (!value) throw new BackfillUsageError(`${name} ต้องมีค่า`);
    return { value, consumed: 1 };
  }
  return null;
}

export function defaultBackfillPaths(homeDir = os.homedir()) {
  return {
    checkpointPath: path.join(
      homeDir,
      ".cache",
      "bestos-meecard-auto-match",
      "snkrdunk-backfill-checkpoint.json",
    ),
    reportDir: path.join(
      homeDir,
      ".local",
      "state",
      "bestos",
      "meecard-auto-match",
      "snkrdunk-backfill-runs",
    ),
  };
}

export function parseBackfillCliArgs(
  argv = process.argv.slice(2),
  env = process.env,
  { homeDir = os.homedir() } = {},
) {
  const defaults = defaultBackfillPaths(homeDir);
  let batchPages = env.MEECARD_SNKRDUNK_BACKFILL_BATCH_PAGES ?? DEFAULT_BATCH_PAGES;
  let checkpointPath = env.MEECARD_SNKRDUNK_BACKFILL_CHECKPOINT ?? defaults.checkpointPath;
  let reportDir = env.MEECARD_SNKRDUNK_BACKFILL_REPORT_DIR ?? defaults.reportDir;
  let mcpUrl = env.MEECARD_MCP_URL ?? DEFAULT_MCP_URL;
  let help = false;

  for (let index = 0; index < argv.length;) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      help = true;
      index++;
      continue;
    }
    const batchOption = parseValueOption(argv, index, "--batch-pages");
    if (batchOption) {
      batchPages = batchOption.value;
      index += batchOption.consumed;
      continue;
    }
    const checkpointOption = parseValueOption(argv, index, "--checkpoint");
    if (checkpointOption) {
      checkpointPath = checkpointOption.value;
      index += checkpointOption.consumed;
      continue;
    }
    const reportOption = parseValueOption(argv, index, "--report-dir");
    if (reportOption) {
      reportDir = reportOption.value;
      index += reportOption.consumed;
      continue;
    }
    const mcpOption = parseValueOption(argv, index, "--mcp-url");
    if (mcpOption) {
      mcpUrl = mcpOption.value;
      index += mcpOption.consumed;
      continue;
    }
    throw new BackfillUsageError(`ไม่รู้จัก option: ${arg}`);
  }

  if (!help) batchPages = positiveInteger(batchPages, "batch pages", MAX_BATCH_PAGES);
  if (!checkpointPath || !String(checkpointPath).trim()) {
    throw new BackfillUsageError("checkpoint path ว่างไม่ได้");
  }
  if (!reportDir || !String(reportDir).trim()) {
    throw new BackfillUsageError("report directory ว่างไม่ได้");
  }
  try {
    const parsed = new URL(String(mcpUrl));
    if (!/^https?:$/.test(parsed.protocol)) throw new Error("protocol");
    mcpUrl = parsed.toString();
  } catch {
    throw new BackfillUsageError("MCP URL ต้องเป็น http(s)");
  }

  return {
    help,
    batchPages: help ? null : batchPages,
    checkpointPath: path.resolve(String(checkpointPath)),
    reportDir: path.resolve(String(reportDir)),
    mcpUrl,
  };
}

function initialCheckpoint() {
  return {
    schemaVersion: BACKFILL_CHECKPOINT_SCHEMA_VERSION,
    job: BACKFILL_JOB,
    discovery: {
      schemaVersion: SNKRDUNK_CHECKPOINT_SCHEMA_VERSION,
      source: "SNKRDUNK",
      complete: false,
      nextPage: 1,
      blockedReason: null,
      seenSnkrdunkIds: [],
    },
    pagesProcessed: 0,
  };
}

export function validateBackfillCheckpoint(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("checkpoint ต้องเป็น JSON object");
  }
  const allowed = new Set([
    "schemaVersion",
    "job",
    "discovery",
    "pagesProcessed",
    "updatedAt",
    "lastRunId",
    "lastReportPath",
    "lastPageStart",
    "lastPageEnd",
  ]);
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  if (unknown.length) throw new Error(`checkpoint มี field ที่ไม่รู้จัก: ${unknown.join(", ")}`);
  if (value.schemaVersion !== BACKFILL_CHECKPOINT_SCHEMA_VERSION || value.job !== BACKFILL_JOB) {
    throw new Error("checkpoint schema/job ไม่ตรง");
  }
  const discovery = validateSnkrdunkDiscoveryCheckpoint(value.discovery);
  const pagesProcessed = Number(value.pagesProcessed ?? 0);
  if (!Number.isSafeInteger(pagesProcessed) || pagesProcessed < 0) {
    throw new Error("checkpoint.pagesProcessed ต้องเป็นจำนวนเต็มตั้งแต่ 0");
  }
  for (const key of ["lastPageStart", "lastPageEnd"]) {
    if (value[key] != null && (!Number.isSafeInteger(value[key]) || value[key] < 1)) {
      throw new Error(`checkpoint.${key} ไม่ถูกต้อง`);
    }
  }
  if (value.updatedAt != null && Number.isNaN(Date.parse(value.updatedAt))) {
    throw new Error("checkpoint.updatedAt ไม่ใช่เวลา ISO");
  }
  if (value.lastRunId != null && (typeof value.lastRunId !== "string" || !value.lastRunId)) {
    throw new Error("checkpoint.lastRunId ไม่ถูกต้อง");
  }
  if (value.lastReportPath != null && (
    typeof value.lastReportPath !== "string"
    || !path.isAbsolute(value.lastReportPath)
  )) {
    throw new Error("checkpoint.lastReportPath ต้องเป็น absolute path");
  }
  return {
    schemaVersion: BACKFILL_CHECKPOINT_SCHEMA_VERSION,
    job: BACKFILL_JOB,
    discovery,
    pagesProcessed,
    ...(value.updatedAt == null ? {} : { updatedAt: value.updatedAt }),
    ...(value.lastRunId == null ? {} : { lastRunId: value.lastRunId }),
    ...(value.lastReportPath == null ? {} : { lastReportPath: value.lastReportPath }),
    ...(value.lastPageStart == null ? {} : { lastPageStart: value.lastPageStart }),
    ...(value.lastPageEnd == null ? {} : { lastPageEnd: value.lastPageEnd }),
  };
}

async function lstatOrNull(target) {
  try {
    return await fs.lstat(target);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

async function ensurePrivateDirectory(directory) {
  const existing = await lstatOrNull(directory);
  if (existing) {
    if (existing.isSymbolicLink() || !existing.isDirectory()) {
      throw new Error(`private directory ไม่ใช่ directory จริง: ${directory}`);
    }
    if ((existing.mode & 0o777) !== PRIVATE_DIR_MODE) {
      throw new Error(`private directory ต้องมี mode 0700: ${directory}`);
    }
    return;
  }
  await fs.mkdir(directory, { recursive: true, mode: PRIVATE_DIR_MODE });
  await fs.chmod(directory, PRIVATE_DIR_MODE);
}

async function assertPrivateRegularFile(filePath) {
  const stat = await lstatOrNull(filePath);
  if (!stat) return null;
  if (stat.isSymbolicLink() || !stat.isFile()) {
    throw new Error(`state file ไม่ใช่ regular file: ${filePath}`);
  }
  if ((stat.mode & 0o777) !== PRIVATE_FILE_MODE) {
    throw new Error(`state file ต้องมี mode 0600: ${filePath}`);
  }
  return stat;
}

export async function readBackfillCheckpoint(checkpointPath) {
  const stat = await assertPrivateRegularFile(checkpointPath);
  if (!stat) return initialCheckpoint();
  if (stat.size > MAX_CHECKPOINT_BYTES) throw new Error("checkpoint ใหญ่เกินขอบเขต");
  const raw = await fs.readFile(checkpointPath, "utf8");
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("checkpoint JSON อ่านไม่ได้");
  }
  return validateBackfillCheckpoint(parsed);
}

async function fsyncDirectory(directory) {
  const handle = await fs.open(directory, "r");
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function writePrivateTemp(directory, basename, payload) {
  const tempPath = path.join(directory, `.${basename}.${process.pid}.${randomUUID()}.tmp`);
  const handle = await fs.open(tempPath, "wx", PRIVATE_FILE_MODE);
  try {
    await handle.writeFile(payload, "utf8");
    await handle.chmod(PRIVATE_FILE_MODE);
    await handle.sync();
  } finally {
    await handle.close();
  }
  return tempPath;
}

export async function writeImmutableJsonReport(reportPath, report) {
  const directory = path.dirname(reportPath);
  await ensurePrivateDirectory(directory);
  if (await lstatOrNull(reportPath)) throw new Error(`report มีอยู่แล้ว ห้ามเขียนทับ: ${reportPath}`);
  const payload = `${JSON.stringify(report, null, 2)}\n`;
  const tempPath = await writePrivateTemp(directory, path.basename(reportPath), payload);
  try {
    await fs.link(tempPath, reportPath);
    await fs.unlink(tempPath);
    await fsyncDirectory(directory);
  } catch (error) {
    await fs.unlink(tempPath).catch(() => {});
    throw error;
  }
  return reportPath;
}

export async function writeAtomicBackfillCheckpoint(checkpointPath, checkpoint) {
  const normalized = validateBackfillCheckpoint(checkpoint);
  const directory = path.dirname(checkpointPath);
  await ensurePrivateDirectory(directory);
  await assertPrivateRegularFile(checkpointPath);
  const payload = `${JSON.stringify(normalized, null, 2)}\n`;
  const tempPath = await writePrivateTemp(directory, path.basename(checkpointPath), payload);
  try {
    await fs.rename(tempPath, checkpointPath);
    await fs.chmod(checkpointPath, PRIVATE_FILE_MODE);
    await fsyncDirectory(directory);
  } catch (error) {
    await fs.unlink(tempPath).catch(() => {});
    throw error;
  }
  return checkpointPath;
}

export function classifyBackfillListingReason(listing) {
  const name = String(listing?.name ?? "");
  if (
    /\[(?:EN|ZH(?:[-_](?:CN|TW|HK))?)\]/i.test(name)
    || /\b(?:ENGLISH|CHINESE)\s+(?:LANGUAGE|VERSION|EDITION)\b/i.test(name)
  ) {
    return "explicit_locale";
  }
  if (/\b(?:OPENED|UN[- ]?OPEN(?:ED)?|SEALED)\b|開封|未開封/i.test(name)) {
    return "opened_or_unopened_product";
  }
  return "requires_exact_variant_review";
}

function paginationNumber(value) {
  return (typeof value === 'number' || (typeof value === 'string' && value.trim())) ? Number(value) : NaN;
}

function parsePagination(value, status, page, limit) {
  const rows = Array.isArray(value?.data) ? value.data : null;
  const totalPage = paginationNumber(value?.totalPage);
  const totalItems = paginationNumber(value?.totalItems);
  const validPages = Number.isSafeInteger(totalPage)
    && (totalPage >= 1 || (totalPage === 0 && totalItems === 0));
  if (!rows || !validPages || !Number.isSafeInteger(totalItems) || totalItems < 0) {
    throw new Error(`snkrdunk_mapping_list status=${status} page=${page} pagination ไม่ถูกต้อง (pages=${totalPage}, items=${totalItems})`);
  }
  const expectedPages = Math.ceil(totalItems / limit);
  if (totalPage !== expectedPages && !(totalItems === 0 && totalPage === 1)) {
    throw new Error(`snkrdunk_mapping_list status=${status} page=${page} pagination จำนวนหน้าไม่ตรงจำนวนข้อมูล (expectedPages=${expectedPages}, pages=${totalPage}, items=${totalItems})`);
  }
  if (
    (Object.hasOwn(value, 'currentPage') && paginationNumber(value.currentPage) !== page)
    || (Object.hasOwn(value, 'pageSize') && paginationNumber(value.pageSize) !== limit)
  ) {
    throw new Error(`snkrdunk_mapping_list status=${status} page=${page} pagination ไม่ตรงคำขอ (currentPage=${paginationNumber(value.currentPage)}, pageSize=${paginationNumber(value.pageSize)}, expectedSize=${limit})`);
  }
  return { rows, totalPage, totalItems };
}

async function fetchMappingsForStatus(client, status) {
  const limit = 100;
  const first = parsePagination(await client.callReadOnly("snkrdunk_mapping_list", {
    page: 1,
    limit,
    status,
    // Price updates change updatedAt between offset pages. productNumber avoids
    // that movement; ties/concurrent catalog changes still require integrity checks.
    sort: "productNumber",
    order: "asc",
  }), status, 1, limit);
  const rows = [...first.rows];
  for (let page = 2; page <= first.totalPage; page++) {
    const next = parsePagination(await client.callReadOnly("snkrdunk_mapping_list", {
      page,
      limit,
      status,
      sort: "productNumber",
      order: "asc",
    }), status, page, limit);
    if (next.totalPage !== first.totalPage || next.totalItems !== first.totalItems) {
      throw new Error(`snkrdunk_mapping_list status=${status} page=${page} pagination เปลี่ยนระหว่างอ่าน (pages=${first.totalPage}->${next.totalPage}, items=${first.totalItems}->${next.totalItems})`);
    }
    rows.push(...next.rows);
  }
  const mappingIds = rows.map((row) => paginationNumber(row?.id));
  const sourceIds = rows.map((row) => paginationNumber(row?.snkrdunkId));
  const invalidMappings = mappingIds.filter((id) => !Number.isSafeInteger(id) || id <= 0).length;
  const invalidSources = sourceIds.filter((id) => !Number.isSafeInteger(id) || id <= 0).length;
  const unique = new Set(mappingIds).size;
  const reasons = [];
  if (rows.length !== first.totalItems) reasons.push('จำนวนข้อมูลไม่ครบ');
  if (invalidMappings) reasons.push(`id invalid=${invalidMappings}`);
  if (unique !== rows.length) reasons.push('mapping ID ซ้ำ');
  if (invalidSources) reasons.push(`snkrdunkId invalid=${invalidSources}`);
  if (reasons.length) {
    throw new Error(`snkrdunk_mapping_list status=${status} integrity ไม่ผ่าน: ${reasons.join(', ')} (fetched=${rows.length}, reported=${first.totalItems}, unique=${unique})`);
  }
  return rows;
}

export async function fetchKnownSnkrdunkIds(client) {
  const ids = new Set();
  const statusCounts = {};
  for (const status of MCP_STATUSES) {
    const rows = await fetchMappingsForStatus(client, status);
    statusCounts[status] = rows.length;
    for (const row of rows) ids.add(Number(row.snkrdunkId));
  }
  return { ids, statusCounts };
}

function reasonCounts(listings) {
  const counts = {};
  for (const listing of listings) counts[listing.reason] = (counts[listing.reason] ?? 0) + 1;
  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)));
}

function reportFilename(startedAt, runId, pageLabel) {
  const stamp = startedAt.toISOString().replace(/[:.]/g, "-");
  return `${stamp}-page-${pageLabel}-${runId}.json`;
}

function buildBackfillListings(cards, knownIds) {
  return cards.map((listing) => {
    const snkrdunkId = Number(listing.snkrdunkId);
    const isKnown = knownIds.has(snkrdunkId);
    return {
      snkrdunkId,
      code: listing.productNumber,
      name: listing.name,
      sourceUrl: `https://snkrdunk.com/en/trading-cards/${snkrdunkId}`,
      imageUrl: listing.thumbnailUrl,
      minPrice: listing.minPrice,
      minPriceFormat: listing.minPriceFormat,
      known: isKnown,
      unmapped: !isKnown,
      reason: isKnown ? "already_known" : classifyBackfillListingReason(listing),
    };
  });
}

export async function runSnkrdunkBackfill({
  argv = process.argv.slice(2),
  env = process.env,
  homeDir = os.homedir(),
  fetchImpl = globalThis.fetch,
  now = () => new Date(),
  uuid = () => randomUUID(),
  clientFactory = (endpoint) => new McpClient(endpoint, { fetchImpl }),
  discoverImpl = discoverSnkrdunkOnePieceCards,
  writeReportImpl = writeImmutableJsonReport,
  writeCheckpointImpl = writeAtomicBackfillCheckpoint,
} = {}) {
  const options = parseBackfillCliArgs(argv, env, { homeDir });
  if (options.help) return { help: true, usage: backfillUsageText() };

  const startedAt = now();
  const runId = uuid();
  const checkpointBefore = await readBackfillCheckpoint(options.checkpointPath);
  const pageLabel = checkpointBefore.discovery.nextPage
    ?? (checkpointBefore.discovery.complete ? "complete" : "blocked");
  const reportPath = path.join(
    options.reportDir,
    reportFilename(startedAt, runId, pageLabel),
  );

  if (checkpointBefore.discovery.complete || checkpointBefore.discovery.blockedReason) {
    const client = clientFactory(options.mcpUrl);
    await client.initialize();
    const known = await fetchKnownSnkrdunkIds(client);
    const tail = await discoverImpl({
      fetchImpl,
      startPage: 1,
      maxPages: options.batchPages,
    });
    if (!tail || !Array.isArray(tail.cards) || !tail.stats) {
      throw new Error("SNKRDUNK tail refresh result ไม่ถูกต้อง");
    }
    const pagesFetched = Number(tail.stats.pagesFetched);
    const pageStart = Number(tail.stats.startPage);
    const lastPage = Number(tail.stats.lastPageFetched);
    if (
      !Number.isSafeInteger(pagesFetched)
      || pagesFetched < 1
      || pagesFetched > options.batchPages
      || pageStart !== 1
      || !Number.isSafeInteger(lastPage)
      || lastPage < pageStart
    ) {
      throw new Error("SNKRDUNK tail refresh page range ไม่ถูกต้อง");
    }
    const listings = buildBackfillListings(tail.cards, known.ids);
    const knownCount = listings.filter((listing) => listing.known).length;
    const finishedAt = now();
    const report = {
      schemaVersion: BACKFILL_REPORT_SCHEMA_VERSION,
      job: BACKFILL_JOB,
      runId,
      mode: "read-only",
      status: "tail-refresh",
      reason: checkpointBefore.discovery.complete
        ? "checkpoint_complete_tail_refresh"
        : "checkpoint_blocked_tail_refresh",
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      reportPath,
      checkpointBefore,
      checkpointAfter: checkpointBefore,
      source: {
        pageStart,
        pageEnd: lastPage,
        pagesRequested: Array.from({ length: lastPage }, (_, index) => index + 1),
        stats: tail.stats,
      },
      mcp: {
        statuses: known.statusCounts,
        knownSourceIds: known.ids.size,
      },
      counts: {
        total: listings.length,
        known: knownCount,
        unmapped: listings.length - knownCount,
        reasons: reasonCounts(listings),
      },
      listings,
    };
    await writeReportImpl(reportPath, report);
    return {
      status: report.status,
      reportPath,
      checkpointPath: options.checkpointPath,
      checkpointAdvanced: false,
      report,
    };
  }

  const client = clientFactory(options.mcpUrl);
  await client.initialize();
  const known = await fetchKnownSnkrdunkIds(client);
  const discovery = await discoverImpl({
    fetchImpl,
    maxPages: options.batchPages,
    checkpoint: checkpointBefore.discovery,
  });
  if (!discovery || !Array.isArray(discovery.cards) || !discovery.stats || !discovery.checkpoint) {
    throw new Error("SNKRDUNK discovery result ไม่ถูกต้อง");
  }

  const listings = buildBackfillListings(discovery.cards, known.ids);
  const pagesFetched = Number(discovery.stats.pagesFetched);
  if (!Number.isSafeInteger(pagesFetched) || pagesFetched < 1 || pagesFetched > options.batchPages) {
    throw new Error("SNKRDUNK discovery pagesFetched ไม่ถูกต้อง");
  }
  const sourceCheckpoint = validateSnkrdunkDiscoveryCheckpoint(discovery.checkpoint);
  const pageStart = Number(discovery.stats.startPage);
  const lastPage = Number(discovery.stats.lastPageFetched);
  if (!Number.isSafeInteger(pageStart) || !Number.isSafeInteger(lastPage) || lastPage < pageStart) {
    throw new Error("SNKRDUNK discovery page range ไม่ถูกต้อง");
  }
  const requestedPages = Array.from(
    { length: lastPage - pageStart + 1 },
    (_, index) => pageStart + index,
  );
  const sourceComplete = sourceCheckpoint.complete;
  const sourceBlocked = sourceCheckpoint.blockedReason !== null;
  const finishedAt = now();
  const checkpointAfter = validateBackfillCheckpoint({
    schemaVersion: BACKFILL_CHECKPOINT_SCHEMA_VERSION,
    job: BACKFILL_JOB,
    discovery: sourceCheckpoint,
    pagesProcessed: checkpointBefore.pagesProcessed + pagesFetched,
    updatedAt: finishedAt.toISOString(),
    lastRunId: runId,
    lastReportPath: reportPath,
    lastPageStart: pageStart,
    lastPageEnd: lastPage,
  });
  const knownCount = listings.filter((listing) => listing.known).length;
  const report = {
    schemaVersion: BACKFILL_REPORT_SCHEMA_VERSION,
    job: BACKFILL_JOB,
    runId,
    mode: "read-only",
    status: sourceComplete ? "complete" : sourceBlocked ? "blocked" : "partial",
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    reportPath,
    checkpointBefore,
    checkpointAfter,
    source: {
      pageStart,
      pageEnd: lastPage,
      pagesRequested: requestedPages,
      stats: discovery.stats,
    },
    mcp: {
      statuses: known.statusCounts,
      knownSourceIds: known.ids.size,
    },
    counts: {
      total: listings.length,
      known: knownCount,
      unmapped: listings.length - knownCount,
      reasons: reasonCounts(listings),
    },
    listings,
  };

  // Ordering is the safety invariant: a failed report leaves the old checkpoint
  // untouched, so the same read-only window is retried on the next run.
  await writeReportImpl(reportPath, report);
  await writeCheckpointImpl(options.checkpointPath, checkpointAfter);
  return {
    status: report.status,
    reportPath,
    checkpointPath: options.checkpointPath,
    checkpointAdvanced: true,
    report,
  };
}

export function backfillUsageText() {
  return [
    "ใช้: node tools/companion/meecard-snkrdunk-backfill.mjs [options]",
    `--batch-pages N       จำนวนหน้าต่อรอบ (default ${DEFAULT_BATCH_PAGES}, max ${MAX_BATCH_PAGES})`,
    "--checkpoint PATH     checkpoint JSON ส่วนตัว",
    "--report-dir PATH     โฟลเดอร์รายงาน immutable",
    "--mcp-url URL          MeeCard MCP endpoint",
    "งานนี้อ่านอย่างเดียวและไม่มี create/approve option",
  ].join("\n");
}

async function recordBackfillResult(result) {
  const detail = JSON.stringify({
    status: result.status,
    pageStart: result.report.source.pageStart ?? null,
    pageEnd: result.report.source.pageEnd ?? null,
    counts: result.report.counts,
    reportPath: result.reportPath,
  });
  try {
    const { writePulse } = await import("./pulse.mjs");
    await writePulse("meecard-snkrdunk-backfill", {
      label: "ไล่รายการ SNKRDUNK ที่ MeeCard ยังไม่มี",
      status: result.status === "blocked" ? "warn" : "ok",
      detail,
    });
  } catch {}
  const heartbeatDir = path.join(os.homedir(), ".cache", "bestos-heartbeat");
  await fs.mkdir(heartbeatDir, { recursive: true });
  await fs.writeFile(
    path.join(heartbeatDir, "meecard-snkrdunk-backfill"),
    new Date().toISOString(),
    "utf8",
  );
}

async function cli() {
  try {
    const result = await runSnkrdunkBackfill();
    if (result.help) {
      console.log(result.usage);
      return;
    }
    console.log(JSON.stringify({
      ok: true,
      status: result.status,
      reportPath: result.reportPath,
      checkpointPath: result.checkpointPath,
      checkpointAdvanced: result.checkpointAdvanced,
      counts: result.report.counts,
      pageStart: result.report.source.pageStart ?? null,
      pageEnd: result.report.source.pageEnd ?? null,
    }));
    await recordBackfillResult(result);
  } catch (error) {
    try {
      const { writePulse } = await import("./pulse.mjs");
      await writePulse("meecard-snkrdunk-backfill", {
        label: "ไล่รายการ SNKRDUNK ที่ MeeCard ยังไม่มี",
        status: "fail",
        detail: String(error?.message ?? error).slice(0, 500),
      });
    } catch {}
    console.error(JSON.stringify({
      ok: false,
      error: String(error?.message ?? error).slice(0, 500),
    }));
    process.exitCode = error instanceof BackfillUsageError ? 2 : 1;
  }
}

const isMain = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) await cli();
