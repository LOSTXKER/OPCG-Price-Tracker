import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createCanvas } from "@napi-rs/canvas";
import { summarizeMeeCardRun } from "./meecard-auto-match-report.mjs";

import {
  UsageError,
  McpClient,
  auditMatchedStructure,
  buildOperationalPulseDetail,
  buildYuyuteiPendingReview,
  classifySnkrdunkDiscovery,
  classifySnkrdunkPending,
  classifyYuyuteiPending,
  compareImageFeatures,
  createApplyJournal,
  decodeImageFeature,
  extractVariantMarkers,
  fetchImageFeature,
  parseCliArgs,
  parseMcpMessages,
  parseToolResult,
  runSupervisor,
  resolveApplyJournalPath,
  snkrWatermarkTolerantVisualPredicate,
  shouldWriteHeartbeat,
} from "./meecard-auto-match-supervisor.mjs";

function solidCard(color) {
  const canvas = createCanvas(240, 336);
  const context = canvas.getContext("2d");
  context.fillStyle = color;
  context.fillRect(0, 0, canvas.width, canvas.height);
  return canvas.toBuffer("image/png");
}

function patternedCard({ padded = false, badge = false } = {}) {
  const card = createCanvas(240, 336);
  const context = card.getContext("2d");
  context.fillStyle = "#f6d54a";
  context.fillRect(0, 0, card.width, card.height);
  context.fillStyle = "#6b2dbd";
  context.fillRect(12, 18, 216, 210);
  context.fillStyle = "#e74c3c";
  context.beginPath();
  context.arc(120, 110, 58, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#111827";
  context.fillRect(16, 246, 208, 70);
  if (!padded) return card.toBuffer("image/png");
  const canvas = createCanvas(800, 600);
  const paddedContext = canvas.getContext("2d");
  paddedContext.drawImage(card, 280, 132);
  if (badge) {
    paddedContext.fillStyle = "#f97316";
    paddedContext.beginPath();
    paddedContext.arc(595, 165, 36, 0, Math.PI * 2);
    paddedContext.fill();
  }
  return canvas.toBuffer("image/png");
}

function mapping(overrides = {}) {
  return {
    id: 11,
    scrapedCode: "OP01-001",
    setCode: "OP01",
    scrapedRarity: "R",
    scrapedName: "Monkey D. Luffy",
    scrapedImage: "source-image",
    ...overrides,
  };
}

function candidate(overrides = {}) {
  return {
    id: 101,
    cardCode: "OP01-001",
    rarity: "R",
    set: { code: "OP01" },
    imageUrl: "candidate-image",
    ...overrides,
  };
}

function yuyuteiPendingMapping(overrides = {}) {
  return {
    id: 11,
    setCode: "op01",
    yuyuteiId: "10001",
    sourceUrl: "https://yuyu-tei.jp/sell/opc/card/op01/10001",
    scrapedCode: "OP01-001",
    scrapedName: "Monkey D. Luffy",
    scrapedRarity: "R",
    scrapedImage: "https://card.yuyu-tei.jp/opc/front/op01/10001.jpg",
    priceJpy: 220,
    inStock: true,
    status: "PENDING",
    updatedAt: "2026-09-01T00:00:00.000Z",
    ...overrides,
  };
}

function yuyuteiCandidate(overrides = {}) {
  return candidate({
    id: 101,
    cardCode: "OP01-001",
    imageUrl: "https://asia-en.onepiece-cardgame.com/images/cardlist/card/OP01-001.png",
    isParallel: false,
    ...overrides,
  });
}

function snkrPendingMapping(overrides = {}) {
  return {
    id: 501,
    snkrdunkId: 7001,
    productNumber: "OP01-001",
    scrapedName: "Monkey D. Luffy R [OP01-001]",
    sourceUrl: "https://snkrdunk.com/en/trading-cards/7001",
    thumbnailUrl: "source-image",
    minPriceUsd: 10,
    usedMinPriceUsd: 9,
    lastSoldPsa10Usd: 40,
    candidates: [candidate()],
    ...overrides,
  };
}

function mcpToolResponse(id, payload, { sessionId = "" } = {}) {
  const headers = { "content-type": "application/json" };
  if (sessionId) headers["mcp-session-id"] = sessionId;
  return new Response(JSON.stringify({
    jsonrpc: "2.0",
    id,
    result: {
      structuredContent: { status: 200, data: payload },
    },
  }), { status: 200, headers });
}

function createSupervisorFetch({
  catalogCards = [],
  catalogTotal = catalogCards.length,
  discoveredCards = [],
  discoveryFails = false,
  productLookup = null,
  productLookupFails = false,
  snkrPending = [],
  snkrMatched = [],
  yuyuteiPending = [],
  yuyuteiMatched = [],
  yuyuteiCandidates = {},
  approveBehavior = "success",
  approveRawPrice = null,
  readbackFailsAfterApprove = false,
  externalYuyuteiTargetCollisionAfterApprove = false,
  onToolCall = null,
} = {}) {
  const rpcRequests = [];
  const state = {
    yuyuteiPending: yuyuteiPending.map((row) => structuredClone(row)),
    yuyuteiMatched: yuyuteiMatched.map((row) => structuredClone(row)),
  };
  const emptyPage = { data: [], totalPage: 1, totalItems: 0 };
  const fetchImpl = async (url, options = {}) => {
    if (!options.body) {
      if (String(url).includes("/v1/trading-cards")) {
        if (discoveryFails) throw new Error("SNKRDUNK unavailable");
        return new Response(JSON.stringify({ tradingCards: discoveredCards }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
      const image = solidCard(String(url).includes("blue") ? "#0033dd" : "#d92222");
      return new Response(image, {
        status: 200,
        headers: { "content-type": "image/png", "content-length": String(image.length) },
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
        headers: { "content-type": "application/json", "mcp-session-id": "test-session" },
      });
    }
    if (request.method === "notifications/initialized") return new Response("", { status: 202 });
    assert.equal(request.method, "tools/call");
    assert.ok([
      "card_list",
      "card_set_list",
      "yuyutei_mapping_list",
      "yuyutei_mapping_candidates",
      "snkrdunk_mapping_list",
      "snkrdunk_product_lookup",
      "yuyutei_mapping_approve",
    ].includes(request.params.name));
    if (onToolCall) await onToolCall({ request, state });
    if (request.params.name === "yuyutei_mapping_list") {
      const allowed = new Set(["status", "keyword", "sort", "order", "page", "limit"]);
      assert.deepEqual(
        Object.keys(request.params.arguments).filter((key) => !allowed.has(key)),
        [],
        "Yuyutei list request sent an unknown argument",
      );
    }
    if (request.params.name === "card_set_list") {
      return mcpToolResponse(request.id, [{ code: "op01" }]);
    }
    if (request.params.name === "card_list") {
      const cards = request.params.arguments.set ? catalogCards : catalogCards.slice(0, 1);
      return mcpToolResponse(request.id, {
        data: cards,
        totalPage: 1,
        totalItems: request.params.arguments.set ? cards.length : catalogTotal,
      });
    }
    if (request.params.name === "snkrdunk_mapping_list" && request.params.arguments.status === "matched") {
      return mcpToolResponse(request.id, {
        data: snkrMatched,
        totalPage: 1,
        totalItems: snkrMatched.length,
      });
    }
    if (request.params.name === "snkrdunk_mapping_list" && request.params.arguments.status === "pending") {
      return mcpToolResponse(request.id, {
        data: snkrPending,
        totalPage: 1,
        totalItems: snkrPending.length,
      });
    }
    if (request.params.name === "yuyutei_mapping_list" && request.params.arguments.status === "matched") {
      if (readbackFailsAfterApprove && state.yuyuteiMatched.some((row) => Number(row.id) === 11)) {
        throw new Error("readback unavailable");
      }
      assert.equal(Object.hasOwn(request.params.arguments, "search"), false);
      const keyword = String(request.params.arguments.keyword ?? "").toUpperCase();
      const rows = keyword
        ? state.yuyuteiMatched.filter((row) => JSON.stringify(row).toUpperCase().includes(keyword))
        : state.yuyuteiMatched;
      return mcpToolResponse(request.id, {
        data: rows,
        totalPage: 1,
        totalItems: rows.length,
      });
    }
    if (request.params.name === "yuyutei_mapping_list" && request.params.arguments.status === "pending") {
      assert.equal(Object.hasOwn(request.params.arguments, "search"), false);
      const keyword = String(request.params.arguments.keyword ?? "").toUpperCase();
      const rows = keyword
        ? state.yuyuteiPending.filter((row) => JSON.stringify(row).toUpperCase().includes(keyword))
        : state.yuyuteiPending;
      return mcpToolResponse(request.id, {
        data: rows,
        totalPage: 1,
        totalItems: rows.length,
      });
    }
    if (request.params.name === "yuyutei_mapping_candidates") {
      const mappingId = Number(request.params.arguments.mappingId);
      return mcpToolResponse(request.id, {
        mappingId,
        candidates: yuyuteiCandidates[mappingId] ?? [],
      });
    }
    if (request.params.name === "yuyutei_mapping_approve") {
      const mappingId = Number(request.params.arguments.mappingId);
      const matchedCardId = Number(request.params.arguments.matchedCardId);
      const pendingIndex = state.yuyuteiPending.findIndex((row) => Number(row.id) === mappingId);
      const source = pendingIndex >= 0 ? state.yuyuteiPending[pendingIndex] : null;
      const target = (yuyuteiCandidates[mappingId] ?? []).find((row) => Number(row.id) === matchedCardId);
      const commit = () => {
        if (!source || !target) return;
        state.yuyuteiPending.splice(pendingIndex, 1);
        state.yuyuteiMatched.push({
          ...source,
          status: "MATCHED",
          matchedCardId,
          matchedCard: {
            ...target,
            latestPriceJpy: String(approveRawPrice ?? source.priceJpy),
          },
          updatedAt: "2026-09-01T00:00:01.000Z",
        });
        if (externalYuyuteiTargetCollisionAfterApprove) {
          state.yuyuteiMatched.push({
            ...source,
            id: 999,
            yuyuteiId: "external-writer",
            status: "MATCHED",
            matchedCardId,
            matchedCard: {
              ...target,
              latestPriceJpy: String(source.priceJpy),
            },
            updatedAt: "2026-09-01T00:00:01.500Z",
          });
        }
      };
      if (approveBehavior === "tool-error") {
        return new Response(JSON.stringify({
          jsonrpc: "2.0",
          id: request.id,
          result: { isError: true, content: [{ type: "text", text: "approve failed" }] },
        }), { status: 200, headers: { "content-type": "application/json" } });
      }
      if (approveBehavior === "tool-error-success") {
        commit();
        return new Response(JSON.stringify({
          jsonrpc: "2.0",
          id: request.id,
          result: { isError: true, content: [{ type: "text", text: "uncertain approve result" }] },
        }), { status: 200, headers: { "content-type": "application/json" } });
      }
      if (approveBehavior === "http-401") {
        return new Response("unauthorized", { status: 401, headers: { "content-type": "text/plain" } });
      }
      if (approveBehavior === "ambiguous-success") {
        commit();
        throw new Error("socket timed out");
      }
      if (approveBehavior === "ambiguous-pending") throw new Error("socket timed out");
      commit();
      return mcpToolResponse(request.id, { mappingId, matchedCardId, status: "MATCHED" });
    }
    if (request.params.name === "snkrdunk_product_lookup") {
      if (productLookupFails) {
        return new Response(JSON.stringify({
          jsonrpc: "2.0",
          id: request.id,
          result: { isError: true, content: [{ type: "text", text: "lookup failed" }] },
        }), { status: 200, headers: { "content-type": "application/json" } });
      }
      return mcpToolResponse(request.id, productLookup);
    }
    return mcpToolResponse(request.id, emptyPage);
  };
  return { fetchImpl, rpcRequests, state };
}

function assertSubset(actual, expected) {
  for (const [key, value] of Object.entries(expected)) {
    assert.deepEqual(actual[key], value, `unexpected ${key}`);
  }
}

function memoryJournalFactory(events = [], { failIntent = false } = {}) {
  return () => ({
    path: "/memory/meecard-apply-journal.jsonl",
    append(event) {
      if (failIntent && event.event === "intent") throw new Error("intent journal unavailable");
      events.push(structuredClone(event));
    },
    close() {},
  });
}

test("parseMcpMessages parses SSE and parseToolResult unwraps JSON text payload", () => {
  const innerPayload = { status: 200, data: { mappingId: 44, candidates: [{ id: 9 }] } };
  const rpcMessage = {
    jsonrpc: "2.0",
    id: 7,
    result: {
      content: [{ type: "text", text: JSON.stringify(innerPayload) }],
    },
  };
  const raw = [
    "event: message",
    `data: ${JSON.stringify(rpcMessage)}`,
    "",
    "data: [DONE]",
    "",
  ].join("\n");

  const messages = parseMcpMessages(raw);

  assert.deepEqual(messages, [rpcMessage]);
  assert.deepEqual(parseToolResult(messages[0]), innerPayload.data);
});

test("parseCliArgs keeps default read-only and requires the exact bounded Yuyutei apply gates", () => {
  assert.deepEqual(parseCliArgs([], {}), {
    help: false,
    mode: "read-only",
    applyYuyutei: false,
    applyYuyuteiMax: 1,
    dryRun: false,
  });
  assert.throws(
    () => parseCliArgs(["--apply-yuyutei"], {}),
    (error) => error instanceof UsageError && /MEECARD_AUTO_MATCH_APPLY_YUYUTEI=1/.test(error.message),
  );
  assert.throws(
    () => parseCliArgs(["--apply-yuyutei"], { MEECARD_AUTO_MATCH_APPLY: "1", MEECARD_MCP_TOKEN: "present" }),
    (error) => error instanceof UsageError && /APPLY_YUYUTEI/.test(error.message),
  );
  assert.throws(
    () => parseCliArgs(["--dry-run", "--apply-yuyutei"], { MEECARD_AUTO_MATCH_APPLY_YUYUTEI: "1" }),
    (error) => error instanceof UsageError && /dry-run/.test(error.message),
  );
  assert.throws(
    () => parseCliArgs(["--apply-yuyutei"], {
      MEECARD_AUTO_MATCH_APPLY_YUYUTEI: "1",
      MEECARD_AUTO_MATCH_YUYUTEI_MAX: "51",
    }),
    (error) => error instanceof UsageError && /1-50/.test(error.message),
  );
  assertSubset(parseCliArgs(["--apply-yuyutei"], {
    MEECARD_AUTO_MATCH_APPLY_YUYUTEI: "1",
    MEECARD_AUTO_MATCH_YUYUTEI_MAX: "3",
  }), {
    mode: "apply-yuyutei",
    applyYuyutei: true,
    applyYuyuteiMax: 3,
  });
});

test("MCP client blocks raw mutation tools before any network request", async () => {
  let calls = 0;
  const client = new McpClient("https://meecardtcg.com/mcp", {
    fetchImpl: async () => { calls++; throw new Error("must not fetch"); },
  });

  await assert.rejects(
    client.rpc({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: { name: "yuyutei_mapping_approve", arguments: { mappingId: 1, matchedCardId: 2 } },
    }),
    (error) => error?.code === "tool_not_allowed",
  );
  assert.equal(calls, 0);

  const applyClient = new McpClient("https://meecardtcg.com/mcp", {
    allowYuyuteiMutation: true,
    fetchImpl: async () => { calls++; throw new Error("must not fetch"); },
  });
  await assert.rejects(
    applyClient.rpc({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: { name: "snkrdunk_mapping_approve", arguments: { mappingId: 1, matchedCardId: 2 } },
    }, { mutation: true }),
    (error) => error?.code === "tool_not_allowed",
  );
  assert.equal(calls, 0);
});

test("extractVariantMarkers recognizes artwork, treatment, stamp, and correction markers", () => {
  assert.deepEqual(
    extractVariantMarkers("スーパーパラレル 海賊旗 フォイル 刻印なし 修正前"),
    ["foil", "parallel", "pirate-flag-foil", "pre-correction", "super-parallel", "unstamped"],
  );
  assert.equal(extractVariantMarkers("unstamped").includes("stamped"), false);
});

test("special Yuyutei treatment needs explicit target metadata even when the image is exact", async () => {
  const source = await decodeImageFeature(solidCard("#d92222"), { url: "source-image" });
  const target = await decodeImageFeature(solidCard("#d92222"), { url: "candidate-image" });
  const args = {
    mapping: mapping({ scrapedName: "Monkey D. Luffy Pirate Flag Foil" }),
    candidates: [candidate({ isParallel: true })],
    imageFeatures: new Map([["source-image", source], ["candidate-image", target]]),
  };

  assertSubset(classifyYuyuteiPending(args), {
    category: "blocked",
    reason: "unverifiable_treatment",
  });
  assertSubset(classifyYuyuteiPending({
    ...args,
    candidates: [candidate({ isParallel: true, variantLabel: "Pirate Flag Foil" })],
  }), {
    category: "shadow_candidate",
    targetCardId: 101,
  });

  assertSubset(classifyYuyuteiPending({
    ...args,
    mapping: mapping({ scrapedName: "Monkey D. Luffy" }),
    candidates: [candidate({ treatment: "Stamped" })],
  }), {
    category: "blocked",
    reason: "unverifiable_treatment",
  });
});

test("exact image becomes a shadow candidate unless its target is already occupied", async () => {
  const image = await decodeImageFeature(solidCard("#d92222"), { url: "source-image" });
  const duplicate = await decodeImageFeature(solidCard("#d92222"), { url: "candidate-image" });
  const visual = compareImageFeatures(image, duplicate);

  assert.equal(image.ok, true);
  assert.equal(visual.score, 0);
  assert.equal(visual.exactNormalizedRgb, true);

  const args = {
    mapping: mapping(),
    candidates: [candidate()],
    imageFeatures: new Map([
      ["source-image", image],
      ["candidate-image", duplicate],
    ]),
  };
  assertSubset(classifyYuyuteiPending(args), {
    category: "shadow_candidate",
    reason: "exact_metadata_and_visual",
    targetCardId: 101,
    visualScore: 0,
  });
  assertSubset(classifyYuyuteiPending({ ...args, occupiedTargetIds: new Set([101]) }), {
    category: "blocked",
    reason: "target_collision",
  });
});

test("transparent padding is cropped before card artwork comparison", async () => {
  const padded = await decodeImageFeature(patternedCard({ padded: true }), { url: "source-image" });
  const target = await decodeImageFeature(patternedCard(), { url: "candidate-image" });
  const visual = compareImageFeatures(padded, target);

  assert.equal(padded.ok, true);
  assert.notDeepEqual(padded.contentRect, [0, 0, 1, 1]);
  assert.equal(target.ok, true);
  assert.ok(visual.score < 0.02, `expected transparent padding to be removed, got ${visual.score}`);
});

test("a separate SNKRDUNK badge does not expand the detected card crop", async () => {
  const padded = await decodeImageFeature(patternedCard({ padded: true, badge: true }), { url: "source-image" });
  const target = await decodeImageFeature(patternedCard(), { url: "candidate-image" });
  const visual = compareImageFeatures(padded, target);

  assert.equal(padded.ok, true);
  assert.equal(target.ok, true);
  assert.ok(visual.score < 0.02, `expected detached badge to be ignored, got ${visual.score}`);
});

test("placeholder source is blocked before visual matching", async () => {
  const placeholder = await decodeImageFeature(solidCard("#ffffff"), {
    url: "https://example.test/placeholder.png",
  });
  const target = await decodeImageFeature(solidCard("#ffffff"), { url: "candidate-image" });

  assertSubset(classifyYuyuteiPending({
    mapping: mapping({ scrapedImage: "https://example.test/placeholder.png" }),
    candidates: [candidate()],
    imageFeatures: new Map([
      ["https://example.test/placeholder.png", placeholder],
      ["candidate-image", target],
    ]),
  }), {
    category: "blocked",
    reason: "source_placeholder",
  });
});

test("image loader rejects unknown hosts and non-image responses", async () => {
  let calls = 0;
  const unknownHost = await fetchImageFeature("https://example.test/card.png", {
    fetchImpl: async () => { calls++; throw new Error("must not fetch"); },
  });
  assert.equal(unknownHost.reason, "image_host_not_allowed");
  assert.equal(calls, 0);

  const insecure = await fetchImageFeature("http://card.yuyu-tei.jp/opc/front/op01/10001.jpg", {
    fetchImpl: async () => { calls++; throw new Error("must not fetch"); },
  });
  assert.equal(insecure.reason, "image_https_required");
  assert.equal(calls, 0);

  const wrongType = await fetchImageFeature("https://card.yuyu-tei.jp/opc/front/op01/10001.jpg", {
    retries: 1,
    fetchImpl: async () => new Response("not an image", { status: 200, headers: { "content-type": "text/html" } }),
  });
  assert.equal(wrongType.reason, "non_image_content_type");
});

test("different colors with near-equal luminance cannot use an exact-image bypass", async () => {
  const source = await decodeImageFeature(solidCard("rgb(255, 0, 0)"), { url: "source-image" });
  const target = await decodeImageFeature(solidCard("rgb(0, 130, 0)"), { url: "candidate-image" });
  const visual = compareImageFeatures(source, target);

  assert.equal(visual.exactRawBytes, false);
  assert.equal(visual.exactNormalizedRgb, false);
  assert.ok(visual.score > 0, "same luminance must not force score=0");
  assert.equal(classifyYuyuteiPending({
    mapping: mapping(),
    candidates: [candidate()],
    imageFeatures: new Map([["source-image", source], ["candidate-image", target]]),
  }).category, "blocked");
});

test("visually different sole candidate remains blocked despite exact metadata", async () => {
  const source = await decodeImageFeature(solidCard("#ff0000"), { url: "source-image" });
  const target = await decodeImageFeature(solidCard("#0000ff"), { url: "candidate-image" });
  const visual = compareImageFeatures(source, target);

  assert.ok(visual.score > 0.20, `expected score above gate, got ${visual.score}`);
  assertSubset(classifyYuyuteiPending({
    mapping: mapping(),
    candidates: [candidate()],
    imageFeatures: new Map([
      ["source-image", source],
      ["candidate-image", target],
    ]),
  }), {
    category: "blocked",
    reason: "visual_score_too_high",
  });
});

test("identical same-code variants remain blocked when the visual margin is zero", async () => {
  const source = await decodeImageFeature(solidCard("#c81818"), { url: "source-image" });
  const first = await decodeImageFeature(solidCard("#c81818"), { url: "candidate-one" });
  const second = await decodeImageFeature(solidCard("#c81818"), { url: "candidate-two" });
  const result = classifyYuyuteiPending({
    mapping: mapping(),
    candidates: [candidate({ id: 101, imageUrl: "candidate-one" }), candidate({ id: 102, imageUrl: "candidate-two" })],
    imageFeatures: new Map([
      ["source-image", source],
      ["candidate-one", first],
      ["candidate-two", second],
    ]),
  });
  assertSubset(result, { category: "blocked", reason: "visual_margin_too_small", margin: 0 });
});

test("SNKRDUNK shadow blocks explicit locale and opened or unopened products", () => {
  const base = {
    snkrdunkId: 7001,
    productNumber: "OP01-001",
    name: "Monkey D. Luffy R [OP01-001]",
    thumbnailUrl: "source-image",
  };
  assertSubset(classifySnkrdunkDiscovery({
    listing: { ...base, name: `${base.name}[EN]` },
    candidates: [candidate()],
  }), { category: "blocked", reason: "explicit_locale" });
  assertSubset(classifySnkrdunkDiscovery({
    listing: { ...base, name: `${base.name}[FR]` },
    candidates: [candidate()],
  }), { category: "blocked", reason: "explicit_locale" });
  assertSubset(classifySnkrdunkDiscovery({
    listing: { ...base, name: `${base.name}[JP]` },
    candidates: [candidate()],
  }), { category: "blocked", reason: "source_image_error" });
  assertSubset(classifySnkrdunkDiscovery({
    listing: { ...base, name: `${base.name} :Unopen` },
    candidates: [candidate()],
  }), { category: "blocked", reason: "opened_or_unopened_product" });
  assertSubset(classifySnkrdunkDiscovery({
    listing: { ...base, name: "Monkey D. Luffy R [OP02-001]" },
    candidates: [candidate()],
  }), { category: "blocked", reason: "source_code_conflict" });
});

test("SNKRDUNK shadow requires symmetric special-treatment metadata", async () => {
  const source = await decodeImageFeature(solidCard("#d92222"), { url: "source-image" });
  const target = await decodeImageFeature(solidCard("#d92222"), { url: "candidate-image" });
  const listing = {
    snkrdunkId: 7009,
    productNumber: "OP01-001",
    name: "Monkey D. Luffy R [OP01-001]",
    thumbnailUrl: "source-image",
  };
  const args = {
    listing,
    candidates: [candidate({ treatment: "Stamped" })],
    imageFeatures: new Map([["source-image", source], ["candidate-image", target]]),
  };

  assertSubset(classifySnkrdunkDiscovery(args), {
    category: "blocked",
    reason: "unverifiable_treatment",
  });
  assertSubset(classifySnkrdunkDiscovery({
    ...args,
    listing: { ...listing, name: `${listing.name} Stamped` },
  }), {
    category: "shadow_candidate",
    targetCardId: 101,
  });
});

test("SNKRDUNK shadow blocks a visually different candidate and an occupied exact target", async () => {
  const source = await decodeImageFeature(solidCard("#ff0000"), { url: "source-image" });
  const different = await decodeImageFeature(solidCard("#0000ff"), { url: "candidate-image" });
  const exact = await decodeImageFeature(solidCard("#ff0000"), { url: "candidate-image" });
  const listing = {
    snkrdunkId: 7002,
    productNumber: "OP01-001",
    name: "Monkey D. Luffy R [OP01-001]",
    thumbnailUrl: "source-image",
  };

  assertSubset(classifySnkrdunkDiscovery({
    listing,
    candidates: [candidate()],
    imageFeatures: new Map([["source-image", source], ["candidate-image", different]]),
  }), { category: "blocked", reason: "visual_score_too_high" });
  assertSubset(classifySnkrdunkDiscovery({
    listing,
    candidates: [candidate()],
    occupiedTargetIds: new Set([101]),
    imageFeatures: new Map([["source-image", source], ["candidate-image", exact]]),
  }), { category: "blocked", reason: "target_collision", targetCardId: 101 });
});

test("SNKRDUNK SAMPLE-watermark fallback is limited to one standard base Booster target", () => {
  const listing = {
    snkrdunkId: 881663,
    productNumber: "OP17-110",
    name: 'Charlotte Perospero C [OP17-110](Booster Pack "THE WORLD’S STRONGEST WARRIORS")',
    thumbnailUrl: "https://cdn.snkrdunk.com/upload_bg_removed/card.webp",
  };
  const card = candidate({
    id: 4266,
    cardCode: "OP17-110",
    rarity: "C",
    imageUrl: "https://asia-en.onepiece-cardgame.com/images/cardlist/card/OP17-110.png",
  });
  const visual = {
    score: 0.33,
    exactRawBytes: false,
    exactNormalizedRgb: false,
    regions: {
      full: { correlation: 0.50, histogramDistance: 0.38 },
      art: { correlation: 0.46, histogramDistance: 0.34 },
      upperArt: { correlation: 0.49, histogramDistance: 0.33 },
      lowerFrame: { correlation: 0.25, histogramDistance: 0.30 },
    },
  };

  assertSubset(snkrWatermarkTolerantVisualPredicate({
    visual,
    listing,
    card,
    sourceMarkers: new Set(),
    compatibleCount: 1,
  }), { ok: true, reason: "official_sample_watermark_tolerant" });
  assertSubset(snkrWatermarkTolerantVisualPredicate({
    visual,
    listing,
    card,
    sourceMarkers: new Set(),
    compatibleCount: 2,
  }), { ok: false, reason: "watermark_candidate_not_unique" });
  assertSubset(snkrWatermarkTolerantVisualPredicate({
    visual: {
      ...visual,
      regions: {
        ...visual.regions,
        full: { correlation: 0.20, histogramDistance: 0.55 },
      },
    },
    listing,
    card,
    sourceMarkers: new Set(),
    compatibleCount: 1,
  }), { ok: false, reason: "watermark_visual_evidence_too_weak" });
  assertSubset(snkrWatermarkTolerantVisualPredicate({
    visual,
    listing,
    card: { ...card, isParallel: true },
    sourceMarkers: new Set(["parallel"]),
    compatibleCount: 1,
  }), { ok: false, reason: "watermark_fallback_not_eligible" });
  assertSubset(snkrWatermarkTolerantVisualPredicate({
    visual,
    listing: { ...listing, name: 'C [OP17-110](Booster Pack "THE WORLD’S STRONGEST WARRIORS")' },
    card,
    sourceMarkers: new Set(),
    compatibleCount: 1,
  }), { ok: false, reason: "watermark_fallback_not_eligible" });
  for (const rarity of ["SP", "P"]) {
    assertSubset(snkrWatermarkTolerantVisualPredicate({
      visual,
      listing: { ...listing, name: `Charlotte Perospero ${rarity} [OP17-110](Booster Pack "THE WORLD’S STRONGEST WARRIORS")` },
      card: { ...card, rarity },
      sourceMarkers: new Set(),
      compatibleCount: 1,
    }), { ok: false, reason: "watermark_fallback_not_eligible" });
  }
});

test("SNKRDUNK pending keeps a visual candidate while blocking explicit non-Japanese markers", async () => {
  const source = await decodeImageFeature(solidCard("#d92222"), { url: "source-image" });
  const target = await decodeImageFeature(solidCard("#d92222"), { url: "candidate-image" });
  const imageFeatures = new Map([["source-image", source], ["candidate-image", target]]);

  assertSubset(classifySnkrdunkPending({
    mapping: snkrPendingMapping(),
    imageFeatures,
  }), {
    category: "shadow_candidate",
    reason: "exact_metadata_and_visual",
    targetCardId: 101,
    target: candidate(),
    visualScore: 0,
  });
  assertSubset(classifySnkrdunkPending({
    mapping: snkrPendingMapping({ scrapedName: "Monkey D. Luffy R [OP01-001][EN]" }),
    imageFeatures,
  }), { category: "blocked", reason: "explicit_locale" });
  assertSubset(classifySnkrdunkPending({
    mapping: snkrPendingMapping({ scrapedName: "Monkey D. Luffy R :Unopened [OP01-001]" }),
    imageFeatures,
  }), { category: "blocked", reason: "opened_or_unopened_product" });
  assertSubset(classifySnkrdunkPending({
    mapping: snkrPendingMapping({ scrapedName: "Monkey D. Luffy [OP01-001]" }),
    imageFeatures,
  }), { category: "blocked", reason: "invalid_source_metadata" });
  assertSubset(classifySnkrdunkPending({
    mapping: snkrPendingMapping({ candidates: [candidate({ cardCode: "OP01-002" })] }),
    imageFeatures,
  }), { category: "blocked", reason: "no_exact_metadata_candidate" });
  assertSubset(classifySnkrdunkPending({
    mapping: snkrPendingMapping({ candidates: [candidate({ rarity: "SR" })] }),
    imageFeatures,
  }), { category: "blocked", reason: "no_exact_metadata_candidate" });
});

test("SNKRDUNK pending requires symmetric treatment, visual separation, and free occupancy", async () => {
  const source = await decodeImageFeature(solidCard("#d92222"), { url: "source-image" });
  const exact = await decodeImageFeature(solidCard("#d92222"), { url: "candidate-image" });
  const second = await decodeImageFeature(solidCard("#d92222"), { url: "candidate-two" });
  const imageFeatures = new Map([
    ["source-image", source],
    ["candidate-image", exact],
    ["candidate-two", second],
  ]);

  assertSubset(classifySnkrdunkPending({
    mapping: snkrPendingMapping({ scrapedName: "Monkey D. Luffy R Stamped [OP01-001]" }),
    imageFeatures,
  }), { category: "blocked", reason: "unverifiable_treatment" });
  assertSubset(classifySnkrdunkPending({
    mapping: snkrPendingMapping({ candidates: [candidate({ treatment: "Stamped" })] }),
    imageFeatures,
  }), { category: "blocked", reason: "unverifiable_treatment" });
  assertSubset(classifySnkrdunkPending({
    mapping: snkrPendingMapping({
      candidates: [
        candidate(),
        candidate({ id: 102, imageUrl: "candidate-two" }),
      ],
    }),
    imageFeatures,
  }), { category: "blocked", reason: "visual_margin_too_small", visualMargin: 0 });
  assertSubset(classifySnkrdunkPending({
    mapping: snkrPendingMapping(),
    occupiedTargetIds: new Set([101]),
    imageFeatures,
  }), { category: "blocked", reason: "target_collision", targetCardId: 101 });
});

test("SNKRDUNK pending report blocks duplicate targets and lists each remaining safe plan", async () => {
  const targetOne = candidate({
    id: 101,
    imageUrl: "https://asia-en.onepiece-cardgame.com/images/cardlist/card/OP01-001.png",
  });
  const targetTwo = candidate({
    id: 102,
    imageUrl: "https://asia-en.onepiece-cardgame.com/images/cardlist/card/OP01-001_promo.png",
  });
  const source = (id) => `https://cdn.snkrdunk.com/cards/pending-${id}.webp`;
  const makePending = (id, target, prices = {}) => snkrPendingMapping({
    id,
    snkrdunkId: 7000 + id,
    sourceUrl: `https://snkrdunk.com/en/trading-cards/${7000 + id}`,
    thumbnailUrl: source(id),
    candidates: [target],
    ...prices,
  });
  const { fetchImpl, rpcRequests } = createSupervisorFetch({
    catalogCards: [targetOne, targetTwo],
    snkrPending: [
      makePending(501, targetOne),
      makePending(502, targetOne),
      makePending(503, targetTwo, { minPriceUsd: 12, usedMinPriceUsd: 11, lastSoldPsa10Usd: 45 }),
    ],
  });

  const report = await runSupervisor({
    argv: ["--dry-run"],
    env: { MEECARD_MCP_URL: "http://127.0.0.1:9999/mcp" },
    fetchImpl,
    now: () => new Date("2026-09-01T00:00:00.000Z"),
  });

  assertSubset(report.reconciliation.snkrdunkPending, {
    total: 3,
    exactShadowCandidates: 1,
    reasons: { exact_metadata_and_visual: 1, shadow_target_collision: 2 },
  });
  assert.equal(report.reconciliation.snkrdunkPending.plan.length, 1);
  assertSubset(report.reconciliation.snkrdunkPending.plan[0], {
    mappingId: 503,
    snkrdunkId: 7503,
    code: "OP01-001",
    rarity: "R",
    targetCardId: 102,
    targetCode: "OP01-001",
    visualScore: 0,
    minPriceUsd: 12,
    usedMinPriceUsd: 11,
    psa10LastSoldUsd: 45,
  });
  const pulse = JSON.parse(buildOperationalPulseDetail(report));
  assertSubset(pulse.snkrdunk.pending, {
    total: 3,
    exactShadowCandidates: 1,
    planTruncated: false,
  });
  assert.equal(pulse.snkrdunk.pending.plan[0].mappingId, 503);
  assert.equal(
    rpcRequests.some((request) => request.method === "tools/call" && /create|approve/i.test(request.params.name)),
    false,
  );
});

test("SNKRDUNK pending occupancy also honors matchedCardId when the embedded target is absent", async () => {
  const target = candidate({
    imageUrl: "https://asia-en.onepiece-cardgame.com/images/cardlist/card/OP01-001.png",
  });
  const { fetchImpl } = createSupervisorFetch({
    catalogCards: [target],
    snkrPending: [snkrPendingMapping({
      thumbnailUrl: "https://cdn.snkrdunk.com/cards/pending-occupied.webp",
      candidates: [target],
    })],
    snkrMatched: [{
      id: 901,
      snkrdunkId: 6001,
      matchedCardId: 101,
      matchedCard: null,
    }],
  });

  const report = await runSupervisor({
    argv: ["--dry-run"],
    env: { MEECARD_MCP_URL: "http://127.0.0.1:9999/mcp" },
    fetchImpl,
    now: () => new Date("2026-09-01T00:00:00.000Z"),
  });

  assertSubset(report.reconciliation.snkrdunkPending, {
    exactShadowCandidates: 0,
    reasons: { target_collision: 1 },
    plan: [],
  });
});

test("pending review keeps blocked details but only samples invalid metadata", () => {
  const invalidRows = Array.from({ length: 8 }, (_, index) => ({
    mapping: mapping({ id: index + 1, scrapedCode: "-", sourceUrl: `https://yuyu.test/${index + 1}` }),
    classification: { category: "blocked", reason: "invalid_source_metadata" },
  }));
  const blocked = {
    mapping: mapping({ id: 99, sourceUrl: "https://yuyu.test/99" }),
    classification: { category: "blocked", reason: "visual_score_too_high", visualScore: 0.31234567, margin: 0.08 },
  };
  const candidates = new Map([[99, { candidates: [candidate({ id: 501, imageUrl: "https://asia-en.onepiece-cardgame.com/card.png" })] }]]);

  const review = buildYuyuteiPendingReview([...invalidRows, blocked], candidates);

  assert.equal(review.invalidSourceMetadata.count, 8);
  assert.equal(review.invalidSourceMetadata.examples.length, 5);
  assert.equal(review.blocked.length, 1);
  assertSubset(review.blocked[0], {
    mappingId: 99,
    reason: "visual_score_too_high",
    visualScore: 0.312346,
    visualMargin: 0.08,
    candidateCount: 1,
  });
  assert.equal(review.blocked[0].candidates[0].cardId, 501);
});

function safeSnkrShadowFixture({ productLookupFails = false } = {}) {
  const listing = {
    id: 7003,
    productNumber: "OP01-001",
    name: "Monkey D. Luffy R [OP01-001](Promotional Card)",
    thumbnailUrl: "https://cdn.snkrdunk.com/cards/red.webp",
    minPrice: 10,
    minPriceFormat: "$10",
  };
  const catalogCard = candidate({
    id: 101,
    imageUrl: "https://asia-en.onepiece-cardgame.com/images/cardlist/card/OP01-001.png",
  });
  const productLookup = {
    detectedCurrency: "USD",
    summary: {
      snkrdunkId: 7003,
      productNumber: "OP01-001",
      name: listing.name,
      minPriceUsd: 10,
      usedMinPriceUsd: 9,
      currency: "USD",
    },
    lastSoldUsd: 8,
    psa10MinPriceUsd: 40,
    psa10LastSoldUsd: 38,
    psa9MinPriceUsd: 30,
    psa9LastSoldUsd: 28,
    psa8MinPriceUsd: 20,
    psa8LastSoldUsd: 18,
  };
  return createSupervisorFetch({
    catalogCards: [catalogCard],
    discoveredCards: [listing],
    productLookup,
    productLookupFails,
    snkrMatched: [{
      id: 901,
      snkrdunkId: 6001,
      minPriceUsd: 5,
      usedMinPriceUsd: null,
      lastSoldPsa10Usd: 15,
      matchedCard: { id: 999 },
    }],
  });
}

test("SNKRDUNK exact shadow performs read-only price lookup and reports target, visuals, and grades", async () => {
  const { fetchImpl, rpcRequests } = safeSnkrShadowFixture();
  const report = await runSupervisor({
    argv: ["--dry-run"],
    env: { MEECARD_MCP_URL: "http://127.0.0.1:9999/mcp" },
    fetchImpl,
    now: () => new Date("2026-09-01T00:00:00.000Z"),
  });

  assert.equal(report.status, "ok");
  assert.equal(report.snkrdunkDiscovery.status, "ok");
  assert.equal(report.snkrdunkDiscovery.exactShadowCandidates, 1);
  assert.equal(report.snkrdunkDiscovery.priceLookup.succeeded, 1);
  assertSubset(report.snkrdunkDiscovery.plan[0], {
    snkrdunkId: 7003,
    targetCardId: 101,
    targetCode: "OP01-001",
    visualScore: 0,
    minPriceUsd: 10,
    usedMinPriceUsd: 9,
    psa10MinPriceUsd: 40,
    psa10LastSoldUsd: 38,
    psa9MinPriceUsd: 30,
    psa9LastSoldUsd: 28,
    psa8MinPriceUsd: 20,
    psa8LastSoldUsd: 18,
  });
  assertSubset(report.reconciliation.snkrdunkMatched.priceCoverage, {
    total: 1,
    withMinPrice: 1,
    withUsedMinPrice: 0,
    withPsa10Price: 1,
    withoutAnyPrice: 0,
  });
  const pulseDetail = buildOperationalPulseDetail(report);
  const pulse = JSON.parse(pulseDetail);
  assert.ok(pulseDetail.length <= 3_000);
  assertSubset(pulse.snkrdunk.discovery, {
    status: "ok",
    scanned: 1,
    unmappedAgainstMcp: 1,
    exactShadowCandidates: 1,
  });
  assert.equal(pulse.snkrdunk.discovery.plan[0].snkrdunkId, 7003);
  assert.equal(pulse.snkrdunk.matchedPriceCoverage.withMinPrice, 1);
  const tools = rpcRequests.filter((request) => request.method === "tools/call").map((request) => request.params.name);
  assert.equal(tools.filter((name) => name === "snkrdunk_product_lookup").length, 1);
  assert.equal(tools.includes("snkrdunk_mapping_create"), false);
  assert.equal(tools.includes("snkrdunk_mapping_approve"), false);
});

test("SNKRDUNK lookup failure fails the component and job without heartbeat or mutation", async () => {
  const { fetchImpl, rpcRequests } = safeSnkrShadowFixture({ productLookupFails: true });
  const report = await runSupervisor({
    argv: ["--dry-run"],
    env: { MEECARD_MCP_URL: "http://127.0.0.1:9999/mcp" },
    fetchImpl,
    now: () => new Date("2026-09-01T00:00:00.000Z"),
  });

  assert.equal(report.status, "failed");
  assert.equal(report.snkrdunkDiscovery.status, "failed");
  assert.equal(report.snkrdunkDiscovery.priceLookup.failed, 1);
  assert.equal(report.snkrdunkDiscovery.plan.length, 0);
  assert.equal(shouldWriteHeartbeat(report), false);
  assert.equal(
    rpcRequests.some((request) => request.method === "tools/call" && /create|approve/i.test(request.params.name)),
    false,
  );
});

test("catalog scan fails closed when per-set rows do not match the stable global total", async () => {
  const { fetchImpl } = createSupervisorFetch({
    catalogCards: [candidate()],
    catalogTotal: 2,
  });
  await assert.rejects(
    runSupervisor({
      argv: ["--dry-run"],
      env: { MEECARD_MCP_URL: "http://127.0.0.1:9999/mcp" },
      fetchImpl,
      now: () => new Date("2026-09-01T00:00:00.000Z"),
    }),
    (error) => error?.code === "catalog_integrity_error",
  );
});

test("matched structural audit flags Yuyutei mapping 2235 set mismatch and keeps heartbeat", async () => {
  const mismatched = {
    id: 2235,
    yuyuteiId: "op07/10113",
    setCode: "op07",
    scrapedCode: "OP07-109",
    scrapedRarity: "SR",
    scrapedName: "Monkey.D.Luffy",
    sourceUrl: "https://yuyu-tei.jp/sell/opc/card/op07/10113",
    matchedCardId: 3106,
    matchedCard: {
      id: 3106,
      cardCode: "OP07-109",
      baseCode: "OP07-109",
      rarity: "SR",
      parallelIndex: null,
      isParallel: false,
      set: { code: "prb02" },
    },
  };
  const direct = auditMatchedStructure([mismatched], { provider: "yuyutei" });
  assertSubset(direct, { checked: 1, violations: 1, reasons: { set_mismatch: 1 } });
  assertSubset(direct.examples[0], {
    mappingId: 2235,
    sourceSet: "op07",
    targetCardId: 3106,
    targetSet: "prb02",
    reasons: ["set_mismatch"],
  });

  const { fetchImpl } = createSupervisorFetch({ yuyuteiMatched: [mismatched] });
  const report = await runSupervisor({
    argv: ["--dry-run"],
    env: { MEECARD_MCP_URL: "http://127.0.0.1:9999/mcp" },
    fetchImpl,
    now: () => new Date("2026-09-01T00:00:00.000Z"),
  });
  assert.equal(report.status, "warn");
  assert.equal(report.reconciliation.yuyuteiMatched.structuralAudit.reasons.set_mismatch, 1);
  assert.equal(report.reconciliation.yuyuteiMatched.fullVisualAuditSkipped, true);
  assert.equal(Object.hasOwn(report.reconciliation.yuyuteiMatched, "visualAuditSkipped"), false);
  assert.equal(shouldWriteHeartbeat(report), true);
});

test("--dry-run uses only read-only MCP tools and never calls mutation", async () => {
  const { fetchImpl, rpcRequests } = createSupervisorFetch();

  const report = await runSupervisor({
    argv: ["--dry-run"],
    env: { MEECARD_MCP_URL: "http://127.0.0.1:9999/mcp" },
    fetchImpl,
    now: () => new Date("2026-09-01T00:00:00.000Z"),
  });

  const calledTools = rpcRequests
    .filter((request) => request.method === "tools/call")
    .map((request) => request.params.name);
  assert.equal(report.mode, "dry-run");
  assert.equal(report.apply.enabled, false);
  assert.equal(report.apply.attempted, 0);
  assert.equal(report.status, "ok");
  assert.equal(calledTools.includes("yuyutei_mapping_approve"), false);
  assert.deepEqual(calledTools.sort(), [
    "card_list",
    "card_list",
    "card_list",
    "card_set_list",
    "snkrdunk_mapping_list",
    "snkrdunk_mapping_list",
    "yuyutei_mapping_list",
    "yuyutei_mapping_list",
  ]);
});

test("SNKRDUNK discovery failure fails the job and suppresses heartbeat", async () => {
  const { fetchImpl, rpcRequests } = createSupervisorFetch({ discoveryFails: true });
  const report = await runSupervisor({
    argv: ["--dry-run"],
    env: { MEECARD_MCP_URL: "http://127.0.0.1:9999/mcp" },
    fetchImpl,
    now: () => new Date("2026-09-01T00:00:00.000Z"),
  });

  assert.equal(report.status, "failed");
  assert.equal(report.snkrdunkDiscovery.status, "failed");
  assert.equal(shouldWriteHeartbeat(report), false);
  assert.equal(
    rpcRequests.some((request) => request.method === "tools/call" && request.params.name === "yuyutei_mapping_approve"),
    false,
  );
});

test("default mode stays read-only even when the apply environment gate exists", async () => {
  const source = yuyuteiPendingMapping();
  const target = yuyuteiCandidate();
  const { fetchImpl, rpcRequests } = createSupervisorFetch({
    catalogCards: [target],
    yuyuteiPending: [source],
    yuyuteiCandidates: { [source.id]: [target] },
  });

  const report = await runSupervisor({
    argv: [],
    env: {
      MEECARD_MCP_URL: "http://127.0.0.1:9999/mcp",
      MEECARD_AUTO_MATCH_APPLY_YUYUTEI: "1",
    },
    fetchImpl,
    now: () => new Date("2026-09-01T00:00:00.000Z"),
  });

  assert.equal(report.mode, "read-only");
  assert.equal(report.apply.enabled, false);
  assert.equal(report.apply.eligible, 1);
  assert.equal(report.apply.attempted, 0);
  assert.equal(
    rpcRequests.some((request) => request.params?.name === "yuyutei_mapping_approve"),
    false,
  );
});

test("Yuyutei apply sends one explicit pair then reports only read-back verified target and RAW price", async () => {
  const source = yuyuteiPendingMapping();
  const target = yuyuteiCandidate();
  const { fetchImpl, rpcRequests } = createSupervisorFetch({
    catalogCards: [target],
    yuyuteiPending: [source],
    yuyuteiCandidates: { [source.id]: [target] },
  });

  const report = await runSupervisor({
    argv: ["--apply-yuyutei"],
    journalFactory: memoryJournalFactory(),
    env: {
      MEECARD_MCP_URL: "http://127.0.0.1:9999/mcp",
      MEECARD_AUTO_MATCH_APPLY_YUYUTEI: "1",
      MEECARD_AUTO_MATCH_YUYUTEI_MAX: "1",
    },
    fetchImpl,
    now: () => new Date("2026-09-01T00:00:00.000Z"),
  });

  const mutations = rpcRequests.filter((request) => request.params?.name === "yuyutei_mapping_approve");
  assert.equal(mutations.length, 1);
  assert.deepEqual(mutations[0].params.arguments, { mappingId: 11, matchedCardId: 101 });
  assertSubset(report.apply, {
    enabled: true,
    eligible: 1,
    selected: 1,
    attempted: 1,
    approvalAcknowledged: 1,
    approved: 1,
    approvedUnverified: 0,
    mappingVerified: 1,
    succeeded: 1,
    pricesVerified: 1,
    postWriteVerified: 1,
    failed: 0,
  });
  assert.equal(report.apply.yuyutei.succeeded, 1);
  assert.equal(summarizeMeeCardRun(report).yuyutei.approved, 1);
  assert.equal(report.reconciliation.snapshotTiming, "before-apply");
  assertSubset(report.apply.results[0], {
    mappingId: 11,
    targetCardId: 101,
    outcome: "approved",
    reason: "approved_and_verified",
    readBack: {
      status: "MATCHED",
      matchedCardId: 101,
      priceJpy: 220,
      latestPriceJpy: "220",
      updatedAt: "2026-09-01T00:00:01.000Z",
      targetOccupancy: 1,
    },
  });
});

test("Yuyutei apply fsyncs intent before approve and outcome after read-back", async (t) => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "meecard-apply-journal-"));
  t.after(() => fs.rmSync(tempRoot, { recursive: true, force: true }));
  const journalDir = path.join(tempRoot, "journal");
  const startedAt = new Date("2026-09-01T00:00:00.000Z");
  const journalPath = resolveApplyJournalPath({
    env: { MEECARD_AUTO_MATCH_JOURNAL_DIR: journalDir },
    startedAt,
  });
  const source = yuyuteiPendingMapping();
  const target = yuyuteiCandidate();
  let sawIntentBeforeApprove = false;
  const { fetchImpl } = createSupervisorFetch({
    catalogCards: [target],
    yuyuteiPending: [source],
    yuyuteiCandidates: { [source.id]: [target] },
    onToolCall: ({ request }) => {
      if (request.params.name !== "yuyutei_mapping_approve") return;
      const lines = fs.readFileSync(journalPath, "utf8").trim().split("\n").map(JSON.parse);
      assert.equal(lines.at(-1).event, "intent");
      assert.equal(lines.at(-1).mappingId, 11);
      sawIntentBeforeApprove = true;
    },
  });

  const report = await runSupervisor({
    argv: ["--apply-yuyutei"],
    env: {
      MEECARD_MCP_URL: "http://127.0.0.1:9999/mcp",
      MEECARD_AUTO_MATCH_APPLY_YUYUTEI: "1",
      MEECARD_AUTO_MATCH_JOURNAL_DIR: journalDir,
    },
    fetchImpl,
    runId: "journal-run-001",
    now: () => startedAt,
  });

  const events = fs.readFileSync(journalPath, "utf8").trim().split("\n").map(JSON.parse);
  assert.equal(sawIntentBeforeApprove, true);
  assert.deepEqual(events.map((event) => event.event), ["intent", "outcome"]);
  assertSubset(events[0], {
    runId: "journal-run-001",
    mappingId: 11,
    targetCardId: 101,
  });
  assertSubset(events[0].source, {
    id: 11,
    yuyuteiId: "10001",
    scrapedCode: "OP01-001",
    priceJpy: 220,
    updatedAt: "2026-09-01T00:00:00.000Z",
  });
  assertSubset(events[1], {
    runId: "journal-run-001",
    mappingId: 11,
    targetCardId: 101,
    outcome: "approved",
  });
  assertSubset(events[1].readBack, {
    status: "MATCHED",
    matchedCardId: 101,
    priceJpy: 220,
    latestPriceJpy: "220",
  });
  assert.equal(report.journalPath, journalPath);
  assertSubset(report.apply, { journalIntents: 1, journalOutcomes: 1, journalFailures: 0 });
  assert.equal(fs.statSync(journalDir).mode & 0o777, 0o700);
  assert.equal(fs.statSync(journalPath).mode & 0o777, 0o600);
});

test("Yuyutei intent journal failure prevents mutation and fails closed", async () => {
  const source = yuyuteiPendingMapping();
  const target = yuyuteiCandidate();
  const events = [];
  const { fetchImpl, rpcRequests } = createSupervisorFetch({
    catalogCards: [target],
    yuyuteiPending: [source],
    yuyuteiCandidates: { [source.id]: [target] },
  });

  const report = await runSupervisor({
    argv: ["--apply-yuyutei"],
    journalFactory: memoryJournalFactory(events, { failIntent: true }),
    env: {
      MEECARD_MCP_URL: "http://127.0.0.1:9999/mcp",
      MEECARD_AUTO_MATCH_APPLY_YUYUTEI: "1",
    },
    fetchImpl,
    now: () => new Date("2026-09-01T00:00:00.000Z"),
  });

  assertSubset(report.apply, {
    attempted: 0,
    succeeded: 0,
    journalIntents: 0,
    journalOutcomes: 0,
    journalFailures: 1,
    stoppedEarly: true,
  });
  assertSubset(report.apply.results[0], {
    outcome: "journal_failed",
    reason: "intent_journal_write_failed",
  });
  assert.equal(report.status, "failed");
  assert.equal(events.length, 0);
  assert.equal(
    rpcRequests.some((request) => request.params?.name === "yuyutei_mapping_approve"),
    false,
  );
});

test("dry-run never creates or opens an apply journal", async (t) => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "meecard-dry-journal-"));
  t.after(() => fs.rmSync(tempRoot, { recursive: true, force: true }));
  const journalDir = path.join(tempRoot, "must-not-exist");
  let journalFactoryCalls = 0;
  const { fetchImpl } = createSupervisorFetch();

  const report = await runSupervisor({
    argv: ["--dry-run"],
    journalFactory: () => { journalFactoryCalls++; throw new Error("must not open journal"); },
    env: {
      MEECARD_MCP_URL: "http://127.0.0.1:9999/mcp",
      MEECARD_AUTO_MATCH_JOURNAL_DIR: journalDir,
    },
    fetchImpl,
    now: () => new Date("2026-09-01T00:00:00.000Z"),
  });

  assert.equal(report.mode, "dry-run");
  assert.equal(report.journalPath, null);
  assert.equal(journalFactoryCalls, 0);
  assert.equal(fs.existsSync(journalDir), false);
});

