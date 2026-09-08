#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";

import {
  discoverSnkrdunkOnePieceCards,
  fetchSnkrdunkDiscoveryPage,
  isStrictOpcgPrintedCode,
  parseSnkrdunkDiscoveryCliArgs,
  validateSnkrdunkDiscoveryCheckpoint,
} from "./meecard-snkrdunk-discovery.mjs";

function response(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      if (payload instanceof Error) throw payload;
      return payload;
    },
  };
}

function pageFromUrl(url) {
  return Number(new URL(url).searchParams.get("page"));
}

test("strict OPCG code filter accepts only printed One Piece code families", () => {
  for (const code of ["OP01-001", "op17-045", "ST29-001", "EB04-061", "P-029"]) {
    assert.equal(isStrictOpcgPrintedCode(code), true, code);
  }
  for (const code of ["OP1-001", "OP01-01", "OP01-001_p1", "PRB01-001", "DON!!", "SV1-001", ""]) {
    assert.equal(isStrictOpcgPrintedCode(code), false, code);
  }
});

test("discovery paginates, filters non-OPCG rows, and deduplicates numeric IDs", async () => {
  const pageOne = [
    { id: 1, productNumber: "op01-001", name: "Luffy", thumbnailUrl: "https://img/1", minPrice: 10 },
    { id: 2, productNumber: "P-001", name: "Promo", thumbnailUrl: null, minPrice: 0 },
    ...Array.from({ length: 98 }, (_, i) => ({
      id: 10_000 + i,
      productNumber: `POKEMON-${i}`,
      name: "Not One Piece",
    })),
  ];
  const pageTwo = [
    { id: 1, productNumber: "OP01-001", name: "Luffy", thumbnailUrl: "https://img/1", minPrice: 11 },
    { id: 3, productNumber: "ST29-001", name: "Starter" },
    { id: 4, productNumber: "EB04-061", name: "Extra Booster" },
    { id: "5", productNumber: " op17-045 ", name: "  Rocks  " },
    { id: 6, productNumber: "OP1-001", name: "Malformed code" },
  ];
  const requestedPages = [];
  const sleepCalls = [];
  const fetchImpl = async (url) => {
    const page = pageFromUrl(url);
    requestedPages.push(page);
    return response({ tradingCards: page === 1 ? pageOne : pageTwo });
  };

  const result = await discoverSnkrdunkOnePieceCards({
    fetchImpl,
    maxPages: 8,
    maxRetries: 0,
    pageDelayMs: 7,
    sleepImpl: async (ms) => sleepCalls.push(ms),
  });

  assert.deepEqual(requestedPages, [1, 2]);
  assert.deepEqual(sleepCalls, [7]);
  assert.equal(result.readOnly, true);
  assert.deepEqual(
    result.cards.map((card) => [card.snkrdunkId, card.productNumber]),
    [
      [1, "OP01-001"],
      [2, "P-001"],
      [3, "ST29-001"],
      [4, "EB04-061"],
      [5, "OP17-045"],
    ],
  );
  assert.equal(result.cards[0].minPrice, 10, "first duplicate occurrence wins");
  assert.equal(result.cards[4].name, "Rocks");
  assert.deepEqual(result.stats, {
    pagesFetched: 2,
    rawItems: 105,
    opcgItems: 6,
    uniqueCards: 5,
    duplicateIds: 1,
    duplicateConflicts: 0,
    checkpointDuplicateIds: 0,
    nonOpcgItems: 99,
    invalidItems: 0,
    stopReason: "short-page",
    startPage: 1,
    lastPageFetched: 2,
    nextPage: null,
    maxPages: 8,
  });
  assert.deepEqual(result.checkpoint, {
    schemaVersion: 1,
    source: "SNKRDUNK",
    complete: true,
    nextPage: null,
    blockedReason: null,
    seenSnkrdunkIds: [1, 2, 3, 4, 5],
  });
});

