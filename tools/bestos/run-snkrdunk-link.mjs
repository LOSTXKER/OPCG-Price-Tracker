#!/usr/bin/env node
// งานประจำ: จับคู่การ์ดของเรากับ SNKRDUNK ด้วยชุดที่ได้ผลจริงในรอบ 4–8 ก.ย. 2026 (planner + apply-lean) — ตั้งเป็นงานประจำ 09-19 ตามที่เบสเคาะทาง ข
//   ขั้น 1 snapshot  แคตตาล็อกวันพีซ (ช่อง brands/onepiece) + การ์ดเรา + คู่ทั้งหมด   (อ่านอย่างเดียว)
//   ขั้น 2 plan      รหัส+ความหายาก+ชุด → เทียบรูป → auto / review                     (อ่านอย่างเดียว · ข้ามขั้น Apple Vision เพราะรันบน Linux)
//   ขั้น 3 apply     เขียนเฉพาะกลุ่ม auto ทีละใบ เว้นจังหวะ หยุดเมื่อเว็บล้ม          (เขียนต่อเมื่อใส่ --apply)
//   ขั้น 4 สรุปภาษาไทยออก stdout — ว่าง = ไม่มีอะไรต้องบอก (ตัวรันงาน V3.1 จะไม่ส่งเข้าห้อง)
// usage: node tools/bestos/run-snkrdunk-link.mjs [--apply] [--max 30] [--delay 45000] [--state DIR]
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const APPLY = argv.includes("--apply");
const MAX = Number(opt("--max", "30"));
const DELAY = Number(opt("--delay", "45000"));
const today = new Date().toISOString().slice(0, 10);
const STATE = opt("--state", path.join(os.homedir(), ".cache", "bestos-meecard-snkrdunk-link", today));
fs.mkdirSync(STATE, { recursive: true });
const log = (...a) => console.error(new Date().toISOString(), ...a);

