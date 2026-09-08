#!/usr/bin/env node
/**
 * Read-only SNKRDUNK discovery for MeeCard.
 *
 * This module only reads SNKRDUNK's public trading-card endpoint. It does not
 * import MeeCard credentials, call MeeCard MCP, or mutate any remote system.
 * The exported functions are intentionally dependency-free so a supervisor can
 * run discovery first and make its own reviewed matching plan later.
 * Price fields stay in SNKRDUNK's native response form: even the `/en` endpoint
 * can localize them to THB, so this module never infers a currency from the URL.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";

export const SNKRDUNK_DISCOVERY_ENDPOINT =
  "https://snkrdunk.com/en/v1/trading-cards?keyword=one+piece+card+game&perPage=100";
export const SNKRDUNK_PAGE_SIZE = 100;
export const SNKRDUNK_HARD_MAX_PAGES = 100;
export const SNKRDUNK_CHECKPOINT_SCHEMA_VERSION = 1;

const DEFAULT_MAX_PAGES = 25;
const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_RETRY_DELAY_MS = 750;
const DEFAULT_PAGE_DELAY_MS = 400;
const MAX_RETRIES = 5;
const OPCG_PRINTED_CODE = /^(?:OP\d{2}-\d{3}|ST\d{2}-\d{3}|EB\d{2}-\d{3}|P-\d{3})$/i;

export class SnkrdunkDiscoveryError extends Error {
  constructor(message, { code, page = null, attempts = null, status = null, cause } = {}) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "SnkrdunkDiscoveryError";
    this.code = code ?? "discovery_error";
    this.page = page;
    this.attempts = attempts;
    this.status = status;
  }
}

/** True only for the printed card-code families used by One Piece Card Game. */
export function isStrictOpcgPrintedCode(value) {
  return typeof value === "string" && OPCG_PRINTED_CODE.test(value.trim());
}

export function buildSnkrdunkDiscoveryUrl(page) {
  if (!Number.isSafeInteger(page) || page < 1) {
    throw new TypeError("page must be a positive integer");
  }
  return `${SNKRDUNK_DISCOVERY_ENDPOINT}&page=${page}`;
}

/** Validate the page envelope before any item is trusted. */
export function validateSnkrdunkPagePayload(payload, page = null) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new SnkrdunkDiscoveryError("SNKRDUNK response must be a JSON object", {
      code: "invalid_payload",
      page,
    });
  }
  if (!Array.isArray(payload.tradingCards)) {
    throw new SnkrdunkDiscoveryError("SNKRDUNK response is missing tradingCards[]", {
      code: "invalid_payload",
      page,
    });
  }
  return payload.tradingCards;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function positiveInteger(value, label, max) {
  if (!Number.isSafeInteger(value) || value < 1 || value > max) {
    throw new TypeError(`${label} must be an integer between 1 and ${max}`);
  }
  return value;
}

function nonNegativeInteger(value, label, max = Number.MAX_SAFE_INTEGER) {
  if (!Number.isSafeInteger(value) || value < 0 || value > max) {
    throw new TypeError(`${label} must be an integer between 0 and ${max}`);
  }
  return value;
}

