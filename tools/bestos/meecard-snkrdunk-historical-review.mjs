#!/usr/bin/env node
// Historical SNKRDUNK artwork review for MeeCard — read-only by construction.
// Inputs are immutable backfill reports and/or one bounded public page range.
// Remote calls are limited to public discovery plus MeeCard MCP read tools.

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

import {
  AUTO_SAFE_MAX_VISUAL_SCORE,
  AUTO_SAFE_MIN_MARGIN,
  DEFAULT_MCP_URL,
  McpClient,
  classifySnkrdunkDiscovery,
  compareImageFeatures,
  extractVariantMarkers,
  fetchImageFeature,
  normalizePrintedCode,
} from "./meecard-auto-match-supervisor.mjs";
import { writeImmutableJsonReport } from "./meecard-snkrdunk-backfill.mjs";
import {
  SNKRDUNK_HARD_MAX_PAGES,
  discoverSnkrdunkOnePieceCards,
} from "./meecard-snkrdunk-discovery.mjs";

export const HISTORICAL_REVIEW_JOB = "meecard-snkrdunk-historical-review";
export const HISTORICAL_REVIEW_SCHEMA_VERSION = 3;

const MCP_STATUSES = ["pending", "matched", "rejected", "skipped"];
const MAX_INPUT_REPORT_BYTES = 128 * 1024 * 1024;
const IMAGE_CONCURRENCY = 6;
const MAX_CANDIDATES_IN_REPORT = 8;
const SPECIAL_TREATMENT_MARKERS = [
  "super-parallel",
  "stamped",
  "unstamped",
  "pirate-flag-foil",
  "foil",
  "no-holo",
  "pre-correction",
  "corrected",
];

export class HistoricalReviewUsageError extends Error {
  constructor(message) {
    super(message);
    this.name = "HistoricalReviewUsageError";
  }
}

function positiveInteger(value, label, max = Number.MAX_SAFE_INTEGER) {
  const parsed = typeof value === "number" ? value : Number(String(value ?? "").trim());
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > max) {
    throw new HistoricalReviewUsageError(`${label} ต้องเป็นจำนวนเต็ม 1-${max}`);
  }
  return parsed;
}

function parseValueOption(argv, index, name) {
  const current = argv[index];
  if (current === name) {
    if (index + 1 >= argv.length) throw new HistoricalReviewUsageError(`${name} ต้องมีค่า`);
    return { value: argv[index + 1], consumed: 2 };
  }
  if (current.startsWith(`${name}=`)) {
    const value = current.slice(name.length + 1);
    if (!value) throw new HistoricalReviewUsageError(`${name} ต้องมีค่า`);
    return { value, consumed: 1 };
  }
  return null;
}

export function defaultHistoricalReviewPaths(homeDir = os.homedir()) {
  return {
    reportDir: path.join(
      homeDir,
      ".local",
      "state",
      "bestos",
      "meecard-auto-match",
      "snkrdunk-historical-review-runs",
    ),
  };
}

export function parseHistoricalReviewCliArgs(
  argv = process.argv.slice(2),
  env = process.env,
  { homeDir = os.homedir() } = {},
) {
  const defaults = defaultHistoricalReviewPaths(homeDir);
  const inputReports = [];
  let startPage = null;
  let endPage = null;
  let reportDir = env.MEECARD_SNKRDUNK_HISTORICAL_REVIEW_DIR ?? defaults.reportDir;
  let mcpUrl = env.MEECARD_MCP_URL ?? DEFAULT_MCP_URL;
  let includeCurrentMatched = false;
  let help = false;

  for (let index = 0; index < argv.length;) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      help = true;
      index++;
      continue;
    }
    if (arg === "--include-current-matched") {
      includeCurrentMatched = true;
      index++;
      continue;
    }
    const inputOption = parseValueOption(argv, index, "--backfill-report");
    if (inputOption) {
      inputReports.push(path.resolve(String(inputOption.value)));
      index += inputOption.consumed;
      continue;
    }
    const startOption = parseValueOption(argv, index, "--start-page");
    if (startOption) {
      startPage = startOption.value;
      index += startOption.consumed;
      continue;
    }
    const endOption = parseValueOption(argv, index, "--end-page");
    if (endOption) {
      endPage = endOption.value;
      index += endOption.consumed;
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
    throw new HistoricalReviewUsageError(`ไม่รู้จัก option: ${arg}`);
  }

  if (!help) {
    if ((startPage == null) !== (endPage == null)) {
      throw new HistoricalReviewUsageError("ต้องระบุ --start-page และ --end-page คู่กัน");
    }
    if (startPage != null) {
      startPage = positiveInteger(startPage, "start page", SNKRDUNK_HARD_MAX_PAGES);
      endPage = positiveInteger(endPage, "end page", SNKRDUNK_HARD_MAX_PAGES);
      if (endPage < startPage) {
        throw new HistoricalReviewUsageError("end page ต้องไม่น้อยกว่า start page");
      }
    }
    if (!inputReports.length && startPage == null && !includeCurrentMatched) {
      throw new HistoricalReviewUsageError(
        "ต้องระบุ --backfill-report, ช่วง --start-page/--end-page หรือ --include-current-matched",
      );
    }
  }

  if (!String(reportDir ?? "").trim()) {
    throw new HistoricalReviewUsageError("report directory ว่างไม่ได้");
  }
  try {
    const parsed = new URL(String(mcpUrl));
    if (!/^https?:$/.test(parsed.protocol)) throw new Error("protocol");
    mcpUrl = parsed.toString();
  } catch {
    throw new HistoricalReviewUsageError("MCP URL ต้องเป็น http(s)");
  }

  return {
    help,
    inputReports,
    startPage: help ? null : startPage,
    endPage: help ? null : endPage,
    includeCurrentMatched: help ? false : includeCurrentMatched,
    reportDir: path.resolve(String(reportDir)),
    mcpUrl,
  };
}