test("Yuyutei fresh preflight blocks an updated source before mutation", async () => {
  const source = yuyuteiPendingMapping();
  const target = yuyuteiCandidate();
  let pendingReads = 0;
  const { fetchImpl, rpcRequests } = createSupervisorFetch({
    catalogCards: [target],
    yuyuteiPending: [source],
    yuyuteiCandidates: { [source.id]: [target] },
    onToolCall: ({ request, state }) => {
      if (request.params.name !== "yuyutei_mapping_list" || request.params.arguments.status !== "pending") return;
      pendingReads++;
      if (pendingReads === 2) state.yuyuteiPending[0].updatedAt = "2026-09-01T00:00:00.500Z";
    },
  });

  const report = await runSupervisor({
    argv: ["--apply-yuyutei"],
    journalFactory: memoryJournalFactory(),
    env: {
      MEECARD_MCP_URL: "http://127.0.0.1:9999/mcp",
      MEECARD_AUTO_MATCH_APPLY_YUYUTEI: "1",
    },
    fetchImpl,
    now: () => new Date("2026-09-01T00:00:00.000Z"),
  });

  assertSubset(report.apply, { attempted: 0, preflightBlocked: 1, succeeded: 0 });
  assertSubset(report.apply.results[0], {
    outcome: "preflight_blocked",
    reason: "mapping_updated_at_changed",
  });
  assert.equal(
    rpcRequests.some((request) => request.params?.name === "yuyutei_mapping_approve"),
    false,
  );
});

