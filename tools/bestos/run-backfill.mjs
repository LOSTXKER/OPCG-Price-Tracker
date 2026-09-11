#!/usr/bin/env node
// run-backfill — ตัวห่อสำหรับตัวรันงาน bestos: ไล่รายการ SNKRDUNK ทีละ 5 หน้า (อ่านอย่างเดียว) แล้วพิมพ์สรุปเฉพาะเมื่อมีของใหม่
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { openSummary, prepareSummary } from "./summary-delivery.mjs";
const HERE = path.dirname(new URL(import.meta.url).pathname);
const STATE = path.join(os.homedir(), ".cache", "bestos-meecard-snkrdunk-backfill", "last-summary.json");
let delivery;
try { delivery = openSummary(STATE); }
catch (error) { console.error(`⚠️ MeeCard ยังตรวจรอบใหม่ไม่ได้: ${error.message}`); process.exit(1); }
if (delivery.replay) { console.log(prepareSummary(STATE, delivery.state, delivery.replay.key, delivery.replay.text)); process.exit(0); }
const r = spawnSync(process.execPath, [path.join(HERE, "meecard-snkrdunk-backfill.mjs"), ...process.argv.slice(2)], { encoding: "utf8", timeout: 25 * 60 * 1000, maxBuffer: 32 * 1024 * 1024, env: process.env });
const last = (r.stdout ?? "").trim().split("\n").filter(Boolean).at(-1) ?? "";
let j; try { j = JSON.parse(last); } catch { j = null; }
if (!j || r.status !== 0 || j.ok === false) {
  console.log(`⚠️ MeeCard ไล่รายการ SNKRDUNK ล้ม: ${(r.stderr ?? "").trim().split("\n").slice(-2).join(" ").slice(0, 300) || `exit ${r.status}`}`);
  process.exit(1);
}
const counts = j.counts ?? {};
const total = Object.values(counts).reduce((a, b) => a + (Number(b) || 0), 0);
const key = JSON.stringify({ counts, pageEnd: j.pageEnd, status: j.status });
const prev = delivery.state.delivery_confirmed === true ? delivery.state.key : null;
if ((key === prev || total === 0) && j.status !== "blocked") process.exit(0);
console.log(prepareSummary(STATE, delivery.state, key, `🃏 MeeCard ไล่รายการ SNKRDUNK หน้า ${j.pageStart ?? "?"}–${j.pageEnd ?? "?"} (${j.status})\n${Object.entries(counts).map(([k, v]) => `• ${k}: ${v}`).join("\n")}\nรายงานเต็ม: ${j.reportPath ?? "-"}`));
