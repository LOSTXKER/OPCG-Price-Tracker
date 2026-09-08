import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { McpClient } from "./meecard-auto-match-supervisor.mjs";
import { discoverSnkrdunkOnePieceCards } from "./meecard-snkrdunk-discovery.mjs";
import {
  BACKFILL_JOB,
  BackfillUsageError,
  classifyBackfillListingReason,
  defaultBackfillPaths,
  parseBackfillCliArgs,
  readBackfillCheckpoint,
  runSnkrdunkBackfill,
  validateBackfillCheckpoint,
  writeAtomicBackfillCheckpoint,
} from "./meecard-snkrdunk-backfill.mjs";

function mcpResponse(id, data, { sessionId = "" } = {}) {
  const headers = { "content-type": "application/json" };
  if (sessionId) headers["mcp-session-id"] = sessionId;
  return new Response(JSON.stringify({
    jsonrpc: "2.0",
    id,
    result: { structuredContent: { status: 200, data } },
  }), { status: 200, headers });
}

function cardPage(actualPage, count = 100) {
  return Array.from({ length: count }, (_, index) => {
    const sequence = (actualPage - 1) * 100 + index + 1;
    return {
      id: actualPage * 1000 + index + 1,
      productNumber: `OP01-${String((sequence % 999) || 999).padStart(3, "0")}`,
      name: index === 1 ? `Card ${sequence} [EN]` : index === 2 ? `Card ${sequence} Unopened` : `Card ${sequence}`,
      thumbnailUrl: `https://cdn.snkrdunk.com/cards/${actualPage}-${index + 1}.webp`,
      minPrice: 100 + index,
      minPriceFormat: `฿ ${100 + index}`,
    };
  });
}