function numericId(value) {
  if (Number.isSafeInteger(value) && value > 0) return value;
  if (typeof value !== "string" || !/^\d+$/.test(value.trim())) return null;
  const parsed = Number(value.trim());
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

/**
 * Validate a resumable discovery checkpoint and return a defensive copy.
 *
 * The checkpoint intentionally stores only IDs already emitted. A repeated ID
 * after the public feed shifts between runs is ignored, while the new page can
 * still be processed. The supervisor remains responsible for persisting the
 * checkpoint only after it has safely consumed the accompanying cards.
 */
export function validateSnkrdunkDiscoveryCheckpoint(checkpoint) {
  if (!checkpoint || typeof checkpoint !== "object" || Array.isArray(checkpoint)) {
    throw new TypeError("checkpoint must be an object");
  }
  if (checkpoint.schemaVersion !== SNKRDUNK_CHECKPOINT_SCHEMA_VERSION) {
    throw new TypeError(
      `checkpoint.schemaVersion must be ${SNKRDUNK_CHECKPOINT_SCHEMA_VERSION}`,
    );
  }
  if (checkpoint.source !== "SNKRDUNK") {
    throw new TypeError('checkpoint.source must be "SNKRDUNK"');
  }
  if (typeof checkpoint.complete !== "boolean") {
    throw new TypeError("checkpoint.complete must be a boolean");
  }

  const nextPage = checkpoint.nextPage;
  const blockedReason = checkpoint.blockedReason ?? null;
  if (blockedReason !== null && blockedReason !== "hard-page-cap") {
    throw new TypeError('checkpoint.blockedReason must be null or "hard-page-cap"');
  }
  if (checkpoint.complete) {
    if (nextPage !== null || blockedReason !== null) {
      throw new TypeError("a complete checkpoint must have nextPage and blockedReason null");
    }
  } else if (blockedReason !== null) {
    if (nextPage !== null) {
      throw new TypeError("a blocked checkpoint must have nextPage null");
    }
  } else {
    positiveInteger(nextPage, "checkpoint.nextPage", SNKRDUNK_HARD_MAX_PAGES);
  }

  if (!Array.isArray(checkpoint.seenSnkrdunkIds)) {
    throw new TypeError("checkpoint.seenSnkrdunkIds must be an array");
  }
  if (checkpoint.seenSnkrdunkIds.length > SNKRDUNK_PAGE_SIZE * SNKRDUNK_HARD_MAX_PAGES) {
    throw new TypeError("checkpoint.seenSnkrdunkIds is larger than the bounded discovery range");
  }

  const seenSnkrdunkIds = [];
  const uniqueIds = new Set();
  for (const value of checkpoint.seenSnkrdunkIds) {
    const id = numericId(value);
    if (id === null) throw new TypeError("checkpoint.seenSnkrdunkIds must contain positive integers");
    if (uniqueIds.has(id)) {
      throw new TypeError("checkpoint.seenSnkrdunkIds must not contain duplicates");
    }
    uniqueIds.add(id);
    seenSnkrdunkIds.push(id);
  }

  return {
    schemaVersion: SNKRDUNK_CHECKPOINT_SCHEMA_VERSION,
    source: "SNKRDUNK",
    complete: checkpoint.complete,
    nextPage,
    blockedReason,
    seenSnkrdunkIds,
  };
}

function makeCheckpoint({ complete, nextPage, blockedReason = null, seenSnkrdunkIds }) {
  return {
    schemaVersion: SNKRDUNK_CHECKPOINT_SCHEMA_VERSION,
    source: "SNKRDUNK",
    complete,
    nextPage,
    blockedReason,
    seenSnkrdunkIds: [...seenSnkrdunkIds].sort((a, b) => a - b),
  };
}

function optionalMoney(value, formattedValue) {
  const unavailableFormat =
    typeof formattedValue === "string" && /[-–—]\s*$/u.test(formattedValue.trim());
  if (value === 0 && unavailableFormat) return null;
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) return value;
  return null;
}

function attemptError(message, { code, retryable, status = null, cause } = {}) {
  const error = new Error(message, cause === undefined ? undefined : { cause });
  error.discoveryCode = code;
  error.retryable = retryable;
  error.status = status;
  return error;
}

