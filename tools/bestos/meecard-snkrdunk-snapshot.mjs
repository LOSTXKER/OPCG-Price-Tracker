#!/usr/bin/env node
// Read-only snapshot for the SNKRDUNK planner: catalog (public SNKRDUNK) + MeeCard cards + all mappings (MCP read-only).
// usage: node tools/companion/meecard-snkrdunk-snapshot.mjs --out DIR [--skip-catalog]
// writes DIR/snkr.json {items}, DIR/cards.json {cards}, DIR/maps.json {mappings}  (inputs of meecard-snkrdunk-catalog-plan.mjs)
// token: env MEECARD_MCP_TOKEN → ~/.config/claude/channels.env → Mac ~/.claude.json (mcpServers.meecard Authorization header). never printed.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { McpClient, DEFAULT_MCP_URL, loadMeeCardMcpToken } from "./meecard-auto-match-supervisor.mjs";

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const outDir = opt("--out", "."); fs.mkdirSync(outDir, { recursive: true });
const log = (...a) => console.log(new Date().toISOString(), ...a);

function macToken() {
  try {
    const j = JSON.parse(fs.readFileSync(path.join(os.homedir(), ".claude.json"), "utf8"));
    for (const p of Object.values(j.projects ?? {})) {
      const h = p?.mcpServers?.meecard?.headers?.Authorization;
      if (h) return String(h).replace(/^Bearer\s+/i, "").trim();
    }
  } catch { /* ไม่มี = ข้าม */ }
  return "";
}
const token = loadMeeCardMcpToken() || macToken();
if (!token) { console.error("ไม่พบ MEECARD_MCP_TOKEN"); process.exit(2); }
const client = new McpClient(process.env.MEECARD_MCP_URL || DEFAULT_MCP_URL, { token });
await client.initialize();

async function allPages(tool, baseArgs, limit = 100) {
  const rows = [];
  for (let page = 1; ; page++) {
    const r = await client.callReadOnly(tool, { ...baseArgs, page, limit });
    if (!Array.isArray(r?.data)) throw new Error(`${tool} page ${page} ไม่มี data[]`);
    rows.push(...r.data);
    if (page >= Number(r.totalPage ?? 1) || r.data.length === 0) { if (rows.length !== Number(r.totalItems)) log(`⚠️ ${tool}: fetched ${rows.length} ≠ reported ${r.totalItems}`); break; }
  }
  return rows;
}

if (!argv.includes("--skip-catalog")) {
  const items = [];
  for (let page = 1; page <= 200; page++) {
    const u = `https://snkrdunk.com/en/v1/brands/onepiece/streetwears?perPage=100&page=${page}&department=tradingCard`;
    const r = await fetch(u, { headers: { "user-agent": "Mozilla/5.0", accept: "application/json" }, signal: AbortSignal.timeout(30_000) });
    if (!r.ok) throw new Error(`catalog page ${page} HTTP ${r.status}`);
    const j = await r.json();
    const arr = j?.streetwears ?? j?.items ?? [];
    if (!arr.length) break;
    items.push(...arr);
    if (page % 10 === 0) log("catalog page", page, "items", items.length);
    await new Promise((res) => setTimeout(res, 300));
  }
  fs.writeFileSync(path.join(outDir, "snkr.json"), JSON.stringify({ fetchedAt: new Date().toISOString(), items }));
  log("catalog done", items.length);
}

const cards = await allPages("card_list", { sort: "id", order: "asc" });
fs.writeFileSync(path.join(outDir, "cards.json"), JSON.stringify({ fetchedAt: new Date().toISOString(), cards }));
log("cards", cards.length);

const mappings = [];
for (const status of ["pending", "matched", "rejected", "skipped"]) {
  const rows = await allPages("snkrdunk_mapping_list", { status, sort: "productNumber", order: "asc" });
  log("mappings", status, rows.length); mappings.push(...rows);
}
fs.writeFileSync(path.join(outDir, "maps.json"), JSON.stringify({ fetchedAt: new Date().toISOString(), mappings }));
log("mappings total", mappings.length);