test("native price formatting is preserved without claiming the value is USD", async () => {
  const result = await discoverSnkrdunkOnePieceCards({
    fetchImpl: async () =>
      response({
        tradingCards: [
          {
            id: 29,
            productNumber: "P-029",
            name: "Bartolomeo",
            minPrice: 1000,
            minPriceFormat: "฿ 1,000",
          },
        ],
      }),
    maxPages: 1,
    maxRetries: 0,
    pageDelayMs: 0,
  });

  assert.equal(result.cards[0].minPrice, 1000);
  assert.equal(result.cards[0].minPriceFormat, "฿ 1,000");
  assert.equal(Object.hasOwn(result.cards[0], "minPriceUsd"), false);
});

test("zero placeholder prices are null when the formatted price is a dash", async () => {
  const result = await discoverSnkrdunkOnePieceCards({
    fetchImpl: async () =>
      response({
        tradingCards: [
          { id: 30, productNumber: "P-030", minPrice: 0, minPriceFormat: "฿ -" },
          { id: 31, productNumber: "P-031", minPrice: 0, minPriceFormat: "$ -" },
          { id: 32, productNumber: "P-032", minPrice: 0, minPriceFormat: "-" },
          { id: 33, productNumber: "P-033", minPrice: 0, minPriceFormat: "฿ 0" },
          { id: 34, productNumber: "P-034", minPrice: 0, minPriceFormat: "SG $ -" },
        ],
      }),
    maxPages: 1,
    maxRetries: 0,
    pageDelayMs: 0,
  });

  assert.deepEqual(
    result.cards.map((card) => card.minPrice),
    [null, null, null, 0, null],
  );
  assert.deepEqual(
    result.cards.map((card) => card.minPriceFormat),
    ["฿ -", "$ -", "-", "฿ 0", "SG $ -"],
  );
});

test("an empty page stops discovery without requesting another page", async () => {
  let calls = 0;
  const result = await discoverSnkrdunkOnePieceCards({
    fetchImpl: async () => {
      calls++;
      return response({ tradingCards: [] });
    },
    maxPages: 5,
    maxRetries: 0,
    pageDelayMs: 0,
  });

  assert.equal(calls, 1);
  assert.equal(result.stats.stopReason, "empty-page");
  assert.equal(result.cards.length, 0);
});

test("page cap stops a full-page feed before requesting page N+1", async () => {
  const requestedPages = [];
  const fetchImpl = async (url) => {
    const page = pageFromUrl(url);
    requestedPages.push(page);
    return response({
      tradingCards: Array.from({ length: 100 }, (_, i) => ({
        id: page * 1000 + i,
        productNumber: `OP01-${String(i).padStart(3, "0")}`,
        name: `Card ${page}-${i}`,
      })),
    });
  };

  const result = await discoverSnkrdunkOnePieceCards({
    fetchImpl,
    maxPages: 2,
    maxRetries: 0,
    pageDelayMs: 0,
  });

  assert.deepEqual(requestedPages, [1, 2]);
  assert.equal(result.cards.length, 200);
  assert.equal(result.stats.stopReason, "page-cap");
  assert.equal(result.stats.nextPage, 3);
  assert.equal(result.checkpoint.complete, false);
  assert.equal(result.checkpoint.nextPage, 3);
});

