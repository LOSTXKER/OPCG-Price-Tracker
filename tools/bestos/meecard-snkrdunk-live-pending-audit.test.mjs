import assert from "node:assert/strict";
import test from "node:test";

import {
  decideLiveAuditSafety,
  fetchAll,
  fetchDominantCardFeature,
  isSpecialSource,
  resolveSourceCode,
} from "./meecard-snkrdunk-live-pending-audit.mjs";

function pagedClient(pages) {
  return {
    async callReadOnly(_tool, args) {
      return pages[args.page - 1];
    },
  };
}

test("pagination fetches every declared page and rejects incomplete or changing totals", async () => {
  const complete = await fetchAll(pagedClient([
    { data: [{ id: 1 }], totalPage: 2, totalItems: 2 },
    { data: [{ id: 2 }], totalPage: 2, totalItems: 2 },
  ]), "card_list", {});
  assert.deepEqual(complete.map((row) => row.id), [1, 2]);

  await assert.rejects(
    fetchAll(pagedClient([
      { data: [{ id: 1 }], totalPage: 2, totalItems: 3 },
      { data: [{ id: 2 }], totalPage: 2, totalItems: 3 },
    ]), "card_list", {}),
    /pagination integrity/,
  );
  await assert.rejects(
    fetchAll(pagedClient([
      { data: [{ id: 1 }], totalPage: 2, totalItems: 2 },
      { data: [{ id: 2 }], totalPage: 3, totalItems: 3 },
    ]), "card_list", {}),
    /pagination ไม่ตรง/,
  );
});

test("pagination rejects missing and duplicate IDs", async () => {
  await assert.rejects(
    fetchAll(pagedClient([
      { data: [{ id: 1 }], totalPage: 2, totalItems: 2 },
      { data: [{ id: 1 }], totalPage: 2, totalItems: 2 },
    ]), "snkrdunk_mapping_list", {}),
    /pagination integrity/,
  );
  await assert.rejects(
    fetchAll(pagedClient([
      { data: [{ id: null }], totalPage: 1, totalItems: 1 },
    ]), "snkrdunk_mapping_list", {}),
    /pagination integrity/,
  );
});

test("productNumber is primary and a conflicting code in the name is blocked", () => {
  assert.deepEqual(resolveSourceCode({
    productNumber: "op01-001",
    scrapedName: "Monkey D. Luffy R [OP02-001]",
  }), {
    code: "OP01-001",
    nameCodes: ["OP02-001"],
    conflict: true,
  });
  assert.equal(resolveSourceCode({
    productNumber: "ST01-001",
    scrapedName: "Monkey D. Luffy L [ST01-001]",
  }).conflict, false);
});

test("a unique promotional candidate always remains manual-only", () => {
  const special = isSpecialSource("Monkey D. Luffy P [P-041]", "P-041");
  assert.equal(special, true);
  assert.deepEqual(decideLiveAuditSafety({
    sourceCode: "P-041",
    sourceRarity: "P",
    compatibleCount: 1,
    hasVisual: true,
    visualGate: { ok: true, reason: "visual_high_confidence" },
    locale: { pass: true, reason: "japanese_locale_high_confidence" },
    special,
  }), {
    safe: false,
    reason: "special_requires_manual_review",
  });
});

test("stamped and serial treatments always remain manual-only", () => {
  assert.equal(isSpecialSource("Nami SR Stamped", "OP01-016"), true);
  assert.equal(isSpecialSource("Luffy serial number card", "ST01-001"), true);
});

test("an explicit non-Japanese marker stays the primary blocked reason", () => {
  assert.deepEqual(decideLiveAuditSafety({
    sourceCode: "OP01-001",
    sourceRarity: "L",
    compatibleCount: 1,
    hasVisual: true,
    visualGate: { ok: false, reason: "visual_score_too_high" },
    locale: { pass: false, reason: "explicit_non_japanese_locale" },
  }), {
    safe: false,
    reason: "explicit_non_japanese_locale",
  });
});

test("ordinary Starter Deck cards are not treated as promotional variants", () => {
  assert.equal(
    isSpecialSource('Brook C [ST31-003](Start Deck "Red Monkey.D.Luffy")', "ST31-003"),
    false,
  );
  assert.equal(
    isSpecialSource('Curiel C [OP16-004](Booster Pack "THE TIME OF BATTLE")', "OP16-004"),
    false,
  );
});

test("source image loading rejects arbitrary hosts, insecure URLs, non-images, and oversized bodies", async () => {
  let calls = 0;
  const arbitraryHost = await fetchDominantCardFeature("https://example.test/card.png", {
    retries: 1,
    fetchImpl: async () => { calls++; throw new Error("must not fetch"); },
  });
  assert.equal(arbitraryHost.reason, "image_host_not_allowed");
  const insecure = await fetchDominantCardFeature("http://cdn.snkrdunk.com/card.png", {
    retries: 1,
    fetchImpl: async () => { calls++; throw new Error("must not fetch"); },
  });
  assert.equal(insecure.reason, "image_https_required");
  assert.equal(calls, 0);

  const nonImage = await fetchDominantCardFeature("https://cdn.snkrdunk.com/card.png", {
    retries: 1,
    fetchImpl: async () => new Response("not an image", {
      status: 200,
      headers: { "content-type": "text/html" },
    }),
  });
  assert.equal(nonImage.reason, "non_image_content_type");

  const oversized = await fetchDominantCardFeature("https://cdn.snkrdunk.com/card.png", {
    retries: 1,
    fetchImpl: async () => new Response(Buffer.alloc(12 * 1024 * 1024 + 1), {
      status: 200,
      headers: { "content-type": "image/png" },
    }),
  });
  assert.equal(oversized.reason, "image_too_large");
});
