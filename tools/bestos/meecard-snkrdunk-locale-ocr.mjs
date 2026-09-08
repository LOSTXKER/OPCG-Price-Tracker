#!/usr/bin/env node
// Read-only Japanese-locale OCR audit for SNKRDUNK historical-review candidates.

import { execFile as execFileCallback } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

import { writeImmutableJsonReport } from "./meecard-snkrdunk-backfill.mjs";

const execFile = promisify(execFileCallback);

export const LOCALE_OCR_JOB = "meecard-snkrdunk-locale-ocr";
export const LOCALE_OCR_SCHEMA_VERSION = 1;
export const MIN_KANA_CHARACTERS = 8;
export const MIN_KANA_LINES = 2;
export const MIN_STRONG_LINE_KANA = 3;
export const MIN_STRONG_LINE_CONFIDENCE = 0.5;

const HISTORICAL_REVIEW_JOB = "meecard-snkrdunk-historical-review";
const MAX_INPUT_REPORT_BYTES = 128 * 1024 * 1024;
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const DOWNLOAD_CONCURRENCY = 6;
const SWIFT_SOURCE_PATH = fileURLToPath(new URL(
  "./meecard-snkrdunk-locale-ocr.swift",
  import.meta.url,
));

export class LocaleOcrUsageError extends Error {
  constructor(message) {
    super(message);
    this.name = "LocaleOcrUsageError";
  }
}

function parseValueOption(argv, index, name) {
  const current = argv[index];
  if (current === name) {
    if (index + 1 >= argv.length) throw new LocaleOcrUsageError(`${name} ต้องมีค่า`);
    return { value: argv[index + 1], consumed: 2 };
  }
  if (current.startsWith(`${name}=`)) {
    const value = current.slice(name.length + 1);
    if (!value) throw new LocaleOcrUsageError(`${name} ต้องมีค่า`);
    return { value, consumed: 1 };
  }
  return null;
}

export function defaultLocaleOcrPaths(homeDir = os.homedir()) {
  return {
    reportDir: path.join(
      homeDir,
      ".local",
      "state",
      "bestos",
      "meecard-auto-match",
      "snkrdunk-locale-ocr-runs",
    ),
  };
}

export function parseLocaleOcrCliArgs(
  argv = process.argv.slice(2),
  env = process.env,
  { homeDir = os.homedir() } = {},
) {
  const defaults = defaultLocaleOcrPaths(homeDir);
  let inputReport = null;
  let reportDir = env.MEECARD_SNKRDUNK_LOCALE_OCR_REPORT_DIR ?? defaults.reportDir;
  let help = false;

  for (let index = 0; index < argv.length;) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      help = true;
      index++;
      continue;
    }
    const inputOption = parseValueOption(argv, index, "--report");
    if (inputOption) {
      if (inputReport != null) throw new LocaleOcrUsageError("ระบุ --report ได้ครั้งเดียว");
      inputReport = inputOption.value;
      index += inputOption.consumed;
      continue;
    }
    const reportDirOption = parseValueOption(argv, index, "--report-dir");
    if (reportDirOption) {
      reportDir = reportDirOption.value;
      index += reportDirOption.consumed;
      continue;
    }
    throw new LocaleOcrUsageError(`ไม่รู้จัก option: ${arg}`);
  }

  if (!help && inputReport == null) {
    throw new LocaleOcrUsageError("ต้องระบุ --report ของ historical review");
  }
  if (!String(reportDir ?? "").trim()) {
    throw new LocaleOcrUsageError("report directory ว่างไม่ได้");
  }
  return {
    help,
    inputReport: help ? null : path.resolve(String(inputReport)),
    reportDir: path.resolve(String(reportDir)),
  };
}