test("checkpoint resumes the next bounded page and deduplicates IDs across batches", async () => {
  const firstPages = [];
  const first = await discoverSnkrdunkOnePieceCards({
    startPage: 3,
    maxPages: 2,
    maxRetries: 0,
    pageDelayMs: 0,
    fetchImpl: async (url) => {
      const page = pageFromUrl(url);
      firstPages.push(page);
      return response({
        tradingCards: Array.from({ length: 100 }, (_, i) => ({
          id: page * 1000 + i,
          productNumber: `OP01-${String(i).padStart(3, "0")}`,
          name: `Card ${page}-${i}`,
        })),
      });
    },
  });

  assert.deepEqual(firstPages, [3, 4]);
  assert.equal(first.stats.startPage, 3);
  assert.equal(first.stats.lastPageFetched, 4);
  assert.equal(first.stats.nextPage, 5);
  assert.equal(first.checkpoint.complete, false);
  assert.equal(first.checkpoint.nextPage, 5);
  assert.equal(first.checkpoint.seenSnkrdunkIds.length, 200);

  const secondPages = [];
  const second = await discoverSnkrdunkOnePieceCards({
    checkpoint: first.checkpoint,
    maxPages: 4,
    maxRetries: 0,
    pageDelayMs: 0,
    fetchImpl: async (url) => {
      secondPages.push(pageFromUrl(url));
      return response({
        tradingCards: [
          { id: 3000, productNumber: "OP01-000", name: "Already emitted" },
          { id: 5001, productNumber: "ST29-001", name: "New starter" },
          { id: 5002, productNumber: "P-029", name: "New promo" },
        ],
      });
    },
  });

  assert.deepEqual(secondPages, [5]);
  assert.deepEqual(second.cards.map((card) => card.snkrdunkId), [5001, 5002]);
  assert.equal(second.stats.duplicateIds, 1);
  assert.equal(second.stats.checkpointDuplicateIds, 1);
  assert.equal(second.stats.stopReason, "short-page");
  assert.equal(second.checkpoint.complete, true);
  assert.equal(second.checkpoint.nextPage, null);
  assert.equal(second.checkpoint.seenSnkrdunkIds.length, 202);
});

test("a completed checkpoint is idempotent and performs no fetch", async () => {
  let calls = 0;
  const checkpoint = {
    schemaVersion: 1,
    source: "SNKRDUNK",
    complete: true,
    nextPage: null,
    blockedReason: null,
    seenSnkrdunkIds: [9, 10],
  };
  const result = await discoverSnkrdunkOnePieceCards({
    checkpoint,
    fetchImpl: async () => {
      calls++;
      return response({ tradingCards: [] });
    },
  });

  assert.equal(calls, 0);
  assert.deepEqual(result.cards, []);
  assert.equal(result.stats.stopReason, "checkpoint-complete");
  assert.deepEqual(result.checkpoint, checkpoint);
});

test("hard page cap stops safely without requesting an out-of-range page", async () => {
  const requestedPages = [];
  const result = await discoverSnkrdunkOnePieceCards({
    startPage: 100,
    maxPages: 2,
    maxRetries: 0,
    pageDelayMs: 0,
    fetchImpl: async (url) => {
      requestedPages.push(pageFromUrl(url));
      return response({
        tradingCards: Array.from({ length: 100 }, (_, i) => ({
          id: 900_000 + i,
          productNumber: `OP01-${String(i).padStart(3, "0")}`,
        })),
      });
    },
  });

  assert.deepEqual(requestedPages, [100]);
  assert.equal(result.stats.stopReason, "hard-page-cap");
  assert.equal(result.stats.nextPage, null);
  assert.equal(result.checkpoint.complete, false);
  assert.equal(result.checkpoint.blockedReason, "hard-page-cap");
});

test("retryable HTTP failure backs off and then succeeds", async () => {
  let calls = 0;
  const sleeps = [];
  const cards = await fetchSnkrdunkDiscoveryPage({
    page: 1,
    fetchImpl: async () => {
      calls++;
      return calls === 1 ? response({}, 503) : response({ tradingCards: [] });
    },
    maxRetries: 1,
    retryDelayMs: 9,
    sleepImpl: async (ms) => sleeps.push(ms),
  });

  assert.deepEqual(cards, []);
  assert.equal(calls, 2);
  assert.deepEqual(sleeps, [9]);
});