function numericId(value) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function optionalMoney(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

function sourceUrl(snkrdunkId, value) {
  if (typeof value === "string" && /^https:\/\//i.test(value.trim())) return value.trim();
  return `https://snkrdunk.com/en/trading-cards/${snkrdunkId}`;
}

export function normalizeHistoricalListing(row, { reportPath = null, reportSource = null } = {}) {
  if (!row || typeof row !== "object" || Array.isArray(row)) {
    throw new Error("backfill listing ต้องเป็น JSON object");
  }
  const snkrdunkId = numericId(row.snkrdunkId ?? row.id);
  const productNumber = normalizePrintedCode(row.productNumber ?? row.code);
  if (snkrdunkId == null || !productNumber) {
    throw new Error("backfill listing ขาด SNKRDUNK ID หรือ printed code");
  }
  const name = typeof row.name === "string" ? row.name.trim() : "";
  const thumbnailUrl = typeof (row.thumbnailUrl ?? row.imageUrl) === "string"
    ? String(row.thumbnailUrl ?? row.imageUrl).trim()
    : null;
  const historicalKnown = row.known === true
    || row.presentInMeeCard === true
    || row.unmapped === false;
  return {
    snkrdunkId,
    productNumber,
    name,
    thumbnailUrl: thumbnailUrl || null,
    sourceUrl: sourceUrl(snkrdunkId, row.sourceUrl),
    minPrice: optionalMoney(row.minPrice),
    minPriceFormat: typeof row.minPriceFormat === "string" ? row.minPriceFormat : null,
    historicalKnown,
    historicalReason: typeof row.reason === "string" ? row.reason : null,
    reportSources: reportPath ? [{ reportPath, reportSource }] : [],
    sourceConflicts: [],
  };
}

function mergeHistoricalListing(existing, incoming) {
  const conflicts = [];
  for (const key of ["productNumber", "name", "thumbnailUrl"]) {
    if (existing[key] && incoming[key] && existing[key] !== incoming[key]) {
      conflicts.push({
        field: key,
        first: existing[key],
        next: incoming[key],
        nextReportPath: incoming.reportSources[0]?.reportPath ?? null,
      });
    }
  }
  return {
    ...existing,
    historicalKnown: existing.historicalKnown || incoming.historicalKnown,
    minPrice: incoming.minPrice ?? existing.minPrice,
    minPriceFormat: incoming.minPriceFormat ?? existing.minPriceFormat,
    historicalReason: incoming.historicalReason ?? existing.historicalReason,
    reportSources: [...existing.reportSources, ...incoming.reportSources],
    sourceConflicts: [...existing.sourceConflicts, ...incoming.sourceConflicts, ...conflicts],
  };
}

function normalizeCurrentMatchedListing(mapping) {
  const listing = normalizeHistoricalListing({
    snkrdunkId: mapping?.snkrdunkId,
    productNumber: mapping?.productNumber,
    name: mapping?.scrapedName,
    thumbnailUrl: mapping?.thumbnailUrl,
    sourceUrl: mapping?.sourceUrl,
    minPrice: mapping?.minPriceUsd ?? mapping?.minPrice,
    minPriceFormat: mapping?.minPriceFormat,
    known: true,
    reason: "current_mapping_matched",
  });
  listing.reportSources = [{
    reportPath: null,
    reportSource: {
      job: "mcp-current-matched",
      runId: null,
      mappingId: numericId(mapping?.id),
      pageStart: null,
      pageEnd: null,
      pagesFetched: null,
    },
  }];
  return listing;
}

export function mergeCurrentMatchedListings(listings, mappings) {
  const byId = new Map();
  for (const listing of Array.isArray(listings) ? listings : []) {
    const existing = byId.get(listing.snkrdunkId);
    byId.set(
      listing.snkrdunkId,
      existing ? mergeHistoricalListing(existing, listing) : listing,
    );
  }
  let matchedMappings = 0;
  let added = 0;
  let merged = 0;
  const matchedSourceCounts = new Map();
  for (const mapping of Array.isArray(mappings) ? mappings : []) {
    if (mapping?.normalizedStatus !== "matched") continue;
    matchedMappings++;
    const incoming = normalizeCurrentMatchedListing(mapping);
    matchedSourceCounts.set(
      incoming.snkrdunkId,
      (matchedSourceCounts.get(incoming.snkrdunkId) ?? 0) + 1,
    );
    const existing = byId.get(incoming.snkrdunkId);
    if (existing) {
      merged++;
      byId.set(incoming.snkrdunkId, mergeHistoricalListing(existing, incoming));
    } else {
      added++;
      byId.set(incoming.snkrdunkId, incoming);
    }
  }
  const output = [...byId.values()];
  return {
    listings: output,
    stats: {
      matchedMappings,
      added,
      merged,
      uniqueListings: output.length,
      duplicateMatchedSourceIds: [...matchedSourceCounts.values()].filter((count) => count > 1).length,
      sourceConflicts: output.filter((listing) => listing.sourceConflicts.length > 0).length,
    },
  };
}

function reportSourceSummary(report) {
  const source = report?.source ?? {};
  return {
    job: typeof report?.job === "string" ? report.job : null,
    runId: typeof report?.runId === "string" ? report.runId : null,
    pageStart: numericId(source.pageStart),
    pageEnd: numericId(source.pageEnd),
    pagesFetched: Number.isSafeInteger(Number(source.pagesFetched))
      ? Number(source.pagesFetched)
      : null,
  };
}

export async function loadHistoricalListingsFromReports(
  reportPaths,
  { readFileImpl = fs.readFile, statImpl = fs.stat } = {},
) {
  const byId = new Map();
  const inputs = [];
  for (const reportPath of reportPaths) {
    const stat = await statImpl(reportPath);
    if (!stat.isFile()) throw new Error(`backfill report ไม่ใช่ไฟล์: ${reportPath}`);
    if (stat.size > MAX_INPUT_REPORT_BYTES) {
      throw new Error(`backfill report ใหญ่เกินขอบเขต: ${reportPath}`);
    }
    let report;
    try {
      report = JSON.parse(await readFileImpl(reportPath, "utf8"));
    } catch {
      throw new Error(`backfill report JSON อ่านไม่ได้: ${reportPath}`);
    }
    if (!report || typeof report !== "object" || !Array.isArray(report.listings)) {
      throw new Error(`backfill report ไม่มี listings[]: ${reportPath}`);
    }
    if (report.listings.length > 10_000) {
      throw new Error(`backfill report มี listings มากเกินขอบเขต: ${reportPath}`);
    }
    const reportSource = reportSourceSummary(report);
    inputs.push({
      reportPath,
      ...reportSource,
      listingCount: report.listings.length,
    });
    for (const row of report.listings) {
      const listing = normalizeHistoricalListing(row, { reportPath, reportSource });
      const existing = byId.get(listing.snkrdunkId);
      byId.set(
        listing.snkrdunkId,
        existing ? mergeHistoricalListing(existing, listing) : listing,
      );
    }
  }
  return { listings: [...byId.values()], inputs };
}

function normalizeDiscoveredListing(row, pageRange) {
  return {
    ...normalizeHistoricalListing(row),
    reportSources: [{
      reportPath: null,
      reportSource: {
        job: "direct-public-page-range",
        runId: null,
        pageStart: pageRange.startPage,
        pageEnd: pageRange.endPage,
        pagesFetched: pageRange.endPage - pageRange.startPage + 1,
      },
    }],
  };
}

async function fetchAllPages(client, tool, baseArgs, { limit = 300 } = {}) {
  const first = await client.callReadOnly(tool, { ...baseArgs, page: 1, limit });
  const rows = Array.isArray(first?.data) ? [...first.data] : null;
  const totalPage = Number(first?.totalPage);
  const totalItems = Number(first?.totalItems);
  const validPages = Number.isInteger(totalPage)
    && (totalPage >= 1 || (totalPage === 0 && totalItems === 0));
  if (!rows || !validPages || !Number.isInteger(totalItems) || totalItems < 0) {
    throw new Error(`${tool} pagination ไม่ถูกต้อง`);
  }
  for (let page = 2; page <= totalPage; page++) {
    const next = await client.callReadOnly(tool, { ...baseArgs, page, limit });
    if (!Array.isArray(next?.data)) throw new Error(`${tool} page ${page} ไม่มี data[]`);
    rows.push(...next.data);
  }
  if (rows.length !== totalItems) {
    throw new Error(`${tool} pagination integrity ไม่ผ่าน (fetched=${rows.length}, total=${totalItems})`);
  }
  return rows;
}

export async function loadMeeCardReviewState(client) {
  const before = await client.callReadOnly("card_list", {
    page: 1,
    limit: 1,
    sort: "id",
    order: "asc",
  });
  const beforeTotal = Number(before?.totalItems);
  if (!Number.isInteger(beforeTotal) || beforeTotal < 0) {
    throw new Error("card_list snapshot ก่อนโหลดไม่ถูกต้อง");
  }
  const catalog = await fetchAllPages(client, "card_list", {
    sort: "id",
    order: "asc",
  });
  const after = await client.callReadOnly("card_list", {
    page: 1,
    limit: 1,
    sort: "id",
    order: "asc",
  });
  const afterTotal = Number(after?.totalItems);
  const cardIds = catalog.map((card) => numericId(card?.id));
  if (
    beforeTotal !== afterTotal
    || catalog.length !== afterTotal
    || cardIds.some((id) => id == null)
    || new Set(cardIds).size !== cardIds.length
  ) {
    throw new Error(
      `MeeCard catalog เปลี่ยนระหว่างโหลด (before=${beforeTotal}, fetched=${catalog.length}, after=${afterTotal})`,
    );
  }

  const mappings = [];
  const statusCounts = {};
  for (const status of MCP_STATUSES) {
    const rows = await fetchAllPages(client, "snkrdunk_mapping_list", {
      status,
      sort: "updatedAt",
      order: "asc",
    }, { limit: 100 });
    statusCounts[status] = rows.length;
    for (const row of rows) mappings.push({ ...row, normalizedStatus: status });
  }
  const mappingIds = mappings.map((row) => numericId(row?.id));
  if (mappingIds.some((id) => id == null) || new Set(mappingIds).size !== mappingIds.length) {
    throw new Error("SNKRDUNK mapping IDs ว่างหรือซ้ำข้ามสถานะ");
  }

  const mappingsBySourceId = new Map();
  const occupiedTargetIds = new Set();
  for (const mapping of mappings) {
    const sourceId = numericId(mapping?.snkrdunkId);
    if (sourceId == null) throw new Error("SNKRDUNK mapping ขาด source ID");
    if (!mappingsBySourceId.has(sourceId)) mappingsBySourceId.set(sourceId, []);
    mappingsBySourceId.get(sourceId).push(mapping);
    if (mapping.normalizedStatus === "matched") {
      const targetId = numericId(mapping?.matchedCard?.id ?? mapping?.matchedCardId);
      if (targetId != null) occupiedTargetIds.add(targetId);
    }
  }
  return { catalog, mappings, mappingsBySourceId, occupiedTargetIds, statusCounts };
}

function normalizeRarity(value) {
  return String(value ?? "").toUpperCase().replace(/\s+/g, "").trim();
}

export function parseSnkrdunkRarity(name) {
  const text = String(name ?? "").toUpperCase();
  const parallel = text.match(/\b(L|C|UC|R|SR|SEC|SP)-P\b/);
  if (parallel) return `P-${parallel[1]}`;
  const direct = text.match(/(?:^|[\s[(])(P-(?:L|C|UC|R|SR|SEC|SP)|SEC|SR|SP|UC|L|R|C|P)(?=[\s:,[\]()])/);
  return direct?.[1] ?? "";
}

export function selectSnkrdunkMetadataCandidates(listing, catalog) {
  const code = normalizePrintedCode(listing?.productNumber);
  const rarity = normalizeRarity(parseSnkrdunkRarity(listing?.name));
  if (!code || !rarity) return [];
  return (Array.isArray(catalog) ? catalog : []).filter((card) => (
    numericId(card?.id) != null
    && normalizePrintedCode(card?.cardCode ?? card?.baseCode) === code
    && normalizeRarity(card?.rarity) === rarity
  ));
}

function cardTreatmentMarkers(card) {
  return new Set(extractVariantMarkers([
    card?.nameJp,
    card?.nameEn,
    card?.nameTh,
    card?.variant,
    card?.variantLabel,
    card?.treatment,
    card?.notes,
  ].filter(Boolean).join(" ")));
}

function exactTreatment(listing, card) {
  const sourceMarkers = new Set(extractVariantMarkers(listing?.name));
  const targetMarkers = cardTreatmentMarkers(card);
  return SPECIAL_TREATMENT_MARKERS.every((marker) => (
    sourceMarkers.has(marker) === targetMarkers.has(marker)
  ));
}

function featureFor(imageFeatures, url) {
  if (!url) return { ok: false, placeholder: false, reason: "missing_image_url", url: "" };
  return imageFeatures.get(String(url))
    ?? { ok: false, placeholder: false, reason: "image_not_loaded", url: String(url) };
}

async function mapLimit(items, limit, fn) {
  const output = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      output[index] = await fn(items[index], index);
    }
  });
  await Promise.all(workers);
  return output;
}

export async function loadHistoricalImageFeatures(
  urls,
  { imageLoader = (url) => fetchImageFeature(url, { retries: 1 }) } = {},
) {
  const entries = await mapLimit([...new Set(urls)].filter(Boolean), IMAGE_CONCURRENCY, async (url) => (
    [url, await imageLoader(url)]
  ));
  return new Map(entries);
}

function compactCard(card) {
  if (!card) return null;
  return {
    cardId: numericId(card.id),
    code: card.cardCode ?? card.baseCode ?? null,
    rarity: card.rarity ?? null,
    name: card.nameEn ?? card.nameJp ?? card.nameTh ?? null,
    imageUrl: card.imageUrl ?? null,
  };
}

function compactClassification(classification) {
  const visualMetrics = classification.visualMetrics == null
    ? null
    : Object.fromEntries(Object.entries(classification.visualMetrics).map(([name, region]) => [name, {
      score: Number(region.score.toFixed(6)),
      correlation: Number(region.correlation.toFixed(6)),
      histogramDistance: Number(region.histogramDistance.toFixed(6)),
    }]));
  return {
    category: classification.category,
    reason: classification.reason,
    visualEvidence: classification.visualEvidence ?? null,
    visualMetrics,
    targetCardId: numericId(classification.targetCardId),
    compatibleCount: Number.isSafeInteger(classification.compatibleCount)
      ? classification.compatibleCount
      : null,
    visualScore: typeof classification.visualScore === "number"
      ? Number(classification.visualScore.toFixed(6))
      : null,
    visualMargin: typeof classification.visualMargin === "number"
      ? Number(classification.visualMargin.toFixed(6))
      : null,
  };
}

function mappingSummary(mapping, catalogById) {
  const targetId = numericId(mapping?.matchedCard?.id ?? mapping?.matchedCardId);
  const target = mapping?.matchedCard ?? catalogById.get(targetId) ?? null;
  return {
    mappingId: numericId(mapping?.id),
    status: mapping?.normalizedStatus ?? null,
    target: targetId == null ? null : compactCard({ ...target, id: targetId }),
  };
}

function candidateScores(listing, candidates, imageFeatures) {
  const sourceFeature = featureFor(imageFeatures, listing.thumbnailUrl);
  return candidates.map((card) => {
    const treatmentExact = exactTreatment(listing, card);
    const targetFeature = featureFor(imageFeatures, card?.imageUrl);
    const visual = treatmentExact ? compareImageFeatures(sourceFeature, targetFeature) : null;
    return {
      ...compactCard(card),
      treatmentExact,
      imageStatus: {
        source: sourceFeature.ok ? "ok" : sourceFeature.reason,
        target: targetFeature.ok ? "ok" : targetFeature.reason,
      },
      visualScore: visual ? Number(visual.score.toFixed(6)) : null,
      exactRawBytes: visual?.exactRawBytes ?? false,
      exactNormalizedRgb: visual?.exactNormalizedRgb ?? false,
    };
  }).sort((left, right) => {
    if (left.treatmentExact !== right.treatmentExact) return left.treatmentExact ? -1 : 1;
    if (left.visualScore == null && right.visualScore != null) return 1;
    if (left.visualScore != null && right.visualScore == null) return -1;
    if (left.visualScore !== right.visualScore) return (left.visualScore ?? 0) - (right.visualScore ?? 0);
    return (left.cardId ?? 0) - (right.cardId ?? 0);
  });
}

function sourceSummary(listing) {
  return {
    snkrdunkId: listing.snkrdunkId,
    code: listing.productNumber,
    name: listing.name,
    sourceUrl: listing.sourceUrl,
    imageUrl: listing.thumbnailUrl,
    minPrice: listing.minPrice,
    minPriceFormat: listing.minPriceFormat,
    historicalKnown: listing.historicalKnown,
    historicalReason: listing.historicalReason,
    reportSources: listing.reportSources,
    sourceConflicts: listing.sourceConflicts,
  };
}

function occupiedTargetIdsExceptCurrent(state, currentMapping) {
  const occupied = new Set(state.occupiedTargetIds);
  const currentMappingId = numericId(currentMapping?.id);
  const currentTargetId = numericId(
    currentMapping?.matchedCard?.id ?? currentMapping?.matchedCardId,
  );
  if (currentTargetId == null) return occupied;
  const occupiedByAnotherMapping = state.mappings.some((mapping) => (
    mapping.normalizedStatus === "matched"
    && numericId(mapping?.id) !== currentMappingId
    && numericId(mapping?.matchedCard?.id ?? mapping?.matchedCardId) === currentTargetId
  ));
  if (!occupiedByAnotherMapping) occupied.delete(currentTargetId);
  return occupied;
}

function classifyCurrentMatchedAudit({
  listing,
  candidates,
  currentMapping,
  state,
  imageFeatures,
}) {
  const currentTargetId = numericId(
    currentMapping?.matchedCard?.id ?? currentMapping?.matchedCardId,
  );
  const audit = classifySnkrdunkDiscovery({
    listing,
    candidates,
    occupiedTargetIds: occupiedTargetIdsExceptCurrent(state, currentMapping),
    imageFeatures,
    maxVisualScore: AUTO_SAFE_MAX_VISUAL_SCORE,
    minMargin: AUTO_SAFE_MIN_MARGIN,
  });
  let reason;
  if (currentTargetId == null) {
    reason = "current_mapping_missing_target";
  } else if (audit.category !== "shadow_candidate") {
    reason = `current_mapping_${audit.reason}`;
  } else if (numericId(audit.targetCardId) !== currentTargetId) {
    reason = "current_mapping_target_mismatch";
  } else {
    // The historical report can prove metadata/artwork, but positive Japanese-locale
    // evidence belongs to the separate OCR audit. Keep the current match fail-closed.
    reason = "current_mapping_requires_locale_audit";
  }
  return {
    classification: {
      category: "requires_matched_audit",
      reason,
      currentTargetCardId: currentTargetId,
      auditedTargetCardId: numericId(audit.targetCardId),
    },
    audit: compactClassification(audit),
  };
}

export function reviewHistoricalListings({ listings, state, imageFeatures = new Map() }) {
  const catalogById = new Map(state.catalog.map((card) => [numericId(card.id), card]));
  const rows = [];
  for (const listing of listings) {
    const currentMappings = state.mappingsBySourceId.get(listing.snkrdunkId) ?? [];
    const current = currentMappings.map((mapping) => mappingSummary(mapping, catalogById));
    const currentMatched = currentMappings.find((mapping) => mapping.normalizedStatus === "matched");
    const currentDecided = currentMappings.find((mapping) => (
      mapping.normalizedStatus === "rejected" || mapping.normalizedStatus === "skipped"
    ));
    const candidates = selectSnkrdunkMetadataCandidates(listing, state.catalog);

    if (listing.sourceConflicts.length) {
      rows.push({
        source: sourceSummary(listing),
        currentMappings: current,
        metadataCandidateCount: candidates.length,
        classification: { category: "blocked", reason: "source_identity_conflict" },
        target: null,
        candidates: [],
      });
      continue;
    }
    if (currentMappings.length > 1) {
      rows.push({
        source: sourceSummary(listing),
        currentMappings: current,
        metadataCandidateCount: candidates.length,
        classification: { category: "blocked", reason: "multiple_current_mappings" },
        target: null,
        candidates: [],
      });
      continue;
    }
    if (currentMatched) {
      const matchedAudit = classifyCurrentMatchedAudit({
        listing,
        candidates,
        currentMapping: currentMatched,
        state,
        imageFeatures,
      });
      const scored = candidateScores(listing, candidates, imageFeatures);
      rows.push({
        source: sourceSummary(listing),
        currentMappings: current,
        metadataCandidateCount: candidates.length,
        classification: matchedAudit.classification,
        matchedAudit: matchedAudit.audit,
        target: current[0]?.target ?? null,
        candidates: scored.slice(0, MAX_CANDIDATES_IN_REPORT),
        candidatesTruncated: scored.length > MAX_CANDIDATES_IN_REPORT,
      });
      continue;
    }
    if (currentDecided) {
      rows.push({
        source: sourceSummary(listing),
        currentMappings: current,
        metadataCandidateCount: candidates.length,
        classification: {
          category: "not_actionable",
          reason: `current_mapping_${currentDecided.normalizedStatus}`,
        },
        target: null,
        candidates: [],
      });
      continue;
    }

    const classification = classifySnkrdunkDiscovery({
      listing,
      candidates,
      occupiedTargetIds: state.occupiedTargetIds,
      imageFeatures,
      maxVisualScore: AUTO_SAFE_MAX_VISUAL_SCORE,
      minMargin: AUTO_SAFE_MIN_MARGIN,
    });
    const scored = candidateScores(listing, candidates, imageFeatures);
    const target = scored.find((candidate) => candidate.treatmentExact && candidate.visualScore != null)
      ?? (classification.target ? compactCard(classification.target) : null);
    rows.push({
      source: sourceSummary(listing),
      currentMappings: current,
      metadataCandidateCount: candidates.length,
      classification: compactClassification(classification),
      target,
      candidates: scored.slice(0, MAX_CANDIDATES_IN_REPORT),
      candidatesTruncated: scored.length > MAX_CANDIDATES_IN_REPORT,
    });
  }

  const safeByTarget = new Map();
  for (const row of rows) {
    if (row.classification.category !== "shadow_candidate") continue;
    const targetId = row.classification.targetCardId;
    if (!safeByTarget.has(targetId)) safeByTarget.set(targetId, []);
    safeByTarget.get(targetId).push(row);
  }
  for (const collisions of safeByTarget.values()) {
    if (collisions.length < 2) continue;
    for (const row of collisions) {
      row.classification = {
        ...row.classification,
        category: "blocked",
        reason: "shadow_target_collision",
      };
    }
  }
  return rows.sort((left, right) => left.source.snkrdunkId - right.source.snkrdunkId);
}

function collectRequiredImageUrls(listings, state) {
  const urls = new Set();
  for (const listing of listings) {
    if (listing.sourceConflicts.length) continue;
    const current = state.mappingsBySourceId.get(listing.snkrdunkId) ?? [];
    if (current.length > 1 || current.some((mapping) => (
      mapping.normalizedStatus === "rejected" || mapping.normalizedStatus === "skipped"
    ))) {
      continue;
    }
    const candidates = selectSnkrdunkMetadataCandidates(listing, state.catalog);
    const preflight = classifySnkrdunkDiscovery({ listing, candidates });
    if (!["source_image_error", "candidate_image_error"].includes(preflight.reason)) continue;
    if (listing.thumbnailUrl) urls.add(listing.thumbnailUrl);
    for (const card of candidates) {
      if (exactTreatment(listing, card) && card?.imageUrl) urls.add(card.imageUrl);
    }
  }
  return [...urls];
}

function countBy(rows, selector) {
  const counts = {};
  for (const row of rows) {
    const value = selector(row);
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)));
}

