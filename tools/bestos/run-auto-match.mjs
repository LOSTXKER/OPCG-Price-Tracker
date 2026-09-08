#!/usr/bin/env node
// run-auto-match — ตัวห่อสำหรับตัวรันงาน bestos: รัน supervisor แบบตรวจอย่างเดียว (--dry-run) แล้วพิมพ์สรุปภาษาคน
//   พิมพ์เฉพาะเมื่อตัวเลข "พร้อมอนุมัติ/เจอใหม่" เปลี่ยนจากรอบก่อน (กันสแปมทุก 15 นาที) · ล้ม = exit 1 พร้อมเหตุ
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
const HERE = path.dirname(new URL(import.meta.url).pathname);
const STATE = path.join(os.homedir(), ".cache", "bestos-meecard-auto-match", "last-summary.json");
const r = spawnSync(process.execPath, [path.join(HERE, "meecard-auto-match-supervisor.mjs"), "--dry-run", ...process.argv.slice(2).filter((a) => a !== "--always")], { encoding: "utf8", timeout: 25 * 60 * 1000, maxBuffer: 32 * 1024 * 1024, env: process.env });
const last = (r.stdout ?? "").trim().split("\n").filter(Boolean).at(-1) ?? "";
let j; try { j = JSON.parse(last); } catch { j = null; }
if (!j || r.status !== 0 || j.ok === false || j.status === "failed") {
  const why = j?.error?.message ?? ((r.stderr ?? "").trim().split("\n").slice(-3).join(" ").slice(0, 300) || `exit ${r.status}`);
  console.log(`⚠️ MeeCard ตรวจการจับคู่ล้ม: ${why}`);
  process.exit(1);
}
const key = JSON.stringify([j.yuyutei?.pending, j.yuyutei?.ready, j.snkrdunk?.pending, j.snkrdunk?.readyExisting, j.snkrdunk?.discoveredUnmapped, j.snkrdunk?.readyNew, j.blocked]);
let prev = null; try { prev = JSON.parse(fs.readFileSync(STATE, "utf8")).key; } catch {}
fs.mkdirSync(path.dirname(STATE), { recursive: true });
fs.writeFileSync(STATE, JSON.stringify({ key, at: new Date().toISOString(), runId: j.runId }));
if (key === prev && !process.argv.includes("--always")) process.exit(0); // เหมือนรอบก่อน = เงียบ
console.log([
  `🃏 MeeCard จับคู่การ์ด (ตรวจอย่างเดียว · ${j.mode})`,
  `Yuyutei: รอตรวจ ${j.yuyutei?.pending ?? 0} · พร้อมอนุมัติ ${j.yuyutei?.ready ?? 0}`,
  `SNKRDUNK: รอตรวจ ${j.snkrdunk?.pending ?? 0} · พร้อมอนุมัติ ${j.snkrdunk?.readyExisting ?? 0} · เจอใหม่ยังไม่มีในระบบ ${j.snkrdunk?.discoveredUnmapped ?? 0} (พร้อมอนุมัติ ${j.snkrdunk?.readyNew ?? 0})`,
  j.blocked ? `⛔ ติดด่านก่อนอนุมัติ ${j.blocked}` : null,
  `รายงานเต็ม: ${j.reportPath ?? "-"}`,
].filter(Boolean).join("\n"));