function numericId(value) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export function preferLargeSnkrdunkImageUrl(value) {
  let parsed;
  try {
    parsed = new URL(String(value ?? ""));
  } catch {
    throw new Error("source image URL ไม่ถูกต้อง");
  }
  if (parsed.protocol !== "https:" || parsed.hostname !== "cdn.snkrdunk.com") {
    throw new Error("source image ต้องเป็น HTTPS จาก cdn.snkrdunk.com");
  }
  parsed.username = "";
  parsed.password = "";
  parsed.hash = "";
  parsed.searchParams.set("size", "l");
  return parsed.toString();
}

const BLOCKED_LOCALE_TOKEN = /(?:^|[^A-Z0-9])(ENGLISH|ENG|EN|CHINESE|ZH(?:[-_](?:CN|TW|HANS|HANT))?|CN|KOREAN|KOR|KR|THAI|TH|FRENCH|FRA|FR|GERMAN|DEUTSCH|DE|SPANISH|ES|ITALIAN|IT|PORTUGUESE|PT)(?=$|[^A-Z0-9])/i;
const BLOCKED_LOCALE_TEXT = /(中文|简体|簡體|繁体|繁體|英語版|英語|韓国語|韓國語|タイ語|フランス語|ドイツ語|スペイン語|イタリア語|ポルトガル語)/u;

export function detectBlockedLocaleMarker(row) {
  let imageFilename = "";
  try {
    imageFilename = decodeURIComponent(path.basename(new URL(String(row?.imageUrl ?? "")).pathname));
  } catch {
    imageFilename = String(row?.imageUrl ?? "");
  }
  for (const [field, value] of [["source_name", row?.name], ["image_filename", imageFilename]]) {
    const text = String(value ?? "");
    const token = text.match(BLOCKED_LOCALE_TOKEN)?.[1] ?? text.match(BLOCKED_LOCALE_TEXT)?.[1];
    if (token) return { blocked: true, field, marker: token };
  }
  return { blocked: false, field: null, marker: null };
}

function compactLocaleAuditRow(row) {
  const source = row?.source;
  const snkrdunkId = numericId(source?.snkrdunkId);
  if (snkrdunkId == null || typeof source?.imageUrl !== "string") {
    throw new Error("locale-audit row ขาด SNKRDUNK ID หรือ source image");
  }
  return {
    key: String(snkrdunkId),
    snkrdunkId,
    auditKind: row?.classification?.category === "requires_matched_audit"
      ? "current_match"
      : "shadow_candidate",
    mappingId: numericId(row?.currentMappings?.[0]?.mappingId),
    code: typeof source.code === "string" ? source.code : null,
    name: typeof source.name === "string" ? source.name : null,
    sourceUrl: typeof source.sourceUrl === "string" ? source.sourceUrl : null,
    imageUrl: source.imageUrl,
    target: row?.target && typeof row.target === "object" ? {
      cardId: numericId(row.target.cardId),
      code: typeof row.target.code === "string" ? row.target.code : null,
      imageUrl: typeof row.target.imageUrl === "string" ? row.target.imageUrl : null,
    } : null,
  };
}

export function extractLocaleAuditRows(report) {
  if (!report || typeof report !== "object" || Array.isArray(report)) {
    throw new Error("historical review report ต้องเป็น JSON object");
  }
  if (report.job !== HISTORICAL_REVIEW_JOB || report.mode !== "read-only") {
    throw new Error("รับเฉพาะรายงาน read-only จาก meecard-snkrdunk-historical-review");
  }
  if (!Array.isArray(report.listings)) throw new Error("historical review report ไม่มี listings[]");

  const rows = report.listings
    .filter((row) => {
      if (["shadow_candidate", "shadow_safe"].includes(row?.classification?.category)) return true;
      return row?.classification?.category === "requires_matched_audit"
        && numericId(row?.classification?.currentTargetCardId) != null;
    })
    .map(compactLocaleAuditRow);
  const seen = new Set();
  for (const row of rows) {
    if (seen.has(row.snkrdunkId)) throw new Error(`SNKRDUNK ID ซ้ำใน locale audit: ${row.snkrdunkId}`);
    seen.add(row.snkrdunkId);
  }
  return rows;
}

