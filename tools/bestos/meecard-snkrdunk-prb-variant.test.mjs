// เทสต์กติกาเลือกแถวของชุดรีปรินต์ PRB — เคสจริงที่เจอ 2026-09-19 ตอนไล่ 88 ใบที่ระบบบอกว่า "ชนกัน"
import { test } from "node:test";
import assert from "node:assert/strict";
import { prbTreatment, pickPrbRows, family } from "./meecard-snkrdunk-prb-variant.mjs";

// แถวจริงของ ST03-013 (ชุด prb01) — _p2 ไม่มีดาว · _p3/_p4 มีดาว · _r1 คือใบพิมพ์ซ้ำธรรมดา
const ST03 = [
  { id: 2968, cardCode: "ST03-013_p2", rarity: "C" },
  { id: 2969, cardCode: "ST03-013_p3", rarity: "P-C" },
  { id: 2970, cardCode: "ST03-013_p4", rarity: "P-C" },
  { id: 2971, cardCode: "ST03-013_r1", rarity: "C" },
];

test("อ่านแบบของใบจากชื่อรายการได้ถูก", () => {
  assert.equal(prbTreatment('Boa Hancock C :Full Art [ST03-013](Premium Booster "One Piece Card The Best")', "C"), "star");
  assert.equal(prbTreatment('Boa Hancock C : Pirate Flag Foil [ST03-013](Premium Booster "One Piece Card The Best")', "C"), "foil");
  assert.equal(prbTreatment('Boa Hancock C [ST03-013](Premium Booster "One Piece Card The Best")', "C"), "plain");
  assert.equal(prbTreatment('Boa Hancock C-P [ST03-013](Premium Booster "One Piece Card The Best")', "P-C"), "star", "ใบ -P อ่านความหายากได้ P-C อยู่แล้ว ต้องเป็นแบบมีดาว");
});

test("Full Art ต้องไปแถวที่มีดาว (P-x) ไม่ใช่แถวความหายากธรรมดา — จุดที่กฎเดิมพลาด", () => {
  const got = pickPrbRows(ST03, "star", "C");
  assert.deepEqual(got.map((k) => k.cardCode).sort(), ["ST03-013_p3", "ST03-013_p4"]);
});

test("Pirate Flag Foil ไปแถว _pN ที่ความหายากธรรมดา", () => {
  assert.deepEqual(pickPrbRows(ST03, "foil", "C").map((k) => k.cardCode), ["ST03-013_p2"]);
});

test("ใบธรรมดาของชุดรีปรินต์ไปแถว _rN", () => {
  assert.deepEqual(pickPrbRows(ST03, "plain", "C").map((k) => k.cardCode), ["ST03-013_r1"]);
});

test("ความหายากต้องเป็นตระกูลเดียวกันเท่านั้น (UC ไม่ไปปนกับ C)", () => {
  const rows = [{ cardCode: "X_p1", rarity: "UC" }, { cardCode: "X_p2", rarity: "P-UC" }, { cardCode: "X_p3", rarity: "P-C" }];
  assert.deepEqual(pickPrbRows(rows, "star", "UC").map((k) => k.cardCode), ["X_p2"]);
  assert.equal(family("P-UC"), "UC");
});

test("ไม่มีแถวที่เข้าข่าย = คืนค่าว่าง (ผู้เรียกไปใช้กติกาทั่วไปต่อ)", () => {
  assert.deepEqual(pickPrbRows([{ cardCode: "Y", rarity: "R" }], "star", "R"), []);
  assert.deepEqual(pickPrbRows([], "plain", "C"), []);
});

test("เคส OP04-032 ที่เคยตีว่าชนกัน: Full Art ต้องได้ _p2 (P-UC) ที่ยังว่าง ไม่ใช่ _p1 ที่มีเจ้าของแล้ว", () => {
  const rows = [
    { id: 2791, cardCode: "OP04-032_p1", rarity: "UC" },
    { id: 2792, cardCode: "OP04-032_p2", rarity: "P-UC" },
    { id: 2793, cardCode: "OP04-032_r1", rarity: "UC" },
  ];
  const name = 'Baby 5 UC :Full Art [OP04-032](Premium Booster "One Piece Card The Best")';
  assert.deepEqual(pickPrbRows(rows, prbTreatment(name, "UC"), "UC").map((k) => k.id), [2792]);
});