test("malformed JSON and invalid envelopes fail closed after bounded retries", async (t) => {
  await t.test("malformed JSON", async () => {
    let calls = 0;
    await assert.rejects(
      fetchSnkrdunkDiscoveryPage({
        page: 1,
        fetchImpl: async () => {
          calls++;
          return response(new SyntaxError("bad json"));
        },
        maxRetries: 1,
        retryDelayMs: 0,
      }),
      (error) => error.code === "invalid_json" && error.page === 1 && error.attempts === 2,
    );
    assert.equal(calls, 2);
  });

  await t.test("missing tradingCards array", async () => {
    await assert.rejects(
      fetchSnkrdunkDiscoveryPage({
        page: 2,
        fetchImpl: async () => response({ tradingCards: {} }),
        maxRetries: 0,
      }),
      (error) => error.code === "invalid_payload" && error.page === 2,
    );
  });
});

test("non-retryable HTTP failure reports status and does not loop", async () => {
  let calls = 0;
  await assert.rejects(
    fetchSnkrdunkDiscoveryPage({
      page: 3,
      fetchImpl: async () => {
        calls++;
        return response({}, 404);
      },
      maxRetries: 4,
      retryDelayMs: 0,
    }),
    (error) =>
      error.code === "http_error" &&
      error.status === 404 &&
      error.page === 3 &&
      error.attempts === 1,
  );
  assert.equal(calls, 1);
});

test("request timeout aborts a hanging fetch", async () => {
  await assert.rejects(
    fetchSnkrdunkDiscoveryPage({
      page: 1,
      timeoutMs: 10,
      maxRetries: 0,
      fetchImpl: (_url, { signal }) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener("abort", () => {
            const error = new Error("aborted");
            error.name = "AbortError";
            reject(error);
          });
        }),
    }),
    (error) => error.code === "timeout" && error.page === 1,
  );
});

test("checkpoint validator rejects unsafe or ambiguous resume state", () => {
  assert.throws(() =>
    validateSnkrdunkDiscoveryCheckpoint({
      schemaVersion: 1,
      source: "SNKRDUNK",
      complete: false,
      nextPage: 2,
      blockedReason: null,
      seenSnkrdunkIds: [1, 1],
    }),
  );
  assert.throws(() =>
    validateSnkrdunkDiscoveryCheckpoint({
      schemaVersion: 1,
      source: "SNKRDUNK",
      complete: true,
      nextPage: 2,
      blockedReason: null,
      seenSnkrdunkIds: [],
    }),
  );
});

test("CLI parser accepts bounded resume inputs and rejects unsafe caps", () => {
  assert.deepEqual(parseSnkrdunkDiscoveryCliArgs(["--max-pages", "3"]), {
    startPage: undefined,
    maxPages: 3,
    checkpoint: null,
    help: false,
  });
  assert.deepEqual(parseSnkrdunkDiscoveryCliArgs(["--start-page=7", "--max-pages=4"]), {
    startPage: 7,
    maxPages: 4,
    checkpoint: null,
    help: false,
  });
  assert.equal(parseSnkrdunkDiscoveryCliArgs([]).maxPages, 25, "default remains bounded");

  const checkpoint = {
    schemaVersion: 1,
    source: "SNKRDUNK",
    complete: false,
    nextPage: 9,
    blockedReason: null,
    seenSnkrdunkIds: [1, 2],
  };
  const resumed = parseSnkrdunkDiscoveryCliArgs([
    "--start-page",
    "9",
    `--checkpoint=${JSON.stringify(checkpoint)}`,
  ]);
  assert.equal(resumed.startPage, 9);
  assert.deepEqual(resumed.checkpoint, checkpoint);

  assert.throws(() => parseSnkrdunkDiscoveryCliArgs(["--max-pages=1000"]));
  assert.throws(() =>
    parseSnkrdunkDiscoveryCliArgs([
      "--start-page=8",
      `--checkpoint=${JSON.stringify(checkpoint)}`,
    ]),
  );
  assert.throws(() => parseSnkrdunkDiscoveryCliArgs(["--checkpoint=not-json"]));
  assert.throws(() => parseSnkrdunkDiscoveryCliArgs(["--write"]));
});
