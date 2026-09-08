#!/usr/bin/env node

import fs from "node:fs/promises";
import { createCanvas, loadImage } from "@napi-rs/canvas";

const input = process.argv[2] ?? "/tmp/meecard-snkr-live-pending-audit.json";
const outputPrefix = process.argv[3] ?? "/tmp/meecard-snkr-live-pending";
const filterMode = process.argv[4] ?? "all";
const report = JSON.parse(await fs.readFile(input, "utf8"));
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const ALLOWED_IMAGE_HOSTS = new Set([
  "cdn.snkrdunk.com",
  "asia-en.onepiece-cardgame.com",
]);

function rowsFromReport(value) {
  if (Array.isArray(value?.rows)) return value.rows.filter((row) => (
    row.candidates?.length
    && (filterMode !== "jp-candidates" || row.locale?.pass === true)
  ));
  if (!Array.isArray(value?.listings)) throw new Error("report ไม่มี rows[] หรือ listings[]");
  if (value.listings.some((row) => Object.hasOwn(row ?? {}, "pass"))) {
    return value.listings.filter((row) => row.auditKind === "current_match" && row.pass === false).map((row) => ({
      mappingId: row.mappingId ?? null,
      snkrdunkId: row.snkrdunkId ?? null,
      code: row.code ?? "",
      name: `${row.name ?? ""} | OCR: ${row.reason ?? "unknown"}`,
      sourceImageUrl: row.imageUrl ?? null,
      candidates: row.target ? [{
        cardId: row.target.cardId,
        code: row.target.code,
        rarity: "",
        imageUrl: row.target.imageUrl,
        visual: { score: null },
      }] : [],
    })).filter((row) => row.sourceImageUrl && row.candidates.length);
  }
  const selected = value.listings.filter((row) => {
    if (filterMode === "watermark-tolerant") {
      return row?.matchedAudit?.visualEvidence === "official_sample_watermark_tolerant";
    }
    if (filterMode === "strict-current") {
      return row?.matchedAudit?.visualEvidence === "strict";
    }
    return row?.classification?.reason === "current_mapping_visual_score_too_high"
      || row?.classification?.reason === "current_mapping_invalid_source_metadata";
  });
  return selected.map((row) => ({
    mappingId: row.currentMappings?.[0]?.mappingId ?? null,
    snkrdunkId: row.source?.snkrdunkId ?? null,
    code: row.source?.code ?? "",
    name: row.source?.name ?? "",
    sourceImageUrl: row.source?.imageUrl ?? null,
    candidates: [
      ...(row.target ? [{
        cardId: row.target.cardId,
        code: row.target.code,
        rarity: row.target.rarity,
        imageUrl: row.target.imageUrl,
        visual: { score: row.matchedAudit?.visualScore ?? null },
      }] : []),
      ...(row.candidates ?? []).filter((candidate) => candidate.cardId !== row.target?.cardId).map((candidate) => ({
        ...candidate,
        visual: { score: candidate.visualScore ?? null },
      })),
    ],
  })).filter((row) => row.sourceImageUrl && row.candidates.length);
}

const rows = rowsFromReport(report);
const perPage = 7;
const cardWidth = 150;
const cardHeight = 210;
const rowHeight = 270;
const width = 1500;

async function imageFor(url) {
  try {
    const parsed = new URL(String(url ?? ""));
    if (parsed.protocol !== "https:" || !ALLOWED_IMAGE_HOSTS.has(parsed.hostname)) return null;
    const response = await fetch(parsed, {
      headers: { accept: "image/*" },
      redirect: "error",
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) return null;
    if (!String(response.headers.get("content-type") ?? "").toLowerCase().startsWith("image/")) return null;
    const declared = Number(response.headers.get("content-length"));
    if (Number.isFinite(declared) && declared > MAX_IMAGE_BYTES) return null;
    const chunks = [];
    let bytes = 0;
    for await (const chunk of response.body) {
      bytes += chunk.byteLength;
      if (bytes > MAX_IMAGE_BYTES) return null;
      chunks.push(Buffer.from(chunk));
    }
    return await loadImage(Buffer.concat(chunks));
  } catch {
    return null;
  }
}

for (let page = 0; page * perPage < rows.length; page++) {
  const batch = rows.slice(page * perPage, (page + 1) * perPage);
  const canvas = createCanvas(width, batch.length * rowHeight);
  const context = canvas.getContext("2d");
  context.fillStyle = "#111827";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.font = "18px sans-serif";
  context.textBaseline = "top";
  for (let rowIndex = 0; rowIndex < batch.length; rowIndex++) {
    const row = batch[rowIndex];
    const y = rowIndex * rowHeight;
    context.fillStyle = rowIndex % 2 ? "#172033" : "#111827";
    context.fillRect(0, y, width, rowHeight);
    context.fillStyle = "#f9fafb";
    context.fillText(`mapping ${row.mappingId} / SNKR ${row.snkrdunkId} / ${row.code}`, 12, y + 8);
    context.font = "14px sans-serif";
    context.fillStyle = "#d1d5db";
    context.fillText(row.name.slice(0, 145), 12, y + 32);
    context.font = "18px sans-serif";
    const images = [
      { label: "SOURCE", url: row.sourceImageUrl },
      ...row.candidates.map((candidate) => ({
        label: `${candidate.cardId} ${candidate.code} ${candidate.rarity ?? ""} s=${candidate.visual?.score ?? "n/a"}`,
        url: candidate.imageUrl,
      })),
    ];
    const loaded = await Promise.all(images.map(async (item) => ({ ...item, image: await imageFor(item.url) })));
    for (let index = 0; index < loaded.length; index++) {
      const item = loaded[index];
      const x = 12 + index * 180;
      context.fillStyle = index === 0 ? "#fbbf24" : "#93c5fd";
      context.font = "13px sans-serif";
      context.fillText(item.label, x, y + 52);
      if (item.image) {
        const scale = Math.min(cardWidth / item.image.width, cardHeight / item.image.height);
        const drawWidth = item.image.width * scale;
        const drawHeight = item.image.height * scale;
        context.drawImage(item.image, x + (cardWidth - drawWidth) / 2, y + 74, drawWidth, drawHeight);
      }
    }
  }
  await fs.writeFile(`${outputPrefix}-${page + 1}.png`, canvas.toBuffer("image/png"));
}