function createCombinedFetch({ pages = new Map(), mappingsByStatus = {} } = {}) {
  const rpcRequests = [];
  const sourcePages = [];
  const fetchImpl = async (url, options = {}) => {
    if (!options.body) {
      const page = Number(new URL(String(url)).searchParams.get("page"));
      sourcePages.push(page);
      return new Response(JSON.stringify({ tradingCards: pages.get(page) ?? [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    const request = JSON.parse(options.body);
    rpcRequests.push(request);
    if (request.method === "initialize") {
      return new Response(JSON.stringify({
        jsonrpc: "2.0",
        id: request.id,
        result: { protocolVersion: "2025-06-18", capabilities: {} },
      }), {
        status: 200,
        headers: { "content-type": "application/json", "mcp-session-id": "backfill-test" },
      });
    }
    if (request.method === "notifications/initialized") return new Response("", { status: 202 });
    assert.equal(request.method, "tools/call");
    assert.equal(request.params.name, "snkrdunk_mapping_list");
    const status = request.params.arguments.status;
    const rows = mappingsByStatus[status] ?? [];
    return mcpResponse(request.id, {
      data: rows,
      totalPage: 1,
      totalItems: rows.length,
    });
  };
  return { fetchImpl, rpcRequests, sourcePages };
}

async function tempLayout(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "meecard-snkr-backfill-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  return {
    root,
    checkpointPath: path.join(root, "state", "checkpoint.json"),
    reportDir: path.join(root, "reports"),
  };
}

function checkpoint(overrides = {}) {
  return {
    schemaVersion: 1,
    job: BACKFILL_JOB,
    discovery: {
      schemaVersion: 1,
      source: "SNKRDUNK",
      complete: false,
      nextPage: 1,
      blockedReason: null,
      seenSnkrdunkIds: [],
    },
    pagesProcessed: 0,
    ...overrides,
  };
}

function discoveryCheckpoint(overrides = {}) {
  return {
    schemaVersion: 1,
    source: "SNKRDUNK",
    complete: false,
    nextPage: 1,
    blockedReason: null,
    seenSnkrdunkIds: [],
    ...overrides,
  };
}

const fastDiscover = (options) => discoverSnkrdunkOnePieceCards({
  ...options,
  maxRetries: 0,
  pageDelayMs: 0,
});

test("CLI/env parsing is bounded and exposes no apply mode", () => {
  const homeDir = "/private/test-home";
  const defaults = defaultBackfillPaths(homeDir);
  assert.deepEqual(parseBackfillCliArgs([], {}, { homeDir }), {
    help: false,
    batchPages: 5,
    checkpointPath: defaults.checkpointPath,
    reportDir: defaults.reportDir,
    mcpUrl: "https://meecardtcg.com/mcp",
  });
  assert.equal(parseBackfillCliArgs([], {
    MEECARD_SNKRDUNK_BACKFILL_BATCH_PAGES: "7",
  }, { homeDir }).batchPages, 7);
  assert.equal(parseBackfillCliArgs(["--batch-pages=3"], {
    MEECARD_SNKRDUNK_BACKFILL_BATCH_PAGES: "7",
  }, { homeDir }).batchPages, 3);
  assert.throws(
    () => parseBackfillCliArgs(["--batch-pages=26"], {}, { homeDir }),
    (error) => error instanceof BackfillUsageError,
  );
  assert.throws(
    () => parseBackfillCliArgs(["--apply"], {}, { homeDir }),
    (error) => error instanceof BackfillUsageError && /ไม่รู้จัก/.test(error.message),
  );
});

test("conservative prefilter never describes an unmapped listing as safe", () => {
  assert.equal(classifyBackfillListingReason({ name: "Luffy [EN]" }), "explicit_locale");
  assert.equal(classifyBackfillListingReason({ name: "Luffy [ZH-TW]" }), "explicit_locale");
  assert.equal(
    classifyBackfillListingReason({ name: "Luffy English Language Edition" }),
    "explicit_locale",
  );
  assert.equal(
    classifyBackfillListingReason({ name: "Luffy Unopened Pack" }),
    "opened_or_unopened_product",
  );
  assert.equal(
    classifyBackfillListingReason({ name: "Luffy OP01-001" }),
    "requires_exact_variant_review",
  );
});

test("checkpoint schema rejects drift and unsafe state", () => {
  assert.deepEqual(validateBackfillCheckpoint(checkpoint()), checkpoint());
  assert.throws(() => validateBackfillCheckpoint({
    ...checkpoint(),
    discovery: discoveryCheckpoint({ nextPage: 0 }),
  }));
  assert.throws(() => validateBackfillCheckpoint({ ...checkpoint(), schemaVersion: 2 }));
  assert.throws(() => validateBackfillCheckpoint({ ...checkpoint(), unexpected: true }));
  assert.throws(() => validateBackfillCheckpoint({ ...checkpoint(), lastReportPath: "relative.json" }));
});

test("backfill resumes page windows, records every unique listing, and calls no mutation", async (t) => {
  const layout = await tempLayout(t);
  await writeAtomicBackfillCheckpoint(layout.checkpointPath, checkpoint({
    discovery: discoveryCheckpoint({ nextPage: 6 }),
    pagesProcessed: 5,
  }));
  const firstKnownId = cardPage(6)[0].id;
  const firstFetch = createCombinedFetch({
    pages: new Map([
      [6, cardPage(6)],
      [7, cardPage(7)],
    ]),
    mappingsByStatus: {
      pending: [{ id: 91, snkrdunkId: firstKnownId }],
    },
  });
  const first = await runSnkrdunkBackfill({
    argv: [
      "--batch-pages=2",
      `--checkpoint=${layout.checkpointPath}`,
      `--report-dir=${layout.reportDir}`,
      "--mcp-url=http://127.0.0.1:9999/mcp",
    ],
    env: {},
    fetchImpl: firstFetch.fetchImpl,
    clientFactory: (endpoint) => new McpClient(endpoint, { fetchImpl: firstFetch.fetchImpl }),
    discoverImpl: fastDiscover,
    now: () => new Date("2026-09-02T00:00:00.000Z"),
    uuid: () => "run-one",
  });

  assert.equal(first.status, "partial");
  assert.deepEqual(firstFetch.sourcePages, [6, 7]);
  assert.equal(first.report.listings.length, 200);
  assert.equal(first.report.counts.known, 1);
  assert.equal(first.report.counts.unmapped, 199);
  assert.equal(first.report.listings[0].known, true);
  assert.equal(first.report.listings[0].unmapped, false);
  assert.equal(first.report.listings[0].reason, "already_known");
  assert.equal(
    first.report.listings[0].sourceUrl,
    `https://snkrdunk.com/en/trading-cards/${firstKnownId}`,
  );
  assert.equal(first.report.listings[1].reason, "explicit_locale");
  assert.equal(Object.hasOwn(first.report.listings[1], "safe"), false);
  const firstCheckpoint = await readBackfillCheckpoint(layout.checkpointPath);
  assert.equal(firstCheckpoint.discovery.nextPage, 8);
  assert.equal(firstCheckpoint.discovery.complete, false);
  assert.equal(firstCheckpoint.discovery.seenSnkrdunkIds.length, 200);
  assert.equal(firstCheckpoint.pagesProcessed, 7);

  const reportStat = await fs.stat(first.reportPath);
  const reportDirStat = await fs.stat(layout.reportDir);
  const checkpointStat = await fs.stat(layout.checkpointPath);
  const checkpointDirStat = await fs.stat(path.dirname(layout.checkpointPath));
  assert.equal(reportStat.mode & 0o777, 0o600);
  assert.equal(checkpointStat.mode & 0o777, 0o600);
  assert.equal(reportDirStat.mode & 0o777, 0o700);
  assert.equal(checkpointDirStat.mode & 0o777, 0o700);
  const persistedReport = JSON.parse(await fs.readFile(first.reportPath, "utf8"));
  assert.equal(persistedReport.listings.length, 200);
  assert.deepEqual(persistedReport.source.pagesRequested, [6, 7]);

  const calledTools = firstFetch.rpcRequests
    .filter((request) => request.method === "tools/call")
    .map((request) => request.params.name);
  assert.deepEqual([...new Set(calledTools)], ["snkrdunk_mapping_list"]);
  assert.equal(calledTools.some((name) => /create|approve|refresh|undo/i.test(name)), false);

  const secondFetch = createCombinedFetch({
    pages: new Map([[8, cardPage(8, 1)]]),
  });
  const second = await runSnkrdunkBackfill({
    argv: [
      "--batch-pages=2",
      `--checkpoint=${layout.checkpointPath}`,
      `--report-dir=${layout.reportDir}`,
      "--mcp-url=http://127.0.0.1:9999/mcp",
    ],
    env: {},
    fetchImpl: secondFetch.fetchImpl,
    clientFactory: (endpoint) => new McpClient(endpoint, { fetchImpl: secondFetch.fetchImpl }),
    discoverImpl: fastDiscover,
    now: () => new Date("2026-09-02T00:05:00.000Z"),
    uuid: () => "run-two",
  });
  assert.equal(second.status, "complete");
  assert.deepEqual(secondFetch.sourcePages, [8]);
  assert.equal(second.report.listings.length, 1);
  const secondCheckpoint = await readBackfillCheckpoint(layout.checkpointPath);
  assert.equal(secondCheckpoint.discovery.nextPage, null);
  assert.equal(secondCheckpoint.discovery.complete, true);
  assert.equal(secondCheckpoint.discovery.seenSnkrdunkIds.length, 201);
  assert.equal(secondCheckpoint.pagesProcessed, 8);
});

test("report failure never advances the checkpoint", async (t) => {
  const layout = await tempLayout(t);
  const before = checkpoint({
    discovery: discoveryCheckpoint({ nextPage: 3 }),
    pagesProcessed: 2,
  });
  await writeAtomicBackfillCheckpoint(layout.checkpointPath, before);
  const rawBefore = await fs.readFile(layout.checkpointPath, "utf8");
  let checkpointWrites = 0;
  const client = {
    async initialize() {},
    async callReadOnly(name) {
      assert.equal(name, "snkrdunk_mapping_list");
      return { data: [], totalPage: 1, totalItems: 0 };
    },
  };

  await assert.rejects(
    runSnkrdunkBackfill({
      argv: [
        "--batch-pages=1",
        `--checkpoint=${layout.checkpointPath}`,
        `--report-dir=${layout.reportDir}`,
      ],
      env: {},
      clientFactory: () => client,
      discoverImpl: async () => ({
        cards: [{
          snkrdunkId: 333,
          productNumber: "OP03-033",
          name: "Card",
          thumbnailUrl: "https://cdn.snkrdunk.com/333.webp",
          minPrice: null,
          minPriceFormat: null,
        }],
        checkpoint: discoveryCheckpoint({ nextPage: 4, seenSnkrdunkIds: [333] }),
        stats: {
          pagesFetched: 1,
          startPage: 3,
          lastPageFetched: 3,
          stopReason: "page-cap",
        },
      }),
      writeReportImpl: async () => { throw new Error("disk full"); },
      writeCheckpointImpl: async () => { checkpointWrites++; },
      now: () => new Date("2026-09-02T01:00:00.000Z"),
      uuid: () => "report-failure",
    }),
    /disk full/,
  );
  assert.equal(checkpointWrites, 0);
  assert.equal(await fs.readFile(layout.checkpointPath, "utf8"), rawBefore);
  assert.deepEqual(await readBackfillCheckpoint(layout.checkpointPath), before);
});

test("a complete checkpoint refreshes the newest page without resetting historical progress", async (t) => {
  const layout = await tempLayout(t);
  const complete = checkpoint({
    discovery: discoveryCheckpoint({
      nextPage: null,
      complete: true,
      seenSnkrdunkIds: [101, 102],
    }),
    pagesProcessed: 18,
    updatedAt: "2026-09-01T00:00:00.000Z",
  });
  await writeAtomicBackfillCheckpoint(layout.checkpointPath, complete);
  const rawBefore = await fs.readFile(layout.checkpointPath, "utf8");
  const live = createCombinedFetch({
    pages: new Map([[1, cardPage(1, 1)]]),
  });
  const result = await runSnkrdunkBackfill({
    argv: [
      `--checkpoint=${layout.checkpointPath}`,
      `--report-dir=${layout.reportDir}`,
    ],
    env: {},
    fetchImpl: live.fetchImpl,
    clientFactory: (endpoint) => new McpClient(endpoint, { fetchImpl: live.fetchImpl }),
    discoverImpl: fastDiscover,
    now: () => new Date("2026-09-02T02:00:00.000Z"),
    uuid: () => "complete-noop",
  });

  assert.equal(result.status, "tail-refresh");
  assert.equal(result.checkpointAdvanced, false);
  assert.equal(result.report.reason, "checkpoint_complete_tail_refresh");
  assert.equal(result.report.listings.length, 1);
  assert.deepEqual(live.sourcePages, [1]);
  assert.equal(await fs.readFile(layout.checkpointPath, "utf8"), rawBefore);
  assert.deepEqual(await readBackfillCheckpoint(layout.checkpointPath), complete);
  assert.equal((await fs.stat(result.reportPath)).mode & 0o777, 0o600);
});