function reportFilename(startedAt, runId) {
  return `${startedAt.toISOString().replace(/[:.]/g, "-")}-${runId}.json`;
}

export async function runSnkrdunkHistoricalReview({
  argv = process.argv.slice(2),
  env = process.env,
  homeDir = os.homedir(),
  fetchImpl = globalThis.fetch,
  now = () => new Date(),
  uuid = () => randomUUID(),
  clientFactory = (endpoint) => new McpClient(endpoint, { fetchImpl }),
  discoverImpl = discoverSnkrdunkOnePieceCards,
  imageLoader = (url) => fetchImageFeature(url, { fetchImpl, retries: 1 }),
  writeReportImpl = writeImmutableJsonReport,
} = {}) {
  const options = parseHistoricalReviewCliArgs(argv, env, { homeDir });
  if (options.help) return { help: true, usage: historicalReviewUsageText() };

  const startedAt = now();
  const runId = uuid();
  const loaded = await loadHistoricalListingsFromReports(options.inputReports);
  const byId = new Map(loaded.listings.map((listing) => [listing.snkrdunkId, listing]));
  let discovery = null;
  if (options.startPage != null) {
    discovery = await discoverImpl({
      fetchImpl,
      startPage: options.startPage,
      maxPages: options.endPage - options.startPage + 1,
    });
    if (!discovery || !Array.isArray(discovery.cards) || !discovery.stats) {
      throw new Error("SNKRDUNK page-range discovery result ไม่ถูกต้อง");
    }
    for (const raw of discovery.cards) {
      const incoming = normalizeDiscoveredListing(raw, {
        startPage: options.startPage,
        endPage: options.endPage,
      });
      const existing = byId.get(incoming.snkrdunkId);
      byId.set(incoming.snkrdunkId, existing ? mergeHistoricalListing(existing, incoming) : incoming);
    }
  }
  if (!byId.size && !options.includeCurrentMatched) {
    throw new Error("ไม่มี SNKRDUNK listing ให้ตรวจ");
  }

  const client = clientFactory(options.mcpUrl);
  await client.initialize();
  const state = await loadMeeCardReviewState(client);
  let currentMatchedInput = null;
  if (options.includeCurrentMatched) {
    const merged = mergeCurrentMatchedListings([...byId.values()], state.mappings);
    byId.clear();
    for (const listing of merged.listings) byId.set(listing.snkrdunkId, listing);
    currentMatchedInput = merged.stats;
  }
  const listings = [...byId.values()];
  if (!listings.length) throw new Error("ไม่มี SNKRDUNK listing ให้ตรวจ");
  const imageUrls = collectRequiredImageUrls(listings, state);
  const imageFeatures = await loadHistoricalImageFeatures(imageUrls, { imageLoader });
  const rows = reviewHistoricalListings({ listings, state, imageFeatures });
  const finishedAt = now();
  const reportPath = path.join(options.reportDir, reportFilename(startedAt, runId));
  const report = {
    schemaVersion: HISTORICAL_REVIEW_SCHEMA_VERSION,
    job: HISTORICAL_REVIEW_JOB,
    runId,
    mode: "read-only",
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    reportPath,
    inputs: {
      reports: loaded.inputs,
      pageRange: options.startPage == null ? null : {
        startPage: options.startPage,
        endPage: options.endPage,
        stats: discovery.stats,
      },
      ...(currentMatchedInput ? { currentMatched: currentMatchedInput } : {}),
    },
    mcp: {
      catalogCards: state.catalog.length,
      mappingStatuses: state.statusCounts,
      occupiedTargets: state.occupiedTargetIds.size,
    },
    images: {
      requested: imageUrls.length,
      loaded: [...imageFeatures.values()].filter((feature) => feature.ok).length,
      failed: [...imageFeatures.values()].filter((feature) => !feature.ok).length,
    },
    counts: {
      total: rows.length,
      categories: countBy(rows, (row) => row.classification.category),
      reasons: countBy(rows, (row) => row.classification.reason),
      exactCandidates: rows.filter((row) => row.classification.category === "shadow_candidate").length,
    },
    listings: rows,
  };
  await writeReportImpl(reportPath, report);
  return { reportPath, report };
}

