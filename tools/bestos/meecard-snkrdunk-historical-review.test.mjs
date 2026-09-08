import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createCanvas } from "@napi-rs/canvas";

import { decodeImageFeature } from "./meecard-auto-match-supervisor.mjs";
import {
  HistoricalReviewUsageError,
  loadHistoricalListingsFromReports,
  mergeCurrentMatchedListings,
  normalizeHistoricalListing,
  parseHistoricalReviewCliArgs,
  parseSnkrdunkRarity,
  reviewHistoricalListings,
  runSnkrdunkHistoricalReview,
  selectSnkrdunkMetadataCandidates,
} from "./meecard-snkrdunk-historical-review.mjs";

function solidCard(color) {
  const canvas = createCanvas(240, 336);
  const context = canvas.getContext("2d");
  context.fillStyle = color;
  context.fillRect(0, 0, canvas.width, canvas.height);
  return canvas.toBuffer("image/png");
}

function emptyState(overrides = {}) {
  return {
    catalog: [],
    mappings: [],
    mappingsBySourceId: new Map(),
    occupiedTargetIds: new Set(),
    statusCounts: { pending: 0, matched: 0, rejected: 0, skipped: 0 },
    ...overrides,
  };
}

test("CLI accepts report or bounded page range and exposes no mutation mode", () => {
  const parsed = parseHistoricalReviewCliArgs([
    "--backfill-report=/tmp/backfill.json",
    "--start-page=4",
    "--end-page=8",
  ], {}, { homeDir: "/tmp/home" });
  assert.deepEqual(parsed.inputReports, ["/tmp/backfill.json"]);
  assert.equal(parsed.startPage, 4);
  assert.equal(parsed.endPage, 8);
  assert.equal(parsed.includeCurrentMatched, false);
  const matchedOnly = parseHistoricalReviewCliArgs([
    "--include-current-matched",
  ], {}, { homeDir: "/tmp/home" });
  assert.equal(matchedOnly.includeCurrentMatched, true);
  assert.deepEqual(matchedOnly.inputReports, []);
  assert.throws(
    () => parseHistoricalReviewCliArgs([], {}, { homeDir: "/tmp/home" }),
    (error) => error instanceof HistoricalReviewUsageError && /ต้องระบุ/.test(error.message),
  );
  assert.throws(
    () => parseHistoricalReviewCliArgs(["--start-page=4"], {}, { homeDir: "/tmp/home" }),
    (error) => error instanceof HistoricalReviewUsageError && /คู่กัน/.test(error.message),
  );
  assert.throws(
    () => parseHistoricalReviewCliArgs(["--start-page=9", "--end-page=8"], {}, { homeDir: "/tmp/home" }),
    (error) => error instanceof HistoricalReviewUsageError && /ไม่น้อยกว่า/.test(error.message),
  );
  assert.throws(
    () => parseHistoricalReviewCliArgs(["--apply"], {}, { homeDir: "/tmp/home" }),
    (error) => error instanceof HistoricalReviewUsageError && /ไม่รู้จัก/.test(error.message),
  );
});

test("full-audit and recurring backfill listing shapes normalize and deduplicate", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "snkr-history-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const full = path.join(root, "full.json");
  const recurring = path.join(root, "recurring.json");
  await fs.writeFile(full, JSON.stringify({
    job: "meecard-snkrdunk-full-backfill-audit",
    source: { pagesFetched: 100 },
    listings: [{
      snkrdunkId: 7001,
      productNumber: "OP01-001",
      name: "Luffy L [OP01-001]",
      thumbnailUrl: "https://cdn.snkrdunk.com/7001.webp",
      presentInMeeCard: false,
    }],
  }));
  await fs.writeFile(recurring, JSON.stringify({
    job: "meecard-snkrdunk-backfill",
    source: { pageStart: 1, pageEnd: 5 },
    listings: [{
      snkrdunkId: 7001,
      code: "OP01-001",
      name: "Luffy L [OP01-001]",
      imageUrl: "https://cdn.snkrdunk.com/7001.webp",
      minPrice: 120,
      known: false,
    }],
  }));

  const result = await loadHistoricalListingsFromReports([full, recurring]);
  assert.equal(result.listings.length, 1);
  assert.equal(result.listings[0].snkrdunkId, 7001);
  assert.equal(result.listings[0].minPrice, 120);
  assert.equal(result.listings[0].reportSources.length, 2);
  assert.deepEqual(result.listings[0].sourceConflicts, []);
});

