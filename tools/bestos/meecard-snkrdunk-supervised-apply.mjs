#!/usr/bin/env node
// Apply a pre-audited SNKRDUNK -> MeeCard manifest one row at a time.
// Default is read-only. Production writes require both --apply and MEECARD_SNKR_APPLY=1.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { loadMeeCardMcpToken } from "./meecard-auto-match-supervisor.mjs";

export const DEFAULT_MCP_URL = "https://meecardtcg.com/mcp";
export const DEFAULT_ADMIN_API_URL = "https://meecardtcg.com/api";
export const REPORT_SCHEMA_VERSION = 1;
export const DEFAULT_MAX = 1;
export const HARD_MAX = 500;

const STATUSES = ["pending", "matched", "rejected", "skipped"];
const READ_TOOLS = new Set(["card_list", "snkrdunk_mapping_list"]);
const MUTATION_TOOLS = new Set(["snkrdunk_mapping_create", "snkrdunk_mapping_approve"]);
const ALLOWED_VISUAL_DECISIONS = new Set([
  "exact",
  "exact_artwork",
  "exact_metadata_and_visual",
  "exact_artwork_and_japanese_locale",
]);
const MAX_MANIFEST_BYTES = 8 * 1024 * 1024;

export class UsageError extends Error {
  constructor(message) {
    super(message);
    this.name = "UsageError";
  }
}

export class ApplyError extends Error {
  constructor(message, {
    code = "apply_error",
    ambiguous = false,
    operation = null,
    requiresReadbackBeforeRetry = false,
    readbackCode = null,
  } = {}) {
    super(message);
    this.name = "ApplyError";
    this.code = code;
    this.ambiguous = ambiguous;
    this.operation = operation;
    this.requiresReadbackBeforeRetry = requiresReadbackBeforeRetry;
    this.readbackCode = readbackCode;
  }
}

function parseAdminApiUrl(value) {
  let parsed;
  try { parsed = new URL(String(value)); } catch {
    throw new UsageError("MEECARD_ADMIN_API_URL ไม่ใช่ URL ที่ถูกต้อง");
  }
  const local = new Set(["localhost", "127.0.0.1", "::1"]).has(parsed.hostname);
  const production = parsed.hostname === "meecardtcg.com";
  if ((!production && !local) || (production && parsed.protocol !== "https:") || (local && !new Set(["http:", "https:"]).has(parsed.protocol))) {
    throw new UsageError("MEECARD_ADMIN_API_URL ต้องเป็น https://meecardtcg.com หรือ localhost สำหรับทดสอบ");
  }
  return parsed.toString().replace(/\/$/, "");
}

function parseValueOption(argv, index, name) {
  const arg = argv[index];
  if (arg === name) {
    if (index + 1 >= argv.length) throw new UsageError(`${name} ต้องมีค่า`);
    return { value: argv[index + 1], consumed: 2 };
  }
  if (arg.startsWith(`${name}=`)) {
    const value = arg.slice(name.length + 1);
    if (!value) throw new UsageError(`${name} ต้องมีค่า`);
    return { value, consumed: 1 };
  }
  return null;
}

function positiveInteger(value, label, max = Number.MAX_SAFE_INTEGER) {
  const parsed = Number(String(value ?? "").trim());
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > max) {
    throw new UsageError(`${label} ต้องเป็นจำนวนเต็ม 1-${max}`);
  }
  return parsed;
}

export function parseCliArgs(argv = process.argv.slice(2), env = process.env) {
  let apply = false;
  let adminApiApprove = false;
  let dryRun = false;
  let help = false;
  let manifestPath = "";
  let outputPath = "";
  let journalPath = "";
  let mcpUrl = env.MEECARD_MCP_URL ?? DEFAULT_MCP_URL;
  let adminApiUrl = env.MEECARD_ADMIN_API_URL ?? DEFAULT_ADMIN_API_URL;
  let max = DEFAULT_MAX;

  for (let index = 0; index < argv.length;) {
    const arg = argv[index];
    if (arg === "--apply") { apply = true; index++; continue; }
    if (arg === "--admin-api-approve") { adminApiApprove = true; index++; continue; }
    if (arg === "--dry-run") { dryRun = true; index++; continue; }
    if (arg === "--help" || arg === "-h") { help = true; index++; continue; }
    const options = [
      ["--manifest", (value) => { manifestPath = value; }],
      ["--output", (value) => { outputPath = value; }],
      ["--journal", (value) => { journalPath = value; }],
      ["--mcp-url", (value) => { mcpUrl = value; }],
      ["--max", (value) => { max = value; }],
    ];
    let matched = false;
    for (const [name, assign] of options) {
      const parsed = parseValueOption(argv, index, name);
      if (!parsed) continue;
      assign(parsed.value);
      index += parsed.consumed;
      matched = true;
      break;
    }
    if (!matched) throw new UsageError(`ไม่รู้จัก option: ${arg}`);
  }

  if (help) return { help: true };
  if (apply && dryRun) throw new UsageError("--apply ใช้พร้อม --dry-run ไม่ได้");
  if (apply && env.MEECARD_SNKR_APPLY !== "1") {
    throw new UsageError("--apply ต้องเปิด MEECARD_SNKR_APPLY=1 อย่างชัดเจน");
  }
  if (adminApiApprove && !apply) throw new UsageError("--admin-api-approve ใช้ได้เฉพาะพร้อม --apply");
  if (adminApiApprove && env.MEECARD_SNKR_ADMIN_API_APPROVE !== "1") {
    throw new UsageError("--admin-api-approve ต้องเปิด MEECARD_SNKR_ADMIN_API_APPROVE=1 อย่างชัดเจน");
  }
  if (adminApiApprove && (!String(env.MEECARD_ADMIN_EMAIL ?? "").trim() || !String(env.MEECARD_ADMIN_PASSWORD ?? ""))) {
    throw new UsageError("Admin API approval ต้องมี MEECARD_ADMIN_EMAIL และ MEECARD_ADMIN_PASSWORD");
  }
  if (!manifestPath) throw new UsageError("ต้องระบุ --manifest <file.json>");
  max = positiveInteger(max, "--max", HARD_MAX);
  try {
    const parsed = new URL(String(mcpUrl));
    if (!/^https?:$/.test(parsed.protocol)) throw new Error("protocol");
    mcpUrl = parsed.toString();
  } catch {
    throw new UsageError("--mcp-url ต้องเป็น http(s)");
  }
  adminApiUrl = parseAdminApiUrl(adminApiUrl);
  return {
    help: false,
    apply,
    adminApiApprove,
    mode: apply ? "apply" : "dry-run",
    max,
    manifestPath: path.resolve(manifestPath),
    outputPath: outputPath ? path.resolve(outputPath) : "",
    journalPath: journalPath ? path.resolve(journalPath) : "",
    mcpUrl,
    adminApiUrl,
  };
}

