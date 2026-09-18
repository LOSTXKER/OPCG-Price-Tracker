#!/usr/bin/env node
// ย้ายคู่ที่จับไว้ผิดให้ไปชี้การ์ดใบที่ถูก แล้ว (ถ้าระบุ) เอารายการอีกใบลงช่องที่เพิ่งว่าง
// ตัวเขียนปกติ (apply-lean) จงใจไม่แตะคู่ที่มีอยู่แล้ว — งานแก้ของเก่าจึงต้องใช้ตัวนี้ และต้องให้เบสเคาะก่อนทุกครั้ง
//
// แต่ละแถวทำตามลำดับ: อ่านกลับ → ยืนยันว่าสภาพปัจจุบันตรงกับที่แผนบอก → ย้าย → อ่านกลับ → สร้างคู่ใหม่ → อ่านกลับ → อนุมัติ → อ่านกลับ
// ผิดจากที่คาดแม้ข้อเดียว = หยุดทั้งงาน ไม่ลองซ้ำ
//
// usage: node tools/bestos/meecard-snkrdunk-repoint.mjs --plan FILE [--apply] [--delay MS]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SnkrMcpClient, createJournal, DEFAULT_MCP_URL } from "./meecard-snkrdunk-supervised-apply.mjs";

/** ตรวจแผนก่อนยิง: ทุกแถวต้องครบและไม่ย้ายไปใบเดิม · คืนแถวที่ตรวจแล้ว หรือโยน error ภาษาคน */
export function validateRepointPlan(rows) {
  if (!Array.isArray(rows) || !rows.length) throw new Error("แผนว่าง");
  const seenMapping = new Set(), seenTarget = new Set();
  return rows.map((r, i) => {
    const at = `แถวที่ ${i + 1}${r.code ? ` (${r.code})` : ""}`;
    const num = (v, field) => { const n = Number(v); if (!Number.isInteger(n) || n <= 0) throw new Error(`${at}: ${field} ไม่ถูกต้อง`); return n; };
    const mappingId = num(r.mappingId, "mappingId");
    const fromCardId = num(r.fromCardId, "fromCardId");
    const toCardId = num(r.toCardId, "toCardId");
    const snkrdunkId = num(r.snkrdunkId, "snkrdunkId");
    if (fromCardId === toCardId) throw new Error(`${at}: ย้ายไปการ์ดใบเดิม ไม่มีอะไรต้องทำ`);
    if (seenMapping.has(mappingId)) throw new Error(`${at}: mapping ${mappingId} ซ้ำในแผน`);
    if (seenTarget.has(toCardId)) throw new Error(`${at}: การ์ด ${toCardId} ถูกใช้เป็นปลายทางซ้ำในแผน`);
    seenMapping.add(mappingId); seenTarget.add(toCardId);
    let fill = null;
    if (r.fill) {
      const fillSnkr = num(r.fill.snkrdunkId, "fill.snkrdunkId");
      const fillCard = num(r.fill.cardId, "fill.cardId");
      if (fillCard !== fromCardId) throw new Error(`${at}: fill.cardId ต้องเป็นช่องที่เพิ่งว่าง (${fromCardId})`);
      if (fillSnkr === snkrdunkId) throw new Error(`${at}: fill.snkrdunkId ซ้ำกับใบที่กำลังย้าย`);
      if (seenTarget.has(fillCard)) throw new Error(`${at}: การ์ด ${fillCard} ถูกใช้เป็นปลายทางซ้ำในแผน`);
      seenTarget.add(fillCard);
      fill = { snkrdunkId: fillSnkr, cardId: fillCard };
    }
    return { code: r.code ?? "", mappingId, fromCardId, toCardId, snkrdunkId, fill };
  });
}

