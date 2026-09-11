// The BestOS runner owns delivery. stdout is only a prepared summary, never an acknowledgement.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const hash = text => crypto.createHash("sha256").update(text.trim() + "\n").digest("hex");
function save(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(value) + "\n"); fs.renameSync(tmp, file);
}
export function openSummary(file, env = process.env) {
  let state = {};
  try { state = JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { if (e.code !== "ENOENT") throw e; }
  const pending = state.pending;
  if (!pending) return { state };
  if (!env.BESTOS_BRAIN || !/^[\w-]+$/.test(pending.job ?? "") || !/^[\w-]+$/.test(pending.runId ?? "")) throw Error("สรุปรอบก่อนยังไม่มีข้อมูลใบเสร็จที่ตรวจได้");
  let receipt;
  const dir = path.join(env.BESTOS_BRAIN, "records", "_receipts", pending.job);
  try {
    const files = fs.readdirSync(dir).filter(f => f.endsWith(`-${pending.runId}.json`));
    if (files.length === 1) receipt = JSON.parse(fs.readFileSync(path.join(dir, files[0]), "utf8"));
  } catch (e) { if (e.code !== "ENOENT") throw e; }
  const sameRun = receipt?.job === pending.job && receipt.run_id === pending.runId;
  if (sameRun && receipt.delivered === true && receipt.delivery_status === "delivered" && receipt.message_id && receipt.output?.sha256 === pending.outputHash) {
    state = { key: pending.key, at: pending.at, job: pending.job, runId: pending.runId, delivery_confirmed: true, message_id: receipt.message_id };
    save(file, state);
    return { state };
  }
  // A failed producer/verifier before send can replay the already prepared summary.
  if (sameRun && receipt.state === "failed" && receipt.delivered !== true && receipt.delivery_status === "pending") return { state, replay: pending };
  throw Error(`สรุปรอบ ${pending.job}/${pending.runId} ยังไม่ยืนยันการส่ง ต้องตรวจหรือกู้รอบเดิมก่อนรันซ้ำ`);
}
export function prepareSummary(file, state, key, text, env = process.env) {
  const managed = env.BESTOS_BRAIN && /^[\w-]+$/.test(env.BESTOS_JOB ?? "") && /^[\w-]+$/.test(env.BESTOS_RUN_ID ?? "");
  if (managed) save(file, { ...state, pending: { key, text: text.trim(), outputHash: hash(text), at: new Date().toISOString(), job: env.BESTOS_JOB, runId: env.BESTOS_RUN_ID } });
  return text.trim(); // direct CLI: show output without recording it as delivered
}