test("Yuyutei apply blocks duplicate shadow targets as a batch", async () => {
  const first = yuyuteiPendingMapping();
  const second = yuyuteiPendingMapping({ id: 12, yuyuteiId: "10002", sourceUrl: "https://yuyu-tei.jp/sell/opc/card/op01/10002" });
  const target = yuyuteiCandidate();
  const { fetchImpl, rpcRequests } = createSupervisorFetch({
    catalogCards: [target],
    yuyuteiPending: [first, second],
    yuyuteiCandidates: { [first.id]: [target], [second.id]: [target] },
  });

  const report = await runSupervisor({
    argv: ["--apply-yuyutei"],
    journalFactory: memoryJournalFactory(),
    env: {
      MEECARD_MCP_URL: "http://127.0.0.1:9999/mcp",
      MEECARD_AUTO_MATCH_APPLY_YUYUTEI: "1",
    },
    fetchImpl,
    now: () => new Date("2026-09-01T00:00:00.000Z"),
  });

  assert.equal(report.reconciliation.yuyuteiPending.reasons.shadow_target_collision, 2);
  assertSubset(report.apply, { eligible: 0, attempted: 0, succeeded: 0 });
  assert.equal(
    rpcRequests.some((request) => request.params?.name === "yuyutei_mapping_approve"),
    false,
  );
});

