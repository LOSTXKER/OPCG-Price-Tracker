// เทสต์สรุปภาษาคนของงานประจำจับคู่ SNKRDUNK — ต้องเงียบเมื่อไม่มีอะไรใหม่ และต้องบอกครบเมื่อมีของให้ดู/ผูก/ล้ม
import { test } from "node:test";
import assert from "node:assert/strict";
import { summarize } from "./run-snkrdunk-link.mjs";

const plan = (over = {}) => ({ listings: 100, eligible: 20, auto: 0, review: 0, reasons: { no_candidate: 50, promo_manual_only: 20 }, ...over });

test("ไม่มีของใหม่เลย = ข้อความว่าง (ตัวรันงานจะไม่ส่งเข้าห้อง)", () => {
  assert.equal(summarize({ plan: plan(), applyResult: null, apply: true, max: 30 }), "");
  assert.equal(summarize({ plan: plan(), applyResult: { summary: {} }, apply: true, max: 30 }), "");
});

test("ผูกจริงแล้ว: บอกจำนวน · ของที่ข้าม · ที่เหลือในคิว · ปิดด้วย Next action", () => {
  const t = summarize({ plan: plan({ auto: 40 }), applyResult: { summary: { matched: 30, "skip-target-occupied": 2, "already-matched": 1 } }, apply: true, max: 30 });
  assert.match(t, /ผูกให้แล้ว 30 ใบ/);
  assert.match(t, /ยังเหลือในคิว 10 ใบ/);
  assert.match(t, /ข้าม 3 ใบ/);
  assert.match(t, /ไม่มีการ์ดเราที่ตรง 50/, "เหตุที่จับไม่ได้ต้องเป็นภาษาคน ไม่ใช่รหัส");
  assert.match(t, /Next action: ไม่มี/);
  assert.ok(!/undefined|NaN|\[object/.test(t));
});

test("โหมดดูอย่างเดียว: บอกชัดว่าไม่ได้เขียน และจะผูกกี่ใบถ้าเปิด", () => {
  const t = summarize({ plan: plan({ auto: 5 }), applyResult: { mode: "dry-run", summary: { "dry-run": 5 } }, apply: false, max: 30 });
  assert.match(t, /โหมดดูอย่างเดียว/);
  assert.match(t, /จะผูก 5 ใบ/);
});

test("มีใบรอเบสดู: บอกจำนวนและรหัส 5 ใบแรก · Next action ชี้ไปที่หน้าแอดมิน", () => {
  const rows = Array.from({ length: 7 }, (_, i) => ({ code: `OP0${i + 1}-001` }));
  const t = summarize({ plan: plan({ review: 7 }), applyResult: null, apply: true, reviewRows: rows, max: 30 });
  assert.match(t, /รอเบสดู 7 ใบ/);
  assert.match(t, /OP01-001 · OP02-001 · OP03-001 · OP04-001 · OP05-001 …/);
  assert.match(t, /Next action: เปิดดูใบที่รอเบสดู/);
});

test("หยุดกลางทางเพราะเว็บล้ม: บอกเหตุเป็นภาษาคน และบอกว่าพรุ่งนี้ทำต่อ", () => {
  const t = summarize({ plan: plan({ auto: 12 }), applyResult: { stopped: { code: "site_unhealthy", status: 502 }, summary: { matched: 4, "create-failed-5xx": 2 } }, apply: true, max: 30 });
  assert.match(t, /ผูกให้แล้ว 4 ใบ/);
  assert.match(t, /หยุดกลางทาง: เว็บ MeeCard ไม่ตอบ/);
  assert.match(t, /ผูกไม่สำเร็จ 2 ใบ/);
  assert.match(t, /Next action: ไม่มี — ระบบจะลองใหม่พรุ่งนี้/);
});