/** รันขั้นย่อย: ล้ม = โยน error ภาษาคน (ตัวรันงาน V3.1 อ่าน stderr) */
function step(name, args, { env = process.env, timeoutMs = 20 * 60_000 } = {}) {
  log(`เริ่ม ${name}`);
  const r = spawnSync(process.execPath, args, { cwd: HERE, encoding: "utf8", env, timeout: timeoutMs, maxBuffer: 64 * 1024 * 1024 });
  if (r.error?.code === "ETIMEDOUT" || r.signal) throw new Error(`${name} ไม่จบใน ${Math.round(timeoutMs / 60000)} นาที`);
  if (r.status !== 0) throw new Error(`${name} ล้ม (รหัส ${r.status}): ${String(r.stderr ?? "").trim().split("\n").slice(-3).join(" · ").slice(0, 300)}`);
  return r.stdout ?? "";
}
/** ผลสรุปของขั้นย่อยเป็น JSON ก้อนสุดท้ายใน stdout — planner กับ apply พิมพ์แบบหลายบรรทัด (JSON.stringify(…, null, 1)) จึงอ่านทีละบรรทัดไม่ได้ */
export function lastJson(text) {
  const t = String(text ?? "").trim();
  if (!t) return null;
  try { return JSON.parse(t); } catch { /* มีข้อความอื่นปนอยู่ก่อนหน้า */ }
  const lines = t.split("\n");
  for (let i = lines.length - 1; i >= 0; i--) {
    if (!/^\s*\{/.test(lines[i])) continue;
    try { return JSON.parse(lines.slice(i).join("\n")); } catch { /* ยังไม่ใช่จุดเริ่มก้อนสุดท้าย */ }
  }
  return null;
}

/** สรุปเป็นภาษาคน · คืน "" เมื่อไม่มีอะไรต้องบอก */
export function summarize({ plan, applyResult, apply, reviewRows = [], max }) {
  const s = applyResult?.summary ?? {};
  const matched = s.matched ?? 0;
  const dry = s["dry-run"] ?? 0;
  const skipped = Object.entries(s).filter(([k]) => k.startsWith("skip-") || k === "already-matched").reduce((a, [, v]) => a + v, 0);
  const failed = Object.entries(s).filter(([k]) => /failed|stopped/.test(k)).reduce((a, [, v]) => a + v, 0);
  const review = plan?.review ?? 0;
  const auto = plan?.auto ?? 0;
  if (!matched && !dry && !review && !failed && !applyResult?.stopped) return "";
  const L = [`🃏 จับคู่การ์ดกับ SNKRDUNK — ${today}`];
  if (apply) {
    if (matched) L.push(`ผูกให้แล้ว ${matched} ใบ (ทีละใบ เว้น ${Math.round((DELAY) / 1000)} วิ)${auto > max ? ` · ยังเหลือในคิว ${auto - max} ใบ ทำต่อพรุ่งนี้` : ""}`);
    else if (auto) L.push(`มีที่ควรผูก ${auto} ใบ แต่รอบนี้ยังไม่ได้ผูกเลย`);
    else L.push("ไม่มีใบใหม่ที่มั่นใจพอจะผูกเอง");
  } else {
    L.push(`โหมดดูอย่างเดียว: ถ้าเปิดเขียนจะผูก ${dry} ใบ (ทั้งหมดที่มั่นใจ ${auto} ใบ)`);
  }
  if (skipped) L.push(`ข้าม ${skipped} ใบ (มีคู่อยู่แล้วหรือใบนั้นถูกใช้ไปแล้ว)`);
  if (review) L.push(`รอเบสดู ${review} ใบ — รูปคล้ายแต่ไม่ชัวร์: ${reviewRows.slice(0, 5).map((r) => r.code).join(" · ")}${review > 5 ? " …" : ""}`);
  const reasons = Object.entries(plan?.reasons ?? {}).filter(([k]) => !k.startsWith("ready:")).sort((a, b) => b[1] - a[1]).slice(0, 3);
  if (reasons.length) L.push(`ที่ยังจับไม่ได้ ส่วนใหญ่เพราะ: ${reasons.map(([k, v]) => `${REASON_TH[k] ?? k} ${v}`).join(" · ")}`);
  if (applyResult?.stopped) L.push(`⚠️ หยุดกลางทาง: ${STOP_TH[applyResult.stopped.code] ?? applyResult.stopped.code} — รอบพรุ่งนี้จะทำต่อจากที่ค้าง`);
  if (failed) L.push(`⚠️ ผูกไม่สำเร็จ ${failed} ใบ (ดูบันทึกในเครื่องที่รัน)`);
  L.push(`Next action: ${review ? "เปิดดูใบที่รอเบสดู แล้วกดผูกในหน้าแอดมิน" : applyResult?.stopped ? "ไม่มี — ระบบจะลองใหม่พรุ่งนี้" : "ไม่มี — อ่านผ่าน ๆ พอ"}`);
  return L.join("\n");
}
const REASON_TH = {
  explicit_locale: "เป็นฉบับต่างภาษา", opened_or_unopened: "เป็นของแกะ/ไม่แกะ", promo_manual_only: "เป็นโปรโม (ต้องทำมือ)", unmapped_pack: "ไม่รู้ว่าแพ็กไหน",
  no_rarity: "อ่านความหายากไม่ออก", no_candidate: "ไม่มีการ์ดเราที่ตรง", target_occupied: "การ์ดเรามีคู่แล้ว", unique_visual_too_high: "รูปไม่เหมือนพอ",
  multi_visual_ambiguous: "รูปคล้ายกันหลายใบ", source_placeholder: "รูปฝั่งเขาเป็นรูปว่าง", source_image_error: "โหลดรูปฝั่งเขาไม่ได้", candidate_image_error: "โหลดรูปเราไม่ได้",
};
const STOP_TH = { site_unhealthy: "เว็บ MeeCard ไม่ตอบ", too_many_failures: "ผูกไม่สำเร็จติดกันหลายใบ", create_unverified: "เขียนแล้วอ่านกลับไม่เจอ", final_state_mismatch: "เขียนแล้วสถานะไม่ตรง" };

const runDirect = process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url));
if (runDirect) {
  try {
    // ขั้น 1 — snapshot (แคตตาล็อกวันพีซ ~1 นาที + MCP อ่านอย่างเดียว)
    step("ดึงข้อมูล", [path.join(HERE, "meecard-snkrdunk-snapshot.mjs"), "--out", STATE]);
    for (const f of ["snkr.json", "cards.json", "maps.json"]) if (!fs.existsSync(path.join(STATE, f))) throw new Error(`ดึงข้อมูลแล้วไม่มีไฟล์ ${f}`);
    // ขั้น 2 — plan (ข้าม Apple Vision บน Linux · กรองฉบับต่างภาษาจากชื่อแทน)
    const planOut = step("วางแผนจับคู่", [path.join(HERE, "meecard-snkrdunk-catalog-plan.mjs"), "--catalog", path.join(STATE, "snkr.json"), "--cards", path.join(STATE, "cards.json"), "--mappings", path.join(STATE, "maps.json"), "--out", STATE, "--no-ocr"], { timeoutMs: 40 * 60_000 });
    const plan = lastJson(planOut);
    if (!plan) throw new Error("วางแผนจับคู่แล้วไม่ได้ผลสรุป");
    const reviewRows = (() => { try { return JSON.parse(fs.readFileSync(path.join(STATE, "manifest-review.json"), "utf8")).rows ?? []; } catch { return []; } })();
    // ขั้น 3 — apply (เฉพาะ auto · ทีละใบ · เว้นจังหวะ)
    let applyResult = null;
    if (plan.auto > 0) {
      const env = APPLY ? { ...process.env, MEECARD_SNKR_APPLY: "1" } : { ...process.env };
      const args = [path.join(HERE, "meecard-snkrdunk-apply-lean.mjs"), "--manifest", path.join(STATE, "manifest-auto.json"), "--state", STATE, "--max", String(MAX), "--delay", String(DELAY), "--probe-every", "10", "--max-fail", "3"];
      if (APPLY) args.push("--apply");
      applyResult = lastJson(step(APPLY ? "ผูกคู่ลงฐาน" : "ซ้อมผูก (ไม่เขียน)", args, { env, timeoutMs: (MAX * (DELAY + 60_000)) + 5 * 60_000 }));
    }
    const text = summarize({ plan, applyResult, apply: APPLY, reviewRows, max: MAX });
    if (text) process.stdout.write(`${text}\n`);
    log("จบ", JSON.stringify({ auto: plan.auto, review: plan.review, apply: APPLY, summary: applyResult?.summary ?? null }));
  } catch (e) {
    console.error(`⚠️ จับคู่การ์ดกับ SNKRDUNK ไม่สำเร็จ: ${e.message}`);
    process.exit(1);
  }
}