test("Yuyutei apply honors the bounded per-run maximum", async () => {
  const first = yuyuteiPendingMapping();
  const second = yuyuteiPendingMapping({
    id: 12,
    yuyuteiId: "10002",
    sourceUrl: "https://yuyu-tei.jp/sell/opc/card/op01/10002",
    scrapedCode: "OP01-002",
    scrapedImage: "https://card.yuyu-tei.jp/opc/front/op01/10002.jpg",
  });
  const firstTarget = yuyuteiCandidate();
  const secondTarget = yuyuteiCandidate({ id: 102, cardCode: "OP01-002", imageUrl: "https://asia-en.onepiece-cardgame.com/images/cardlist/card/OP01-002.png" });
  const { fetchImpl, rpcRequests } = createSupervisorFetch({
    catalogCards: [firstTarget, secondTarget],
    yuyuteiPending: [first, second],
    yuyuteiCandidates: { [first.id]: [firstTarget], [second.id]: [secondTarget] },
  });

  const report = await runSupervisor({
    argv: ["--apply-yuyutei"],
    journalFactory: memoryJournalFactory(),
    env: {
      MEECARD_MCP_URL: "http://127.0.0.1:9999/mcp",
      MEECARD_AUTO_MATCH_APPLY_YUYUTEI: "1",
      MEECARD_AUTO_MATCH_YUYUTEI_MAX: "1",
    },
    fetchImpl,
    now: () => new Date("2026-09-01T00:00:00.000Z"),
  });

  assertSubset(report.apply, { eligible: 2, selected: 1, attempted: 1, succeeded: 1 });
  assert.equal(report.status, "warn");
  assert.equal(rpcRequests.filter((request) => request.params?.name === "yuyutei_mapping_approve").length, 1);
});

