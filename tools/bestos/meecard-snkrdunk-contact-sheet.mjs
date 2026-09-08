#!/usr/bin/env node
// Render side-by-side contact sheets (SNKRDUNK thumbnail | official MeeCard image) for manual visual review.
// usage: node tools/companion/meecard-snkrdunk-contact-sheet.mjs manifest.json outPrefix [perSheet=40]
// manifest.json = { rows: [{ snkrdunkId, name, sourceImageUrl|thumbnailUrl, targetImageUrl, targetCode, visualScore, tier }] }
import fs from "node:fs";
import { createRequire } from "node:module";
const { createCanvas, loadImage } = createRequire(import.meta.url)("@napi-rs/canvas");
const [manifestPath, outPrefix = "sheet", perArg = "40"] = process.argv.slice(2);
const rows = JSON.parse(fs.readFileSync(manifestPath, "utf8")).rows;
const per = Number(perArg), W = 230, H = 330, COLS = 4;
const get = async (u) => { try { const r = await fetch(u, { headers: { "user-agent": "bestos-meecard-contact-sheet/1.0" }, signal: AbortSignal.timeout(20_000) }); if (!r.ok) return null; return await loadImage(Buffer.from(await r.arrayBuffer())); } catch { return null; } };
for (let s = 0; s * per < rows.length; s++) {
  const chunk = rows.slice(s * per, (s + 1) * per);
  const rowsN = Math.ceil(chunk.length / COLS);
  const cv = createCanvas(COLS * W * 2, rowsN * (H + 40)); const ctx = cv.getContext("2d");
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, cv.width, cv.height);
  for (let i = 0; i < chunk.length; i++) {
    const r = chunk[i]; const cx = (i % COLS) * W * 2, cy = Math.floor(i / COLS) * (H + 40);
    const [a, b] = await Promise.all([get(r.sourceImageUrl ?? r.thumbnailUrl), get(r.targetImageUrl)]);
    if (a) ctx.drawImage(a, cx + 5, cy + 30, W - 10, H - 10); if (b) ctx.drawImage(b, cx + W + 5, cy + 30, W - 10, H - 10);
    ctx.fillStyle = "#000"; ctx.font = "13px sans-serif";
    ctx.fillText(`#${s * per + i} ${r.snkrdunkId} ${String(r.name).slice(0, 40)}`, cx + 4, cy + 14);
    ctx.fillText(`-> ${r.targetCode} ${r.tier ?? ""} ${r.visualScore ?? ""}`, cx + 4, cy + 27);
  }
  const out = `${outPrefix}-${String(s + 1).padStart(2, "0")}.png`;
  fs.writeFileSync(out, cv.toBuffer("image/png")); console.log(out, chunk.length);
}