async function fetchAttempt(fetchImpl, url, { page, timeoutMs }) {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    let response;
    try {
      response = await fetchImpl(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "BestOS-MeeCard-SNKRDUNK-Discovery/1.0",
        },
        signal: controller.signal,
      });
    } catch (cause) {
      if (timedOut || controller.signal.aborted) {
        throw attemptError(`SNKRDUNK page ${page} timed out after ${timeoutMs}ms`, {
          code: "timeout",
          retryable: true,
          cause,
        });
      }
      throw attemptError(`SNKRDUNK page ${page} request failed`, {
        code: "network_error",
        retryable: true,
        cause,
      });
    }

    if (!response || typeof response.ok !== "boolean" || typeof response.json !== "function") {
      throw attemptError(`SNKRDUNK page ${page} returned an invalid fetch response`, {
        code: "invalid_response",
        retryable: true,
      });
    }

    if (!response.ok) {
      const status = Number.isInteger(response.status) ? response.status : null;
      const retryable =
        status === null || status === 408 || status === 425 || status === 429 || status >= 500;
      throw attemptError(`SNKRDUNK page ${page} returned HTTP ${status ?? "error"}`, {
        code: "http_error",
        retryable,
        status,
      });
    }

    let payload;
    try {
      payload = await response.json();
    } catch (cause) {
      throw attemptError(`SNKRDUNK page ${page} returned malformed JSON`, {
        code: "invalid_json",
        retryable: true,
        cause,
      });
    }

    try {
      return validateSnkrdunkPagePayload(payload, page);
    } catch (cause) {
      throw attemptError(cause.message, {
        code: cause.code ?? "invalid_payload",
        retryable: true,
        cause,
      });
    }
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetch and validate one page with bounded retry/backoff.
 * Returns the raw tradingCards array; it performs no writes.
 */
export async function fetchSnkrdunkDiscoveryPage({
  page,
  fetchImpl = globalThis.fetch,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  maxRetries = DEFAULT_MAX_RETRIES,
  retryDelayMs = DEFAULT_RETRY_DELAY_MS,
  sleepImpl = sleep,
} = {}) {
  positiveInteger(page, "page", SNKRDUNK_HARD_MAX_PAGES);
  positiveInteger(timeoutMs, "timeoutMs", 300_000);
  nonNegativeInteger(maxRetries, "maxRetries", MAX_RETRIES);
  nonNegativeInteger(retryDelayMs, "retryDelayMs", 300_000);
  if (typeof fetchImpl !== "function") throw new TypeError("fetchImpl must be a function");
  if (typeof sleepImpl !== "function") throw new TypeError("sleepImpl must be a function");

  const url = buildSnkrdunkDiscoveryUrl(page);
  let lastError;
  let attemptsMade = 0;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    attemptsMade++;
    try {
      return await fetchAttempt(fetchImpl, url, { page, timeoutMs });
    } catch (error) {
      lastError = error;
      const finalAttempt = attempt === maxRetries;
      if (finalAttempt || error.retryable === false) break;
      const backoffMs = retryDelayMs * 2 ** attempt;
      if (backoffMs > 0) await sleepImpl(backoffMs);
    }
  }

  throw new SnkrdunkDiscoveryError(lastError?.message ?? `SNKRDUNK page ${page} failed`, {
    code: lastError?.discoveryCode ?? "request_failed",
    page,
    attempts: attemptsMade,
    status: lastError?.status ?? null,
    cause: lastError,
  });
}

/**
 * Discover public SNKRDUNK One Piece listings without touching MeeCard.
 *
 * `fetchImpl` and `sleepImpl` are injectable for the supervisor's tests. The
 * first occurrence of a numeric SNKRDUNK id wins; conflicting duplicates are
 * counted so a later planner can fail closed instead of silently trusting them.
 * `maxPages` is a per-run batch limit, while `startPage` or a returned
 * `checkpoint` lets a backfill continue without turning the default run into an
 * unbounded crawl. When a checkpoint is supplied, only IDs not emitted by a
 * previous batch are returned.
 */