// Backward-compatible name for existing callers. The extractor now also admits
// current matches so OCR can provide independent locale evidence without
// claiming that their artwork or target is safe.
export const extractShadowSafeRows = extractLocaleAuditRows;

export function countKanaCharacters(text) {
  const value = typeof text === "string" ? text : "";
  const hiragana = value.match(/\p{Script=Hiragana}/gu)?.length ?? 0;
  const katakana = value.match(/\p{Script=Katakana}/gu)?.length ?? 0;
  return {
    total: hiragana + katakana,
    hiragana,
    katakana,
  };
}

export function classifyJapaneseLocale(lines) {
  const evidence = (Array.isArray(lines) ? lines : []).map((line, index) => {
    const text = typeof line?.text === "string" ? line.text : "";
    const confidence = typeof line?.confidence === "number" && Number.isFinite(line.confidence)
      ? line.confidence
      : 0;
    const kanaCharacters = countKanaCharacters(text);
    return {
      index,
      text,
      confidence: Number(confidence.toFixed(6)),
      kanaCharacters,
      hasKana: kanaCharacters.total > 0,
      strongEvidence: kanaCharacters.total >= MIN_STRONG_LINE_KANA
        && confidence >= MIN_STRONG_LINE_CONFIDENCE,
    };
  });
  const kanaCharacters = evidence.reduce((total, line) => ({
    total: total.total + line.kanaCharacters.total,
    hiragana: total.hiragana + line.kanaCharacters.hiragana,
    katakana: total.katakana + line.kanaCharacters.katakana,
  }), { total: 0, hiragana: 0, katakana: 0 });
  const kanaLineCount = evidence.filter((line) => line.hasKana).length;
  const strongLineCount = evidence.filter((line) => line.strongEvidence).length;
  const failedReasons = [];
  if (kanaCharacters.total < MIN_KANA_CHARACTERS) failedReasons.push("insufficient_kana_total");
  if (kanaLineCount < MIN_KANA_LINES) failedReasons.push("insufficient_kana_lines");
  if (strongLineCount < 1) failedReasons.push("missing_confident_kana_line");
  const pass = failedReasons.length === 0;
  return {
    status: pass ? "pass" : "fail",
    pass,
    reason: pass ? "kana_evidence_confirmed" : failedReasons[0],
    failedReasons,
    kanaCharacters,
    kanaLineCount,
    strongLineCount,
    lineEvidence: evidence,
  };
}

