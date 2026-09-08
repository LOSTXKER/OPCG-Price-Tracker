#!/usr/bin/env node
// Read-only audit for live SNKRDUNK pending rows that were absent from a prior
// historical-review mapping snapshot. This tool never exposes mutation tools.

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  AUTO_SAFE_MAX_VISUAL_SCORE,
  AUTO_SAFE_MIN_MARGIN,
  DEFAULT_MCP_URL,
  McpClient,
  compareImageFeatures,
  conservativeVisualPredicate,
  fetchImageFeature,
  normalizePrintedCode,
} from "./meecard-auto-match-supervisor.mjs";
import {
  classifyJapaneseLocale,
  detectBlockedLocaleMarker,
  downloadSnkrdunkSourceImage,
  runVisionOcrBatch,
} from "./meecard-snkrdunk-locale-ocr.mjs";

const SPECIAL_SOURCE = /(?:PROMOTIONAL|PROMO|WINNER|FLAGSHIP|ANNIVERSARY SPECIAL CARD|COMPLETE GUIDE|MAGAZINE|JUMP|GIFT|ROUND1|SOUVENIR|SUPPLEMENT|ATTENDEE|VISITOR|CHAMPIONSHIP|COMIC PARALLEL|GOLD BACKGROUND|SILVER BACKGROUND|WANTED|STAMPED|UNSTAMPED|SERIAL|シリアル|刻印|P-[A-Z]{1,3}\b|\b[A-Z]{1,3}-P\b)/i;

function normalizeRarity(value) {
  return String(value ?? "").toUpperCase().replace(/\s+/g, "").trim();
}