export async function discoverSnkrdunkOnePieceCards({
  fetchImpl = globalThis.fetch,
  startPage,
  maxPages = DEFAULT_MAX_PAGES,
  checkpoint = null,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  maxRetries = DEFAULT_MAX_RETRIES,
  retryDelayMs = DEFAULT_RETRY_DELAY_MS,
  pageDelayMs = DEFAULT_PAGE_DELAY_MS,
  sleepImpl = sleep,
} = {}) {
  positiveInteger(maxPages, "maxPages", SNKRDUNK_HARD_MAX_PAGES);
  nonNegativeInteger(pageDelayMs, "pageDelayMs", 300_000);

  const normalizedCheckpoint =
    checkpoint === null || checkpoint === undefined
      ? null
      : validateSnkrdunkDiscoveryCheckpoint(checkpoint);
  if (startPage !== undefined) {
    positiveInteger(startPage, "startPage", SNKRDUNK_HARD_MAX_PAGES);
  }
  if (
    normalizedCheckpoint &&
    startPage !== undefined &&
    startPage !== normalizedCheckpoint.nextPage
  ) {
    throw new TypeError("startPage must match checkpoint.nextPage");
  }

  const resolvedStartPage = startPage ?? normalizedCheckpoint?.nextPage ?? 1;
  const previouslySeenIds = new Set(normalizedCheckpoint?.seenSnkrdunkIds ?? []);
  const allSeenIds = new Set(previouslySeenIds);
  const byId = new Map();
  const stats = {
    pagesFetched: 0,
    rawItems: 0,
    opcgItems: 0,
    uniqueCards: 0,
    duplicateIds: 0,
    duplicateConflicts: 0,
    checkpointDuplicateIds: 0,
    nonOpcgItems: 0,
    invalidItems: 0,
    stopReason: "page-cap",
    startPage: resolvedStartPage,
    lastPageFetched: null,
    nextPage: resolvedStartPage,
    maxPages,
  };

  if (normalizedCheckpoint?.complete || normalizedCheckpoint?.blockedReason) {
    stats.stopReason = normalizedCheckpoint.complete
      ? "checkpoint-complete"
      : "checkpoint-blocked";
    stats.startPage = null;
    stats.nextPage = null;
    return {
      schemaVersion: 1,
      source: "SNKRDUNK",
      readOnly: true,
      cards: [],
      checkpoint: normalizedCheckpoint,
      stats,
    };
  }

  let complete = false;
  for (
    let page = resolvedStartPage, pagesInBatch = 0;
    pagesInBatch < maxPages && page <= SNKRDUNK_HARD_MAX_PAGES;
    page++, pagesInBatch++
  ) {
    const items = await fetchSnkrdunkDiscoveryPage({
      page,
      fetchImpl,
      timeoutMs,
      maxRetries,
      retryDelayMs,
      sleepImpl,
    });
    stats.pagesFetched++;
    stats.lastPageFetched = page;
    stats.rawItems += items.length;

    for (const item of items) {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        stats.invalidItems++;
        continue;
      }

      if (typeof item.productNumber !== "string") {
        stats.invalidItems++;
        continue;
      }

      const productNumber = item.productNumber.trim().toUpperCase();
      if (!isStrictOpcgPrintedCode(productNumber)) {
        stats.nonOpcgItems++;
        continue;
      }

      const snkrdunkId = numericId(item.id);
      if (snkrdunkId === null) {
        stats.invalidItems++;
        continue;
      }

      stats.opcgItems++;
      const minPriceFormat =
        typeof item.minPriceFormat === "string" && item.minPriceFormat.trim()
          ? item.minPriceFormat.trim()
          : null;
      const normalized = {
        snkrdunkId,
        productNumber,
        name: typeof item.name === "string" ? item.name.trim() : "",
        thumbnailUrl:
          typeof item.thumbnailUrl === "string" && item.thumbnailUrl.trim()
            ? item.thumbnailUrl.trim()
            : null,
        minPrice: optionalMoney(item.minPrice, minPriceFormat),
        minPriceFormat,
      };

      const existing = byId.get(snkrdunkId);
      if (existing) {
        stats.duplicateIds++;
        if (
          existing.productNumber !== normalized.productNumber ||
          existing.name !== normalized.name ||
          existing.thumbnailUrl !== normalized.thumbnailUrl
        ) {
          stats.duplicateConflicts++;
        }
        continue;
      }
      if (previouslySeenIds.has(snkrdunkId)) {
        stats.duplicateIds++;
        stats.checkpointDuplicateIds++;
        continue;
      }
      byId.set(snkrdunkId, normalized);
      allSeenIds.add(snkrdunkId);
    }

    if (items.length === 0) {
      stats.stopReason = "empty-page";
      complete = true;
      break;
    }
    if (items.length < SNKRDUNK_PAGE_SIZE) {
      stats.stopReason = "short-page";
      complete = true;
      break;
    }
    const hasAnotherPageInBatch = pagesInBatch + 1 < maxPages;
    const belowHardPageLimit = page < SNKRDUNK_HARD_MAX_PAGES;
    if (hasAnotherPageInBatch && belowHardPageLimit && pageDelayMs > 0) {
      await sleepImpl(pageDelayMs);
    }
  }

  let nextPage = null;
  let blockedReason = null;
  if (!complete && stats.lastPageFetched !== null) {
    if (stats.lastPageFetched >= SNKRDUNK_HARD_MAX_PAGES) {
      stats.stopReason = "hard-page-cap";
      blockedReason = "hard-page-cap";
    } else {
      nextPage = stats.lastPageFetched + 1;
    }
  }
  stats.nextPage = nextPage;

  const cards = [...byId.values()];
  stats.uniqueCards = cards.length;
  return {
    schemaVersion: 1,
    source: "SNKRDUNK",
    readOnly: true,
    cards,
    checkpoint: makeCheckpoint({
      complete,
      nextPage,
      blockedReason,
      seenSnkrdunkIds: allSeenIds,
    }),
    stats,
  };
}