function exactPositiveInteger(value, field) {
  if (!Number.isSafeInteger(value) || value <= 0) throw new UsageError(`${field} ต้องเป็นจำนวนเต็มบวก`);
  return value;
}

function normalizedCode(value) {
  const match = String(value ?? "").toUpperCase().match(/[A-Z]+\d*[-‐‑‒–—]\d{3,4}/);
  return match ? match[0].replace(/[-‐‑‒–—]/, "-") : "";
}

function requiredImageUrl(value, field, source) {
  let parsed;
  try { parsed = new URL(String(value)); } catch { throw new UsageError(`${field} ต้องเป็น URL`); }
  if (parsed.protocol !== "https:") throw new UsageError(`${field} ต้องเป็น https`);
  const host = parsed.hostname.toLowerCase();
  if (source && host !== "cdn.snkrdunk.com" && !host.endsWith(".snkrdunk.com")) {
    throw new UsageError(`${field} ต้องมาจาก SNKRDUNK`);
  }
  if (!source && !new Set([
    "asia-en.onepiece-cardgame.com",
    "onepiece-cardgame.com",
    "www.onepiece-cardgame.com",
  ]).has(host)) {
    throw new UsageError(`${field} ต้องมาจากเว็บทางการ One Piece Card Game`);
  }
  return parsed.toString();
}

export function validateManifest(value) {
  const rawRows = Array.isArray(value) ? value : value?.rows;
  if (!Array.isArray(rawRows) || !rawRows.length) throw new UsageError("manifest ต้องมี rows อย่างน้อย 1 แถว");
  const sourceIds = new Set();
  const targetIds = new Set();
  return rawRows.map((raw, index) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new UsageError(`rows[${index}] ต้องเป็น object`);
    const snkrdunkId = exactPositiveInteger(raw.snkrdunkId, `rows[${index}].snkrdunkId`);
    const matchedCardId = exactPositiveInteger(raw.matchedCardId, `rows[${index}].matchedCardId`);
    if (sourceIds.has(snkrdunkId)) throw new UsageError(`SNKRDUNK ID ซ้ำใน manifest: ${snkrdunkId}`);
    if (targetIds.has(matchedCardId)) throw new UsageError(`MeeCard target ซ้ำใน manifest: ${matchedCardId}`);
    sourceIds.add(snkrdunkId);
    targetIds.add(matchedCardId);
    const code = normalizedCode(raw.code);
    if (!code || code !== String(raw.code).trim().toUpperCase()) {
      throw new UsageError(`rows[${index}].code ไม่ใช่รหัสการ์ดมาตรฐาน`);
    }
    if (!raw.visual || typeof raw.visual !== "object" || Array.isArray(raw.visual)) {
      throw new UsageError(`rows[${index}].visual ต้องมี decision และ pass`);
    }
    const decision = String(raw.visual.decision ?? "").trim();
    if (raw.visual.pass !== true || !ALLOWED_VISUAL_DECISIONS.has(decision)) {
      throw new UsageError(`rows[${index}].visual ยังไม่ใช่ผลตรวจภาพที่อนุมัติได้`);
    }
    const sourceImageUrl = requiredImageUrl(raw.sourceImageUrl, `rows[${index}].sourceImageUrl`, true);
    const targetImageUrl = requiredImageUrl(raw.targetImageUrl, `rows[${index}].targetImageUrl`, false);
    if (sourceImageUrl === targetImageUrl) throw new UsageError(`rows[${index}] ใช้รูปต้นทางและรูปเป้าหมาย URL เดียวกัน`);
    return {
      snkrdunkId,
      matchedCardId,
      code,
      sourceImageUrl,
      targetImageUrl,
      visual: { decision, pass: true },
    };
  });
}

