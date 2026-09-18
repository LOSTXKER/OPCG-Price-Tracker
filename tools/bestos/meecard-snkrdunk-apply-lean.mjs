#!/usr/bin/env node
// Lean supervised apply for a SNKRDUNK manifest — ตัวเขียนที่ใช้จริงในรอบ 4–8 ก.ย. 2026 (ยกจาก ~/meecard-snkr-full บนเซิร์ฟเวอร์เข้า repo 09-19)
// Per row: readback(snkrdunkId) -> occupancy(code) -> create -> readback -> approve (if needed) -> readback.
// Mutations never retry. Any ambiguous outcome (timeout / 5xx / readback mismatch) stops the run.
// Requires --apply and MEECARD_SNKR_APPLY=1 to write anything; default is dry-run.
// usage: node tools/bestos/meecard-snkrdunk-apply-lean.mjs --manifest FILE --state DIR [--apply] [--max N] [--delay MS] [--probe-every N] [--max-fail N]
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { SnkrMcpClient, createJournal, validateManifest, DEFAULT_MCP_URL } from "./meecard-snkrdunk-supervised-apply.mjs";

const argv = process.argv.slice(2);
const opt = (name, def) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : def; };
const apply = argv.includes("--apply");
const createOnly = argv.includes("--create-only");
if (apply && process.env.MEECARD_SNKR_APPLY !== "1") throw new Error("--apply ต้องมี MEECARD_SNKR_APPLY=1");
const manifestPath = opt("--manifest");
if (!manifestPath) throw new Error("ต้องระบุ --manifest <file.json>");
const stateDir = opt("--state", path.dirname(path.resolve(manifestPath)));
fs.mkdirSync(path.join(stateDir, "journal"), { recursive: true });
const max = Number(opt("--max", "1"));
const skip = Number(opt("--skip", "0"));
const delayMs = Number(opt("--delay", "1500"));
const probeUrl = opt("--probe-url", "https://meecardtcg.com/");
const probeEvery = Number(opt("--probe-every", "10"));
const maxConsecutiveFail = Number(opt("--max-fail", "1"));
async function probeSite() { try { const r = await fetch(probeUrl, { method: "GET", signal: AbortSignal.timeout(15_000), headers: { "user-agent": "bestos-meecard-apply-probe/1.0" } }); return r.status; } catch { return 0; } }
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const outPath = opt("--output", path.join(stateDir, `apply-run-${stamp}.json`));
const journal = createJournal(opt("--journal", path.join(stateDir, "journal", `apply-${new Date().toISOString().slice(0, 10)}.jsonl`)));
const runId = randomUUID();
const log = (...a) => console.error(new Date().toISOString(), ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const rows = validateManifest(JSON.parse(fs.readFileSync(manifestPath, "utf8"))).slice(skip, skip + max);
const client = new SnkrMcpClient(process.env.MEECARD_MCP_URL ?? DEFAULT_MCP_URL, { allowMutation: apply, timeoutMs: 90_000 });
await client.initialize();

const num = (v) => (v == null ? null : Number(v));
function normalize(m) {
  return { id: num(m.id), snkrdunkId: num(m.snkrdunkId), status: String(m.status ?? "").toUpperCase(), targetId: num(m.matchedCard?.id ?? m.matchedCardId), code: String(m.productNumber ?? "").toUpperCase(), name: m.scrapedName };
}
async function bySource(snkrdunkId) {
  const res = await client.callTool("snkrdunk_mapping_list", { page: 1, limit: 20, keyword: String(snkrdunkId) });
  const list = (res?.data ?? []).map(normalize).filter((m) => m.snkrdunkId === snkrdunkId);
  if (list.length > 1) throw Object.assign(new Error(`SNKR ${snkrdunkId} มี mapping ซ้ำ ${list.length}`), { code: "duplicate_source" });
  return list[0] ?? null;
}
async function byCode(code) {
  const out = []; let page = 1, totalPage = 1;
  do { const res = await client.callTool("snkrdunk_mapping_list", { page, limit: 100, keyword: code }); totalPage = Number(res?.totalPage ?? 1); out.push(...(res?.data ?? []).map(normalize)); page++; } while (page <= totalPage && page <= 10);
  return out;
}

const results = []; let stopped = null; let consecutiveFail = 0;
let processedRows = 0;
for (const row of rows) {
  const t0 = Date.now();
  if (processedRows > 0 && processedRows % probeEvery === 0) { const st = await probeSite(); journal.append({ runId, event: "site_probe", status: st, processedRows }); if (st !== 200) { stopped = { code: "site_unhealthy", status: st, at: row.snkrdunkId }; log("STOP site probe", st); break; } }
  processedRows++;
  const r = { snkrdunkId: row.snkrdunkId, matchedCardId: row.matchedCardId, code: row.code, outcome: null, mappingId: null, steps: [] };
  try {
    let cur = await bySource(row.snkrdunkId);
    if (cur && cur.status === "MATCHED" && cur.targetId === row.matchedCardId) { r.outcome = "already-matched"; r.mappingId = cur.id; results.push(r); log("skip already", row.code, row.snkrdunkId); continue; }
    if (cur && cur.status === "MATCHED") { r.outcome = "skip-matched-elsewhere"; r.mappingId = cur.id; r.currentTarget = cur.targetId; results.push(r); log("skip matched elsewhere", row.code, row.snkrdunkId, "->", cur.targetId); continue; }
    if (cur && cur.status === "REJECTED") { r.outcome = "skip-rejected"; r.mappingId = cur.id; results.push(r); log("skip rejected", row.code, row.snkrdunkId); continue; }
    const occupied = (await byCode(row.code)).filter((m) => m.status === "MATCHED" && m.targetId === row.matchedCardId && m.snkrdunkId !== row.snkrdunkId);
    if (occupied.length) { r.outcome = "skip-target-occupied"; r.occupiedBy = occupied.map((m) => ({ mappingId: m.id, snkrdunkId: m.snkrdunkId })); results.push(r); log("skip occupied", row.code, row.matchedCardId, "by", occupied[0].snkrdunkId); continue; }
    if (!apply) { r.outcome = "dry-run"; r.plannedAction = cur ? "approve" : "create+approve"; results.push(r); log("dry-run", row.code, row.snkrdunkId, r.plannedAction); continue; }

    if (!cur) {
      journal.append({ runId, event: "mutation_start", op: "create", snkrdunkId: row.snkrdunkId, code: row.code, target: row.matchedCardId });
      let createErr = null;
      try { await client.callTool("snkrdunk_mapping_create", { snkrdunkId: row.snkrdunkId }, { mutation: true }); }
      catch (e) { createErr = e; log("create error", row.snkrdunkId, e.code, e.message?.slice(0, 160)); }
      cur = await bySource(row.snkrdunkId);
      journal.append({ runId, event: "mutation_readback", op: "create", snkrdunkId: row.snkrdunkId, found: !!cur, status: cur?.status ?? null, targetId: cur?.targetId ?? null, error: createErr ? { code: createErr.code, message: String(createErr.message).slice(0, 200) } : null });
      if (!cur && createErr && /returned 5\d\d/.test(String(createErr.message))) {
        // backend 5xx + nothing on readback: wait, re-read once; if still absent treat as a clean failure (not ambiguous)
        await sleep(10_000); cur = await bySource(row.snkrdunkId);
        journal.append({ runId, event: "mutation_readback", op: "create-recheck", snkrdunkId: row.snkrdunkId, found: !!cur, status: cur?.status ?? null });
        if (!cur) { r.outcome = "create-failed-5xx"; r.error = { code: createErr.code, message: String(createErr.message).slice(0, 200) }; results.push(r); consecutiveFail++; log("create 5xx, skipping", row.code, row.snkrdunkId, "consecutive", consecutiveFail); if (consecutiveFail >= maxConsecutiveFail) { stopped = { code: "too_many_failures", at: row.snkrdunkId }; break; } await sleep(delayMs); continue; }
      }
      if (!cur) {
        if (createErr && !createErr.ambiguous && /HTTP 4\d\d|tool_error|application_error/.test(`${createErr.code} ${createErr.message}`)) {
          r.outcome = "create-failed"; r.error = { code: createErr.code, message: String(createErr.message).slice(0, 200) }; results.push(r); consecutiveFail++; if (consecutiveFail >= maxConsecutiveFail) { stopped = { code: "too_many_failures", at: row.snkrdunkId }; break; } await sleep(delayMs); continue;
        }
        throw Object.assign(new Error(`create แล้วอ่านกลับไม่เจอ SNKR ${row.snkrdunkId}`), { code: "create_unverified", ambiguous: true });
      }
      r.steps.push({ op: "create", status: cur.status, targetId: cur.targetId });
      if (cur.code && cur.code !== row.code) throw Object.assign(new Error(`mapping ${cur.id} รหัส ${cur.code} ไม่ตรง ${row.code}`), { code: "source_code_mismatch" });
    }
    if (createOnly && !(cur.status === "MATCHED" && cur.targetId === row.matchedCardId)) {
      r.outcome = cur.status === "PENDING" ? "pending-needs-approve" : `auto-${cur.status.toLowerCase()}-target-${cur.targetId}`;
      r.mappingId = cur.id; r.ms = Date.now() - t0; consecutiveFail = 0;
      journal.append({ runId, event: "row_complete", ...r }); results.push(r); log(r.outcome, row.code, row.snkrdunkId, "mapping", cur.id, "want", row.matchedCardId);
      await sleep(delayMs); continue;
    }
    if (!(cur.status === "MATCHED" && cur.targetId === row.matchedCardId)) {
      if (cur.status === "REJECTED") throw Object.assign(new Error(`mapping ${cur.id} เป็น REJECTED`), { code: "blocked_status" });
      journal.append({ runId, event: "mutation_start", op: "approve", mappingId: cur.id, snkrdunkId: row.snkrdunkId, from: { status: cur.status, targetId: cur.targetId }, target: row.matchedCardId });
      let approveErr = null;
      try { await client.callTool("snkrdunk_mapping_approve", { mappingId: cur.id, matchedCardId: row.matchedCardId }, { mutation: true }); }
      catch (e) { approveErr = e; log("approve error", cur.id, e.code, e.message?.slice(0, 160)); }
      const after = await bySource(row.snkrdunkId);
      journal.append({ runId, event: "mutation_readback", op: "approve", mappingId: cur.id, snkrdunkId: row.snkrdunkId, status: after?.status ?? null, targetId: after?.targetId ?? null, error: approveErr ? { code: approveErr.code, message: String(approveErr.message).slice(0, 200) } : null });
      if (!after || after.status !== "MATCHED" || after.targetId !== row.matchedCardId) {
        throw Object.assign(new Error(`approve แล้วสถานะไม่ตรง: ${after?.status} -> ${after?.targetId}`), { code: "final_state_mismatch", ambiguous: true });
      }
      r.steps.push({ op: "approve", status: after.status, targetId: after.targetId, softError: approveErr ? approveErr.code : null });
      cur = after;
    }
    r.outcome = "matched"; r.mappingId = cur.id; r.ms = Date.now() - t0; consecutiveFail = 0;
    journal.append({ runId, event: "row_complete", ...r });
    results.push(r); log("matched", row.code, row.snkrdunkId, "->", row.matchedCardId, "mapping", cur.id, `${r.ms}ms`);
    await sleep(delayMs);
  } catch (e) {
    r.outcome = "stopped"; r.error = { code: e.code ?? "unexpected_error", message: String(e.message).slice(0, 300), ambiguous: !!e.ambiguous };
    results.push(r); journal.append({ runId, event: "run_stopped", ...r }); stopped = r.error; log("STOP", row.code, row.snkrdunkId, r.error); break;
  }
}
const summary = {}; for (const r of results) summary[r.outcome] = (summary[r.outcome] ?? 0) + 1;
const report = { runId, mode: apply ? "apply" : "dry-run", manifestPath, skip, max, stopped, summary, results, journalPath: journal.path };
fs.writeFileSync(outPath, JSON.stringify(report, null, 1));
journal.close?.();
console.log(JSON.stringify({ runId, mode: report.mode, stopped, summary, outPath }, null, 1));