function parseSourceRarity(name) {
  const text = String(name ?? "").toUpperCase();
  if (/(?:^|\s)P-P(?=\s|\[|:|$)/.test(text)) return "P";
  const suffixParallel = text.match(/(?:^|\s)(L|C|UC|R|SR|SEC|SP)-P(?=\s|\[|:|$)/);
  if (suffixParallel) return `P-${suffixParallel[1]}`;
  const prefixParallel = text.match(/(?:^|\s)(P-(?:L|C|UC|R|SR|SEC|SP))(?=\s|\[|:|$)/);
  if (prefixParallel) return prefixParallel[1];
  const direct = text.match(/(?:^|\s)(SEC|SR|SP|UC|L|R|C|P)(?=\s|\[|:|$)/);
  return direct?.[1] ?? "";
}

export function resolveSourceCode(mapping) {
  const code = normalizePrintedCode(mapping?.productNumber);
  const nameCodes = [...new Set(
    (String(mapping?.scrapedName ?? "").toUpperCase().match(/[A-Z]+\d*[-‐‑‒–—]\d{3,4}/g) ?? [])
      .map((value) => normalizePrintedCode(value))
      .filter(Boolean),
  )];
  return {
    code,
    nameCodes,
    conflict: Boolean(code) && nameCodes.some((nameCode) => nameCode !== code),
  };
}

export function isSpecialSource(name, sourceCode = "") {
  return SPECIAL_SOURCE.test(String(name ?? ""))
    || /^P-\d{3,4}$/i.test(String(sourceCode ?? "").trim());
}

export function decideLiveAuditSafety({
  sourceCode,
  sourceCodeConflict = false,
  sourceRarity,
  compatibleCount = 0,
  hasVisual = false,
  visualGate = { ok: false, reason: "visual_evidence_missing" },
  locale = { pass: false, reason: "locale_evidence_missing" },
  targetOccupied = false,
  special = false,
}) {
  // A source explicitly labelled as another language must never be hidden by
  // a later visual/metadata failure. Keep this first so the audit summary says
  // why the listing is ineligible, while still failing closed for every other
  // missing signal below.
  if (locale.reason === "explicit_non_japanese_locale") {
    return { safe: false, reason: "explicit_non_japanese_locale" };
  }
  if (!sourceCode || !sourceRarity) return { safe: false, reason: "invalid_source_metadata" };
  if (sourceCodeConflict) return { safe: false, reason: "source_code_conflict" };
  if (!compatibleCount) return { safe: false, reason: "no_exact_code_rarity_candidate" };
  if (!hasVisual) return { safe: false, reason: "visual_evidence_missing" };
  if (!visualGate.ok) return { safe: false, reason: visualGate.reason ?? "visual_evidence_missing" };
  if (!locale.pass) return { safe: false, reason: locale.reason ?? "locale_evidence_missing" };
  if (targetOccupied) return { safe: false, reason: "target_already_occupied" };
  if (special) return { safe: false, reason: "special_requires_manual_review" };
  return { safe: true, reason: "exact_artwork_and_japanese_locale" };
}

export async function fetchAll(client, tool, baseArgs, { limit = 100 } = {}) {
  const first = await client.callReadOnly(tool, { ...baseArgs, page: 1, limit });
  const totalPage = Number(first?.totalPage);
  const totalItems = Number(first?.totalItems);
  const validPageCount = Number.isInteger(totalPage)
    && (totalPage >= 1 || (totalPage === 0 && totalItems === 0));
  if (!Array.isArray(first?.data) || !validPageCount || !Number.isInteger(totalItems) || totalItems < 0) {
    throw new Error(`${tool} pagination shape ไม่ถูกต้อง`);
  }
  const rows = [...first.data];
  for (let page = 2; page <= totalPage; page++) {
    const result = await client.callReadOnly(tool, { ...baseArgs, page, limit });
    if (
      !Array.isArray(result?.data)
      || Number(result?.totalPage) !== totalPage
      || Number(result?.totalItems) !== totalItems
    ) {
      throw new Error(`${tool} page ${page} pagination ไม่ตรงกับ page แรก`);
    }
    rows.push(...result.data);
  }
  const ids = rows.map((row) => Number(row?.id));
  if (
    rows.length !== totalItems
    || ids.some((id) => !Number.isSafeInteger(id) || id <= 0)
    || new Set(ids).size !== rows.length
  ) {
    throw new Error(`${tool} pagination integrity ไม่ผ่าน (fetched=${rows.length}, reported=${totalItems})`);
  }
  return rows;
}

async function mapLimit(items, limit, fn) {
  const output = new Array(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      output[index] = await fn(items[index], index);
    }
  }));
  return output;
}

export async function fetchDominantCardFeature(url, options = {}) {
  return fetchImageFeature(url, options);
}

function compactVisual(visual) {
  if (!visual) return null;
  return {
    score: Number(visual.score.toFixed(6)),
    exactRawBytes: visual.exactRawBytes,
    exactNormalizedRgb: visual.exactNormalizedRgb,
    regions: Object.fromEntries(Object.entries(visual.regions).map(([key, row]) => [key, {
      score: Number(row.score.toFixed(6)),
      correlation: Number(row.correlation.toFixed(6)),
      histogramDistance: Number(row.histogramDistance.toFixed(6)),
    }])),
  };
}

async function main() {
  const historicalInput = process.argv[2] ?? process.env.MEECARD_SNKRDUNK_HISTORICAL_REPORT;
  if (!historicalInput) {
    throw new Error("ต้องระบุ path ของ historical-review report เป็น argument แรก");
  }
  const historicalPath = path.resolve(historicalInput);
  const outputInput = process.argv[3] ?? process.env.MEECARD_SNKRDUNK_LIVE_AUDIT_REPORT;
  const outputPath = outputInput ? path.resolve(outputInput) : null;
  const historical = JSON.parse(await fs.readFile(historicalPath, "utf8"));
  const historicalMappingIds = new Set(
    historical.listings.flatMap((row) => row.currentMappings ?? [])
      .map((row) => Number(row.mappingId ?? row.id))
      .filter(Number.isSafeInteger),
  );

  const client = new McpClient(process.env.MEECARD_MCP_URL ?? DEFAULT_MCP_URL);
  await client.initialize();
  const [pending, matched, catalog] = await Promise.all([
    fetchAll(client, "snkrdunk_mapping_list", { status: "pending", sort: "productNumber", order: "asc" }),
    fetchAll(client, "snkrdunk_mapping_list", { status: "matched", sort: "productNumber", order: "asc" }),
    fetchAll(client, "card_list", { sort: "id", order: "asc" }),
  ]);
  const rows = pending.filter((row) => !historicalMappingIds.has(Number(row.id)));
  const occupiedTargetIds = new Set(matched.map((row) => Number(row.matchedCardId)).filter(Number.isSafeInteger));

  const candidatePoolByMappingId = new Map(rows.map((row) => {
    const source = resolveSourceCode(row);
    const sourceRarity = parseSourceRarity(row.scrapedName);
    if (!source.code || source.conflict) return [Number(row.id), []];
    const candidates = [...(row.candidates ?? []), ...catalog.filter((candidate) => (
      normalizePrintedCode(candidate.cardCode ?? candidate.baseCode) === source.code
      && normalizeRarity(candidate.rarity) === normalizeRarity(sourceRarity)
    ))];
    return [Number(row.id), [...new Map(candidates.map((candidate) => [Number(candidate.id), candidate])).values()]];
  }));
  const imageUrls = [...new Set(rows.flatMap((row) => [
    row.thumbnailUrl,
    ...candidatePoolByMappingId.get(Number(row.id)).map((candidate) => candidate.imageUrl),
  ]).filter(Boolean))];
  const sourceUrls = new Set(rows.map((row) => row.thumbnailUrl));
  const featurePairs = await mapLimit(imageUrls, 8, async (url) => [
    url,
    sourceUrls.has(url) ? await fetchDominantCardFeature(url) : await fetchImageFeature(url),
  ]);
  const features = new Map(featurePairs);

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "meecard-snkr-live-audit-"));
  let ocrMetadata = null;
  const localeByMappingId = new Map();
  try {
    const ocrRows = rows.map((row) => ({
      key: String(row.id),
      snkrdunkId: Number(row.snkrdunkId),
      name: row.scrapedName,
      imageUrl: row.thumbnailUrl,
    }));
    const blockedByKey = new Map(ocrRows.map((row) => [row.key, detectBlockedLocaleMarker(row)]));
    const downloadable = ocrRows.filter((row) => !blockedByKey.get(row.key)?.blocked);
    const downloads = await mapLimit(downloadable, 6, (row) => downloadSnkrdunkSourceImage(row, tempDir));
    const successful = downloads.filter((row) => row.ok);
    const batch = await runVisionOcrBatch(successful, tempDir);
    ocrMetadata = batch.metadata;
    const downloadByKey = new Map(downloads.map((row) => [row.key, row]));
    for (const row of ocrRows) {
      const blocked = blockedByKey.get(row.key);
      if (blocked?.blocked) {
        localeByMappingId.set(Number(row.key), { pass: false, reason: "explicit_non_japanese_locale", blockedLocale: blocked });
        continue;
      }
      const download = downloadByKey.get(row.key);
      if (!download?.ok) {
        localeByMappingId.set(Number(row.key), { pass: false, reason: "source_image_download_error", error: download?.error ?? null });
        continue;
      }
      const ocr = batch.results.get(row.key);
      if (!ocr?.ok) {
        localeByMappingId.set(Number(row.key), { pass: false, reason: "vision_ocr_error", error: ocr?.error ?? null });
        continue;
      }
      const classified = classifyJapaneseLocale(ocr.lines);
      localeByMappingId.set(Number(row.key), {
        pass: classified.pass,
        reason: classified.reason,
        kanaCharacters: classified.kanaCharacters,
        kanaLineCount: classified.kanaLineCount,
        strongLineCount: classified.strongLineCount,
        lines: classified.lineEvidence,
        imageSha256: download.sha256,
      });
    }
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }

  const audited = rows.map((mapping) => {
    const sourceCodeEvidence = resolveSourceCode(mapping);
    const sourceCode = sourceCodeEvidence.code;
    const sourceRarity = parseSourceRarity(mapping.scrapedName);
    const compatible = candidatePoolByMappingId.get(Number(mapping.id)).filter((candidate) => (
      normalizePrintedCode(candidate.cardCode ?? candidate.baseCode) === sourceCode
      && normalizeRarity(candidate.rarity) === normalizeRarity(sourceRarity)
    ));
    const source = features.get(mapping.thumbnailUrl);
    const scored = compatible.map((candidate) => ({
      candidate,
      visual: compareImageFeatures(source, features.get(candidate.imageUrl)),
    })).filter((row) => row.visual).sort((a, b) => a.visual.score - b.visual.score || Number(a.candidate.id) - Number(b.candidate.id));
    const best = scored[0] ?? null;
    const second = scored[1] ?? null;
    const margin = best && second ? second.visual.score - best.visual.score : null;
    const visualGate = best ? conservativeVisualPredicate({
      visual: best.visual,
      compatibleCount: compatible.length,
      margin,
      maxVisualScore: AUTO_SAFE_MAX_VISUAL_SCORE,
      minMargin: AUTO_SAFE_MIN_MARGIN,
    }) : { ok: false, reason: "visual_evidence_missing" };
    const locale = localeByMappingId.get(Number(mapping.id)) ?? { pass: false, reason: "locale_evidence_missing" };
    const special = isSpecialSource(mapping.scrapedName, sourceCode);
    const decision = decideLiveAuditSafety({
      sourceCode,
      sourceCodeConflict: sourceCodeEvidence.conflict,
      sourceRarity,
      compatibleCount: compatible.length,
      hasVisual: Boolean(best),
      visualGate,
      locale,
      targetOccupied: best ? occupiedTargetIds.has(Number(best.candidate.id)) : false,
      special,
    });
    return {
      mappingId: Number(mapping.id),
      snkrdunkId: Number(mapping.snkrdunkId),
      code: mapping.productNumber,
      sourceCodeEvidence,
      name: mapping.scrapedName,
      sourceUrl: mapping.sourceUrl,
      sourceImageUrl: mapping.thumbnailUrl,
      special,
      sourceRarity: sourceRarity || null,
      locale,
      safe: decision.safe,
      reason: decision.reason,
      visualEvidence: visualGate.ok ? visualGate.reason : null,
      targetCardId: decision.safe ? Number(best.candidate.id) : null,
      bestCandidate: best ? {
        cardId: Number(best.candidate.id),
        code: best.candidate.cardCode,
        rarity: best.candidate.rarity,
        imageUrl: best.candidate.imageUrl,
        occupied: occupiedTargetIds.has(Number(best.candidate.id)),
        visual: compactVisual(best.visual),
      } : null,
      visualMargin: margin == null ? null : Number(margin.toFixed(6)),
      candidates: scored.map((row) => ({
        cardId: Number(row.candidate.id),
        code: row.candidate.cardCode,
        rarity: row.candidate.rarity,
        imageUrl: row.candidate.imageUrl,
        visual: compactVisual(row.visual),
      })),
    };
  });

  const targetGroups = new Map();
  for (const row of audited.filter((row) => row.safe)) {
    if (!targetGroups.has(row.targetCardId)) targetGroups.set(row.targetCardId, []);
    targetGroups.get(row.targetCardId).push(row);
  }
  for (const group of targetGroups.values()) {
    if (group.length < 2) continue;
    for (const row of group) {
      row.safe = false;
      row.reason = "pending_target_collision";
      row.targetCardId = null;
    }
  }

  const report = {
    mode: "read-only",
    historicalPath,
    counts: {
      livePending: pending.length,
      liveCatalog: catalog.length,
      absentFromHistoricalMappingSnapshot: audited.length,
      safe: audited.filter((row) => row.safe).length,
      blocked: audited.filter((row) => !row.safe).length,
    },
    ocrMetadata,
    rows: audited,
  };
  if (outputPath) {
    await fs.writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, {
      encoding: "utf8",
      flag: "wx",
      mode: 0o600,
    });
    console.log(JSON.stringify({ ok: true, outputPath, counts: report.counts }));
    return;
  }
  console.log(JSON.stringify(report, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(String(error?.stack ?? error));
    process.exitCode = 1;
  });
}