test("Yuyutei mutation failure stops before the next selected row", async () => {
  const first = yuyuteiPendingMapping();
  const second = yuyuteiPendingMapping({
    id: 12,
    yuyuteiId: "10002",
    sourceUrl: "https://yuyu-tei.jp/sell/opc/card/op01/10002",
    scrapedCode: "OP01-002",
    scrapedImage: "https://card.yuyu-tei.jp/opc/front/op01/10002.jpg",
  });
  const firstTarget = yuyuteiCandidate();
  const secondTarget = yuyuteiCandidate({ id: 102, cardCode: "OP01-002", imageUrl: "https://asia-en.onepiece-cardgame.com/images/cardlist/card/OP01-002.png" });
  const { fetchImpl, rpcRequests } = createSupervisorFetch({
    catalogCards: [firstTarget, secondTarget],
    yuyuteiPending: [first, second],
    yuyuteiCandidates: { [first.id]: [firstTarget], [second.id]: [secondTarget] },
    approveBehavior: "http-401",
  });

  const report = await runSupervisor({
    argv: ["--apply-yuyutei"],
    journalFactory: memoryJournalFactory(),
    env: {
      MEECARD_MCP_URL: "http://127.0.0.1:9999/mcp",
      MEECARD_AUTO_MATCH_APPLY_YUYUTEI: "1",
      MEECARD_AUTO_MATCH_YUYUTEI_MAX: "2",
    },
    fetchImpl,
    now: () => new Date("2026-09-01T00:00:00.000Z"),
  });

  assertSubset(report.apply, {
    eligible: 2,
    selected: 2,
    attempted: 1,
    failed: 1,
    succeeded: 0,
    stoppedEarly: true,
  });
  assert.equal(rpcRequests.filter((request) => request.params?.name === "yuyutei_mapping_approve").length, 1);
});

