import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  LocaleOcrUsageError,
  classifyJapaneseLocale,
  countKanaCharacters,
  detectBlockedLocaleMarker,
  extractLocaleAuditRows,
  extractShadowSafeRows,
  parseLocaleOcrCliArgs,
  parseVisionOcrOutput,
  preferLargeSnkrdunkImageUrl,
  runSnkrdunkLocaleOcrAudit,
} from "./meecard-snkrdunk-locale-ocr.mjs";

test("CLI requires one historical report and exposes no apply mode", () => {
  const parsed = parseLocaleOcrCliArgs(["--report=/tmp/history.json"], {}, { homeDir: "/tmp/home" });
  assert.equal(parsed.inputReport, "/tmp/history.json");
  assert.throws(
    () => parseLocaleOcrCliArgs([], {}, { homeDir: "/tmp/home" }),
    (error) => error instanceof LocaleOcrUsageError && /ต้องระบุ/.test(error.message),
  );
  assert.throws(
    () => parseLocaleOcrCliArgs(["--report=/tmp/a", "--apply"], {}, { homeDir: "/tmp/home" }),
    (error) => error instanceof LocaleOcrUsageError && /ไม่รู้จัก/.test(error.message),
  );
  assert.throws(
    () => parseLocaleOcrCliArgs([
      "--report=/tmp/a",
      "--min-japanese-chars=1",
    ], {}, { homeDir: "/tmp/home" }),
    (error) => error instanceof LocaleOcrUsageError && /ไม่รู้จัก/.test(error.message),
  );
});

test("SNKRDUNK source URL is HTTPS-only, host-pinned, and prefers size l", () => {
  assert.equal(
    preferLargeSnkrdunkImageUrl("https://cdn.snkrdunk.com/card.webp?size=m"),
    "https://cdn.snkrdunk.com/card.webp?size=l",
  );
  assert.throws(() => preferLargeSnkrdunkImageUrl("http://cdn.snkrdunk.com/card.webp"), /HTTPS/);
  assert.throws(() => preferLargeSnkrdunkImageUrl("https://example.com/card.webp"), /cdn\.snkrdunk/);
});

test("historical report filter keeps shadow candidates and all current matches for locale evidence", () => {
  const report = {
    job: "meecard-snkrdunk-historical-review",
    mode: "read-only",
    listings: [
      {
        source: {
          snkrdunkId: 7001,
          code: "OP01-001",
          imageUrl: "https://cdn.snkrdunk.com/7001.webp",
        },
        target: { cardId: 101, code: "OP01-001", imageUrl: "https://official/101.png" },
        classification: { category: "shadow_candidate" },
      },
      {
        source: { snkrdunkId: 7002, imageUrl: "https://cdn.snkrdunk.com/7002.webp" },
        classification: { category: "blocked" },
      },
      {
        source: {
          snkrdunkId: 7003,
          code: "OP01-003",
          imageUrl: "https://cdn.snkrdunk.com/7003.webp",
        },
        currentMappings: [{ mappingId: 903, status: "matched" }],
        target: { cardId: 103, code: "OP01-003", imageUrl: "https://official/103.png" },
        classification: {
          category: "requires_matched_audit",
          reason: "current_mapping_requires_locale_audit",
          currentTargetCardId: 103,
          auditedTargetCardId: 103,
        },
        matchedAudit: { category: "shadow_safe" },
      },
      {
        source: { snkrdunkId: 7004, imageUrl: "https://cdn.snkrdunk.com/7004.webp" },
        classification: {
          category: "requires_matched_audit",
          reason: "current_mapping_target_mismatch",
          currentTargetCardId: 104,
          auditedTargetCardId: 105,
        },
        matchedAudit: { category: "shadow_safe" },
      },
    ],
  };
  const rows = extractLocaleAuditRows(report);
  assert.deepEqual(rows.map((row) => row.snkrdunkId), [7001, 7003, 7004]);
  assert.equal(rows[0].auditKind, "shadow_candidate");
  assert.equal(rows[1].auditKind, "current_match");
  assert.equal(rows[1].mappingId, 903);
  assert.equal(rows[2].auditKind, "current_match");
  assert.deepEqual(extractShadowSafeRows(report), rows);
  assert.throws(() => extractShadowSafeRows({ ...report, mode: "apply" }), /รับเฉพาะ/);
});