test("metadata filter matches supervisor code and rarity interpretation", () => {
  const listing = normalizeHistoricalListing({
    snkrdunkId: 7001,
    productNumber: "OP05-119",
    name: "Monkey.D.Luffy SEC-P [OP05-119] Parallel",
    thumbnailUrl: "https://cdn.snkrdunk.com/7001.webp",
  });
  assert.equal(parseSnkrdunkRarity(listing.name), "P-SEC");
  const candidates = selectSnkrdunkMetadataCandidates(listing, [
    { id: 10, cardCode: "OP05-119_p1", baseCode: "OP05-119", rarity: "P-SEC" },
    { id: 11, cardCode: "OP05-119", rarity: "SEC" },
    { id: 12, cardCode: "OP01-001", rarity: "P-SEC" },
  ]);
  assert.deepEqual(candidates.map((card) => card.id), [10]);
});

test("historical review emits exact source target artwork and score", async () => {
  const source = await decodeImageFeature(solidCard("#d92222"), { url: "source-image" });
  const target = await decodeImageFeature(solidCard("#d92222"), { url: "target-image" });
  const listing = normalizeHistoricalListing({
    snkrdunkId: 7001,
    productNumber: "OP01-001",
    name: "Monkey.D.Luffy L [OP01-001]",
    thumbnailUrl: "source-image",
  });
  const state = emptyState({
    catalog: [{
      id: 101,
      cardCode: "OP01-001",
      rarity: "L",
      nameEn: "Monkey D. Luffy",
      imageUrl: "target-image",
    }],
  });
  const rows = reviewHistoricalListings({
    listings: [listing],
    state,
    imageFeatures: new Map([["source-image", source], ["target-image", target]]),
  });
  assert.equal(rows[0].classification.category, "shadow_candidate");
  assert.equal(rows[0].classification.reason, "exact_metadata_and_visual");
  assert.equal(rows[0].classification.targetCardId, 101);
  assert.equal(rows[0].target.cardId, 101);
  assert.equal(rows[0].target.imageUrl, "target-image");
  assert.equal(rows[0].target.visualScore, 0);
  assert.equal(rows[0].source.imageUrl, "source-image");
});

test("same target from two historical listings is blocked for review", async () => {
  const feature = await decodeImageFeature(solidCard("#d92222"), { url: "same-image" });
  const listings = [7001, 7002].map((snkrdunkId) => normalizeHistoricalListing({
    snkrdunkId,
    productNumber: "OP01-001",
    name: "Monkey.D.Luffy L [OP01-001]",
    thumbnailUrl: `source-${snkrdunkId}`,
  }));
  const state = emptyState({
    catalog: [{ id: 101, cardCode: "OP01-001", rarity: "L", imageUrl: "target-image" }],
  });
  const rows = reviewHistoricalListings({
    listings,
    state,
    imageFeatures: new Map([
      ["source-7001", feature],
      ["source-7002", feature],
      ["target-image", feature],
    ]),
  });
  assert.deepEqual(rows.map((row) => row.classification.reason), [
    "shadow_target_collision",
    "shadow_target_collision",
  ]);
});

test("explicit locale remains blocked even when an exact artwork exists", async () => {
  const feature = await decodeImageFeature(solidCard("#d92222"), { url: "same-image" });
  const listing = normalizeHistoricalListing({
    snkrdunkId: 7001,
    productNumber: "OP01-001",
    name: "Monkey.D.Luffy L [OP01-001][EN]",
    thumbnailUrl: "source-image",
  });
  const rows = reviewHistoricalListings({
    listings: [listing],
    state: emptyState({
      catalog: [{ id: 101, cardCode: "OP01-001", rarity: "L", imageUrl: "target-image" }],
    }),
    imageFeatures: new Map([["source-image", feature], ["target-image", feature]]),
  });
  assert.equal(rows[0].classification.category, "blocked");
  assert.equal(rows[0].classification.reason, "explicit_locale");
});

test("explicit EN current match is fail-closed instead of already_matched", async () => {
  const feature = await decodeImageFeature(solidCard("#d92222"), { url: "same-image" });
  const listing = normalizeHistoricalListing({
    snkrdunkId: 7001,
    productNumber: "OP01-001",
    name: "Monkey.D.Luffy L [OP01-001][EN]",
    thumbnailUrl: "source-image",
  });
  const card = {
    id: 101,
    cardCode: "OP01-001",
    rarity: "L",
    imageUrl: "target-image",
  };
  const mapping = {
    id: 901,
    snkrdunkId: 7001,
    normalizedStatus: "matched",
    matchedCardId: 101,
    matchedCard: card,
  };
  const rows = reviewHistoricalListings({
    listings: [listing],
    state: emptyState({
      catalog: [card],
      mappings: [mapping],
      mappingsBySourceId: new Map([[7001, [mapping]]]),
      occupiedTargetIds: new Set([101]),
    }),
    imageFeatures: new Map([["source-image", feature], ["target-image", feature]]),
  });
  assert.equal(rows[0].classification.category, "requires_matched_audit");
  assert.equal(rows[0].classification.reason, "current_mapping_explicit_locale");
  assert.equal(rows[0].matchedAudit.category, "blocked");
  assert.equal(rows[0].matchedAudit.reason, "explicit_locale");
  assert.equal(rows[0].target.cardId, 101);
});