test("ambiguous Yuyutei timeout is resolved by read-back and always stops the batch", async () => {
  const first = yuyuteiPendingMapping();
  const second = yuyuteiPendingMapping({
    id: 12,
    yuyuteiId: "10002",
    sourceUrl: "https://yuyu-tei.jp/sell/opc/card/op01/10002",
    scrapedCode: "OP01-002",
    scrapedImage: "https://card.yuyu-tei.jp/opc/front/op01/10002.jpg",
  });
  const firstTarget = yuyuteiCandidate();
  const secondTarget = yuyuteiCandidate({ id: 102, cardCode: "OP01-002", imageUrl: "https://asia-en.onepiece-cardgame.com/images/cardlist/card/OP01-002.png" });
  const { fetchImpl, rpcRequests } = createSupervisorFetch({
    catalogCards: [firstTarget, secondTarget],
    yuyuteiPending: [first, second],
    yuyuteiCandidates: { [first.id]: [firstTarget], [second.id]: [secondTarget] },
    approveBehavior: "ambiguous-success",
  });

  const report = await runSupervisor({
    argv: ["--apply-yuyutei"],
    journalFactory: memoryJournalFactory(),
    env: {
      MEECARD_MCP_URL: "http://127.0.0.1:9999/mcp",
      MEECARD_AUTO_MATCH_APPLY_YUYUTEI: "1",
      MEECARD_AUTO_MATCH_YUYUTEI_MAX: "2",
    },
    fetchImpl,
    now: () => new Date("2026-09-01T00:00:00.000Z"),
  });

  assertSubset(report.apply, {
    attempted: 1,
    succeeded: 1,
    ambiguous: 0,
    ambiguousResolvedByReadBack: 1,
    postWriteVerified: 1,
    stoppedEarly: true,
  });
  assertSubset(report.apply.results[0], {
    outcome: "approved",
    reason: "approved_after_ambiguous_readback",
  });
  assert.equal(report.status, "warn");
  const pulse = JSON.parse(buildOperationalPulseDetail(report));
  assertSubset(pulse.apply, {
    selected: 2,
    attempted: 1,
    approved: 1,
    mappingVerified: 1,
    succeeded: 1,
    pricesVerified: 1,
    preflightBlocked: 0,
    ambiguous: 0,
    stoppedEarly: true,
  });
  assert.equal(pulse.reconciliationSnapshotTiming, "before-apply");
  assert.equal(rpcRequests.filter((request) => request.params?.name === "yuyutei_mapping_approve").length, 1);
});