test("locale markers in source name or image filename are blocked before OCR", () => {
  assert.deepEqual(detectBlockedLocaleMarker({
    name: "Monkey.D.Luffy [EN]",
    imageUrl: "https://cdn.snkrdunk.com/card.webp",
  }), { blocked: true, field: "source_name", marker: "EN" });
  assert.deepEqual(detectBlockedLocaleMarker({
    name: "Monkey.D.Luffy",
    imageUrl: "https://cdn.snkrdunk.com/OP01-001_ZH-CN.webp",
  }), { blocked: true, field: "image_filename", marker: "ZH-CN" });
  assert.deepEqual(detectBlockedLocaleMarker({
    name: "Monkey.D.Luffy [FR]",
    imageUrl: "https://cdn.snkrdunk.com/OP13-001.webp",
  }), { blocked: true, field: "source_name", marker: "FR" });
  assert.equal(detectBlockedLocaleMarker({
    name: "Monkey.D.Luffy [JP]",
    imageUrl: "https://cdn.snkrdunk.com/OP13-001_JP.webp",
  }).blocked, false);
  assert.equal(detectBlockedLocaleMarker({
    name: "Enel R [OP05-100]",
    imageUrl: "https://cdn.snkrdunk.com/OP05-100.webp",
  }).blocked, false);
});

test("kana counter excludes Han and the fail-closed line rules pass valid Japanese", () => {
  assert.deepEqual(countKanaCharacters("Luffy ルフィ 海賊王"), {
    total: 3,
    hiragana: 0,
    katakana: 3,
  });
  const result = classifyJapaneseLocale([
    { text: "モンキー・D・ルフィ", confidence: 0.91 },
    { text: "麦わらの一味", confidence: 0.72 },
  ]);
  assert.equal(result.status, "pass");
  assert.equal(result.kanaCharacters.total >= 8, true);
  assert.equal(result.kanaLineCount, 2);
  assert.equal(result.strongLineCount >= 1, true);
});

test("English and Chinese OCR text fail because Han is not counted as Japanese evidence", () => {
  const english = classifyJapaneseLocale([
    { text: "Monkey D. Luffy", confidence: 0.99 },
    { text: "Straw Hat Crew", confidence: 0.98 },
  ]);
  const chinese = classifyJapaneseLocale([
    { text: "蒙奇路飞", confidence: 0.99 },
    { text: "草帽海贼团", confidence: 0.98 },
  ]);
  assert.equal(english.status, "fail");
  assert.equal(chinese.status, "fail");
  assert.equal(chinese.kanaCharacters.total, 0);
});

test("a low-confidence kana line cannot satisfy the strong-line gate", () => {
  const result = classifyJapaneseLocale([
    { text: "モンキールフィ", confidence: 0.49 },
    { text: "むぎわらのいちみ", confidence: 0.49 },
  ]);
  assert.equal(result.status, "fail");
  assert.equal(result.failedReasons.includes("missing_confident_kana_line"), true);
});

