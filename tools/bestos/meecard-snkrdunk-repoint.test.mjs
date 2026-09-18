// เทสต์ด่านตรวจแผนย้ายคู่ที่จับผิด — งานนี้แก้ข้อมูลที่คนทำไว้ ผิดแล้วย้อนยาก ด่านตรวจต้องกันพลาดก่อนยิง
import { test } from "node:test";
import assert from "node:assert/strict";
import { validateRepointPlan } from "./meecard-snkrdunk-repoint.mjs";

const ok = () => [{ code: "ST06-014", mappingId: 4600, snkrdunkId: 328690, fromCardId: 2983, toCardId: 2984, fill: { snkrdunkId: 328689, cardId: 2983 } }];

test("แผนที่ถูกต้องผ่าน และคืนค่าเป็นตัวเลขล้วน", () => {
  const rows = validateRepointPlan(ok());
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0], { code: "ST06-014", mappingId: 4600, fromCardId: 2983, toCardId: 2984, snkrdunkId: 328690, fill: { snkrdunkId: 328689, cardId: 2983 } });
});

test("แผนว่างหรือไม่ใช่รายการ = ไม่ยอมรับ", () => {
  assert.throws(() => validateRepointPlan([]), /แผนว่าง/);
  assert.throws(() => validateRepointPlan(null), /แผนว่าง/);
});

test("ค่าที่ขาดหรือไม่ใช่เลขบวก = ไม่ยอมรับ และบอกว่าแถวไหน", () => {
  const bad = ok(); delete bad[0].toCardId;
  assert.throws(() => validateRepointPlan(bad), /แถวที่ 1 \(ST06-014\).*toCardId/s);
  const zero = ok(); zero[0].mappingId = 0;
  assert.throws(() => validateRepointPlan(zero), /mappingId/);
});

test("ย้ายไปการ์ดใบเดิม = ไม่ยอมรับ (กันสั่งซ้ำโดยไม่ตั้งใจ)", () => {
  const same = ok(); same[0].toCardId = same[0].fromCardId;
  assert.throws(() => validateRepointPlan(same), /ใบเดิม/);
});

test("mapping ซ้ำ หรือ การ์ดปลายทางซ้ำในแผนเดียวกัน = ไม่ยอมรับ", () => {
  const dupMap = [...ok(), { ...ok()[0], toCardId: 9999, fill: null }];
  assert.throws(() => validateRepointPlan(dupMap), /ซ้ำในแผน/);
  const dupTarget = [ok()[0], { code: "X", mappingId: 4601, snkrdunkId: 1, fromCardId: 5, toCardId: 2984 }];
  assert.throws(() => validateRepointPlan(dupTarget), /ปลายทางซ้ำ/);
});

test("ช่องที่จะเอาใบใหม่ลง ต้องเป็นช่องที่เพิ่งว่างเท่านั้น", () => {
  const wrong = ok(); wrong[0].fill.cardId = 7777;
  assert.throws(() => validateRepointPlan(wrong), /ช่องที่เพิ่งว่าง/);
});

test("ใบที่จะเอาลงช่องว่าง ต้องไม่ใช่ใบเดียวกับที่กำลังย้าย", () => {
  const wrong = ok(); wrong[0].fill.snkrdunkId = wrong[0].snkrdunkId;
  assert.throws(() => validateRepointPlan(wrong), /ซ้ำกับใบที่กำลังย้าย/);
});

test("ไม่ใส่ fill ก็ได้ = ย้ายอย่างเดียว", () => {
  const rows = validateRepointPlan([{ code: "A", mappingId: 1, snkrdunkId: 2, fromCardId: 3, toCardId: 4 }]);
  assert.equal(rows[0].fill, null);
});