test("current match to the wrong artwork is surfaced as target mismatch", async () => {
  const red = await decodeImageFeature(solidCard("#d92222"), { url: "red-image" });
  const blue = await decodeImageFeature(solidCard("#2244bb"), { url: "blue-image" });
  const listing = normalizeHistoricalListing({
    snkrdunkId: 7001,
    productNumber: "OP01-001",
    name: "Monkey.D.Luffy L [OP01-001]",
    thumbnailUrl: "source-image",
  });
  const wrongArtwork = {
    id: 101,
    cardCode: "OP01-001",
    rarity: "L",
    imageUrl: "wrong-target-image",
  };
  const exactArtwork = {
    id: 102,
    cardCode: "OP01-001_p1",
    baseCode: "OP01-001",
    rarity: "L",
    imageUrl: "exact-target-image",
  };
  const mapping = {
    id: 901,
    snkrdunkId: 7001,
    normalizedStatus: "matched",
    matchedCardId: 101,
    matchedCard: wrongArtwork,
  };
  const rows = reviewHistoricalListings({
    listings: [listing],
    state: emptyState({
      catalog: [wrongArtwork, exactArtwork],
      mappings: [mapping],
      mappingsBySourceId: new Map([[7001, [mapping]]]),
      occupiedTargetIds: new Set([101]),
    }),
    imageFeatures: new Map([
      ["source-image", red],
      ["wrong-target-image", blue],
      ["exact-target-image", red],
    ]),
  });
  assert.equal(rows[0].classification.category, "requires_matched_audit");
  assert.equal(rows[0].classification.reason, "current_mapping_target_mismatch");
  assert.equal(rows[0].classification.currentTargetCardId, 101);
  assert.equal(rows[0].classification.auditedTargetCardId, 102);
  assert.equal(rows[0].matchedAudit.category, "shadow_candidate");
  assert.equal(rows[0].matchedAudit.targetCardId, 102);
  assert.equal(rows[0].target.cardId, 101);
});

test("visually exact current match still requires positive locale audit", async () => {
  const feature = await decodeImageFeature(solidCard("#d92222"), { url: "same-image" });
  const listing = normalizeHistoricalListing({
    snkrdunkId: 7001,
    productNumber: "OP01-001",
    name: "Monkey.D.Luffy L [OP01-001]",
    thumbnailUrl: "source-image",
  });
  const card = {
    id: 101,
    cardCode: "OP01-001",
    rarity: "L",
    imageUrl: "target-image",
  };
  const mapping = {
    id: 901,
    snkrdunkId: 7001,
    normalizedStatus: "matched",
    matchedCardId: 101,
    matchedCard: card,
  };
  const rows = reviewHistoricalListings({
    listings: [listing],
    state: emptyState({
      catalog: [card],
      mappings: [mapping],
      mappingsBySourceId: new Map([[7001, [mapping]]]),
      occupiedTargetIds: new Set([101]),
    }),
    imageFeatures: new Map([["source-image", feature], ["target-image", feature]]),
  });
  assert.equal(rows[0].classification.category, "requires_matched_audit");
  assert.equal(rows[0].classification.reason, "current_mapping_requires_locale_audit");
  assert.equal(rows[0].classification.currentTargetCardId, 101);
  assert.equal(rows[0].classification.auditedTargetCardId, 101);
  assert.equal(rows[0].matchedAudit.category, "shadow_candidate");
  assert.equal(rows[0].matchedAudit.reason, "exact_metadata_and_visual");
});