export function parseVisionOcrOutput(value, expectedKeys = []) {
  let parsed;
  try {
    parsed = typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    throw new Error("Vision OCR output ไม่ใช่ JSON");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Vision OCR output ต้องเป็น object");
  }
  const metadata = parsed.metadata;
  if (!metadata || typeof metadata !== "object"
    || typeof metadata.engine !== "string"
    || typeof metadata.framework !== "string"
    || !Number.isSafeInteger(metadata.requestRevision)
    || metadata.requestRevision < 1
    || metadata.recognitionLevel !== "accurate"
    || !Array.isArray(metadata.recognitionLanguages)
    || !metadata.recognitionLanguages.includes("ja-JP")) {
    throw new Error("Vision OCR output ขาด engine/revision metadata");
  }
  if (!Array.isArray(parsed.results)) throw new Error("Vision OCR output results ต้องเป็น array");
  const expected = new Set(expectedKeys.map(String));
  const results = new Map();
  for (const row of parsed.results) {
    const key = typeof row?.key === "string" ? row.key : null;
    if (!key || results.has(key) || (expected.size && !expected.has(key))) {
      throw new Error("Vision OCR output มี key ไม่ถูกต้องหรือซ้ำ");
    }
    if (typeof row.ok !== "boolean") throw new Error("Vision OCR output ขาด ok");
    if (row.ok && !Array.isArray(row.lines)) throw new Error("Vision OCR output ขาด lines");
    const lines = (Array.isArray(row.lines) ? row.lines : []).map((line) => {
      if (typeof line?.text !== "string"
        || typeof line?.confidence !== "number"
        || !Number.isFinite(line.confidence)
        || line.confidence < 0
        || line.confidence > 1) {
        throw new Error("Vision OCR line text/confidence ไม่ถูกต้อง");
      }
      return { text: line.text, confidence: line.confidence };
    });
    results.set(key, {
      key,
      ok: row.ok,
      lines,
      observationCount: Number.isSafeInteger(row.observationCount) && row.observationCount >= 0
        ? row.observationCount
        : 0,
      error: row.ok ? null : String(row.error ?? "Vision OCR failed").slice(0, 500),
    });
  }
  for (const key of expected) {
    if (!results.has(key)) throw new Error(`Vision OCR output ขาด key: ${key}`);
  }
  return {
    metadata: {
      engine: metadata.engine,
      framework: metadata.framework,
      requestRevision: metadata.requestRevision,
      recognitionLevel: metadata.recognitionLevel,
      recognitionLanguages: metadata.recognitionLanguages.map(String),
      operatingSystemVersion: typeof metadata.operatingSystemVersion === "string"
        ? metadata.operatingSystemVersion
        : null,
    },
    results,
  };
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

async function loadHistoricalReport(reportPath, { readFileImpl = fs.readFile, statImpl = fs.stat } = {}) {
  const stat = await statImpl(reportPath);
  if (!stat.isFile()) throw new Error(`historical review report ไม่ใช่ไฟล์: ${reportPath}`);
  if (stat.size > MAX_INPUT_REPORT_BYTES) throw new Error("historical review report ใหญ่เกินขอบเขต");
  const bytes = await readFileImpl(reportPath);
  let report;
  try {
    report = JSON.parse(bytes.toString("utf8"));
  } catch {
    throw new Error("historical review report อ่าน JSON ไม่ได้");
  }
  return {
    report,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}

function extensionForContentType(contentType) {
  if (/png/i.test(contentType)) return ".png";
  if (/jpe?g/i.test(contentType)) return ".jpg";
  if (/webp/i.test(contentType)) return ".webp";
  if (/gif/i.test(contentType)) return ".gif";
  return ".image";
}

export async function downloadSnkrdunkSourceImage(
  row,
  tempDir,
  { fetchImpl = globalThis.fetch } = {},
) {
  try {
    const requestedUrl = preferLargeSnkrdunkImageUrl(row.imageUrl);
    const response = await fetchImpl(requestedUrl, {
      redirect: "error",
      signal: AbortSignal.timeout(30_000),
      headers: { accept: "image/*" },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const contentType = response.headers.get("content-type") ?? "";
    if (!/^image\//i.test(contentType)) throw new Error("response ไม่ใช่ image");
    const declaredLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(declaredLength) && declaredLength > MAX_IMAGE_BYTES) {
      throw new Error("image ใหญ่เกินขอบเขต");
    }
    if (!response.body) throw new Error("image response ไม่มี body");
    const chunks = [];
    let receivedBytes = 0;
    for await (const chunk of response.body) {
      receivedBytes += chunk.byteLength;
      if (receivedBytes > MAX_IMAGE_BYTES) throw new Error("image ใหญ่เกินขอบเขต");
      chunks.push(Buffer.from(chunk));
    }
    const bytes = Buffer.concat(chunks);
    if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) throw new Error("image ว่างหรือใหญ่เกินขอบเขต");
    const filePath = path.join(tempDir, `${row.snkrdunkId}${extensionForContentType(contentType)}`);
    await fs.writeFile(filePath, bytes, { mode: 0o600, flag: "wx" });
    return {
      ok: true,
      key: row.key,
      requestedUrl,
      filePath,
      contentType,
      bytes: bytes.length,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      key: row.key,
      requestedUrl: null,
      filePath: null,
      contentType: null,
      bytes: 0,
      sha256: null,
      error: String(error?.message ?? error).slice(0, 500),
    };
  }
}

export async function runVisionOcrBatch(
  downloads,
  tempDir,
  { execFileImpl = execFile, swiftSourcePath = SWIFT_SOURCE_PATH } = {},
) {
  if (!downloads.length) return { metadata: null, results: new Map() };
  const executablePath = path.join(tempDir, "meecard-snkrdunk-locale-ocr");
  const manifestPath = path.join(tempDir, "manifest.json");
  const outputPath = path.join(tempDir, "ocr-output.json");
  await execFileImpl("xcrun", [
    "swiftc",
    swiftSourcePath,
    "-O",
    "-framework", "Vision",
    "-framework", "ImageIO",
    "-framework", "CoreGraphics",
    "-o", executablePath,
  ], { timeout: 120_000, maxBuffer: 4 * 1024 * 1024 });
  await fs.writeFile(manifestPath, JSON.stringify({
    items: downloads.map((download) => ({ key: download.key, path: download.filePath })),
  }), { mode: 0o600, flag: "wx" });
  await execFileImpl(executablePath, [manifestPath, outputPath], {
    timeout: 15 * 60_000,
    maxBuffer: 4 * 1024 * 1024,
  });
  return parseVisionOcrOutput(
    await fs.readFile(outputPath, "utf8"),
    downloads.map((download) => download.key),
  );
}

function reportFilename(startedAt, runId) {
  return `${startedAt.toISOString().replace(/[:.]/g, "-")}-${runId}.json`;
}

function countStatuses(rows) {
  const counts = { total: rows.length, pass: 0, fail: 0, error: 0 };
  for (const row of rows) counts[row.status]++;
  counts.failedChecks = counts.fail + counts.error;
  return counts;
}

function resultForRow(row, localeBlock, download, ocr) {
  if (localeBlock?.blocked) {
    return {
      ...row,
      status: "fail",
      pass: false,
      reason: "explicit_non_japanese_locale",
      failedReasons: ["explicit_non_japanese_locale"],
      blockedLocale: localeBlock,
      error: null,
      image: null,
      ocr: null,
    };
  }
  if (!download?.ok) {
    return {
      ...row,
      status: "error",
      pass: false,
      reason: "source_image_download_error",
      failedReasons: ["source_image_download_error"],
      blockedLocale: null,
      error: `download: ${download?.error ?? "missing result"}`,
      image: null,
      ocr: null,
    };
  }
  const image = {
    requestedUrl: download.requestedUrl,
    contentType: download.contentType,
    bytes: download.bytes,
    sha256: download.sha256,
  };
  if (!ocr?.ok) {
    return {
      ...row,
      status: "error",
      pass: false,
      reason: "vision_ocr_error",
      failedReasons: ["vision_ocr_error"],
      blockedLocale: null,
      error: `ocr: ${ocr?.error ?? "missing result"}`,
      image,
      ocr: null,
    };
  }
  const classification = classifyJapaneseLocale(ocr.lines);
  return {
    ...row,
    status: classification.status,
    pass: classification.pass,
    reason: classification.reason,
    failedReasons: classification.failedReasons,
    blockedLocale: null,
    error: null,
    image,
    ocr: {
      observationCount: ocr.observationCount,
      kanaCharacters: classification.kanaCharacters,
      kanaLineCount: classification.kanaLineCount,
      strongLineCount: classification.strongLineCount,
      lineEvidence: classification.lineEvidence,
    },
  };
}

export async function runSnkrdunkLocaleOcrAudit({
  argv = process.argv.slice(2),
  env = process.env,
  homeDir = os.homedir(),
  fetchImpl = globalThis.fetch,
  now = () => new Date(),
  uuid = () => randomUUID(),
  downloadImpl = downloadSnkrdunkSourceImage,
  ocrBatchImpl = runVisionOcrBatch,
  writeReportImpl = writeImmutableJsonReport,
} = {}) {
  const options = parseLocaleOcrCliArgs(argv, env, { homeDir });
  if (options.help) return { help: true, usage: localeOcrUsageText() };

  const startedAt = now();
  const runId = uuid();
  const loaded = await loadHistoricalReport(options.inputReport);
  const candidates = extractLocaleAuditRows(loaded.report);
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "meecard-snkr-locale-ocr-"));
  await fs.chmod(tempDir, 0o700);

  try {
    const localeBlocks = new Map(candidates.map((row) => [row.key, detectBlockedLocaleMarker(row)]));
    const downloadCandidates = candidates.filter((row) => !localeBlocks.get(row.key)?.blocked);
    const downloads = await mapLimit(downloadCandidates, DOWNLOAD_CONCURRENCY, (row) => (
      downloadImpl(row, tempDir, { fetchImpl })
    ));
    const successfulDownloads = downloads.filter((download) => download.ok);
    const ocrBatch = await ocrBatchImpl(successfulDownloads, tempDir);
    if (!ocrBatch || !(ocrBatch.results instanceof Map)) {
      throw new Error("Vision OCR batch result ไม่ถูกต้อง");
    }
    const downloadByKey = new Map(downloads.map((download) => [download.key, download]));
    const rows = candidates.map((row) => resultForRow(
      row,
      localeBlocks.get(row.key),
      downloadByKey.get(row.key),
      ocrBatch.results.get(row.key),
    ));
    const finishedAt = now();
    const reportPath = path.join(options.reportDir, reportFilename(startedAt, runId));
    const counts = countStatuses(rows);
    const report = {
      schemaVersion: LOCALE_OCR_SCHEMA_VERSION,
      job: LOCALE_OCR_JOB,
      runId,
      mode: "read-only",
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      reportPath,
      input: {
        reportPath: options.inputReport,
        reportSha256: loaded.sha256,
        sourceJob: loaded.report.job,
        sourceRunId: loaded.report.runId ?? null,
        sourceLocaleAuditRows: candidates.length,
      },
      policy: {
        imageHost: "cdn.snkrdunk.com",
        preferredImageSize: "l",
        countedScripts: ["Hiragana", "Katakana"],
        excludedScripts: ["Han"],
        minKanaCharacters: MIN_KANA_CHARACTERS,
        minKanaLines: MIN_KANA_LINES,
        strongLine: {
          minKanaCharacters: MIN_STRONG_LINE_KANA,
          minConfidence: MIN_STRONG_LINE_CONFIDENCE,
        },
      },
      ocrEngine: ocrBatch.metadata,
      counts,
      outcome: counts.failedChecks === 0 ? "all_passed" : "review_required",
      listings: rows,
    };
    await writeReportImpl(reportPath, report);
    return { reportPath, report };
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

export function localeOcrUsageText() {
  return [
    "ใช้: node tools/companion/meecard-snkrdunk-locale-ocr.mjs --report PATH [options]",
    "--report PATH                 รายงาน meecard-snkrdunk-historical-review",
    "--report-dir PATH             โฟลเดอร์รายงาน immutable",
    "งานนี้อ่านภาพสาธารณะและเขียนรายงานเท่านั้น ไม่มี Production mutation/cron",
  ].join("\n");
}

async function cli() {
  try {
    const result = await runSnkrdunkLocaleOcrAudit();
    if (result.help) {
      console.log(result.usage);
      return;
    }
    console.log(JSON.stringify({
      ok: true,
      mode: result.report.mode,
      reportPath: result.reportPath,
      outcome: result.report.outcome,
      counts: result.report.counts,
    }));
  } catch (error) {
    console.error(JSON.stringify({
      ok: false,
      error: String(error?.message ?? error).slice(0, 500),
    }));
    process.exitCode = error instanceof LocaleOcrUsageError ? 2 : 1;
  }
}

const isMain = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) await cli();