test("mock Vision OCR output parsing enforces expected keys", () => {
  const parsed = parseVisionOcrOutput(JSON.stringify({
    metadata: {
      engine: "VNRecognizeTextRequest",
      framework: "Apple Vision",
      requestRevision: 3,
      recognitionLevel: "accurate",
      recognitionLanguages: ["ja-JP", "en-US"],
      operatingSystemVersion: "macOS",
    },
    results: [
      {
        key: "7001",
        ok: true,
        lines: [{ text: "ルフィ", confidence: 0.91 }],
        observationCount: 1,
        error: null,
      },
      { key: "7002", ok: false, lines: [], observationCount: 0, error: "decode" },
    ],
  }), ["7001", "7002"]);
  assert.equal(parsed.metadata.requestRevision, 3);
  assert.equal(parsed.results.get("7001").lines[0].confidence, 0.91);
  assert.equal(parsed.results.get("7002").error, "decode");
  assert.throws(
    () => parseVisionOcrOutput(JSON.stringify({ metadata: {}, results: [] }), ["7001"]),
    /metadata/,
  );
});

test("audit writes pass fail and error counts from mocked downloads and OCR", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "snkr-locale-test-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const inputPath = path.join(root, "history.json");
  const sourceRows = [7001, 7002, 7003, 7004].map((snkrdunkId) => ({
    source: {
      snkrdunkId,
      code: `OP01-00${snkrdunkId - 7000}`,
      name: snkrdunkId === 7004 ? "Nami [EN]" : "Nami",
      imageUrl: `https://cdn.snkrdunk.com/${snkrdunkId}.webp`,
    },
    classification: { category: "shadow_candidate" },
  }));
  await fs.writeFile(inputPath, JSON.stringify({
    job: "meecard-snkrdunk-historical-review",
    mode: "read-only",
    runId: "history-run",
    listings: sourceRows,
  }));
  let written = null;
  const downloadedIds = [];
  const result = await runSnkrdunkLocaleOcrAudit({
    argv: ["--report", inputPath, "--report-dir", path.join(root, "reports")],
    homeDir: root,
    now: () => new Date("2026-09-02T00:00:00.000Z"),
    uuid: () => "ocr-run",
    downloadImpl: async (row) => {
      downloadedIds.push(row.snkrdunkId);
      return row.snkrdunkId === 7003 ? { ok: false, key: row.key, error: "network" } : {
          ok: true,
          key: row.key,
          requestedUrl: `https://cdn.snkrdunk.com/${row.key}.webp?size=l`,
          filePath: `/tmp/${row.key}.webp`,
          contentType: "image/webp",
          bytes: 100,
          sha256: "abc",
        };
    },
    ocrBatchImpl: async () => ({
      metadata: {
        engine: "VNRecognizeTextRequest",
        framework: "Apple Vision",
        requestRevision: 3,
        recognitionLevel: "accurate",
        recognitionLanguages: ["ja-JP", "en-US"],
        operatingSystemVersion: "macOS",
      },
      results: new Map([
        ["7001", {
          ok: true,
          lines: [
            { text: "モンキー・D・ルフィ", confidence: 0.91 },
            { text: "麦わらの一味", confidence: 0.72 },
          ],
          observationCount: 2,
        }],
        ["7002", {
          ok: true,
          lines: [
            { text: "Monkey D. Luffy", confidence: 0.99 },
            { text: "Straw Hat Crew", confidence: 0.98 },
          ],
          observationCount: 2,
        }],
      ]),
    }),
    writeReportImpl: async (reportPath, report) => { written = { reportPath, report }; },
  });
  assert.equal(result.report.outcome, "review_required");
  assert.deepEqual(result.report.counts, {
    total: 4,
    pass: 1,
    fail: 2,
    error: 1,
    failedChecks: 3,
  });
  assert.deepEqual(downloadedIds, [7001, 7002, 7003]);
  assert.equal(written.report.listings[0].ocr.kanaCharacters.katakana > 0, true);
  assert.equal(written.report.listings[0].ocr.lineEvidence[0].confidence, 0.91);
  assert.equal(written.report.listings[0].image.sha256, "abc");
  assert.equal(written.report.listings[3].reason, "explicit_non_japanese_locale");
  assert.equal(written.report.ocrEngine.requestRevision, 3);
});