const runDirect = process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url));
if (runDirect) {
  const argv = process.argv.slice(2);
  const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
  const apply = argv.includes("--apply");
  if (apply && process.env.MEECARD_SNKR_APPLY !== "1") throw new Error("--apply ต้องมี MEECARD_SNKR_APPLY=1");
  const planPath = opt("--plan"); if (!planPath) throw new Error("ต้องระบุ --plan <file.json>");
  const delayMs = Number(opt("--delay", "45000"));
  const stateDir = opt("--state", path.dirname(path.resolve(planPath)));
  fs.mkdirSync(stateDir, { recursive: true });
  const rows = validateRepointPlan(JSON.parse(fs.readFileSync(planPath, "utf8")));
  const log = (...a) => console.error(new Date().toISOString(), ...a);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const journal = createJournal(path.join(stateDir, `repoint-${new Date().toISOString().slice(0, 10)}.jsonl`));
  const client = new SnkrMcpClient(process.env.MEECARD_MCP_URL ?? DEFAULT_MCP_URL, { allowMutation: apply, timeoutMs: 90_000 });
  await client.initialize();

  const num = (v) => (v == null ? null : Number(v));
  const read = async (snkrdunkId) => {
    const res = await client.callTool("snkrdunk_mapping_list", { page: 1, limit: 20, keyword: String(snkrdunkId) });
    const hit = (res?.data ?? []).find((m) => num(m.snkrdunkId) === num(snkrdunkId));
    return hit ? { id: num(hit.id), status: String(hit.status ?? "").toUpperCase(), targetId: num(hit.matchedCard?.id ?? hit.matchedCardId) } : null;
  };

  const results = []; let stopped = null;
  for (const r of rows) {
    const step = { code: r.code, snkrdunkId: r.snkrdunkId, outcome: null };
    try {
      const before = await read(r.snkrdunkId);
      if (!before) throw new Error(`อ่านกลับไม่เจอคู่ของ SNKR ${r.snkrdunkId}`);
      if (before.id !== r.mappingId) throw new Error(`mapping ไม่ตรงแผน: ฐานเป็น ${before.id} แผนบอก ${r.mappingId}`);
      if (before.status !== "MATCHED" || before.targetId !== r.fromCardId) throw new Error(`สภาพปัจจุบันไม่ตรงแผน: ${before.status} → ${before.targetId} (แผนคาด MATCHED → ${r.fromCardId})`);
      if (!apply) { step.outcome = "dry-run"; step.plan = `ย้าย ${r.fromCardId} → ${r.toCardId}` + (r.fill ? ` แล้วเอา ${r.fill.snkrdunkId} ลง ${r.fill.cardId}` : ""); results.push(step); log("dry-run", r.code, step.plan); continue; }

      journal.append({ event: "repoint_start", ...r, before });
      await client.callTool("snkrdunk_mapping_approve", { mappingId: r.mappingId, matchedCardId: r.toCardId }, { mutation: true });
      const after = await read(r.snkrdunkId);
      journal.append({ event: "repoint_readback", snkrdunkId: r.snkrdunkId, after });
      if (!after || after.status !== "MATCHED" || after.targetId !== r.toCardId) throw new Error(`ย้ายแล้วอ่านกลับไม่ตรง: ${after?.status} → ${after?.targetId}`);
      step.moved = { from: r.fromCardId, to: r.toCardId };
      log("ย้ายแล้ว", r.code, r.fromCardId, "→", r.toCardId);

      if (r.fill) {
        await sleep(delayMs);
        let cur = await read(r.fill.snkrdunkId);
        if (cur && cur.status === "MATCHED" && cur.targetId === r.fill.cardId) { step.fill = "already-matched"; }
        else {
          if (cur && cur.status === "MATCHED") throw new Error(`SNKR ${r.fill.snkrdunkId} มีคู่อยู่กับการ์ด ${cur.targetId} แล้ว`);
          if (!cur) {
            journal.append({ event: "fill_create", snkrdunkId: r.fill.snkrdunkId });
            await client.callTool("snkrdunk_mapping_create", { snkrdunkId: r.fill.snkrdunkId }, { mutation: true });
            cur = await read(r.fill.snkrdunkId);
            if (!cur) throw new Error(`สร้างคู่ SNKR ${r.fill.snkrdunkId} แล้วอ่านกลับไม่เจอ`);
          }
          await client.callTool("snkrdunk_mapping_approve", { mappingId: cur.id, matchedCardId: r.fill.cardId }, { mutation: true });
          const done = await read(r.fill.snkrdunkId);
          journal.append({ event: "fill_readback", snkrdunkId: r.fill.snkrdunkId, done });
          if (!done || done.status !== "MATCHED" || done.targetId !== r.fill.cardId) throw new Error(`ลงช่องที่ว่างแล้วอ่านกลับไม่ตรง: ${done?.status} → ${done?.targetId}`);
          step.fill = { snkrdunkId: r.fill.snkrdunkId, cardId: r.fill.cardId, mappingId: done.id };
          log("ลงช่องว่างแล้ว", r.code, r.fill.snkrdunkId, "→", r.fill.cardId);
        }
      }
      step.outcome = "done";
      results.push(step);
      await sleep(delayMs);
    } catch (e) {
      step.outcome = "stopped"; step.error = String(e.message).slice(0, 300);
      results.push(step); stopped = step.error; journal.append({ event: "stopped", ...step });
      log("หยุด", r.code, step.error);
      break;
    }
  }
  journal.close?.();
  const summary = {}; for (const s of results) summary[s.outcome] = (summary[s.outcome] ?? 0) + 1;
  console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", stopped, summary, results }, null, 1));
  if (stopped) process.exitCode = 1;
}