test("uncertain Yuyutei tool response is read back before deciding success", async () => {
  const source = yuyuteiPendingMapping();
  const target = yuyuteiCandidate();
  const { fetchImpl } = createSupervisorFetch({
    catalogCards: [target],
    yuyuteiPending: [source],
    yuyuteiCandidates: { [source.id]: [target] },
    approveBehavior: "tool-error-success",
  });

  const report = await runSupervisor({
    argv: ["--apply-yuyutei"],
    journalFactory: memoryJournalFactory(),
    env: {
      MEECARD_MCP_URL: "http://127.0.0.1:9999/mcp",
      MEECARD_AUTO_MATCH_APPLY_YUYUTEI: "1",
    },
    fetchImpl,
    now: () => new Date("2026-09-01T00:00:00.000Z"),
  });

  assertSubset(report.apply, {
    attempted: 1,
    succeeded: 1,
    ambiguousResolvedByReadBack: 1,
    postWriteVerified: 1,
    stoppedEarly: true,
  });
  assert.equal(report.apply.results[0].reason, "approved_after_ambiguous_readback");
});

test("unresolved ambiguous Yuyutei timeout is reported and stops without claiming success", async () => {
  const source = yuyuteiPendingMapping();
  const target = yuyuteiCandidate();
  const { fetchImpl } = createSupervisorFetch({
    catalogCards: [target],
    yuyuteiPending: [source],
    yuyuteiCandidates: { [source.id]: [target] },
    approveBehavior: "ambiguous-pending",
  });

  const report = await runSupervisor({
    argv: ["--apply-yuyutei"],
    journalFactory: memoryJournalFactory(),
    env: {
      MEECARD_MCP_URL: "http://127.0.0.1:9999/mcp",
      MEECARD_AUTO_MATCH_APPLY_YUYUTEI: "1",
    },
    fetchImpl,
    now: () => new Date("2026-09-01T00:00:00.000Z"),
  });

  assertSubset(report.apply, {
    attempted: 1,
    succeeded: 0,
    ambiguous: 1,
    postWriteVerified: 0,
    stoppedEarly: true,
  });
  assertSubset(report.apply.results[0], {
    outcome: "ambiguous",
    reason: "readback_still_pending",
  });
  assert.equal(report.status, "failed");
});

