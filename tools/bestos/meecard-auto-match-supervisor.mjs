#!/usr/bin/env node
// meecard-auto-match-supervisor.mjs — ตรวจและอนุมัติ Yuyutei ที่ผ่านด่านเข้มงวด
// ค่าเริ่มต้นและ --dry-run อ่านอย่างเดียวเสมอ · SNKRDUNK ยังไม่มี mutation path

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { discoverSnkrdunkOnePieceCards } from "./meecard-snkrdunk-discovery.mjs";
import { summarizeMeeCardRun, writeMeeCardRunReport } from "./meecard-auto-match-report.mjs";

export const DEFAULT_MCP_URL = "https://meecardtcg.com/mcp";
export const AUTO_SAFE_MAX_VISUAL_SCORE = 0.20;
export const AUTO_SAFE_MIN_MARGIN = 0.04;

const READ_ONLY_TOOLS = new Set([
  "card_list",
  "card_set_list",
  "yuyutei_mapping_list",
  "yuyutei_mapping_candidates",
  "snkrdunk_mapping_list",
  "snkrdunk_product_lookup",
]);
const YUYUTEI_MUTATION_TOOL = "yuyutei_mapping_approve";
const DEFAULT_YUYUTEI_APPLY_MAX = 1;
const HARD_YUYUTEI_APPLY_MAX = 50;
const APPLY_JOURNAL_SCHEMA_VERSION = 1;
const PLACEHOLDER_RE = /(?:no[-_]?image|noimage|placeholder|now[-_ ]?printing|coming[-_ ]?soon|dummy)/i;
const ALLOWED_IMAGE_HOSTS = new Set([
  "card.yuyu-tei.jp",
  "asia-en.onepiece-cardgame.com",
  "onepiece-cardgame.com",
  "www.onepiece-cardgame.com",
  "cdn.snkrdunk.com",
]);
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const IMAGE_CONCURRENCY = 10;
const IMAGE_FETCH_TIMEOUT_MS = 15_000;
const CANDIDATE_CONCURRENCY = 6;
const CATALOG_SET_CONCURRENCY = 6;
const SNKR_LOOKUP_CONCURRENCY = 3;
const SNKR_DISCOVERY_REVIEW_LIMIT = 12;
const SNKR_LOOKUP_TIMEOUT_MS = 25_000;
const SUPERVISOR_WALL_BUDGET_MS = 150_000;
const MCP_READ_TIMEOUT_MS = 25_000;

export class UsageError extends Error {
  constructor(message) {
    super(message);
    this.name = "UsageError";
  }
}

export class McpError extends Error {
  constructor(message, { code = "mcp_error", ambiguous = false } = {}) {
    super(message);
    this.name = "McpError";
    this.code = code;
    this.ambiguous = ambiguous;
  }
}

export function resolveApplyJournalPath({ env = process.env, startedAt = new Date() } = {}) {
  const configured = String(env.MEECARD_AUTO_MATCH_JOURNAL_DIR ?? "").trim();
  const directory = configured || path.join(os.homedir(), ".cache", "bestos-meecard-auto-match", "journal");
  return path.join(directory, `${startedAt.toISOString().slice(0, 10)}.jsonl`);
}

export function createApplyJournal({ env = process.env, startedAt = new Date() } = {}) {
  const journalPath = resolveApplyJournalPath({ env, startedAt });
  const directory = path.dirname(journalPath);
  let descriptor;
  try {
    fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
    fs.chmodSync(directory, 0o700);
    descriptor = fs.openSync(
      journalPath,
      fs.constants.O_APPEND | fs.constants.O_CREAT | fs.constants.O_WRONLY | (fs.constants.O_NOFOLLOW ?? 0),
      0o600,
    );
    fs.fchmodSync(descriptor, 0o600);
  } catch (error) {
    if (descriptor != null) {
      try { fs.closeSync(descriptor); } catch {}
    }
    const wrapped = new McpError(`เปิด apply journal ไม่ได้: ${error?.message ?? error}`, { code: "journal_open_error" });
    wrapped.journalPath = journalPath;
    throw wrapped;
  }
  let closed = false;
  return {
    path: journalPath,
    append(event) {
      if (closed) throw new McpError("apply journal ถูกปิดแล้ว", { code: "journal_closed" });
      const payload = Buffer.from(`${JSON.stringify({
        schemaVersion: APPLY_JOURNAL_SCHEMA_VERSION,
        recordedAt: new Date().toISOString(),
        ...event,
      })}\n`, "utf8");
      let offset = 0;
      while (offset < payload.length) {
        const written = fs.writeSync(descriptor, payload, offset, payload.length - offset, null);
        if (!Number.isInteger(written) || written <= 0) throw new Error("journal write returned zero bytes");
        offset += written;
      }
      fs.fsyncSync(descriptor);
    },
    close() {
      if (closed) return;
      closed = true;
      fs.closeSync(descriptor);
    },
  };
}

export function parseCliArgs(argv = [], env = process.env) {
  const known = new Set(["--dry-run", "--apply-yuyutei", "--help", "-h"]);
  const unknown = argv.filter((arg) => !known.has(arg));
  if (unknown.length) throw new UsageError(`ไม่รู้จัก option: ${unknown.join(", ")}`);

  const dryRun = argv.includes("--dry-run");
  const applyYuyutei = argv.includes("--apply-yuyutei");
  if (dryRun && applyYuyutei) {
    throw new UsageError("--dry-run ใช้พร้อม --apply-yuyutei ไม่ได้");
  }
  if (applyYuyutei && env.MEECARD_AUTO_MATCH_APPLY_YUYUTEI !== "1") {
    throw new UsageError("--apply-yuyutei ต้องเปิด MEECARD_AUTO_MATCH_APPLY_YUYUTEI=1 อย่างชัดเจน");
  }
  const rawMax = String(env.MEECARD_AUTO_MATCH_YUYUTEI_MAX ?? DEFAULT_YUYUTEI_APPLY_MAX);
  if (!/^\d+$/.test(rawMax)) throw new UsageError("MEECARD_AUTO_MATCH_YUYUTEI_MAX ต้องเป็นจำนวนเต็ม 1-50");
  const applyYuyuteiMax = Number(rawMax);
  if (applyYuyuteiMax < 1 || applyYuyuteiMax > HARD_YUYUTEI_APPLY_MAX) {
    throw new UsageError("MEECARD_AUTO_MATCH_YUYUTEI_MAX ต้องอยู่ระหว่าง 1-50");
  }

  return {
    help: argv.includes("--help") || argv.includes("-h"),
    mode: applyYuyutei ? "apply-yuyutei" : dryRun ? "dry-run" : "read-only",
    applyYuyutei,
    applyYuyuteiMax,
    dryRun,
  };
}

export function extractVariantMarkers(value) {
  const text = String(value ?? "");
  const markers = [];
  const add = (marker, expression) => { if (expression.test(text)) markers.push(marker); };
  add("parallel", /パラレル|parallel|alternate\s+art|alt[ -]?art/i);
  add("super-parallel", /スーパーパラレル|super[ -]?parallel|manga/i);
  add("stamped", /刻印あり|刻印有|\bstamped\b|with\s+stamp/i);
  add("unstamped", /刻印なし|刻印無|without\s+stamp|unstamped/i);
  add("pirate-flag-foil", /海賊旗|pirate[ -]?flag/i);
  add("foil", /フォイル|ホイル|foil|holo(?:graphic)?/i);
  add("no-holo", /ノンホロ|ホロなし|no[ -]?holo|non[ -]?holo/i);
  add("pre-correction", /修正前|訂正前|pre[ -]?correction|before\s+correction/i);
  add("corrected", /修正版|修正後|訂正版|corrected|after\s+correction/i);
  return [...new Set(markers)].sort();
}

export function normalizePrintedCode(value) {
  const match = String(value ?? "").toUpperCase().match(/[A-Z]+\d*[-‐‑‒–—]\d{3,4}/);
  return match ? match[0].replace(/[-‐‑‒–—]/, "-") : "";
}

function normalizeSetCode(value) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeRarity(value) {
  return String(value ?? "").toUpperCase().replace(/\s+/g, "").trim();
}

function cardSetCode(card) {
  return normalizeSetCode(card?.set?.code ?? card?.setCode);
}

function isParallelCard(card) {
  return Boolean(
    card?.isParallel
    || card?.parallelIndex != null
    || /_p\d+$/i.test(String(card?.cardCode ?? ""))
    || /^P-/.test(normalizeRarity(card?.rarity)),
  );
}

function expectedParallel(mapping) {
  const markers = new Set(extractVariantMarkers(`${mapping?.scrapedName ?? ""} ${mapping?.scrapedRarity ?? ""}`));
  if (["parallel", "super-parallel", "stamped", "pirate-flag-foil", "foil"].some((x) => markers.has(x))) return true;
  if (/^P-/.test(normalizeRarity(mapping?.scrapedRarity))) return true;
  if (markers.has("no-holo") || normalizeRarity(mapping?.scrapedRarity)) return false;
  return null;
}

function markerContradiction(sourceMarkers, card) {
  const candidateMarkers = cardVariantMarkers(card);
  if (sourceMarkers.has("no-holo") && candidateMarkers.has("foil")) return true;
  if (sourceMarkers.has("foil") && candidateMarkers.has("no-holo")) return true;
  if (sourceMarkers.has("stamped") && candidateMarkers.has("unstamped")) return true;
  if (sourceMarkers.has("unstamped") && candidateMarkers.has("stamped")) return true;
  if (sourceMarkers.has("corrected") && candidateMarkers.has("pre-correction")) return true;
  if (sourceMarkers.has("pre-correction") && candidateMarkers.has("corrected")) return true;
  return false;
}

const SPECIAL_TREATMENT_MARKERS = [
  "super-parallel",
  "stamped",
  "unstamped",
  "pirate-flag-foil",
  "foil",
  "no-holo",
  "pre-correction",
  "corrected",
];

function cardVariantMarkers(card) {
  return new Set(extractVariantMarkers([
    card?.nameJp,
    card?.nameEn,
    card?.nameTh,
    card?.variant,
    card?.variantLabel,
    card?.treatment,
    card?.notes,
  ].filter(Boolean).join(" ")));
}

function hasExactTreatmentEvidence(sourceMarkers, card) {
  const candidateMarkers = cardVariantMarkers(card);
  return SPECIAL_TREATMENT_MARKERS.every((marker) => (
    sourceMarkers.has(marker) === candidateMarkers.has(marker)
  ));
}