export function parseSnkrdunkDiscoveryCliArgs(args) {
  let startPage;
  let maxPages = DEFAULT_MAX_PAGES;
  let checkpoint = null;
  let help = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") {
      help = true;
      continue;
    }
    if (arg === "--max-pages") {
      if (i + 1 >= args.length) throw new Error("--max-pages requires a value");
      maxPages = Number(args[++i]);
      continue;
    }
    if (arg.startsWith("--max-pages=")) {
      maxPages = Number(arg.slice("--max-pages=".length));
      continue;
    }
    if (arg === "--start-page") {
      if (i + 1 >= args.length) throw new Error("--start-page requires a value");
      startPage = Number(args[++i]);
      continue;
    }
    if (arg.startsWith("--start-page=")) {
      startPage = Number(arg.slice("--start-page=".length));
      continue;
    }
    if (arg === "--checkpoint") {
      if (i + 1 >= args.length) throw new Error("--checkpoint requires a JSON value");
      try {
        checkpoint = JSON.parse(args[++i]);
      } catch {
        throw new Error("--checkpoint must be valid JSON");
      }
      continue;
    }
    if (arg.startsWith("--checkpoint=")) {
      try {
        checkpoint = JSON.parse(arg.slice("--checkpoint=".length));
      } catch {
        throw new Error("--checkpoint must be valid JSON");
      }
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!help) {
    positiveInteger(maxPages, "maxPages", SNKRDUNK_HARD_MAX_PAGES);
    if (startPage !== undefined) {
      positiveInteger(startPage, "startPage", SNKRDUNK_HARD_MAX_PAGES);
    }
    if (checkpoint !== null) {
      checkpoint = validateSnkrdunkDiscoveryCheckpoint(checkpoint);
      if (startPage !== undefined && startPage !== checkpoint.nextPage) {
        throw new Error("--start-page must match checkpoint.nextPage");
      }
    }
  }
  return { startPage, maxPages, checkpoint, help };
}

async function runCli() {
  let parsed;
  try {
    parsed = parseSnkrdunkDiscoveryCliArgs(process.argv.slice(2));
  } catch (error) {
    console.error(JSON.stringify({ ok: false, error: error.message }));
    process.exitCode = 2;
    return;
  }

  if (parsed.help) {
    console.log(
      "Usage: node tools/companion/meecard-snkrdunk-discovery.mjs [--start-page N] [--max-pages N] [--checkpoint JSON]",
    );
    return;
  }

  try {
    const result = await discoverSnkrdunkOnePieceCards({
      startPage: parsed.startPage,
      maxPages: parsed.maxPages,
      checkpoint: parsed.checkpoint,
    });
    console.log(JSON.stringify({ ok: true, ...result }));
  } catch (error) {
    console.error(
      JSON.stringify({
        ok: false,
        error: error.message,
        code: error.code ?? "discovery_error",
        page: error.page ?? null,
      }),
    );
    process.exitCode = 1;
  }
}

const THIS_FILE = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === THIS_FILE) {
  await runCli();
}