test("Yuyutei apply fails closed when the matched target RAW price is not synchronized", async () => {
  const source = yuyuteiPendingMapping();
  const target = yuyuteiCandidate();
  const { fetchImpl } = createSupervisorFetch({
    catalogCards: [target],
    yuyuteiPending: [source],
    yuyuteiCandidates: { [source.id]: [target] },
    approveRawPrice: 221,
  });

  const report = await runSupervisor({
    argv: ["--apply-yuyutei"],
    journalFactory: memoryJournalFactory(),
    env: {
      MEECARD_MCP_URL: "http://127.0.0.1:9999/mcp",
      MEECARD_AUTO_MATCH_APPLY_YUYUTEI: "1",
    },
    fetchImpl,
    now: () => new Date("2026-09-01T00:00:00.000Z"),
  });

  assertSubset(report.apply, {
    attempted: 1,
    approvalAcknowledged: 1,
    approved: 1,
    mappingVerified: 1,
    succeeded: 0,
    pricesVerified: 0,
    failed: 1,
    stoppedEarly: true,
  });
  assertSubset(report.apply.results[0], {
    outcome: "approved_price_sync_failed",
    reason: "raw_price_not_synced",
  });
  assert.equal(summarizeMeeCardRun(report).yuyutei.approved, 1);
});

test("Yuyutei read-back catches an external writer occupying the same target", async () => {
  const source = yuyuteiPendingMapping();
  const target = yuyuteiCandidate();
  const { fetchImpl, rpcRequests } = createSupervisorFetch({
    catalogCards: [target],
    yuyuteiPending: [source],
    yuyuteiCandidates: { [source.id]: [target] },
    externalYuyuteiTargetCollisionAfterApprove: true,
  });

  const report = await runSupervisor({
    argv: ["--apply-yuyutei"],
    journalFactory: memoryJournalFactory(),
    env: {
      MEECARD_MCP_URL: "http://127.0.0.1:9999/mcp",
      MEECARD_AUTO_MATCH_APPLY_YUYUTEI: "1",
    },
    fetchImpl,
    now: () => new Date("2026-09-01T00:00:00.000Z"),
  });

  assertSubset(report.apply, {
    attempted: 1,
    approved: 1,
    mappingVerified: 1,
    succeeded: 0,
    failed: 1,
    stoppedEarly: true,
  });
  assertSubset(report.apply.results[0], {
    outcome: "approved_verification_failed",
    reason: "readback_target_collision",
  });
  assert.equal(report.apply.results[0].readBack.targetOccupancy, 2);
  assert.equal(report.status, "failed");
  assert.equal(rpcRequests.filter((request) => request.params?.name === "yuyutei_mapping_approve").length, 1);
});

test("acknowledged Yuyutei approval with unavailable read-back is reported as unverified", async () => {
  const source = yuyuteiPendingMapping();
  const target = yuyuteiCandidate();
  const { fetchImpl } = createSupervisorFetch({
    catalogCards: [target],
    yuyuteiPending: [source],
    yuyuteiCandidates: { [source.id]: [target] },
    readbackFailsAfterApprove: true,
  });

  const report = await runSupervisor({
    argv: ["--apply-yuyutei"],
    journalFactory: memoryJournalFactory(),
    env: {
      MEECARD_MCP_URL: "http://127.0.0.1:9999/mcp",
      MEECARD_AUTO_MATCH_APPLY_YUYUTEI: "1",
    },
    fetchImpl,
    now: () => new Date("2026-09-01T00:00:00.000Z"),
  });

  assertSubset(report.apply, {
    approvalAcknowledged: 1,
    approved: 0,
    approvedUnverified: 1,
    mappingVerified: 0,
    succeeded: 0,
    failed: 0,
    ambiguous: 1,
    stoppedEarly: true,
  });
  assertSubset(report.apply.results[0], {
    outcome: "approved_unverified",
    reason: "postwrite_readback_failed",
  });
  assert.equal(report.status, "failed");
});