export function parseMcpMessages(rawBody) {
  const raw = String(rawBody ?? "");
  if (!raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch { /* SSE ต่อด้านล่าง */ }

  const messages = [];
  let data = [];
  const flush = () => {
    if (!data.length) return;
    const joined = data.join("\n").trim();
    data = [];
    if (!joined || joined === "[DONE]") return;
    try { messages.push(JSON.parse(joined)); } catch (error) {
      throw new McpError(`MCP SSE parse ไม่ได้: ${error.message}`, { code: "invalid_sse" });
    }
  };
  for (const line of raw.replace(/\r\n/g, "\n").split("\n")) {
    if (!line) { flush(); continue; }
    if (line.startsWith("data:")) data.push(line.slice(5).replace(/^ /, ""));
  }
  flush();
  if (!messages.length) throw new McpError("MCP response ไม่มี JSON หรือ SSE data", { code: "empty_mcp_response" });
  return messages;
}

export function parseToolResult(message) {
  if (!message || typeof message !== "object") {
    throw new McpError("MCP tool response ว่าง", { code: "empty_tool_response" });
  }
  if (message.error) {
    throw new McpError(`MCP JSON-RPC error: ${String(message.error.message ?? message.error.code ?? "unknown")}`, { code: "rpc_error" });
  }
  const result = message.result;
  if (!result || result.isError === true) {
    const text = result?.content?.find((item) => item?.type === "text")?.text;
    throw new McpError(`MCP tool reported error: ${String(text ?? "unknown")}`.slice(0, 500), { code: "tool_error" });
  }

  let payload = result.structuredContent;
  if (payload == null) {
    const textBlocks = Array.isArray(result.content)
      ? result.content.filter((item) => item?.type === "text" && typeof item.text === "string")
      : [];
    for (const block of textBlocks) {
      try { payload = JSON.parse(block.text); break; } catch { /* ลอง text block ถัดไป */ }
    }
  }
  if (payload == null) throw new McpError("MCP tool response ไม่มี JSON payload", { code: "missing_tool_payload" });
  if (payload.status != null && Number(payload.status) !== 200) {
    throw new McpError(`MCP application error ${payload.status}: ${String(payload.message ?? "unknown")}`.slice(0, 500), { code: "application_error" });
  }
  return Object.hasOwn(payload, "data") ? payload.data : payload;
}

// MCP MeeCard ต้องมี bearer ตั้งแต่ 2026-09-04 (dev เปิด auth) · ลำดับหา token: env MEECARD_MCP_TOKEN → ~/.config/claude/channels.env
// (ไฟล์เดียวกับ Telegram/Vercel token · chmod 600 · ไม่ commit) · ไม่ log ค่า token ที่ไหนทั้งสิ้น
export function loadMeeCardMcpToken(env = process.env, home = os.homedir()) {
  if (env.MEECARD_MCP_TOKEN) return env.MEECARD_MCP_TOKEN.trim();
  try {
    for (const line of fs.readFileSync(path.join(home, ".config", "claude", "channels.env"), "utf8").split("\n")) {
      const m = line.match(/^\s*MEECARD_MCP_TOKEN\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const t = m[1].replace(/^["']|["']$/g, "").trim();
      if (t) return t;
    }
  } catch { /* ไม่มีไฟล์ = ข้าม */ }
  return "";
}

export class McpClient {
  constructor(endpoint, {
    fetchImpl = globalThis.fetch,
    timeoutMs = 45_000,
    allowYuyuteiMutation = false,
    token = loadMeeCardMcpToken(),
  } = {}) {
    const parsed = new URL(endpoint);
    if (!/^https?:$/.test(parsed.protocol)) throw new UsageError("MEECARD_MCP_URL ต้องเป็น http(s)");
    this.endpoint = parsed.toString();
    this.fetchImpl = fetchImpl;
    this.timeoutMs = timeoutMs;
    this.allowYuyuteiMutation = allowYuyuteiMutation === true;
    this.token = String(token ?? "");
    this.sessionId = "";
    this.nextId = 1;
  }

  headers() {
    const headers = {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      "user-agent": "bestos-meecard-auto-match-supervisor/1.0",
    };
    if (this.token) headers.authorization = `Bearer ${this.token}`;
    if (this.sessionId) headers["mcp-session-id"] = this.sessionId;
    return headers;
  }

  async rpc(body, {
    retryable = false,
    allowEmpty = false,
    timeoutMs = this.timeoutMs,
    mutation = false,
  } = {}) {
    const method = body?.method;
    if (!new Set(["initialize", "notifications/initialized", "tools/call"]).has(method)) {
      throw new McpError(`ปฏิเสธ MCP method ที่ไม่ใช่ read-only flow: ${String(method)}`, { code: "method_not_allowed" });
    }
    if (method === "tools/call") {
      const tool = body?.params?.name;
      const allowedMutation = mutation && this.allowYuyuteiMutation && tool === YUYUTEI_MUTATION_TOOL;
      if (!READ_ONLY_TOOLS.has(tool) && !allowedMutation) {
        throw new McpError(`ปฏิเสธ tool ที่ไม่อยู่ใน allow-list: ${String(tool)}`, { code: "tool_not_allowed" });
      }
      if (mutation && !allowedMutation) {
        throw new McpError(`ปฏิเสธ mutation tool: ${String(tool)}`, { code: "tool_not_allowed" });
      }
    }
    if (mutation && retryable) throw new McpError("mutation MCP ห้าม retry", { code: "mutation_retry_not_allowed" });
    const attempts = retryable ? 3 : 1;
    let lastError;
    for (let attempt = 0; attempt < attempts; attempt++) {
      try {
        const response = await this.fetchImpl(this.endpoint, {
          method: "POST",
          headers: this.headers(),
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(timeoutMs),
        });
        const raw = await response.text();
        if (!response.ok) {
          throw new McpError(`MCP HTTP ${response.status}: ${raw.slice(0, 240)}`, {
            code: "http_error",
            ambiguous: mutation && response.status >= 500,
          });
        }
        const messages = raw.trim() ? parseMcpMessages(raw) : [];
        if (!messages.length) {
          if (allowEmpty) return { response, message: null };
          throw new McpError("MCP response ว่าง", { code: "empty_mcp_response" });
        }
        const wantedId = body.id;
        const message = [...messages].reverse().find((item) => wantedId == null || item?.id === wantedId) ?? messages.at(-1);
        return { response, message };
      } catch (error) {
        lastError = error;
        if (attempt + 1 >= attempts) break;
        await new Promise((resolve) => setTimeout(resolve, 250 * (2 ** attempt)));
      }
    }
    if (lastError instanceof McpError) {
      if (mutation && !lastError.ambiguous && new Set(["empty_mcp_response", "invalid_sse"]).has(lastError.code)) {
        throw new McpError(lastError.message, { code: lastError.code, ambiguous: true });
      }
      throw lastError;
    }
    throw new McpError(`MCP request ล้มเหลว: ${lastError?.message ?? lastError}`, {
      code: "network_error",
      ambiguous: mutation,
    });
  }

  async initialize() {
    const id = this.nextId++;
    const { response, message } = await this.rpc({
      jsonrpc: "2.0",
      id,
      method: "initialize",
      params: {
        protocolVersion: "2025-06-18",
        capabilities: {},
        clientInfo: { name: "bestos-meecard-auto-match-supervisor", version: "1.0" },
      },
    }, { retryable: true });
    if (!message?.result) throw new McpError("MCP initialize ไม่มี result", { code: "initialize_error" });
    this.sessionId = response.headers.get("mcp-session-id") ?? "";
    if (!this.sessionId) throw new McpError("MCP initialize ไม่มี session id", { code: "initialize_error" });
    await this.rpc({ jsonrpc: "2.0", method: "notifications/initialized" }, { allowEmpty: true });
  }

  async callReadOnly(name, args, { retryable = true, timeoutMs = this.timeoutMs } = {}) {
    if (!READ_ONLY_TOOLS.has(name)) throw new McpError(`ปฏิเสธ tool ที่ไม่อยู่ใน read-only allow-list: ${name}`, { code: "tool_not_allowed" });
    const id = this.nextId++;
    const { message } = await this.rpc({
      jsonrpc: "2.0",
      id,
      method: "tools/call",
      params: { name, arguments: args },
    }, { retryable, timeoutMs });
    return parseToolResult(message);
  }

  async approveYuyutei(mappingId, matchedCardId) {
    if (!this.allowYuyuteiMutation) {
      throw new McpError("ปฏิเสธ Yuyutei mutation เพราะ apply gate ไม่ได้เปิด", { code: "tool_not_allowed" });
    }
    if (!Number.isSafeInteger(mappingId) || mappingId <= 0 || !Number.isSafeInteger(matchedCardId) || matchedCardId <= 0) {
      throw new McpError("Yuyutei mutation id ไม่ถูกต้อง", { code: "invalid_mutation_args" });
    }
    const id = this.nextId++;
    try {
      const { message } = await this.rpc({
        jsonrpc: "2.0",
        id,
        method: "tools/call",
        params: {
          name: YUYUTEI_MUTATION_TOOL,
          arguments: { mappingId, matchedCardId },
        },
      }, { retryable: false, mutation: true });
      return parseToolResult(message);
    } catch (error) {
      const uncertainResponseCodes = new Set([
        "empty_tool_response",
        "missing_tool_payload",
        "rpc_error",
        "tool_error",
        "application_error",
      ]);
      if (error instanceof McpError && (error.ambiguous || uncertainResponseCodes.has(error.code))) {
        throw new McpError(error.message, { code: error.code, ambiguous: true });
      }
      throw error;
    }
  }

}

async function fetchAllPages(client, tool, baseArgs, { limit = 100 } = {}) {
  const first = await client.callReadOnly(tool, { ...baseArgs, page: 1, limit });
  const firstRows = Array.isArray(first?.data) ? first.data : null;
  const totalPage = Number(first?.totalPage);
  const totalItems = Number(first?.totalItems);
  const validPageCount = Number.isInteger(totalPage) && (totalPage >= 1 || (totalPage === 0 && totalItems === 0));
  if (!firstRows || !validPageCount || !Number.isInteger(totalItems) || totalItems < 0) {
    throw new McpError(`${tool} pagination shape ไม่ถูกต้อง`, { code: "pagination_error" });
  }
  const rows = [...firstRows];
  for (let page = 2; page <= totalPage; page++) {
    const next = await client.callReadOnly(tool, { ...baseArgs, page, limit });
    if (!Array.isArray(next?.data)) throw new McpError(`${tool} page ${page} ไม่มี data[]`, { code: "pagination_error" });
    rows.push(...next.data);
  }
  const ids = rows.map((row) => row?.id);
  if (rows.length !== totalItems || ids.some((id) => id == null) || new Set(ids).size !== rows.length) {
    throw new McpError(`${tool} pagination integrity ไม่ผ่าน (fetched=${rows.length}, reported=${totalItems})`, { code: "pagination_error" });
  }
  return rows;
}

function parsePaginationEnvelope(value, tool) {
  const rows = Array.isArray(value?.data) ? value.data : null;
  const totalPage = Number(value?.totalPage);
  const totalItems = Number(value?.totalItems);
  const validPageCount = Number.isInteger(totalPage) && (totalPage >= 1 || (totalPage === 0 && totalItems === 0));
  if (!rows || !validPageCount || !Number.isInteger(totalItems) || totalItems < 0) {
    throw new McpError(`${tool} pagination shape ไม่ถูกต้อง`, { code: "pagination_error" });
  }
  return { rows, totalPage, totalItems };
}

async function fetchCatalogBySet(client) {
  const before = parsePaginationEnvelope(
    await client.callReadOnly("card_list", { page: 1, limit: 1, sort: "id", order: "asc" }),
    "card_list",
  );
  const sets = await client.callReadOnly("card_set_list", {});
  if (!Array.isArray(sets) || !sets.length) {
    throw new McpError("card_set_list ไม่มีชุดการ์ด", { code: "catalog_integrity_error" });
  }
  const setCodes = sets.map((set) => normalizeSetCode(set?.code));
  if (setCodes.some((code) => !code) || new Set(setCodes).size !== setCodes.length) {
    throw new McpError("card_set_list มี code ว่างหรือซ้ำ", { code: "catalog_integrity_error" });
  }

  const chunks = await mapLimit(setCodes, CATALOG_SET_CONCURRENCY, async (setCode) => {
    const cards = await fetchAllPages(client, "card_list", {
      set: setCode,
      sort: "id",
      order: "asc",
    }, { limit: 300 });
    if (cards.some((card) => cardSetCode(card) !== setCode)) {
      throw new McpError(`card_list set=${setCode} คืนการ์ดข้ามชุด`, { code: "catalog_integrity_error" });
    }
    return cards;
  });
  const cards = chunks.flat();
  const ids = cards.map((card) => Number(card?.id));
  const after = parsePaginationEnvelope(
    await client.callReadOnly("card_list", { page: 1, limit: 1, sort: "id", order: "asc" }),
    "card_list",
  );
  if (
    ids.some((id) => !Number.isSafeInteger(id) || id <= 0)
    || new Set(ids).size !== ids.length
    || before.totalItems !== after.totalItems
    || cards.length !== after.totalItems
  ) {
    throw new McpError(
      `card catalog integrity ไม่ผ่าน (before=${before.totalItems}, fetched=${cards.length}, after=${after.totalItems}, unique=${new Set(ids).size})`,
      { code: "catalog_integrity_error" },
    );
  }
  return { cards, setCount: setCodes.length, totalSnapshot: after.totalItems };
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

function grayPixels(rgba) {
  const gray = new Uint8Array(rgba.length / 4);
  for (let src = 0, dst = 0; src < rgba.length; src += 4, dst++) {
    gray[dst] = Math.round(0.299 * rgba[src] + 0.587 * rgba[src + 1] + 0.114 * rgba[src + 2]);
  }
  return gray;
}

function rgbPixels(rgba) {
  const rgb = new Uint8Array((rgba.length / 4) * 3);
  for (let src = 0, dst = 0; src < rgba.length; src += 4) {
    rgb[dst++] = rgba[src];
    rgb[dst++] = rgba[src + 1];
    rgb[dst++] = rgba[src + 2];
  }
  return rgb;
}

const CARD_IMAGE_ASPECT = 63 / 88;
const CONTENT_SCAN_MAX_DIMENSION = 512;
const CONTENT_ALPHA_THRESHOLD = 16;
const SNKR_WATERMARK_BASE_RARITIES = new Set(["L", "C", "UC", "R", "SR", "SEC"]);

function fitCardAspect(rect, imageWidth, imageHeight) {
  let [x0, y0, x1, y1] = rect;
  const centerX = (x0 + x1) / 2;
  const centerY = (y0 + y1) / 2;
  let width = (x1 - x0) * imageWidth;
  let height = (y1 - y0) * imageHeight;
  if (width / height < CARD_IMAGE_ASPECT) width = height * CARD_IMAGE_ASPECT;
  else height = width / CARD_IMAGE_ASPECT;
  const halfWidth = width / (2 * imageWidth);
  const halfHeight = height / (2 * imageHeight);
  x0 = Math.max(0, centerX - halfWidth);
  x1 = Math.min(1, centerX + halfWidth);
  y0 = Math.max(0, centerY - halfHeight);
  y1 = Math.min(1, centerY + halfHeight);
  return [x0, y0, x1, y1];
}

function detectCardContentRect(image) {
  const scale = Math.min(1, CONTENT_SCAN_MAX_DIMENSION / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, width, height);
  const rgba = context.getImageData(0, 0, width, height).data;
  const opaqueMask = new Uint8Array(width * height);
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  let opaque = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (rgba[(y * width + x) * 4 + 3] <= CONTENT_ALPHA_THRESHOLD) continue;
      opaqueMask[y * width + x] = 1;
      opaque++;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (!opaque || opaque / (width * height) > 0.98) return REGIONS.full;
  const seen = new Uint8Array(opaqueMask.length);
  const components = [];
  for (let start = 0; start < opaqueMask.length; start++) {
    if (!opaqueMask[start] || seen[start]) continue;
    const queue = [start];
    seen[start] = 1;
    let cursor = 0;
    let count = 0;
    let componentMinX = width;
    let componentMinY = height;
    let componentMaxX = -1;
    let componentMaxY = -1;
    while (cursor < queue.length) {
      const index = queue[cursor++];
      const x = index % width;
      const y = Math.floor(index / width);
      count++;
      componentMinX = Math.min(componentMinX, x);
      componentMinY = Math.min(componentMinY, y);
      componentMaxX = Math.max(componentMaxX, x);
      componentMaxY = Math.max(componentMaxY, y);
      const neighbors = [index - 1, index + 1, index - width, index + width];
      for (const neighbor of neighbors) {
        if (neighbor < 0 || neighbor >= opaqueMask.length || seen[neighbor] || !opaqueMask[neighbor]) continue;
        const neighborX = neighbor % width;
        if ((neighbor === index - 1 || neighbor === index + 1) && Math.abs(neighborX - x) !== 1) continue;
        seen[neighbor] = 1;
        queue.push(neighbor);
      }
    }
    const componentWidth = componentMaxX - componentMinX + 1;
    const componentHeight = componentMaxY - componentMinY + 1;
    components.push({
      count,
      minX: componentMinX,
      minY: componentMinY,
      maxX: componentMaxX,
      maxY: componentMaxY,
      width: componentWidth,
      height: componentHeight,
    });
  }
  const cardComponent = components.filter((component) => (
    component.height >= height * 0.45
    && component.width / component.height >= 0.55
    && component.width / component.height <= 0.82
  )).sort((left, right) => right.count - left.count)[0];
  if (cardComponent) {
    minX = cardComponent.minX;
    minY = cardComponent.minY;
    maxX = cardComponent.maxX;
    maxY = cardComponent.maxY;
  }
  const contentWidth = maxX - minX + 1;
  const contentHeight = maxY - minY + 1;
  if (contentWidth < width * 0.15 || contentHeight < height * 0.15) return REGIONS.full;
  return fitCardAspect([
    minX / width,
    minY / height,
    (maxX + 1) / width,
    (maxY + 1) / height,
  ], image.width, image.height);
}

function rectWithin(outer, inner) {
  const [ox0, oy0, ox1, oy1] = outer;
  const [ix0, iy0, ix1, iy1] = inner;
  const width = ox1 - ox0;
  const height = oy1 - oy0;
  return [
    ox0 + width * ix0,
    oy0 + height * iy0,
    ox0 + width * ix1,
    oy0 + height * iy1,
  ];
}

function resizedPixels(image, rect, width, height) {
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  const [x0, y0, x1, y1] = rect;
  const sx = Math.round(image.width * x0);
  const sy = Math.round(image.height * y0);
  const sw = Math.max(1, Math.round(image.width * (x1 - x0)));
  const sh = Math.max(1, Math.round(image.height * (y1 - y0)));
  context.drawImage(image, sx, sy, sw, sh, 0, 0, width, height);
  return context.getImageData(0, 0, width, height).data;
}

function bitsFromComparisons(values) {
  let bits = 0n;
  for (const value of values) bits = (bits << 1n) | (value ? 1n : 0n);
  return bits;
}

function regionFeature(image, rect) {
  const rgba = resizedPixels(image, rect, 32, 32);
  const gray = grayPixels(rgba);
  const mean = gray.reduce((sum, value) => sum + value, 0) / gray.length;
  const aValues = new Uint8Array(gray.length);
  for (let i = 0; i < gray.length; i++) aValues[i] = gray[i] > mean ? 1 : 0;

  const dGray = grayPixels(resizedPixels(image, rect, 33, 32));
  const dValues = new Uint8Array(32 * 32);
  let dIndex = 0;
  for (let y = 0; y < 32; y++) {
    const offset = y * 33;
    for (let x = 0; x < 32; x++) dValues[dIndex++] = dGray[offset + x] > dGray[offset + x + 1] ? 1 : 0;
  }

  const histogram = new Uint32Array(48);
  for (let i = 0; i < rgba.length; i += 4) {
    histogram[Math.floor(rgba[i] / 16)]++;
    histogram[16 + Math.floor(rgba[i + 1] / 16)]++;
    histogram[32 + Math.floor(rgba[i + 2] / 16)]++;
  }
  return { gray, aHash: bitsFromComparisons(aValues), dHash: bitsFromComparisons(dValues), histogram };
}

const REGIONS = {
  full: [0, 0, 1, 1],
  art: [0.04, 0.03, 0.96, 0.72],
  upperArt: [0.07, 0.05, 0.93, 0.58],
  lowerFrame: [0.04, 0.58, 0.96, 0.97],
  rulesText: [0.07, 0.59, 0.93, 0.80],
  nameStrip: [0.16, 0.81, 0.84, 0.94],
};

export async function decodeImageFeature(raw, { url = "", contentType = "" } = {}) {
  const buffer = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
  if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) {
    return { ok: false, placeholder: false, reason: "invalid_image_size", url };
  }
  if (PLACEHOLDER_RE.test(url)) return { ok: false, placeholder: true, reason: "placeholder_url", url };
  try {
    const image = await loadImage(buffer);
    if (!image?.width || !image?.height) return { ok: false, placeholder: false, reason: "image_decode_error", url };
    if (image.width < 120 || image.height < 160) {
      return { ok: false, placeholder: true, reason: "placeholder_dimensions", url, width: image.width, height: image.height };
    }
    const contentRect = detectCardContentRect(image);
    const normalizedRgb = rgbPixels(resizedPixels(image, contentRect, 128, 179));
    const regions = Object.fromEntries(Object.entries(REGIONS).map(([name, rect]) => [
      name,
      regionFeature(image, rectWithin(contentRect, rect)),
    ]));
    return {
      ok: true,
      placeholder: false,
      url,
      contentType,
      byteLength: buffer.length,
      width: image.width,
      height: image.height,
      contentRect,
      rawSha256: createHash("sha256").update(buffer).digest("hex"),
      normalizedRgbSha256: createHash("sha256").update(normalizedRgb).digest("hex"),
      regions,
    };
  } catch {
    return { ok: false, placeholder: false, reason: "image_decode_error", url };
  }
}

async function readBodyLimited(response, maxBytes) {
  if (!response.body?.getReader) {
    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer.length > maxBytes ? null : buffer;
  }
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      try { await reader.cancel(); } catch {}
      return null;
    }
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks, total);
}

export async function fetchImageFeature(url, { fetchImpl = globalThis.fetch, retries = 3, timeoutMs = 40_000 } = {}) {
  const value = String(url ?? "");
  if (!/^https?:\/\//i.test(value)) return { ok: false, placeholder: false, reason: "missing_image_url", url: value };
  let requestedUrl;
  try { requestedUrl = new URL(value); } catch { return { ok: false, placeholder: false, reason: "invalid_image_url", url: value }; }
  if (requestedUrl.protocol !== "https:") return { ok: false, placeholder: false, reason: "image_https_required", url: value };
  if (!ALLOWED_IMAGE_HOSTS.has(requestedUrl.hostname.toLowerCase())) {
    return { ok: false, placeholder: false, reason: "image_host_not_allowed", url: value };
  }
  if (PLACEHOLDER_RE.test(value)) return { ok: false, placeholder: true, reason: "placeholder_url", url: value };
  let lastReason = "image_fetch_error";
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetchImpl(value, {
        headers: {
          accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
          "user-agent": "bestos-meecard-auto-match-supervisor/1.0",
          "cache-control": "no-cache",
        },
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!response.ok) { lastReason = `image_http_${response.status}`; throw new Error(lastReason); }
      let finalUrl;
      try { finalUrl = new URL(response.url || value); } catch { return { ok: false, placeholder: false, reason: "invalid_redirect_url", url: value }; }
      if (!ALLOWED_IMAGE_HOSTS.has(finalUrl.hostname.toLowerCase())) {
        return { ok: false, placeholder: false, reason: "image_redirect_host_not_allowed", url: value };
      }
      const contentType = response.headers.get("content-type") ?? "";
      if (!/^image\//i.test(contentType)) return { ok: false, placeholder: false, reason: "non_image_content_type", url: value };
      const lengthHeader = response.headers.get("content-length");
      const length = lengthHeader == null ? 0 : Number(lengthHeader);
      if (lengthHeader != null && (!Number.isFinite(length) || length < 0)) {
        return { ok: false, placeholder: false, reason: "invalid_content_length", url: value };
      }
      if (length > MAX_IMAGE_BYTES) return { ok: false, placeholder: false, reason: "image_too_large", url: value };
      const buffer = await readBodyLimited(response, MAX_IMAGE_BYTES);
      if (!buffer) return { ok: false, placeholder: false, reason: "image_too_large", url: value };
      const feature = await decodeImageFeature(buffer, {
        url: response.url || value,
        contentType,
      });
      if (feature.ok || feature.placeholder) return feature;
      lastReason = feature.reason;
    } catch (error) {
      if (!String(error?.message ?? "").startsWith("image_http_")) lastReason = "image_fetch_error";
    }
    if (attempt + 1 < retries) await new Promise((resolve) => setTimeout(resolve, 200 * (2 ** attempt)));
  }
  return { ok: false, placeholder: false, reason: lastReason, url: value };
}

function hamming(left, right) {
  let bits = left ^ right;
  let count = 0;
  while (bits) { bits &= bits - 1n; count++; }
  return count / 1024;
}

function regionDistance(left, right) {
  const lhs = left.gray;
  const rhs = right.gray;
  let lhsMean = 0;
  let rhsMean = 0;
  for (let i = 0; i < lhs.length; i++) { lhsMean += lhs[i]; rhsMean += rhs[i]; }
  lhsMean /= lhs.length;
  rhsMean /= rhs.length;
  let numerator = 0;
  let lhsNorm = 0;
  let rhsNorm = 0;
  for (let i = 0; i < lhs.length; i++) {
    const a = lhs[i] - lhsMean;
    const b = rhs[i] - rhsMean;
    numerator += a * b;
    lhsNorm += a * a;
    rhsNorm += b * b;
  }
  const denominator = Math.sqrt(lhsNorm) * Math.sqrt(rhsNorm);
  const correlation = Math.max(-1, Math.min(1, denominator ? numerator / denominator : 0));
  const dHashDistance = hamming(left.dHash, right.dHash);
  const aHashDistance = hamming(left.aHash, right.aHash);
  let histogramDelta = 0;
  let histogramTotal = 0;
  for (let i = 0; i < left.histogram.length; i++) {
    histogramDelta += Math.abs(left.histogram[i] - right.histogram[i]);
    histogramTotal += left.histogram[i];
  }
  const histogramDistance = histogramTotal ? histogramDelta / (2 * histogramTotal) : 1;
  const score = 0.38 * dHashDistance + 0.12 * aHashDistance + 0.35 * ((1 - correlation) / 2) + 0.15 * histogramDistance;
  return { score, dHashDistance, aHashDistance, correlation, histogramDistance };
}

export function compareImageFeatures(left, right) {
  if (!left?.ok || !right?.ok || left.placeholder || right.placeholder) return null;
  const exactRawBytes = left.rawSha256 === right.rawSha256;
  const exactNormalizedRgb = left.normalizedRgbSha256 === right.normalizedRgbSha256;
  const regions = Object.fromEntries(Object.keys(REGIONS).map((name) => [name, regionDistance(left.regions[name], right.regions[name])]));
  const score = exactRawBytes || exactNormalizedRgb
    ? 0
    : 0.28 * regions.full.score + 0.37 * regions.art.score + 0.25 * regions.upperArt.score + 0.10 * regions.lowerFrame.score;
  return { score, exactRawBytes, exactNormalizedRgb, regions };
}

function visualAuditMetrics(visual) {
  if (!visual?.regions) return null;
  return Object.fromEntries(Object.entries(visual.regions).map(([name, region]) => [name, {
    score: region.score,
    correlation: region.correlation,
    histogramDistance: region.histogramDistance,
  }]));
}

/**
 * Gate สำหรับการเขียน Production โดยเฉพาะ: คะแนนรวมต้องต่ำ และเมื่อมีหลาย
 * variant ภาพอันดับหนึ่งต้องทิ้งห่างอันดับสอง นอกจากนี้ภาพที่ไม่ได้ exact ยัง
 * ต้องรักษาโครงสร้าง art และสีรวมไว้ด้วย เพื่อกันภาพคนละใบที่ layout คล้ายกัน
 */
export function conservativeVisualPredicate({
  visual,
  compatibleCount = 1,
  margin = null,
  maxVisualScore = AUTO_SAFE_MAX_VISUAL_SCORE,
  minMargin = AUTO_SAFE_MIN_MARGIN,
}) {
  if (!visual) return { ok: false, reason: "visual_evidence_missing" };
  if (visual.score > maxVisualScore) return { ok: false, reason: "visual_score_too_high" };
  if (compatibleCount > 1 && (margin == null || margin < minMargin)) {
    return { ok: false, reason: "visual_margin_too_small" };
  }
  if (!visual.exactRawBytes && !visual.exactNormalizedRgb) {
    if (visual.regions.art.correlation < 0.60 || visual.regions.upperArt.correlation < 0.55) {
      return { ok: false, reason: "visual_structure_too_weak" };
    }
    if (visual.regions.full.histogramDistance > 0.45 || visual.regions.art.histogramDistance > 0.45) {
      return { ok: false, reason: "visual_color_too_different" };
    }
  }
  return { ok: true, reason: "visual_high_confidence" };
}

function urlHostname(value) {
  try { return new URL(String(value ?? "")).hostname.toLowerCase(); } catch { return ""; }
}

function hasDistinctSnkrCardName(listing) {
  const name = String(listing?.name ?? listing?.scrapedName ?? "");
  const beforeCode = name.split(/\[[A-Z]+\d*[-‐‑‒–—]\d{3,4}\]/i, 1)[0] ?? "";
  const withoutRarity = beforeCode.replace(/(?:^|\s)(?:P-(?:L|C|UC|R|SR|SEC|SP)|SEC|SR|SP|UC|L|R|C|P)\s*$/i, "").trim();
  return (withoutRarity.match(/[\p{L}\p{N}]/gu) ?? []).length >= 2;
}

function isStandardSnkrBoosterBase(listing, card, sourceMarkers) {
  const name = String(listing?.name ?? listing?.scrapedName ?? "");
  const sourceRarity = normalizeRarity(parseSnkrRarity(name));
  return (
    /\bBOOSTER\s+PACK\b/i.test(name)
    && !/\b(?:PROMO|PREMIUM|WINNER|CHAMPIONSHIP|TOURNAMENT|STANDARD\s+BATTLE|ANNIVERSARY|COLLECTION|DECK|GIFT|SERIAL|SIGNED|MANGA)\b/i.test(name)
    && sourceMarkers.size === 0
    && hasDistinctSnkrCardName(listing)
    && cardVariantMarkers(card).size === 0
    && !isParallelCard(card)
    && SNKR_WATERMARK_BASE_RARITIES.has(sourceRarity)
    && urlHostname(listing?.thumbnailUrl) === "cdn.snkrdunk.com"
    && ["asia-en.onepiece-cardgame.com", "onepiece-cardgame.com", "www.onepiece-cardgame.com"]
      .includes(urlHostname(card?.imageUrl))
  );
}

/**
 * รูป Official มีลายน้ำ SAMPLE แต่รูป SNKR ไม่มี จึงใช้ด่านสำรองที่ยอมรับ
 * ความต่างจากลายน้ำได้เฉพาะการ์ด base จาก Booster Pack ซึ่ง metadata เหลือ
 * เป้าหมายเดียวเท่านั้น การ์ด parallel/promo/treatment พิเศษยังต้องผ่านด่านเดิม
 */
export function snkrWatermarkTolerantVisualPredicate({
  visual,
  listing,
  card,
  sourceMarkers = new Set(),
  compatibleCount = 1,
}) {
  if (!visual) return { ok: false, reason: "visual_evidence_missing" };
  if (compatibleCount !== 1) return { ok: false, reason: "watermark_candidate_not_unique" };
  if (!isStandardSnkrBoosterBase(listing, card, sourceMarkers)) {
    return { ok: false, reason: "watermark_fallback_not_eligible" };
  }
  if (
    visual.score > 0.35
    || visual.regions.full.correlation < 0.45
    || visual.regions.full.histogramDistance > 0.40
    || visual.regions.art.histogramDistance > 0.35
    || Math.max(
      visual.regions.art.correlation,
      visual.regions.upperArt.correlation,
      visual.regions.lowerFrame.correlation,
    ) < 0.45
  ) {
    return { ok: false, reason: "watermark_visual_evidence_too_weak" };
  }
  return { ok: true, reason: "official_sample_watermark_tolerant" };
}

function featureFor(imageFeatures, url) {
  if (!url) return { ok: false, placeholder: false, reason: "missing_image_url", url: "" };
  return imageFeatures instanceof Map
    ? imageFeatures.get(String(url)) ?? { ok: false, placeholder: false, reason: "image_not_loaded", url: String(url) }
    : imageFeatures?.[String(url)] ?? { ok: false, placeholder: false, reason: "image_not_loaded", url: String(url) };
}

function yuyuteiCompatibleCandidates(mapping, candidates) {
  const sourceCode = normalizePrintedCode(mapping?.scrapedCode);
  const sourceSet = normalizeSetCode(mapping?.setCode);
  const sourceRarity = normalizeRarity(mapping?.scrapedRarity);
  const parallel = expectedParallel(mapping);
  const markers = new Set(extractVariantMarkers(mapping?.scrapedName));
  return (Array.isArray(candidates) ? candidates : []).filter((card) => {
    if (!sourceCode || normalizePrintedCode(card?.cardCode ?? card?.baseCode) !== sourceCode) return false;
    if (!sourceSet || cardSetCode(card) !== sourceSet) return false;
    if (!sourceRarity || normalizeRarity(card?.rarity) !== sourceRarity) return false;
    if (parallel != null && isParallelCard(card) !== parallel) return false;
    return !markerContradiction(markers, card);
  });
}

export function classifyYuyuteiPending({
  mapping,
  candidates,
  occupiedTargetIds = new Set(),
  imageFeatures = new Map(),
  maxVisualScore = AUTO_SAFE_MAX_VISUAL_SCORE,
  minMargin = AUTO_SAFE_MIN_MARGIN,
}) {
  if (!mapping?.id || !normalizePrintedCode(mapping.scrapedCode) || !normalizeSetCode(mapping.setCode) || !normalizeRarity(mapping.scrapedRarity)) {
    return { category: "blocked", reason: "invalid_source_metadata" };
  }
  if (!Array.isArray(candidates) || !candidates.length) return { category: "blocked", reason: "no_candidates" };
  const compatible = yuyuteiCompatibleCandidates(mapping, candidates);
  if (!compatible.length) return { category: "blocked", reason: "no_exact_metadata_candidate" };
  const sourceMarkers = new Set(extractVariantMarkers(`${mapping?.scrapedName ?? ""} ${mapping?.scrapedRarity ?? ""}`));
  const treatmentCompatible = compatible.filter((card) => hasExactTreatmentEvidence(sourceMarkers, card));
  if (!treatmentCompatible.length) {
    return { category: "blocked", reason: "unverifiable_treatment", compatibleCount: compatible.length };
  }

  const source = featureFor(imageFeatures, mapping.scrapedImage);
  if (!source.ok) return { category: "blocked", reason: source.placeholder ? "source_placeholder" : "source_image_error", compatibleCount: treatmentCompatible.length };
  const unusable = treatmentCompatible.find((card) => {
    const feature = featureFor(imageFeatures, card.imageUrl);
    return !feature.ok;
  });
  if (unusable) {
    const feature = featureFor(imageFeatures, unusable.imageUrl);
    return { category: "blocked", reason: feature.placeholder ? "candidate_placeholder" : "candidate_image_error", compatibleCount: treatmentCompatible.length };
  }

  const scored = treatmentCompatible.map((card) => ({
    card,
    visual: compareImageFeatures(source, featureFor(imageFeatures, card.imageUrl)),
  })).sort((a, b) => a.visual.score - b.visual.score || Number(a.card.id) - Number(b.card.id));
  const best = scored[0];
  const second = scored[1];
  const margin = second ? second.visual.score - best.visual.score : null;
  const visualGate = conservativeVisualPredicate({
    visual: best.visual,
    compatibleCount: treatmentCompatible.length,
    margin,
    maxVisualScore,
    minMargin,
  });
  if (!visualGate.ok) {
    return { category: "blocked", reason: visualGate.reason, compatibleCount: treatmentCompatible.length, visualScore: best.visual.score, margin };
  }
  if (occupiedTargetIds.has(Number(best.card.id))) {
    return { category: "blocked", reason: "target_collision", compatibleCount: treatmentCompatible.length, visualScore: best.visual.score, margin };
  }
  return {
    category: "shadow_candidate",
    reason: "exact_metadata_and_visual",
    targetCardId: Number(best.card.id),
    target: best.card,
    compatibleCount: treatmentCompatible.length,
    visualScore: best.visual.score,
    visualMargin: margin,
    exactRawBytes: best.visual.exactRawBytes,
    exactNormalizedRgb: best.visual.exactNormalizedRgb,
  };
}

function parseSnkrRarity(name) {
  const text = String(name ?? "").toUpperCase();
  const parallel = text.match(/\b(L|C|UC|R|SR|SEC|SP)-P\b/);
  if (parallel) return `P-${parallel[1]}`;
  const direct = text.match(/(?:^|[\s[(])(P-(?:L|C|UC|R|SR|SEC|SP)|SEC|SR|SP|UC|L|R|C|P)(?=[\s:,[\]()])/);
  return direct?.[1] ?? "";
}

function blockedSnkrSourceReason(listing) {
  const name = String(listing?.name ?? listing?.scrapedName ?? "");
  if (/\[(?:EN|ZH(?:[-_](?:CN|TW|HK|HANS|HANT))?|CN|KR|KO|TH|FR|DE|ES|IT|PT)\]/i.test(name)
    || /\b(?:ENGLISH|CHINESE|KOREAN|THAI|FRENCH|GERMAN|SPANISH|ITALIAN|PORTUGUESE)\s+(?:LANGUAGE|VERSION|EDITION)\b/i.test(name)) {
    return "explicit_locale";
  }
  if (/\b(?:OPENED|UN[- ]?OPEN(?:ED)?|SEALED)\b|開封|未開封/i.test(name)) return "opened_or_unopened_product";
  return "";
}

function snkrCatalogCandidates(listing, catalogCards) {
  const code = normalizePrintedCode(listing?.productNumber);
  const rarity = normalizeRarity(parseSnkrRarity(listing?.name));
  if (!code || !rarity) return [];
  return (Array.isArray(catalogCards) ? catalogCards : []).filter((card) => (
    normalizePrintedCode(card?.cardCode ?? card?.baseCode) === code
    && normalizeRarity(card?.rarity) === rarity
  ));
}

export function classifySnkrdunkDiscovery({
  listing,
  candidates,
  occupiedTargetIds = new Set(),
  imageFeatures = new Map(),
  maxVisualScore = AUTO_SAFE_MAX_VISUAL_SCORE,
  minMargin = AUTO_SAFE_MIN_MARGIN,
}) {
  const blockedSource = blockedSnkrSourceReason(listing);
  if (blockedSource) return { category: "blocked", reason: blockedSource };
  const sourceCode = normalizePrintedCode(listing?.productNumber);
  const nameCodes = [...new Set(
    (String(listing?.name ?? listing?.scrapedName ?? "").toUpperCase().match(/[A-Z]+\d*[-‐‑‒–—]\d{3,4}/g) ?? [])
      .map((value) => normalizePrintedCode(value))
      .filter(Boolean),
  )];
  if (sourceCode && nameCodes.some((nameCode) => nameCode !== sourceCode)) {
    return { category: "blocked", reason: "source_code_conflict" };
  }
  if (
    !Number.isSafeInteger(Number(listing?.snkrdunkId))
    || Number(listing?.snkrdunkId) <= 0
    || !normalizePrintedCode(listing?.productNumber)
    || !normalizeRarity(parseSnkrRarity(listing?.name))
  ) {
    return { category: "blocked", reason: "invalid_source_metadata" };
  }
  const compatible = Array.isArray(candidates) ? candidates : [];
  if (!compatible.length) return { category: "blocked", reason: "no_exact_metadata_candidate" };
  const sourceMarkers = new Set(extractVariantMarkers(listing?.name ?? listing?.scrapedName));
  const treatmentCompatible = compatible.filter((card) => hasExactTreatmentEvidence(sourceMarkers, card));
  if (!treatmentCompatible.length) {
    return { category: "blocked", reason: "unverifiable_treatment", compatibleCount: compatible.length };
  }

  const source = featureFor(imageFeatures, listing?.thumbnailUrl);
  if (!source.ok) {
    return {
      category: "blocked",
      reason: source.placeholder ? "source_placeholder" : "source_image_error",
      compatibleCount: treatmentCompatible.length,
    };
  }
  const unusable = treatmentCompatible.find((card) => !featureFor(imageFeatures, card?.imageUrl).ok);
  if (unusable) {
    const feature = featureFor(imageFeatures, unusable?.imageUrl);
    return {
      category: "blocked",
      reason: feature.placeholder ? "candidate_placeholder" : "candidate_image_error",
      compatibleCount: treatmentCompatible.length,
    };
  }

  const scored = treatmentCompatible.map((card) => ({
    card,
    visual: compareImageFeatures(source, featureFor(imageFeatures, card.imageUrl)),
  })).sort((a, b) => a.visual.score - b.visual.score || Number(a.card.id) - Number(b.card.id));
  const best = scored[0];
  const second = scored[1];
  const margin = second ? second.visual.score - best.visual.score : null;
  const visualGate = conservativeVisualPredicate({
    visual: best.visual,
    compatibleCount: treatmentCompatible.length,
    margin,
    maxVisualScore,
    minMargin,
  });
  const watermarkGate = visualGate.ok ? null : snkrWatermarkTolerantVisualPredicate({
    visual: best.visual,
    listing,
    card: best.card,
    sourceMarkers,
    compatibleCount: treatmentCompatible.length,
  });
  if (!visualGate.ok && !watermarkGate.ok) {
    return {
      category: "blocked",
      reason: visualGate.reason,
      compatibleCount: treatmentCompatible.length,
      visualScore: best.visual.score,
      visualMargin: margin,
    };
  }
  if (occupiedTargetIds.has(Number(best.card.id))) {
    return {
      category: "blocked",
      reason: "target_collision",
      compatibleCount: treatmentCompatible.length,
      visualScore: best.visual.score,
      visualMargin: margin,
      targetCardId: Number(best.card.id),
    };
  }
  return {
    category: "shadow_candidate",
    reason: "exact_metadata_and_visual",
    visualEvidence: visualGate.ok ? "strict" : watermarkGate.reason,
    visualMetrics: visualAuditMetrics(best.visual),
    targetCardId: Number(best.card.id),
    target: best.card,
    compatibleCount: treatmentCompatible.length,
    visualScore: best.visual.score,
    visualMargin: margin,
  };
}

function blockDuplicateShadowTargets(results) {
  const groups = new Map();
  for (const row of results) {
    if (row.classification.category !== "shadow_candidate") continue;
    const targetId = row.classification.targetCardId;
    if (!groups.has(targetId)) groups.set(targetId, []);
    groups.get(targetId).push(row);
  }
  for (const rows of groups.values()) {
    if (rows.length < 2) continue;
    for (const row of rows) {
      row.classification = {
        ...row.classification,
        category: "blocked",
        reason: "shadow_target_collision",
      };
    }
  }
  return results;
}

function blockDuplicateYuyuteiShadowTargets(results) {
  const groups = new Map();
  for (const row of results) {
    if (row.classification.category !== "shadow_candidate") continue;
    const targetId = Number(row.classification.targetCardId);
    if (!groups.has(targetId)) groups.set(targetId, []);
    groups.get(targetId).push(row);
  }
  for (const rows of groups.values()) {
    if (rows.length < 2) continue;
    for (const row of rows) {
      row.classification = {
        ...row.classification,
        category: "blocked",
        reason: "shadow_target_collision",
      };
    }
  }
  return results;
}

function snkrCompatibleCandidates(mapping) {
  const code = normalizePrintedCode(mapping?.productNumber);
  const rarity = normalizeRarity(parseSnkrRarity(mapping?.scrapedName));
  if (!code || !rarity) return [];
  return (Array.isArray(mapping?.candidates) ? mapping.candidates : []).filter((card) => {
    const cardId = Number(card?.id);
    if (!Number.isSafeInteger(cardId) || cardId <= 0) return false;
    if (normalizePrintedCode(card?.cardCode ?? card?.baseCode) !== code) return false;
    return normalizeRarity(card?.rarity) === rarity;
  });
}

export function classifySnkrdunkPending({
  mapping,
  occupiedTargetIds = new Set(),
  imageFeatures = new Map(),
  maxVisualScore = AUTO_SAFE_MAX_VISUAL_SCORE,
  minMargin = AUTO_SAFE_MIN_MARGIN,
}) {
  const blockedSource = blockedSnkrSourceReason(mapping);
  if (blockedSource) return { category: "blocked", reason: blockedSource };
  if (!Number.isSafeInteger(Number(mapping?.id)) || Number(mapping?.id) <= 0) {
    return { category: "blocked", reason: "invalid_source_metadata" };
  }
  return classifySnkrdunkDiscovery({
    listing: {
      snkrdunkId: mapping?.snkrdunkId,
      productNumber: mapping?.productNumber,
      name: mapping?.scrapedName,
      scrapedName: mapping?.scrapedName,
      thumbnailUrl: mapping?.thumbnailUrl,
    },
    candidates: snkrCompatibleCandidates(mapping),
    occupiedTargetIds,
    imageFeatures,
    maxVisualScore,
    minMargin,
  });
}

function countReasons(rows) {
  const counts = {};
  for (const row of rows) counts[row.reason] = (counts[row.reason] ?? 0) + 1;
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

function hasMoney(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function snkrMatchedPriceCoverage(rows) {
  const withMinPrice = rows.filter((row) => hasMoney(row?.minPriceUsd)).length;
  const withUsedMinPrice = rows.filter((row) => hasMoney(row?.usedMinPriceUsd)).length;
  const withPsa10Price = rows.filter((row) => hasMoney(row?.lastSoldPsa10Usd)).length;
  const withoutAnyPrice = rows.filter((row) => (
    !hasMoney(row?.minPriceUsd)
    && !hasMoney(row?.usedMinPriceUsd)
    && !hasMoney(row?.lastSoldPsa10Usd)
  )).length;
  return {
    total: rows.length,
    withMinPrice,
    withUsedMinPrice,
    withPsa10Price,
    withoutMinPrice: rows.length - withMinPrice,
    withoutUsedMinPrice: rows.length - withUsedMinPrice,
    withoutPsa10Price: rows.length - withPsa10Price,
    withoutAnyPrice,
  };
}

function normalizeSnkrLookup(lookup, expected) {
  const summary = lookup?.summary;
  if (
    !summary
    || Number(summary.snkrdunkId) !== Number(expected.snkrdunkId)
    || normalizePrintedCode(summary.productNumber) !== normalizePrintedCode(expected.productNumber)
  ) {
    throw new McpError(`SNKRDUNK lookup ${expected.snkrdunkId} คืน identity ไม่ตรง`, { code: "lookup_integrity_error" });
  }
  const money = (value) => hasMoney(value) ? value : null;
  return {
    currency: summary.currency ?? lookup.detectedCurrency ?? null,
    minPriceUsd: money(summary.minPriceUsd),
    usedMinPriceUsd: money(summary.usedMinPriceUsd),
    lastSoldUsd: money(lookup.lastSoldUsd),
    psa10MinPriceUsd: money(lookup.psa10MinPriceUsd),
    psa10LastSoldUsd: money(lookup.psa10LastSoldUsd),
    psa9MinPriceUsd: money(lookup.psa9MinPriceUsd),
    psa9LastSoldUsd: money(lookup.psa9LastSoldUsd),
    psa8MinPriceUsd: money(lookup.psa8MinPriceUsd),
    psa8LastSoldUsd: money(lookup.psa8LastSoldUsd),
  };
}

function snkrDiscoveryPlanRow(row, prices) {
  const { listing, classification } = row;
  return {
    snkrdunkId: Number(listing.snkrdunkId),
    code: normalizePrintedCode(listing.productNumber),
    rarity: normalizeRarity(parseSnkrRarity(listing.name)),
    name: listing.name,
    sourceUrl: `https://snkrdunk.com/en/trading-cards/${Number(listing.snkrdunkId)}`,
    thumbnailUrl: listing.thumbnailUrl,
    targetCardId: classification.targetCardId,
    targetCode: classification.target?.cardCode,
    targetImageUrl: classification.target?.imageUrl,
    approvalReady: false,
    requiredNextGate: "japanese_locale_ocr",
    visualScore: Number(classification.visualScore.toFixed(6)),
    visualMargin: classification.visualMargin == null ? null : Number(classification.visualMargin.toFixed(6)),
    ...prices,
  };
}

function snkrPendingPlanRow(row) {
  const { mapping, classification } = row;
  const money = (value) => hasMoney(value) ? value : null;
  return {
    mappingId: Number(mapping.id),
    snkrdunkId: Number(mapping.snkrdunkId),
    code: normalizePrintedCode(mapping.productNumber),
    rarity: normalizeRarity(parseSnkrRarity(mapping.scrapedName)),
    name: mapping.scrapedName,
    sourceUrl: mapping.sourceUrl,
    thumbnailUrl: mapping.thumbnailUrl,
    targetCardId: classification.targetCardId,
    targetCode: classification.target?.cardCode,
    targetImageUrl: classification.target?.imageUrl,
    approvalReady: false,
    requiredNextGate: "japanese_locale_ocr",
    visualScore: Number(classification.visualScore.toFixed(6)),
    visualMargin: classification.visualMargin == null ? null : Number(classification.visualMargin.toFixed(6)),
    minPriceUsd: money(mapping.minPriceUsd),
    usedMinPriceUsd: money(mapping.usedMinPriceUsd),
    psa10LastSoldUsd: money(mapping.lastSoldPsa10Usd),
  };
}

function snkrDiscoveryReview(results) {
  const blocked = results.filter((row) => row.classification.category === "blocked");
  return {
    count: blocked.length,
    examples: blocked.slice(0, SNKR_DISCOVERY_REVIEW_LIMIT).map(({ listing, candidates, classification }) => ({
      snkrdunkId: Number(listing.snkrdunkId),
      code: normalizePrintedCode(listing.productNumber),
      rarity: normalizeRarity(parseSnkrRarity(listing.name)) || null,
      name: listing.name,
      thumbnailUrl: listing.thumbnailUrl,
      reason: classification.reason,
      visualScore: classification.visualScore == null ? null : Number(classification.visualScore.toFixed(6)),
      visualMargin: classification.visualMargin == null ? null : Number(classification.visualMargin.toFixed(6)),
      candidates: candidates.slice(0, 6).map((card) => ({
        cardId: Number(card.id),
        code: card.cardCode,
        rarity: card.rarity,
        imageUrl: card.imageUrl,
      })),
    })),
    examplesTruncated: blocked.length > SNKR_DISCOVERY_REVIEW_LIMIT,
  };
}

export function buildYuyuteiPendingReview(results, candidateResponses, { invalidExampleLimit = 5, candidateLimit = 12 } = {}) {
  const invalid = results.filter((row) => row.classification.reason === "invalid_source_metadata");
  const sourceSummary = (mapping) => ({
    mappingId: Number(mapping.id),
    code: mapping.scrapedCode,
    name: mapping.scrapedName,
    sourceUrl: mapping.sourceUrl,
    sourceImageUrl: mapping.scrapedImage,
  });
  return {
    invalidSourceMetadata: {
      count: invalid.length,
      examples: invalid.slice(0, invalidExampleLimit).map((row) => sourceSummary(row.mapping)),
    },
    blocked: results
      .filter((row) => row.classification.category === "blocked" && row.classification.reason !== "invalid_source_metadata")
      .map((row) => {
        const response = candidateResponses.get(Number(row.mapping.id));
        const candidates = Array.isArray(response?.candidates) ? response.candidates : [];
        return {
          ...sourceSummary(row.mapping),
          reason: row.classification.reason,
          visualScore: row.classification.visualScore == null ? null : Number(row.classification.visualScore.toFixed(6)),
          visualMargin: row.classification.margin == null ? null : Number(row.classification.margin.toFixed(6)),
          candidateCount: candidates.length,
          candidates: candidates.slice(0, candidateLimit).map((card) => ({
            cardId: Number(card.id),
            code: card.cardCode,
            setCode: card?.set?.code ?? card?.setCode ?? null,
            rarity: card.rarity,
            imageUrl: card.imageUrl,
          })),
          candidatesTruncated: candidates.length > candidateLimit,
        };
      }),
  };
}

function collectImageUrls({ yuyuteiPending, yuyuteiCandidates, snkrPending, snkrDiscoveryRows = [] }) {
  const urls = new Set();
  const add = (url) => { if (url) urls.add(String(url)); };
  for (const row of yuyuteiPending) {
    add(row.scrapedImage);
    for (const card of yuyuteiCompatibleCandidates(row, yuyuteiCandidates.get(Number(row.id))?.candidates)) add(card.imageUrl);
  }
  for (const row of snkrPending) {
    add(row.thumbnailUrl);
    for (const card of snkrCompatibleCandidates(row)) add(card.imageUrl);
  }
  for (const row of snkrDiscoveryRows) {
    if (blockedSnkrSourceReason(row.listing)) continue;
    if (!normalizePrintedCode(row.listing?.productNumber) || !normalizeRarity(parseSnkrRarity(row.listing?.name))) continue;
    if (!row.candidates.length) continue;
    add(row.listing?.thumbnailUrl);
    for (const card of row.candidates) add(card.imageUrl);
  }
  return urls;
}

async function loadFeatures(urls, fetchImpl, { deadlineMs = Number.POSITIVE_INFINITY } = {}) {
  const entries = await mapLimit([...urls], IMAGE_CONCURRENCY, async (url) => {
    const remainingMs = deadlineMs - Date.now();
    if (remainingMs < 1_000) {
      return [url, { ok: false, placeholder: false, reason: "job_deadline_exceeded", url }];
    }
    return [url, await fetchImageFeature(url, {
      fetchImpl,
      retries: 1,
      timeoutMs: Math.min(IMAGE_FETCH_TIMEOUT_MS, remainingMs),
    })];
  });
  return new Map(entries);
}

function occupiedTargets(matched) {
  const counts = new Map();
  for (const row of matched) {
    const id = Number(row?.matchedCard?.id ?? row?.matchedCardId);
    if (Number.isInteger(id) && id > 0) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return {
    ids: new Set(counts.keys()),
    duplicates: new Set([...counts].filter(([, count]) => count > 1).map(([id]) => id)),
  };
}

function rarityFamily(value) {
  return normalizeRarity(value).replace(/^P-/, "").replace(/-P$/, "");
}

function structuralTargetParallel(card) {
  if (typeof card?.isParallel === "boolean") return card.isParallel;
  const rarity = normalizeRarity(card?.rarity);
  if (/^P-/.test(rarity)) return true;
  if (/_[pr]\d+$/i.test(String(card?.cardCode ?? ""))) return null;
  return rarity ? false : null;
}

function structuralSource(row, provider) {
  if (provider === "yuyutei") {
    return {
      sourceId: row?.yuyuteiId ?? null,
      code: row?.scrapedCode,
      setCode: row?.setCode,
      rarity: row?.scrapedRarity,
      name: row?.scrapedName,
      url: row?.sourceUrl,
      parallel: expectedParallel(row),
    };
  }
  const rarity = parseSnkrRarity(row?.scrapedName);
  const markers = new Set(extractVariantMarkers(row?.scrapedName));
  return {
    sourceId: row?.snkrdunkId ?? null,
    code: row?.productNumber,
    setCode: row?.setCode ?? row?.sourceSetCode,
    rarity,
    name: row?.scrapedName,
    url: row?.sourceUrl,
    parallel: markers.has("parallel") || markers.has("super-parallel") ? true : null,
  };
}

export function auditMatchedStructure(rows, { provider, exampleLimit = 12 } = {}) {
  if (!new Set(["yuyutei", "snkrdunk"]).has(provider)) {
    throw new UsageError("structural audit provider ต้องเป็น yuyutei หรือ snkrdunk");
  }
  const targetCounts = new Map();
  for (const row of rows) {
    const targetId = Number(row?.matchedCard?.id ?? row?.matchedCardId);
    if (Number.isSafeInteger(targetId) && targetId > 0) {
      targetCounts.set(targetId, (targetCounts.get(targetId) ?? 0) + 1);
    }
  }
  const violations = [];
  for (const row of rows) {
    const source = structuralSource(row, provider);
    const target = row?.matchedCard;
    const reasons = [];
    const targetId = Number(target?.id ?? row?.matchedCardId);
    if (!target || !Number.isSafeInteger(targetId) || targetId <= 0) {
      reasons.push("missing_target");
    } else {
      const sourceCode = normalizePrintedCode(source.code);
      const targetCode = normalizePrintedCode(target?.baseCode ?? target?.cardCode);
      if (sourceCode && sourceCode !== targetCode) reasons.push("code_mismatch");
      const sourceSet = normalizeSetCode(source.setCode);
      const targetSet = cardSetCode(target);
      if (sourceSet && sourceSet !== targetSet) reasons.push("set_mismatch");
      const sourceFamily = rarityFamily(source.rarity);
      const targetFamily = rarityFamily(target?.rarity);
      if (sourceFamily && sourceFamily !== targetFamily) reasons.push("rarity_family_mismatch");
      const targetParallel = structuralTargetParallel(target);
      if (source.parallel != null && targetParallel != null && source.parallel !== targetParallel) {
        reasons.push("parallel_mismatch");
      }
      if ((targetCounts.get(targetId) ?? 0) > 1) reasons.push("duplicate_target");
    }
    if (!reasons.length) continue;
    violations.push({
      mappingId: Number(row?.id),
      sourceId: source.sourceId,
      sourceCode: source.code ?? null,
      sourceSet: source.setCode ?? null,
      sourceRarity: source.rarity || null,
      sourceName: source.name ?? null,
      sourceUrl: source.url ?? null,
      targetCardId: Number.isSafeInteger(targetId) && targetId > 0 ? targetId : null,
      targetCode: target?.cardCode ?? target?.baseCode ?? null,
      targetSet: target?.set?.code ?? target?.setCode ?? null,
      targetRarity: target?.rarity ?? null,
      reasons,
    });
  }
  const reasonCounts = {};
  for (const row of violations) {
    for (const reason of row.reasons) reasonCounts[reason] = (reasonCounts[reason] ?? 0) + 1;
  }
  return {
    checked: rows.length,
    violations: violations.length,
    reasons: Object.fromEntries(Object.entries(reasonCounts).sort(([a], [b]) => a.localeCompare(b))),
    examples: violations.slice(0, exampleLimit),
    examplesTruncated: violations.length > exampleLimit,
  };
}

function yuyuteiSourceIdentity(row) {
  return {
    id: Number(row?.id),
    yuyuteiId: String(row?.yuyuteiId ?? ""),
    setCode: String(row?.setCode ?? ""),
    sourceUrl: String(row?.sourceUrl ?? ""),
    scrapedCode: String(row?.scrapedCode ?? ""),
    scrapedName: String(row?.scrapedName ?? ""),
    scrapedRarity: String(row?.scrapedRarity ?? ""),
    scrapedImage: String(row?.scrapedImage ?? ""),
    priceJpy: row?.priceJpy ?? null,
    inStock: row?.inStock ?? null,
  };
}

function sameYuyuteiSourceIdentity(left, right) {
  return JSON.stringify(yuyuteiSourceIdentity(left)) === JSON.stringify(yuyuteiSourceIdentity(right));
}

function yuyuteiApplyResultBase(mapping, classification) {
  return {
    mappingId: Number(mapping.id),
    yuyuteiId: mapping.yuyuteiId ?? null,
    sourceCode: mapping.scrapedCode ?? null,
    sourceUrl: mapping.sourceUrl ?? null,
    sourceImageUrl: mapping.scrapedImage ?? null,
    sourcePriceJpy: mapping.priceJpy ?? null,
    targetCardId: Number(classification.targetCardId),
    targetCode: classification.target?.cardCode ?? null,
    targetImageUrl: classification.target?.imageUrl ?? null,
  };
}

function finiteMoney(value) {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function verifyYuyuteiMatchedRow(row, expected) {
  if (!row) return { ok: false, reason: "matched_row_missing", readBack: null };
  const matchedCardId = Number(row?.matchedCard?.id ?? row?.matchedCardId);
  const readBack = {
    status: row?.status ?? null,
    matchedCardId: Number.isSafeInteger(matchedCardId) ? matchedCardId : null,
    priceJpy: row?.priceJpy ?? null,
    latestPriceJpy: row?.matchedCard?.latestPriceJpy ?? null,
    updatedAt: row?.updatedAt ?? null,
  };
  if (String(row?.status ?? "").toUpperCase() !== "MATCHED") {
    return { ok: false, reason: "readback_not_matched", readBack };
  }
  if (matchedCardId !== expected.targetCardId) {
    return { ok: false, reason: "readback_wrong_target", readBack };
  }
  if (!sameYuyuteiSourceIdentity(row, expected.mapping)) {
    return { ok: false, reason: "readback_source_identity_changed", readBack };
  }
  const sourcePrice = finiteMoney(row?.priceJpy);
  const rawPrice = finiteMoney(row?.matchedCard?.latestPriceJpy);
  if (sourcePrice == null || rawPrice == null) {
    return { ok: false, reason: "raw_price_unverifiable", readBack };
  }
  if (sourcePrice !== rawPrice) {
    return { ok: false, reason: "raw_price_not_synced", readBack };
  }
  return { ok: true, reason: "matched_target_and_raw_price_verified", readBack };
}

async function fetchYuyuteiRowsForCode(client, status, code) {
  return fetchAllPages(client, "yuyutei_mapping_list", {
    status,
    keyword: normalizePrintedCode(code),
    sort: "scrapedCode",
    order: "asc",
  });
}

async function preflightYuyuteiApply({
  client,
  original,
  intended,
  fetchImpl,
  deadlineMs,
}) {
  if (!original?.updatedAt || typeof original.updatedAt !== "string") {
    return { ok: false, reason: "missing_original_updated_at" };
  }
  if (deadlineMs - Date.now() < 1_000) return { ok: false, reason: "job_deadline_exceeded" };

  const freshCandidates = await client.callReadOnly("yuyutei_mapping_candidates", {
    mappingId: Number(original.id),
  }, { retryable: false });
  if (Number(freshCandidates?.mappingId) !== Number(original.id) || !Array.isArray(freshCandidates?.candidates)) {
    return { ok: false, reason: "fresh_candidate_integrity_error" };
  }

  const freshPendingRows = await fetchYuyuteiRowsForCode(client, "pending", original.scrapedCode);
  const fresh = freshPendingRows.find((row) => Number(row?.id) === Number(original.id));
  if (!fresh || String(fresh?.status ?? "").toUpperCase() !== "PENDING") {
    return { ok: false, reason: "mapping_no_longer_pending" };
  }
  if (fresh.updatedAt !== original.updatedAt) {
    return { ok: false, reason: "mapping_updated_at_changed" };
  }
  if (!sameYuyuteiSourceIdentity(fresh, original)) {
    return { ok: false, reason: "source_identity_changed" };
  }

  const freshMatchedRows = await fetchYuyuteiRowsForCode(
    client,
    "matched",
    intended.target?.cardCode ?? original.scrapedCode,
  );
  const occupied = occupiedTargets(freshMatchedRows).ids;
  if (occupied.has(Number(intended.targetCardId))) {
    return { ok: false, reason: "fresh_target_collision" };
  }

  const urls = new Set([fresh.scrapedImage]);
  for (const card of yuyuteiCompatibleCandidates(fresh, freshCandidates.candidates)) {
    if (card?.imageUrl) urls.add(card.imageUrl);
  }
  const freshImageFeatures = await loadFeatures(urls, fetchImpl, { deadlineMs });
  const classification = classifyYuyuteiPending({
    mapping: fresh,
    candidates: freshCandidates.candidates,
    occupiedTargetIds: occupied,
    imageFeatures: freshImageFeatures,
  });
  if (
    classification.category !== "shadow_candidate"
    || Number(classification.targetCardId) !== Number(intended.targetCardId)
  ) {
    return {
      ok: false,
      reason: classification.reason === "exact_metadata_and_visual" ? "fresh_target_changed" : `fresh_${classification.reason}`,
    };
  }

  // ปิดช่องเวลาระหว่างโหลดภาพกับ mutation ด้วยการอ่านสถานะ/occupancy ซ้ำเป็นขั้นสุดท้าย
  const finalPendingRows = await fetchYuyuteiRowsForCode(client, "pending", original.scrapedCode);
  const finalFresh = finalPendingRows.find((row) => Number(row?.id) === Number(original.id));
  if (!finalFresh || String(finalFresh?.status ?? "").toUpperCase() !== "PENDING") {
    return { ok: false, reason: "mapping_no_longer_pending" };
  }
  if (finalFresh.updatedAt !== original.updatedAt) {
    return { ok: false, reason: "mapping_updated_at_changed" };
  }
  if (!sameYuyuteiSourceIdentity(finalFresh, original)) {
    return { ok: false, reason: "source_identity_changed" };
  }
  const finalMatchedRows = await fetchYuyuteiRowsForCode(
    client,
    "matched",
    intended.target?.cardCode ?? original.scrapedCode,
  );
  if (occupiedTargets(finalMatchedRows).ids.has(Number(intended.targetCardId))) {
    return { ok: false, reason: "fresh_target_collision" };
  }
  return { ok: true, mapping: finalFresh, classification };
}

async function readBackYuyuteiApply(client, expected) {
  const matchedRows = await fetchYuyuteiRowsForCode(client, "matched", expected.mapping.scrapedCode);
  const matched = matchedRows.find((row) => Number(row?.id) === Number(expected.mapping.id));
  const targetOccupancy = matchedRows.filter((row) => (
    Number(row?.matchedCard?.id ?? row?.matchedCardId) === expected.targetCardId
  )).length;
  const initial = verifyYuyuteiMatchedRow(matched, expected);
  const verified = {
    ...initial,
    readBack: initial.readBack ? { ...initial.readBack, targetOccupancy } : { targetOccupancy },
  };
  if (targetOccupancy > 1) {
    return { ...verified, ok: false, reason: "readback_target_collision" };
  }
  if (verified.ok || matched) return verified;
  const pendingRows = await fetchYuyuteiRowsForCode(client, "pending", expected.mapping.scrapedCode);
  const pending = pendingRows.find((row) => Number(row?.id) === Number(expected.mapping.id));
  return {
    ...verified,
    reason: pending ? "readback_still_pending" : "readback_mapping_missing",
    readBack: pending ? {
      status: pending.status ?? null,
      matchedCardId: null,
      priceJpy: pending.priceJpy ?? null,
      latestPriceJpy: null,
      updatedAt: pending.updatedAt ?? null,
    } : null,
  };
}

async function applyYuyuteiCandidates({
  client,
  candidates,
  maxRows,
  fetchImpl,
  deadlineMs,
  journal,
  runId,
}) {
  const selected = candidates.slice(0, maxRows);
  const apply = {
    eligible: candidates.length,
    selected: selected.length,
    attempted: 0,
    approvalAcknowledged: 0,
    approved: 0,
    approvedUnverified: 0,
    mappingVerified: 0,
    succeeded: 0,
    pricesVerified: 0,
    preflightBlocked: 0,
    failed: 0,
    ambiguous: 0,
    ambiguousResolvedByReadBack: 0,
    postWriteVerified: 0,
    journalIntents: 0,
    journalOutcomes: 0,
    journalFailures: 0,
    stoppedEarly: false,
    results: [],
  };

  const recordOutcome = (result) => {
    apply.results.push(result);
    try {
      journal.append({
        event: "outcome",
        runId,
        provider: "yuyutei",
        mappingId: result.mappingId,
        targetCardId: result.targetCardId,
        outcome: result.outcome,
        reason: result.reason,
        readBack: result.readBack ?? null,
      });
      apply.journalOutcomes++;
      result.journalOutcomePersisted = true;
      return true;
    } catch (error) {
      apply.journalFailures++;
      apply.stoppedEarly = true;
      result.journalOutcomePersisted = false;
      result.journalError = String(error?.message ?? error).slice(0, 240);
      return false;
    }
  };

  for (const row of selected) {
    const base = yuyuteiApplyResultBase(row.mapping, row.classification);
    let preflight;
    try {
      preflight = await preflightYuyuteiApply({
        client,
        original: row.mapping,
        intended: row.classification,
        fetchImpl,
        deadlineMs,
      });
    } catch (error) {
      apply.preflightBlocked++;
      apply.results.push({
        ...base,
        outcome: "preflight_blocked",
        reason: error?.code ?? "preflight_read_error",
        error: String(error?.message ?? error).slice(0, 240),
      });
      continue;
    }
    if (!preflight.ok) {
      apply.preflightBlocked++;
      apply.results.push({ ...base, outcome: "preflight_blocked", reason: preflight.reason });
      continue;
    }

    try {
      journal.append({
        event: "intent",
        runId,
        provider: "yuyutei",
        mappingId: Number(preflight.mapping.id),
        targetCardId: Number(preflight.classification.targetCardId),
        source: {
          ...yuyuteiSourceIdentity(preflight.mapping),
          updatedAt: preflight.mapping.updatedAt,
        },
      });
      apply.journalIntents++;
    } catch (error) {
      apply.journalFailures++;
      apply.stoppedEarly = true;
      apply.results.push({
        ...base,
        outcome: "journal_failed",
        reason: "intent_journal_write_failed",
        error: String(error?.message ?? error).slice(0, 240),
      });
      break;
    }

    apply.attempted++;
    const expected = {
      mapping: preflight.mapping,
      targetCardId: Number(preflight.classification.targetCardId),
    };
    try {
      await client.approveYuyutei(Number(preflight.mapping.id), expected.targetCardId);
      apply.approvalAcknowledged++;
    } catch (error) {
      if (!error?.ambiguous) {
        apply.failed++;
        apply.stoppedEarly = true;
        recordOutcome({
          ...base,
          outcome: "failed",
          reason: error?.code ?? "mutation_error",
          error: String(error?.message ?? error).slice(0, 240),
        });
        break;
      }

      let readBack;
      try {
        readBack = await readBackYuyuteiApply(client, expected);
      } catch (readError) {
        apply.ambiguous++;
        apply.stoppedEarly = true;
        recordOutcome({
          ...base,
          outcome: "ambiguous",
          reason: "ambiguous_mutation_readback_failed",
          error: String(readError?.message ?? readError).slice(0, 240),
        });
        break;
      }
      apply.stoppedEarly = true;
      if (readBack.ok) {
        apply.approved++;
        apply.mappingVerified++;
        apply.succeeded++;
        apply.pricesVerified++;
        apply.postWriteVerified++;
        apply.ambiguousResolvedByReadBack++;
        recordOutcome({
          ...base,
          outcome: "approved",
          reason: "approved_after_ambiguous_readback",
          readBack: readBack.readBack,
        });
      } else if (
        String(readBack.readBack?.status ?? "").toUpperCase() === "MATCHED"
        && Number(readBack.readBack?.matchedCardId) === expected.targetCardId
      ) {
        apply.approved++;
        apply.mappingVerified++;
        apply.failed++;
        recordOutcome({
          ...base,
          outcome: readBack.reason.startsWith("raw_price_")
            ? "approved_price_sync_failed"
            : "approved_verification_failed",
          reason: readBack.reason,
          readBack: readBack.readBack,
        });
      } else if (String(readBack.readBack?.status ?? "").toUpperCase() === "MATCHED") {
        apply.approved++;
        apply.failed++;
        recordOutcome({
          ...base,
          outcome: "approved_wrong_target",
          reason: readBack.reason,
          readBack: readBack.readBack,
        });
      } else {
        apply.ambiguous++;
        recordOutcome({
          ...base,
          outcome: "ambiguous",
          reason: readBack.reason,
          readBack: readBack.readBack,
        });
      }
      break;
    }

    let readBack;
    try {
      readBack = await readBackYuyuteiApply(client, expected);
    } catch (error) {
      apply.approvedUnverified++;
      apply.ambiguous++;
      apply.stoppedEarly = true;
      recordOutcome({
        ...base,
        outcome: "approved_unverified",
        reason: "postwrite_readback_failed",
        error: String(error?.message ?? error).slice(0, 240),
      });
      break;
    }
    if (!readBack.ok) {
      apply.failed++;
      apply.stoppedEarly = true;
      const observedMatched = String(readBack.readBack?.status ?? "").toUpperCase() === "MATCHED";
      const expectedTarget = observedMatched && Number(readBack.readBack?.matchedCardId) === expected.targetCardId;
      if (observedMatched) apply.approved++;
      if (expectedTarget) apply.mappingVerified++;
      recordOutcome({
        ...base,
        outcome: expectedTarget
          ? readBack.reason.startsWith("raw_price_")
            ? "approved_price_sync_failed"
            : "approved_verification_failed"
          : observedMatched ? "approved_wrong_target" : "failed",
        reason: readBack.reason,
        readBack: readBack.readBack,
      });
      break;
    }
    apply.approved++;
    apply.mappingVerified++;
    apply.succeeded++;
    apply.pricesVerified++;
    apply.postWriteVerified++;
    if (!recordOutcome({
      ...base,
      outcome: "approved",
      reason: "approved_and_verified",
      readBack: readBack.readBack,
    })) break;
  }
  return apply;
}

export async function runSupervisor({
  argv = process.argv.slice(2),
  env = process.env,
  fetchImpl = globalThis.fetch,
  now = () => new Date(),
  runId = randomUUID(),
  journalFactory = createApplyJournal,
} = {}) {
  const flags = parseCliArgs(argv, env);
  if (flags.help) return { help: true, usage: usageText() };
  const endpoint = env.MEECARD_MCP_URL || DEFAULT_MCP_URL;

  const startedAt = now();
  const wallDeadlineMs = Date.now() + SUPERVISOR_WALL_BUDGET_MS;
  const client = new McpClient(endpoint, {
    fetchImpl,
    timeoutMs: MCP_READ_TIMEOUT_MS,
    allowYuyuteiMutation: flags.applyYuyutei,
  });
  await client.initialize();

  const [yuyuteiPending, yuyuteiMatched, snkrPending, snkrMatched, catalog] = await Promise.all([
    fetchAllPages(client, "yuyutei_mapping_list", { status: "pending", sort: "scrapedCode", order: "asc" }),
    fetchAllPages(client, "yuyutei_mapping_list", { status: "matched", sort: "scrapedCode", order: "asc" }),
    fetchAllPages(client, "snkrdunk_mapping_list", { status: "pending", sort: "productNumber", order: "asc" }),
    fetchAllPages(client, "snkrdunk_mapping_list", { status: "matched", sort: "productNumber", order: "asc" }),
    fetchCatalogBySet(client),
  ]);

  const [candidatePairs, discoveryCapture] = await Promise.all([
    mapLimit(yuyuteiPending, CANDIDATE_CONCURRENCY, async (mapping) => {
      const response = await client.callReadOnly("yuyutei_mapping_candidates", { mappingId: Number(mapping.id) });
      if (Number(response?.mappingId) !== Number(mapping.id) || !Array.isArray(response?.candidates)) {
        throw new McpError(`candidate response ของ mapping ${mapping.id} ไม่ตรงกัน`, { code: "candidate_integrity_error" });
      }
      return [Number(mapping.id), response];
    }),
    (async () => {
      try {
        return {
          discovered: await discoverSnkrdunkOnePieceCards({
            fetchImpl,
            maxPages: 3,
            timeoutMs: 15_000,
            maxRetries: 0,
            pageDelayMs: 0,
          }),
          error: null,
        };
      } catch (error) {
        return { discovered: null, error };
      }
    })(),
  ]);
  const yuyuteiCandidates = new Map(candidatePairs);
  const knownSnkrIds = new Set([...snkrPending, ...snkrMatched].map((row) => Number(row.snkrdunkId)));
  const unmappedSnkr = discoveryCapture.discovered
    ? discoveryCapture.discovered.cards.filter((card) => !knownSnkrIds.has(Number(card.snkrdunkId)))
    : [];
  const snkrDiscoveryRows = unmappedSnkr.map((listing) => ({
    listing,
    candidates: snkrCatalogCandidates(listing, catalog.cards),
  }));
  const urls = collectImageUrls({ yuyuteiPending, yuyuteiCandidates, snkrPending, snkrDiscoveryRows });
  const imageFeatures = await loadFeatures(urls, fetchImpl, { deadlineMs: wallDeadlineMs });

  const occupancy = occupiedTargets(yuyuteiMatched);
  const snkrOccupancy = occupiedTargets(snkrMatched);
  const yuyuteiStructuralAudit = auditMatchedStructure(yuyuteiMatched, { provider: "yuyutei" });
  const snkrdunkStructuralAudit = auditMatchedStructure(snkrMatched, { provider: "snkrdunk" });
  const yuyuteiPendingResults = blockDuplicateYuyuteiShadowTargets(yuyuteiPending.map((mapping) => ({
    mapping,
    classification: classifyYuyuteiPending({
      mapping,
      candidates: yuyuteiCandidates.get(Number(mapping.id)).candidates,
      occupiedTargetIds: occupancy.ids,
      imageFeatures,
    }),
  })));
  const shadowYuyutei = yuyuteiPendingResults.filter((row) => row.classification.category === "shadow_candidate");
  const yuyuteiReview = buildYuyuteiPendingReview(yuyuteiPendingResults, yuyuteiCandidates);
  const snkrPendingResults = blockDuplicateShadowTargets(snkrPending.map((mapping) => ({
    mapping,
    classification: classifySnkrdunkPending({
      mapping,
      occupiedTargetIds: snkrOccupancy.ids,
      imageFeatures,
    }),
  })));
  const shadowSnkrPending = snkrPendingResults.filter((row) => row.classification.category === "shadow_candidate");
  const snkrPendingPlan = shadowSnkrPending.map(snkrPendingPlanRow);

  let snkrdunkDiscovery;
  if (discoveryCapture.error) {
    snkrdunkDiscovery = {
      status: "failed",
      scanned: 0,
      unmappedAgainstMcp: 0,
      exactShadowCandidates: 0,
      approvalReady: 0,
      requiresLocaleAudit: 0,
      plan: [],
      priceLookup: { attempted: 0, succeeded: 0, failed: 0, errors: [] },
      error: {
        code: discoveryCapture.error?.code ?? "discovery_error",
        message: String(discoveryCapture.error?.message ?? discoveryCapture.error).slice(0, 300),
      },
    };
  } else {
    const snkrDiscoveryResults = blockDuplicateShadowTargets(snkrDiscoveryRows.map((row) => ({
      ...row,
      classification: classifySnkrdunkDiscovery({
        listing: row.listing,
        candidates: row.candidates,
        occupiedTargetIds: snkrOccupancy.ids,
        imageFeatures,
      }),
    })));
    const shadowCandidates = snkrDiscoveryResults.filter((row) => row.classification.category === "shadow_candidate");
    const lookupResults = await mapLimit(shadowCandidates, SNKR_LOOKUP_CONCURRENCY, async (row) => {
      const remainingMs = wallDeadlineMs - Date.now();
      if (remainingMs < 1_000) {
        return {
          ok: false,
          row,
          error: new McpError("SNKRDUNK lookup เกินเวลางาน", { code: "lookup_deadline_exceeded" }),
        };
      }
      try {
        const lookup = await client.callReadOnly(
          "snkrdunk_product_lookup",
          { snkrdunkId: Number(row.listing.snkrdunkId) },
          { retryable: false, timeoutMs: Math.min(SNKR_LOOKUP_TIMEOUT_MS, remainingMs) },
        );
        return { ok: true, row, prices: normalizeSnkrLookup(lookup, row.listing) };
      } catch (error) {
        return { ok: false, row, error };
      }
    });
    const lookupFailures = lookupResults.filter((row) => !row.ok);
    const plan = lookupResults.filter((row) => row.ok).map((row) => snkrDiscoveryPlanRow(row.row, row.prices));
    snkrdunkDiscovery = {
      status: lookupFailures.length ? "failed" : "ok",
      scanned: discoveryCapture.discovered.cards.length,
      unmappedAgainstMcp: unmappedSnkr.length,
      exactShadowCandidates: shadowCandidates.length,
      approvalReady: 0,
      requiresLocaleAudit: shadowCandidates.length,
      reasons: countReasons(snkrDiscoveryResults.map((row) => row.classification)),
      stats: discoveryCapture.discovered.stats,
      plan,
      review: snkrDiscoveryReview(snkrDiscoveryResults),
      priceLookup: {
        attempted: shadowCandidates.length,
        succeeded: plan.length,
        failed: lookupFailures.length,
        errors: lookupFailures.map(({ row, error }) => ({
          snkrdunkId: Number(row.listing.snkrdunkId),
          code: normalizePrintedCode(row.listing.productNumber),
          error: {
            code: error?.code ?? "lookup_error",
            message: String(error?.message ?? error).slice(0, 240),
          },
        })),
      },
    };
  }

  let journalPath = null;
  let apply;
  if (flags.applyYuyutei) {
    journalPath = resolveApplyJournalPath({ env, startedAt });
    let journal;
    try {
      journal = journalFactory({ env, startedAt });
      journalPath = journal?.path ?? journalPath;
    } catch (error) {
      if (error && typeof error === "object" && !error.journalPath) error.journalPath = journalPath;
      throw error;
    }
    try {
      apply = await applyYuyuteiCandidates({
        client,
        candidates: shadowYuyutei,
        maxRows: flags.applyYuyuteiMax,
        fetchImpl,
        deadlineMs: wallDeadlineMs,
        journal,
        runId,
      });
    } finally {
      try { journal?.close?.(); } catch (error) {
        if (apply) {
          apply.journalFailures++;
          apply.stoppedEarly = true;
          apply.results.push({
            outcome: "journal_failed",
            reason: "journal_close_failed",
            error: String(error?.message ?? error).slice(0, 240),
          });
        }
      }
    }
  } else {
    apply = {
      eligible: shadowYuyutei.length,
      selected: 0,
      attempted: 0,
      approvalAcknowledged: 0,
      approved: 0,
      approvedUnverified: 0,
      mappingVerified: 0,
      succeeded: 0,
      pricesVerified: 0,
      preflightBlocked: 0,
      failed: 0,
      ambiguous: 0,
      ambiguousResolvedByReadBack: 0,
      postWriteVerified: 0,
      journalIntents: 0,
      journalOutcomes: 0,
      journalFailures: 0,
      stoppedEarly: false,
      results: [],
    };
  }
  const finishedAt = now();
  const imageValues = [...imageFeatures.values()];
  const deadlineExceeded = imageValues.some((item) => item.reason === "job_deadline_exceeded");
  const failed = apply.failed > 0
    || apply.ambiguous > 0
    || apply.journalFailures > 0
    || snkrdunkDiscovery.status === "failed"
    || deadlineExceeded;
  const hasReview = shadowYuyutei.length < yuyuteiPending.length
    || apply.preflightBlocked > 0
    || apply.stoppedEarly
    || (flags.applyYuyutei && apply.selected < apply.eligible)
    || snkrPending.length > 0
    || occupancy.duplicates.size > 0
    || yuyuteiStructuralAudit.violations > 0
    || snkrdunkStructuralAudit.violations > 0
    || (snkrdunkDiscovery.review?.count ?? 0) > 0;

  const yuyuteiShadowPlan = shadowYuyutei.map(({ mapping, classification }) => ({
    mappingId: Number(mapping.id),
    sourceCode: mapping.scrapedCode,
    sourceUrl: mapping.sourceUrl,
    sourceImageUrl: mapping.scrapedImage,
    targetCardId: classification.targetCardId,
    targetCode: classification.target?.cardCode,
    targetImageUrl: classification.target?.imageUrl,
    visualScore: Number(classification.visualScore.toFixed(6)),
    visualMargin: classification.visualMargin == null ? null : Number(classification.visualMargin.toFixed(6)),
  }));

  return {
    schemaVersion: 1,
    runId,
    job: "meecard-auto-match",
    mode: flags.mode,
    status: failed ? "failed" : hasReview ? "warn" : "ok",
    endpoint,
    journalPath,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: Math.max(0, finishedAt.getTime() - startedAt.getTime()),
    safeguards: {
      defaultReadOnly: true,
      yuyuteiMutationAvailable: true,
      yuyuteiApplyMax: flags.applyYuyuteiMax,
      yuyuteiServerAtomicPreconditions: false,
      yuyuteiExternalWriterRaceRemains: true,
      maxVisualScore: AUTO_SAFE_MAX_VISUAL_SCORE,
      minVisualMarginWhenMultiple: AUTO_SAFE_MIN_MARGIN,
      snkrdunkMutationAvailable: false,
      snkrdunkShadowOnly: true,
      catalogScan: "card_set_list_then_card_list_per_set",
      supervisorWallBudgetMs: SUPERVISOR_WALL_BUDGET_MS,
    },
    fetched: {
      yuyutei: { pending: yuyuteiPending.length, matched: yuyuteiMatched.length, candidateResponses: yuyuteiCandidates.size },
      snkrdunk: {
        pending: snkrPending.length,
        matched: snkrMatched.length,
        candidatesEmbeddedInList: true,
        catalogCards: catalog.cards.length,
        catalogSets: catalog.setCount,
        catalogTotalSnapshot: catalog.totalSnapshot,
      },
      images: {
        requested: urls.size,
        loaded: imageValues.filter((item) => item.ok).length,
        placeholders: imageValues.filter((item) => item.placeholder).length,
        errors: imageValues.filter((item) => !item.ok && !item.placeholder).length,
        deadlineExceeded,
      },
    },
    reconciliation: {
      snapshotTiming: "before-apply",
      yuyuteiPending: {
        total: yuyuteiPending.length,
        shadowCandidates: shadowYuyutei.length,
        reasons: countReasons(yuyuteiPendingResults.map((row) => row.classification)),
        shadowPlan: yuyuteiShadowPlan,
        review: yuyuteiReview,
      },
      yuyuteiMatched: {
        total: yuyuteiMatched.length,
        occupiedTargets: occupancy.ids.size,
        duplicateTargets: occupancy.duplicates.size,
        structuralAudit: yuyuteiStructuralAudit,
        fullVisualAuditSkipped: true,
      },
      snkrdunkPending: {
        total: snkrPending.length,
        exactShadowCandidates: shadowSnkrPending.length,
        approvalReady: 0,
        requiresLocaleAudit: shadowSnkrPending.length,
        reasons: countReasons(snkrPendingResults.map((row) => row.classification)),
        plan: snkrPendingPlan,
      },
      snkrdunkMatched: {
        total: snkrMatched.length,
        priceCoverage: snkrMatchedPriceCoverage(snkrMatched),
        structuralAudit: snkrdunkStructuralAudit,
        fullVisualAuditSkipped: true,
      },
    },
    snkrdunkDiscovery,
    apply: {
      enabled: flags.applyYuyutei,
      ...apply,
      yuyutei: {
        succeeded: apply.approved,
        approved: apply.approved,
        approvedUnverified: apply.approvedUnverified,
        mappingVerified: apply.mappingVerified,
        fullySucceeded: apply.succeeded,
      },
    },
  };
}

function usageText() {
  return [
    "ใช้: node tools/companion/meecard-auto-match-supervisor.mjs [--dry-run|--apply-yuyutei]",
    "ค่าเริ่มต้นและ --dry-run อ่านอย่างเดียวเสมอ",
    "--apply-yuyutei ต้องมี MEECARD_AUTO_MATCH_APPLY_YUYUTEI=1 และอนุมัติเฉพาะแถวที่ผ่าน fresh preflight",
    `MEECARD_AUTO_MATCH_YUYUTEI_MAX กำหนดสูงสุดต่อรอบ (ค่าเริ่ม ${DEFAULT_YUYUTEI_APPLY_MAX}, สูงสุด ${HARD_YUYUTEI_APPLY_MAX})`,
  ].join("\n");
}

export function buildOperationalPulseDetail(report) {
  const discovery = report?.snkrdunkDiscovery ?? {};
  const lookup = discovery.priceLookup ?? {};
  return JSON.stringify({
    runId: report.runId,
    mode: report.mode,
    status: report.status,
    yuyutei: {
      pending: {
        total: report.reconciliation.yuyuteiPending.total,
        shadowCandidates: report.reconciliation.yuyuteiPending.shadowCandidates,
        reasons: report.reconciliation.yuyuteiPending.reasons,
      },
      matchedStructural: {
        checked: report.reconciliation.yuyuteiMatched.structuralAudit?.checked ?? 0,
        violations: report.reconciliation.yuyuteiMatched.structuralAudit?.violations ?? 0,
        reasons: report.reconciliation.yuyuteiMatched.structuralAudit?.reasons ?? {},
      },
    },
    snkrdunk: {
      pending: {
        total: report.reconciliation.snkrdunkPending.total,
        exactShadowCandidates: report.reconciliation.snkrdunkPending.exactShadowCandidates ?? 0,
        approvalReady: report.reconciliation.snkrdunkPending.approvalReady ?? 0,
        requiresLocaleAudit: report.reconciliation.snkrdunkPending.requiresLocaleAudit ?? 0,
        reasons: report.reconciliation.snkrdunkPending.reasons,
        plan: (report.reconciliation.snkrdunkPending.plan ?? []).slice(0, 3).map((row) => ({
          mappingId: row.mappingId,
          snkrdunkId: row.snkrdunkId,
          code: row.code,
          targetCardId: row.targetCardId,
          targetCode: row.targetCode,
          visualScore: row.visualScore,
          visualMargin: row.visualMargin,
          minPriceUsd: row.minPriceUsd,
          usedMinPriceUsd: row.usedMinPriceUsd,
          psa10LastSoldUsd: row.psa10LastSoldUsd,
        })),
        planTruncated: (report.reconciliation.snkrdunkPending.plan?.length ?? 0) > 3,
      },
      discovery: {
        status: discovery.status,
        scanned: discovery.scanned ?? 0,
        unmappedAgainstMcp: discovery.unmappedAgainstMcp ?? 0,
        exactShadowCandidates: discovery.exactShadowCandidates ?? 0,
        approvalReady: discovery.approvalReady ?? 0,
        requiresLocaleAudit: discovery.requiresLocaleAudit ?? 0,
        priceLookup: {
          attempted: lookup.attempted ?? 0,
          succeeded: lookup.succeeded ?? 0,
          failed: lookup.failed ?? 0,
        },
        plan: (discovery.plan ?? []).slice(0, 3).map((row) => ({
          snkrdunkId: row.snkrdunkId,
          code: row.code,
          targetCardId: row.targetCardId,
          targetCode: row.targetCode,
          visualScore: row.visualScore,
          visualMargin: row.visualMargin,
          minPriceUsd: row.minPriceUsd,
          usedMinPriceUsd: row.usedMinPriceUsd,
          psa10MinPriceUsd: row.psa10MinPriceUsd,
          psa10LastSoldUsd: row.psa10LastSoldUsd,
          psa9MinPriceUsd: row.psa9MinPriceUsd,
          psa9LastSoldUsd: row.psa9LastSoldUsd,
          psa8MinPriceUsd: row.psa8MinPriceUsd,
          psa8LastSoldUsd: row.psa8LastSoldUsd,
        })),
        planTruncated: (discovery.plan?.length ?? 0) > 3,
      },
      matchedPriceCoverage: report.reconciliation.snkrdunkMatched.priceCoverage,
      matchedStructural: {
        checked: report.reconciliation.snkrdunkMatched.structuralAudit?.checked ?? 0,
        violations: report.reconciliation.snkrdunkMatched.structuralAudit?.violations ?? 0,
        reasons: report.reconciliation.snkrdunkMatched.structuralAudit?.reasons ?? {},
      },
    },
    apply: {
      enabled: report.apply.enabled,
      eligible: report.apply.eligible,
      selected: report.apply.selected,
      attempted: report.apply.attempted,
      approvalAcknowledged: report.apply.approvalAcknowledged,
      approved: report.apply.approved,
      approvedUnverified: report.apply.approvedUnverified,
      mappingVerified: report.apply.mappingVerified,
      succeeded: report.apply.succeeded,
      pricesVerified: report.apply.pricesVerified,
      preflightBlocked: report.apply.preflightBlocked,
      failed: report.apply.failed,
      ambiguous: report.apply.ambiguous,
      journalIntents: report.apply.journalIntents,
      journalOutcomes: report.apply.journalOutcomes,
      journalFailures: report.apply.journalFailures,
      stoppedEarly: report.apply.stoppedEarly,
    },
    journalPath: report.journalPath ?? null,
    reconciliationSnapshotTiming: report.reconciliation.snapshotTiming ?? "unknown",
  });
}

async function recordOperationalResult(report) {
  const detail = buildOperationalPulseDetail(report);
  try {
    const { writePulse } = await import("./pulse.mjs");
    await writePulse("meecard-auto-match", {
      label: "ตรวจการจับคู่ MeeCard",
      status: report.status === "ok" ? "ok" : report.status === "warn" ? "warn" : "fail",
      detail: detail.slice(0, 3_000),
    });
  } catch { /* pulse fail-open */ }
  if (!shouldWriteHeartbeat(report)) return;
  try {
    const dir = path.join(os.homedir(), ".cache", "bestos-heartbeat");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "meecard-auto-match"), new Date().toISOString());
  } catch { /* heartbeat fail-open */ }
}

export function shouldWriteHeartbeat(report) {
  return report?.status !== "failed";
}

async function cli() {
  try {
    const report = await runSupervisor();
    if (report.help) {
      console.log(report.usage);
      return;
    }
    const persisted = writeMeeCardRunReport(report, { runId: report.runId });
    const emitted = { ...persisted.report, reportPath: persisted.path };
    console.log(JSON.stringify({
      ok: true,
      ...summarizeMeeCardRun(emitted),
      reportPath: emitted.reportPath,
      journalPath: emitted.journalPath ?? null,
    }));
    await recordOperationalResult(emitted);
    if (emitted.status === "failed") process.exitCode = 1;
  } catch (error) {
    const failure = {
      schemaVersion: 1,
      runId: randomUUID(),
      job: "meecard-auto-match",
      status: "failed",
      journalPath: error?.journalPath ?? null,
      error: {
        code: error?.code ?? (error instanceof UsageError ? "usage_error" : "unexpected_error"),
        message: String(error?.message ?? error).slice(0, 500),
        ambiguousMutation: error?.ambiguous === true,
      },
    };
    try {
      const persisted = writeMeeCardRunReport(failure, { runId: failure.runId });
      console.log(JSON.stringify({ ...persisted.report, reportPath: persisted.path }));
    } catch {
      console.log(JSON.stringify(failure));
    }
    try {
      const { writePulse } = await import("./pulse.mjs");
      await writePulse("meecard-auto-match", { label: "ตรวจการจับคู่ MeeCard", status: "fail", detail: failure.error.message });
    } catch { /* pulse fail-open */ }
    process.exitCode = error instanceof UsageError ? 2 : 1;
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) await cli();