export function readManifest(manifestPath) {
  const stat = fs.lstatSync(manifestPath);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new UsageError("manifest ต้องเป็น regular file และห้ามเป็น symlink");
  if (stat.size > MAX_MANIFEST_BYTES) throw new UsageError("manifest ใหญ่เกินขอบเขต 8 MB");
  let parsed;
  try { parsed = JSON.parse(fs.readFileSync(manifestPath, "utf8")); } catch { throw new UsageError("manifest JSON อ่านไม่ได้"); }
  return validateManifest(parsed);
}

export function defaultJournalPath(runId, homeDir = os.homedir()) {
  return path.join(homeDir, ".cache", "bestos-meecard-auto-match", "snkrdunk-apply", `${runId}.jsonl`);
}

export function createJournal(journalPath) {
  const directory = path.dirname(journalPath);
  let directoryStat = null;
  try { directoryStat = fs.lstatSync(directory); } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  if (directoryStat && (directoryStat.isSymbolicLink() || !directoryStat.isDirectory())) {
    throw new ApplyError("journal directory ต้องเป็น directory จริง", { code: "journal_directory_error" });
  }
  if (!directoryStat) {
    fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
    fs.chmodSync(directory, 0o700);
  }
  const descriptor = fs.openSync(
    journalPath,
    fs.constants.O_APPEND | fs.constants.O_CREAT | fs.constants.O_WRONLY | (fs.constants.O_NOFOLLOW ?? 0),
    0o600,
  );
  fs.fchmodSync(descriptor, 0o600);
  let closed = false;
  return {
    path: journalPath,
    append(event) {
      if (closed) throw new ApplyError("journal ถูกปิดแล้ว", { code: "journal_closed" });
      const payload = Buffer.from(`${JSON.stringify({ recordedAt: new Date().toISOString(), ...event })}\n`);
      let offset = 0;
      while (offset < payload.length) {
        const written = fs.writeSync(descriptor, payload, offset, payload.length - offset);
        if (!Number.isSafeInteger(written) || written <= 0) throw new ApplyError("เขียน journal ไม่สำเร็จ", { code: "journal_write_error" });
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

function parseMcpMessages(rawBody) {
  const raw = String(rawBody ?? "");
  if (!raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch { /* parse SSE below */ }
  const messages = [];
  let data = [];
  const flush = () => {
    if (!data.length) return;
    const joined = data.join("\n").trim();
    data = [];
    if (!joined || joined === "[DONE]") return;
    try { messages.push(JSON.parse(joined)); } catch {
      throw new ApplyError("MCP SSE อ่านไม่ได้", { code: "invalid_response" });
    }
  };
  for (const line of raw.replace(/\r\n/g, "\n").split("\n")) {
    if (!line) { flush(); continue; }
    if (line.startsWith("data:")) data.push(line.slice(5).replace(/^ /, ""));
  }
  flush();
  return messages;
}

export function parseToolResult(message) {
  if (!message || typeof message !== "object") throw new ApplyError("MCP response ว่าง", { code: "invalid_response" });
  if (message.error) throw new ApplyError(`MCP error: ${String(message.error.message ?? message.error.code)}`, { code: "rpc_error" });
  const result = message.result;
  if (!result || result.isError === true) {
    const detail = result?.content?.find((row) => row?.type === "text")?.text ?? "unknown";
    throw new ApplyError(`MCP tool error: ${String(detail).slice(0, 300)}`, { code: "tool_error" });
  }
  let payload = result.structuredContent;
  if (payload == null) {
    for (const block of result.content ?? []) {
      if (block?.type !== "text") continue;
      try { payload = JSON.parse(block.text); break; } catch { /* continue */ }
    }
  }
  if (payload == null) throw new ApplyError("MCP ไม่มี JSON payload", { code: "invalid_response" });
  if (
    payload.status != null
    && (Number(payload.status) < 200 || Number(payload.status) >= 300)
  ) {
    throw new ApplyError(`MCP application error ${payload.status}: ${String(payload.message ?? "unknown")}`, { code: "application_error" });
  }
  return Object.hasOwn(payload, "data") ? payload.data : payload;
}

function extractCookieHeader(headers) {
  const values = typeof headers.getSetCookie === "function"
    ? headers.getSetCookie()
    : String(headers.get("set-cookie") ?? "").split(/,(?=\s*[^;,=\s]+=)/);
  const cookies = values
    .map((value) => String(value).split(";", 1)[0].trim())
    .filter((value) => value.startsWith("meecard_admin_"));
  if (!cookies.length) {
    throw new ApplyError("Admin signin ไม่ได้คืน session cookie ที่คาดไว้", { code: "admin_cookie_missing" });
  }
  return cookies.join("; ");
}

async function jsonOrNull(response) {
  const raw = await response.text();
  if (!raw.trim()) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export class AdminApiApprover {
  #email;
  #password;
  #cookieHeader = "";
  #initialized = false;

  constructor(baseUrl, { email, password, fetchImpl = globalThis.fetch, timeoutMs = 45_000 } = {}) {
    const parsed = new URL(parseAdminApiUrl(baseUrl));
    if (!String(email ?? "").trim() || !String(password ?? "")) {
      throw new UsageError("Admin API approver ต้องมี email/password");
    }
    this.baseUrl = parsed.toString().replace(/\/$/, "");
    this.fetchImpl = fetchImpl;
    this.timeoutMs = timeoutMs;
    this.#email = String(email).trim();
    this.#password = String(password);
  }

  async initialize() {
    if (this.#initialized) return;
    let signin;
    try {
      signin = await this.fetchImpl(`${this.baseUrl}/admin/auth/signin`, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ email: this.#email, password: this.#password }),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      throw new ApplyError(`Admin signin ติดต่อไม่ได้: ${error?.message ?? error}`, { code: "admin_signin_network" });
    } finally {
      this.#email = "";
      this.#password = "";
    }
    if (!signin.ok) {
      await signin.text();
      throw new ApplyError(`Admin signin HTTP ${signin.status}`, { code: "admin_signin_failed" });
    }
    this.#cookieHeader = extractCookieHeader(signin.headers);
    await signin.text();

    let verify;
    try {
      verify = await this.fetchImpl(`${this.baseUrl}/admin/auth/verify`, {
        method: "GET",
        headers: { accept: "application/json", cookie: this.#cookieHeader },
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      this.#cookieHeader = "";
      throw new ApplyError(`Admin verify ติดต่อไม่ได้: ${error?.message ?? error}`, { code: "admin_verify_network" });
    }
    const verified = await jsonOrNull(verify);
    const explicitValid = verified?.authenticated === true
      || verified?.valid === true
      || verified?.success === true
      || Boolean(verified?.user || verified?.admin);
    if (!verify.ok || !explicitValid) {
      this.#cookieHeader = "";
      throw new ApplyError(`Admin verify ไม่ผ่าน (HTTP ${verify.status})`, { code: "admin_verify_failed" });
    }
    this.#initialized = true;
  }

  async approveMapping(mappingId, matchedCardId) {
    if (!this.#initialized || !this.#cookieHeader) {
      throw new ApplyError("Admin API ยังไม่ได้ signin/verify", { code: "admin_not_initialized" });
    }
    if (
      !Number.isSafeInteger(mappingId) || mappingId <= 0
      || !Number.isSafeInteger(matchedCardId) || matchedCardId <= 0
    ) {
      throw new ApplyError("Admin approve mappingId/matchedCardId ไม่ถูกต้อง", { code: "invalid_approve_args" });
    }
    let response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}/admin/snkrdunk-mappings/${mappingId}/approve`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
          cookie: this.#cookieHeader,
        },
        body: JSON.stringify({ matchedCardId }),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      throw new ApplyError(`Admin approve ติดต่อไม่ได้: ${error?.message ?? error}`, {
        code: "admin_approve_network",
        ambiguous: true,
      });
    }
    const payload = await jsonOrNull(response);
    if (!response.ok) {
      throw new ApplyError(`Admin approve HTTP ${response.status}`, {
        code: "admin_approve_http",
        ambiguous: response.status >= 500,
      });
    }
    return payload ?? { mappingId, matchedCardId, status: "MATCHED" };
  }
}

export class SnkrMcpClient {
  constructor(endpoint, {
    fetchImpl = globalThis.fetch,
    timeoutMs = 45_000,
    allowMutation = false,
    adminApprover = null,
    token = loadMeeCardMcpToken(), // MCP MeeCard ต้องมี bearer ตั้งแต่ 2026-09-04 (ที่มา token ดูใน supervisor)
  } = {}) {
    const parsed = new URL(endpoint);
    if (!/^https?:$/.test(parsed.protocol)) throw new UsageError("MCP URL ต้องเป็น http(s)");
    this.endpoint = parsed.toString();
    this.fetchImpl = fetchImpl;
    this.timeoutMs = timeoutMs;
    this.allowMutation = allowMutation === true;
    this.adminApprover = adminApprover;
    this.token = String(token ?? "");
    this.sessionId = "";
    this.nextId = 1;
  }

  headers() {
    return {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      "user-agent": "bestos-meecard-snkrdunk-supervised-apply/1.0",
      ...(this.token ? { authorization: `Bearer ${this.token}` } : {}),
      ...(this.sessionId ? { "mcp-session-id": this.sessionId } : {}),
    };
  }

  async rpc(body, { retryable = false, mutation = false, allowEmpty = false } = {}) {
    const tool = body?.params?.name;
    if (body?.method === "tools/call") {
      if (mutation && (!this.allowMutation || !MUTATION_TOOLS.has(tool))) {
        throw new ApplyError(`ปฏิเสธ mutation tool: ${String(tool)}`, { code: "tool_not_allowed" });
      }
      if (!mutation && !READ_TOOLS.has(tool)) {
        throw new ApplyError(`ปฏิเสธ read tool: ${String(tool)}`, { code: "tool_not_allowed" });
      }
    }
    if (mutation && retryable) throw new ApplyError("mutation ห้าม retry", { code: "mutation_retry_not_allowed" });
    const attempts = retryable ? 3 : 1;
    let lastError;
    for (let attempt = 0; attempt < attempts; attempt++) {
      try {
        const response = await this.fetchImpl(this.endpoint, {
          method: "POST",
          headers: this.headers(),
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(this.timeoutMs),
        });
        const raw = await response.text();
        if (!response.ok) {
          throw new ApplyError(`MCP HTTP ${response.status}: ${raw.slice(0, 200)}`, {
            code: "http_error",
            ambiguous: mutation && response.status >= 500,
          });
        }
        const messages = parseMcpMessages(raw);
        if (!messages.length) {
          if (allowEmpty) return { response, message: null };
          throw new ApplyError("MCP response ว่าง", { code: "invalid_response", ambiguous: mutation });
        }
        const message = [...messages].reverse().find((row) => body.id == null || row?.id === body.id) ?? messages.at(-1);
        return { response, message };
      } catch (error) {
        lastError = error;
        if (attempt + 1 < attempts) await new Promise((resolve) => setTimeout(resolve, 150 * (2 ** attempt)));
      }
    }
    if (lastError instanceof ApplyError) throw lastError;
    throw new ApplyError(`MCP request ล้มเหลว: ${lastError?.message ?? lastError}`, {
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
        clientInfo: { name: "bestos-meecard-snkrdunk-supervised-apply", version: "1.0" },
      },
    }, { retryable: true });
    if (!message?.result) throw new ApplyError("MCP initialize ไม่มี result", { code: "initialize_error" });
    this.sessionId = response.headers.get("mcp-session-id") ?? "";
    if (!this.sessionId) throw new ApplyError("MCP initialize ไม่มี session id", { code: "initialize_error" });
    await this.rpc({ jsonrpc: "2.0", method: "notifications/initialized" }, { allowEmpty: true });
    if (this.adminApprover) await this.adminApprover.initialize();
  }

  async callTool(name, args, { mutation = false } = {}) {
    const id = this.nextId++;
    try {
      const { message } = await this.rpc({
        jsonrpc: "2.0",
        id,
        method: "tools/call",
        params: { name, arguments: args },
      }, { retryable: !mutation, mutation });
      return parseToolResult(message);
    } catch (error) {
      if (mutation && error instanceof ApplyError && !error.ambiguous && new Set([
        "invalid_response", "rpc_error", "tool_error", "application_error",
      ]).has(error.code)) {
        throw new ApplyError(error.message, { code: error.code, ambiguous: true });
      }
      throw error;
    }
  }

  async fetchAll(name, baseArgs) {
    const first = await this.callTool(name, { ...baseArgs, page: 1, limit: 100 });
    const rows = Array.isArray(first?.data) ? [...first.data] : null;
    const totalPage = Number(first?.totalPage);
    const totalItems = Number(first?.totalItems);
    if (!rows || !Number.isSafeInteger(totalPage) || totalPage < 0 || !Number.isSafeInteger(totalItems) || totalItems < 0) {
      throw new ApplyError(`${name} pagination ไม่ถูกต้อง`, { code: "pagination_error" });
    }
    for (let page = 2; page <= totalPage; page++) {
      const next = await this.callTool(name, { ...baseArgs, page, limit: 100 });
      if (!Array.isArray(next?.data) || Number(next.totalPage) !== totalPage || Number(next.totalItems) !== totalItems) {
        throw new ApplyError(`${name} page ${page} pagination เปลี่ยนระหว่างอ่าน`, { code: "pagination_error" });
      }
      rows.push(...next.data);
    }
    if (rows.length !== totalItems) throw new ApplyError(`${name} จำนวนข้อมูลไม่ตรง`, { code: "pagination_error" });
    return rows;
  }

  async listAllMappings() {
    const pages = await Promise.all(STATUSES.map((status) => this.fetchAll(
      "snkrdunk_mapping_list",
      { status, sort: "productNumber", order: "asc" },
    )));
    return pages.flat();
  }

  async listCatalog(rows = []) {
    const setCodes = [...new Set(rows.map((row) => String(row?.code ?? "").split("-", 1)[0]).filter(Boolean))];
    if (!setCodes.length) return this.fetchAll("card_list", { sort: "id", order: "asc" });
    const chunks = await Promise.all(setCodes.map((set) => this.fetchAll(
      "card_list",
      { set, sort: "id", order: "asc" },
    )));
    return chunks.flat();
  }

  async createMapping(snkrdunkId) {
    return this.callTool("snkrdunk_mapping_create", { snkrdunkId }, { mutation: true });
  }

  async approveMapping(mappingId, matchedCardId) {
    if (!this.allowMutation) throw new ApplyError("ปฏิเสธ approve เพราะ apply gate ไม่ได้เปิด", { code: "tool_not_allowed" });
    if (this.adminApprover) return this.adminApprover.approveMapping(mappingId, matchedCardId);
    return this.callTool("snkrdunk_mapping_approve", { mappingId, matchedCardId }, { mutation: true });
  }
}

function mappingId(row) { return Number(row?.id ?? row?.mappingId); }
function sourceId(row) { return Number(row?.snkrdunkId ?? row?.mapping?.snkrdunkId); }
function targetId(row) {
  const value = row?.matchedCard?.id ?? row?.matchedCardId ?? row?.mapping?.matchedCard?.id ?? row?.mapping?.matchedCardId;
  return value == null ? null : Number(value);
}
function mappingStatus(row) { return String(row?.status ?? row?.mapping?.status ?? "").toUpperCase(); }
function mappingCode(row) { return normalizedCode(row?.productNumber ?? row?.scrapedCode ?? row?.mapping?.productNumber); }

export function snapshotMappings(rows) {
  const snapshot = new Map();
  for (const row of rows) {
    const id = mappingId(row);
    const source = sourceId(row);
    if (!Number.isSafeInteger(id) || id <= 0 || !Number.isSafeInteger(source) || source <= 0 || snapshot.has(id)) {
      throw new ApplyError("mapping snapshot มี id/source ที่ไม่ถูกต้องหรือซ้ำ", { code: "snapshot_integrity_error" });
    }
    snapshot.set(id, {
      id,
      sourceId: source,
      targetId: targetId(row),
      status: mappingStatus(row),
      code: mappingCode(row),
      raw: row,
    });
  }
  return snapshot;
}

function sourceRows(snapshot, snkrdunkId) {
  return [...snapshot.values()].filter((row) => row.sourceId === snkrdunkId);
}

function catalogIndex(rows) {
  const index = new Map();
  for (const card of rows) {
    const id = Number(card?.id);
    if (!Number.isSafeInteger(id) || id <= 0 || index.has(id)) {
      throw new ApplyError("card catalog มี id ไม่ถูกต้องหรือซ้ำ", { code: "catalog_integrity_error" });
    }
    index.set(id, normalizedCode(card?.cardCode ?? card?.baseCode ?? card?.code));
  }
  return index;
}

export function preflightRow(row, snapshot, cards) {
  const catalogCode = cards.get(row.matchedCardId);
  if (!catalogCode) throw new ApplyError(`ไม่พบ MeeCard ${row.matchedCardId} ใน catalog`, { code: "target_not_found" });
  if (catalogCode !== row.code) {
    throw new ApplyError(`รหัส MeeCard ${row.matchedCardId} เป็น ${catalogCode} ไม่ใช่ ${row.code}`, { code: "code_mismatch" });
  }
  const existing = sourceRows(snapshot, row.snkrdunkId);
  if (existing.length > 1) throw new ApplyError(`SNKR ${row.snkrdunkId} มี mapping ซ้ำ`, { code: "duplicate_source" });
  const current = existing[0] ?? null;
  const occupied = [...snapshot.values()].filter((mapping) => (
    mapping.status === "MATCHED"
    && mapping.targetId === row.matchedCardId
    && mapping.sourceId !== row.snkrdunkId
  ));
  if (occupied.length) throw new ApplyError(`MeeCard ${row.matchedCardId} ถูก mapping ${occupied[0].id} ครองแล้ว`, { code: "target_occupied" });
  if (!current) return { action: "create", mapping: null };
  if (current.code && current.code !== row.code) throw new ApplyError(`mapping ${current.id} ใช้รหัส ${current.code} ไม่ใช่ ${row.code}`, { code: "source_code_mismatch" });
  if (current.targetId != null && current.targetId !== row.matchedCardId) {
    throw new ApplyError(`mapping ${current.id} ชี้ MeeCard ${current.targetId} ผิดจาก manifest`, { code: "wrong_target" });
  }
  if (current.status === "MATCHED") return { action: "already-matched", mapping: current };
  if (current.status === "PENDING") return { action: "approve", mapping: current };
  throw new ApplyError(`mapping ${current.id} อยู่สถานะ ${current.status || "UNKNOWN"} จึงไม่แตะ`, { code: "blocked_status" });
}

function responseMapping(response) {
  if (!response || typeof response !== "object") return null;
  return response.mapping && typeof response.mapping === "object" ? response.mapping : response;
}

export function assertResponseIdentity(response, expected, operation) {
  const mapping = responseMapping(response);
  if (!mapping) return;
  const source = sourceId(mapping);
  const target = targetId(mapping);
  const status = mappingStatus(mapping);
  if (Number.isSafeInteger(source) && source !== expected.snkrdunkId) {
    throw new ApplyError(`${operation} response คืน SNKR ${source} ผิดแถว`, { code: "wrong_response_source" });
  }
  if (target != null && target !== expected.matchedCardId) {
    throw new ApplyError(`${operation} response ชี้ MeeCard ${target} ผิดจาก ${expected.matchedCardId}`, { code: "wrong_response_target" });
  }
  if (status === "MATCHED" && target == null) {
    throw new ApplyError(`${operation} response เป็น MATCHED แต่ไม่มี target`, { code: "invalid_response_target" });
  }
}

export function assertUnrelatedStable(before, after, activeMappingId) {
  const allIds = new Set([...before.keys(), ...after.keys()]);
  for (const id of allIds) {
    if (id === activeMappingId) continue;
    const left = before.get(id);
    const right = after.get(id);
    if (!left || !right || left.status !== right.status || left.targetId !== right.targetId || left.sourceId !== right.sourceId) {
      throw new ApplyError(`mapping อื่น ${id} เปลี่ยนระหว่าง mutation`, { code: "unrelated_mapping_changed" });
    }
  }
}

function validateReadback(row, before, after) {
  const currentRows = sourceRows(after, row.snkrdunkId);
  if (currentRows.length !== 1) {
    throw new ApplyError(`readback SNKR ${row.snkrdunkId} พบ ${currentRows.length} mapping`, { code: "readback_source_count" });
  }
  const current = currentRows[0];
  assertUnrelatedStable(before, after, current.id);
  if (current.code && current.code !== row.code) throw new ApplyError(`readback mapping ${current.id} รหัสไม่ตรง`, { code: "readback_code_mismatch" });
  if (current.targetId != null && current.targetId !== row.matchedCardId) {
    throw new ApplyError(`readback mapping ${current.id} ชี้ target ผิด`, { code: "wrong_target" });
  }
  if (!new Set(["PENDING", "MATCHED"]).has(current.status)) {
    throw new ApplyError(`readback mapping ${current.id} อยู่สถานะ ${current.status}`, { code: "unexpected_status" });
  }
  return current;
}

async function readback(client, row, before) {
  const after = snapshotMappings(await client.listAllMappings());
  return { after, current: validateReadback(row, before, after) };
}

function unresolvedMutation(operation, row, readbackError) {
  return new ApplyError(
    `${operation} SNKR ${row.snkrdunkId} อาจสำเร็จแล้ว แต่ readback ล้ม: ${readbackError?.message ?? readbackError}`,
    {
      code: "ambiguous_unresolved",
      ambiguous: true,
      operation,
      requiresReadbackBeforeRetry: true,
      readbackCode: readbackError?.code ?? "unexpected_error",
    },
  );
}

const CONCLUSIVE_READBACK_CODES = new Set([
  "readback_source_count",
  "readback_code_mismatch",
  "wrong_target",
  "unexpected_status",
  "unrelated_mapping_changed",
]);

function rethrowReadback(operation, row, error) {
  if (error instanceof ApplyError && CONCLUSIVE_READBACK_CODES.has(error.code)) throw error;
  throw unresolvedMutation(operation, row, error);
}

async function mutateAndReadback({ client, journal, runId, row, operation, before, invoke }) {
  journal.append({ runId, event: "mutation_intent", operation, snkrdunkId: row.snkrdunkId, matchedCardId: row.matchedCardId });
  let response;
  try {
    response = await invoke();
    journal.append({ runId, event: "mutation_response", operation, snkrdunkId: row.snkrdunkId, response });
    assertResponseIdentity(response, row, operation);
  } catch (error) {
    if (!(error instanceof ApplyError) || !error.ambiguous) throw error;
    journal.append({ runId, event: "mutation_ambiguous", operation, snkrdunkId: row.snkrdunkId, code: error.code, message: error.message });
    let resolved;
    try {
      resolved = await readback(client, row, before);
    } catch (readbackError) {
      rethrowReadback(operation, row, readbackError);
    }
    journal.append({ runId, event: "ambiguous_readback", operation, snkrdunkId: row.snkrdunkId, mappingId: resolved.current.id, status: resolved.current.status, targetId: resolved.current.targetId });
    if (operation === "approve" && !(resolved.current.status === "MATCHED" && resolved.current.targetId === row.matchedCardId)) {
      throw new ApplyError(`approve ${row.snkrdunkId} คลุมเครือและ readback ยังไม่ตรง`, {
        code: "ambiguous_unresolved",
        ambiguous: true,
        operation,
        requiresReadbackBeforeRetry: true,
      });
    }
    return { ...resolved, ambiguousResolved: true };
  }
  let resolved;
  try {
    resolved = await readback(client, row, before);
  } catch (readbackError) {
    rethrowReadback(operation, row, readbackError);
  }
  journal.append({ runId, event: "mutation_readback", operation, snkrdunkId: row.snkrdunkId, mappingId: resolved.current.id, status: resolved.current.status, targetId: resolved.current.targetId });
  return { ...resolved, ambiguousResolved: false };
}

export async function runSupervisedApply({
  client,
  rows,
  apply = false,
  max = DEFAULT_MAX,
  journal = null,
  onProgress = () => {},
  now = () => new Date(),
  runId = randomUUID(),
} = {}) {
  if (!client) throw new UsageError("runSupervisedApply ต้องมี client");
  const manifest = validateManifest(rows);
  max = positiveInteger(max, "max", HARD_MAX);
  if (apply && !journal) throw new UsageError("apply mode ต้องมี fsync journal");
  const selected = manifest.slice(0, max);
  const startedAt = now().toISOString();
  const results = [];
  let stopped = false;
  let stopReason = null;

  await client.initialize();
  for (const row of selected) {
    try {
      const cards = catalogIndex(await client.listCatalog([row]));
      let snapshot = snapshotMappings(await client.listAllMappings());
      const preflight = preflightRow(row, snapshot, cards);
      if (!apply) {
        const result = { snkrdunkId: row.snkrdunkId, matchedCardId: row.matchedCardId, code: row.code, outcome: "dry-run", plannedAction: preflight.action };
        results.push(result);
        onProgress(result);
        continue;
      }
      if (preflight.action === "already-matched") {
        const result = { snkrdunkId: row.snkrdunkId, matchedCardId: row.matchedCardId, code: row.code, outcome: "already-matched", mappingId: preflight.mapping.id };
        results.push(result);
        onProgress(result);
        continue;
      }
      let current = preflight.mapping;
      let ambiguousResolved = false;
      if (preflight.action === "create") {
        const created = await mutateAndReadback({
          client,
          journal,
          runId,
          row,
          operation: "create",
          before: snapshot,
          invoke: () => client.createMapping(row.snkrdunkId),
        });
        snapshot = created.after;
        current = created.current;
        ambiguousResolved ||= created.ambiguousResolved;
      }
      if (current.status === "PENDING") {
        const approved = await mutateAndReadback({
          client,
          journal,
          runId,
          row,
          operation: "approve",
          before: snapshot,
          invoke: () => client.approveMapping(current.id, row.matchedCardId),
        });
        current = approved.current;
        ambiguousResolved ||= approved.ambiguousResolved;
      }
      if (current.status !== "MATCHED" || current.targetId !== row.matchedCardId) {
        throw new ApplyError(`SNKR ${row.snkrdunkId} ยังไม่ MATCHED กับ MeeCard ที่กำหนด`, { code: "final_state_mismatch" });
      }
      const result = {
        snkrdunkId: row.snkrdunkId,
        matchedCardId: row.matchedCardId,
        code: row.code,
        outcome: "matched",
        mappingId: current.id,
        ambiguousResolved,
      };
      journal.append({ runId, event: "row_complete", ...result });
      results.push(result);
      onProgress(result);
    } catch (error) {
      stopped = true;
      stopReason = {
        code: error?.code ?? "unexpected_error",
        message: error?.message ?? String(error),
        ...(error?.operation ? { operation: error.operation } : {}),
        ...(error?.readbackCode ? { readbackCode: error.readbackCode } : {}),
        ...(error?.requiresReadbackBeforeRetry ? { requiresReadbackBeforeRetry: true } : {}),
      };
      const failed = { snkrdunkId: row.snkrdunkId, matchedCardId: row.matchedCardId, code: row.code, outcome: "stopped", error: stopReason };
      results.push(failed);
      if (journal) journal.append({ runId, event: "run_stopped", ...failed });
      onProgress(failed);
      break;
    }
  }
  const summary = {
    selected: selected.length,
    processed: results.length,
    matched: results.filter((row) => row.outcome === "matched").length,
    alreadyMatched: results.filter((row) => row.outcome === "already-matched").length,
    dryRun: results.filter((row) => row.outcome === "dry-run").length,
    stopped: results.filter((row) => row.outcome === "stopped").length,
  };
  return {
    schemaVersion: REPORT_SCHEMA_VERSION,
    runId,
    mode: apply ? "apply" : "dry-run",
    startedAt,
    finishedAt: now().toISOString(),
    manifestRows: manifest.length,
    max,
    stopped,
    stopReason,
    summary,
    results,
    journalPath: journal?.path ?? null,
  };
}

function writeJsonReport(outputPath, report) {
  if (!outputPath) return;
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const descriptor = fs.openSync(
    outputPath,
    fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_TRUNC | (fs.constants.O_NOFOLLOW ?? 0),
    0o600,
  );
  try {
    fs.writeFileSync(descriptor, `${JSON.stringify(report, null, 2)}\n`);
    fs.fsyncSync(descriptor);
  } finally {
    fs.closeSync(descriptor);
  }
}

function usage() {
  return [
    "Usage: node tools/companion/meecard-snkrdunk-supervised-apply.mjs --manifest FILE [options]",
    "",
    "Default: dry-run/read-only. Apply requires both --apply and MEECARD_SNKR_APPLY=1.",
    "Options: --apply --admin-api-approve --dry-run --max N --output FILE --journal FILE --mcp-url URL",
  ].join("\n");
}

async function main() {
  const options = parseCliArgs();
  if (options.help) { process.stdout.write(`${usage()}\n`); return; }
  const rows = readManifest(options.manifestPath);
  const runId = randomUUID();
  const journal = options.apply
    ? createJournal(options.journalPath || defaultJournalPath(runId))
    : null;
  try {
    const adminApprover = options.adminApiApprove
      ? new AdminApiApprover(options.adminApiUrl, {
        email: process.env.MEECARD_ADMIN_EMAIL,
        password: process.env.MEECARD_ADMIN_PASSWORD,
      })
      : null;
    const client = new SnkrMcpClient(options.mcpUrl, {
      allowMutation: options.apply,
      adminApprover,
    });
    const report = await runSupervisedApply({
      client,
      rows,
      apply: options.apply,
      max: options.max,
      journal,
      runId,
      onProgress: (result) => process.stdout.write(`${JSON.stringify({ type: "row", runId, ...result })}\n`),
    });
    writeJsonReport(options.outputPath, report);
    process.stdout.write(`${JSON.stringify({ type: "report", report })}\n`);
    if (report.stopped) process.exitCode = 2;
  } finally {
    journal?.close();
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((error) => {
    process.stderr.write(`${error?.stack ?? error}\n`);
    process.exitCode = 1;
  });
}