test("current MATCHED absent from input is merged and audited", async () => {
  const feature = await decodeImageFeature(solidCard("#d92222"), { url: "same-image" });
  const card = {
    id: 101,
    cardCode: "OP01-001",
    rarity: "L",
    imageUrl: "target-image",
  };
  const mapping = {
    id: 901,
    snkrdunkId: 7001,
    normalizedStatus: "matched",
    productNumber: "OP01-001",
    scrapedName: "Monkey.D.Luffy L [OP01-001]",
    thumbnailUrl: "source-image",
    sourceUrl: "https://snkrdunk.com/en/trading-cards/7001",
    minPriceUsd: 12.5,
    matchedCardId: 101,
    matchedCard: card,
  };
  const merged = mergeCurrentMatchedListings([], [mapping]);
  assert.equal(merged.stats.matchedMappings, 1);
  assert.equal(merged.stats.added, 1);
  assert.equal(merged.stats.merged, 0);
  assert.equal(merged.stats.duplicateMatchedSourceIds, 0);
  assert.equal(merged.stats.sourceConflicts, 0);
  assert.equal(merged.listings.length, 1);
  assert.equal(merged.listings[0].snkrdunkId, 7001);
  assert.equal(merged.listings[0].name, mapping.scrapedName);
  assert.equal(merged.listings[0].minPrice, 12.5);
  assert.equal(merged.listings[0].reportSources[0].reportSource.job, "mcp-current-matched");

  const rows = reviewHistoricalListings({
    listings: merged.listings,
    state: emptyState({
      catalog: [card],
      mappings: [mapping],
      mappingsBySourceId: new Map([[7001, [mapping]]]),
      occupiedTargetIds: new Set([101]),
    }),
    imageFeatures: new Map([["source-image", feature], ["target-image", feature]]),
  });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].source.snkrdunkId, 7001);
  assert.equal(rows[0].classification.category, "requires_matched_audit");
  assert.equal(rows[0].matchedAudit.category, "shadow_candidate");
});

test("include-current-matched loads an MCP-only match into the final read-only report", async () => {
  const feature = await decodeImageFeature(solidCard("#d92222"), { url: "same-image" });
  const card = {
    id: 101,
    cardCode: "OP01-001",
    rarity: "L",
    imageUrl: "target-image",
  };
  const mapping = {
    id: 901,
    snkrdunkId: 7001,
    normalizedStatus: "matched",
    productNumber: "OP01-001",
    scrapedName: "Monkey.D.Luffy L [OP01-001]",
    thumbnailUrl: "source-image",
    sourceUrl: "https://snkrdunk.com/en/trading-cards/7001",
    minPriceUsd: 12.5,
    matchedCardId: 101,
    matchedCard: card,
  };
  const page = (data) => ({
    data,
    totalPage: data.length ? 1 : 0,
    totalItems: data.length,
  });
  const client = {
    async initialize() {},
    async callReadOnly(tool, args) {
      if (tool === "card_list") return page([card]);
      if (tool === "snkrdunk_mapping_list") {
        return page(args.status === "matched" ? [mapping] : []);
      }
      throw new Error(`unexpected tool: ${tool}`);
    },
  };
  let written = null;
  const result = await runSnkrdunkHistoricalReview({
    argv: ["--include-current-matched", "--report-dir", "/tmp/reports"],
    env: {},
    clientFactory: () => client,
    imageLoader: async (url) => ({ ...feature, url }),
    writeReportImpl: async (reportPath, report) => { written = { reportPath, report }; },
    now: () => new Date("2026-09-02T00:00:00.000Z"),
    uuid: () => "test-run",
  });
  assert.equal(result.report.mode, "read-only");
  assert.equal(result.report.inputs.currentMatched.matchedMappings, 1);
  assert.equal(result.report.inputs.currentMatched.added, 1);
  assert.equal(result.report.listings.length, 1);
  assert.equal(result.report.listings[0].source.snkrdunkId, 7001);
  assert.equal(result.report.listings[0].classification.category, "requires_matched_audit");
  assert.equal(result.report.listings[0].matchedAudit.category, "shadow_candidate");
  assert.equal(written.reportPath, result.reportPath);
});

test("current MATCHED merge records source conflicts and duplicate source IDs", () => {
  const input = normalizeHistoricalListing({
    snkrdunkId: 7001,
    productNumber: "OP01-002",
    name: "Conflicting snapshot R [OP01-002]",
    thumbnailUrl: "snapshot-image",
  });
  const mapping = {
    id: 901,
    snkrdunkId: 7001,
    normalizedStatus: "matched",
    productNumber: "OP01-001",
    scrapedName: "Monkey.D.Luffy L [OP01-001]",
    thumbnailUrl: "current-image",
  };
  const merged = mergeCurrentMatchedListings([input], [
    mapping,
    { ...mapping, id: 902 },
  ]);
  assert.equal(merged.stats.matchedMappings, 2);
  assert.equal(merged.stats.added, 0);
  assert.equal(merged.stats.merged, 2);
  assert.equal(merged.stats.duplicateMatchedSourceIds, 1);
  assert.equal(merged.stats.sourceConflicts, 1);
  assert.ok(merged.listings[0].sourceConflicts.some((row) => row.field === "productNumber"));
  assert.ok(merged.listings[0].sourceConflicts.some((row) => row.field === "thumbnailUrl"));
});