export function historicalReviewUsageText() {
  return [
    "ใช้: node tools/companion/meecard-snkrdunk-historical-review.mjs [input] [options]",
    "--backfill-report PATH   รายงาน backfill/full-audit (ระบุซ้ำได้)",
    "--start-page N           หน้า SNKRDUNK แรกของช่วงอ่านสด",
    "--end-page N             หน้า SNKRDUNK สุดท้ายของช่วงอ่านสด",
    "--include-current-matched เพิ่ม MATCHED ปัจจุบันจาก MCP เข้า audit (อ่านอย่างเดียว)",
    "--report-dir PATH        โฟลเดอร์รายงาน immutable",
    "--mcp-url URL             MeeCard MCP endpoint",
    "งานนี้อ่านอย่างเดียว ไม่มี create/approve/update option",
  ].join("\n");
}

async function cli() {
  try {
    const result = await runSnkrdunkHistoricalReview();
    if (result.help) {
      console.log(result.usage);
      return;
    }
    console.log(JSON.stringify({
      ok: true,
      mode: result.report.mode,
      reportPath: result.reportPath,
      counts: result.report.counts,
      images: result.report.images,
    }));
  } catch (error) {
    console.error(JSON.stringify({
      ok: false,
      error: String(error?.message ?? error).slice(0, 500),
    }));
    process.exitCode = error instanceof HistoricalReviewUsageError ? 2 : 1;
  }
}

const isMain = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) await cli();
