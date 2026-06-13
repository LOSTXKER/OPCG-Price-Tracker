# `HoneyActionType` migration runbook

> อัปเดตล่าสุด: 2026-06-14 · cross-checked vs code

Runbook ย้ายค่า enum เก่า 7 ตัวออกจาก `HoneyActionType` ไปคอลัมน์ free-form `legacyType` เพื่อให้ enum หดเหลือเฉพาะค่าที่ใช้จริง

**SSOT:** [PLAN.md M2](../PLAN.md) — ตอนนี้ freeze ด้วย runtime guard เท่านั้น · Step 1–4 ค้างทั้งก้อน (แตะ DB จริง ต้องอนุมัติก่อนรัน)

## ค่าที่ deprecated (frozen)

7 ค่านี้มีมาก่อน rebalance v2 economy — แถวประวัติยังต้อง validate ผ่าน enum ได้ แต่ห้ามโค้ดใหม่ emit:

```
PORTFOLIO_ADD  GIFT_SEND  GIFT_RECEIVE  LUCKY_DRAW
FIRST_PURCHASE  SHARE  AFFILIATE
```

## สถานะวันนี้ (freeze-only — Step 1–4 ยังไม่ทำ)

ทำแล้ว:

- **Enum ยังคงค่าเก่าไว้ครบ** — [`prisma/schema.prisma:441-447`](../prisma/schema.prisma) พร้อม `///` doc-comment เหนือบล็อกที่ mark ว่า DEPRECATED
- **Runtime guard active** — `assertNotDeprecatedHoneyActionType` ([`src/lib/honey/deprecated.ts`](../src/lib/honey/deprecated.ts)) ถูกเรียกใน `grantHoney` ที่ [`src/lib/honey/index.ts:276`](../src/lib/honey/index.ts) → throw ถ้า caller พยายามเขียนค่า deprecated แม้จะ bypass TypeScript enum ด้วย string cast ก็ตาม
- **เซ็ตค่า deprecated รวมศูนย์** ที่ `src/lib/honey/deprecated.ts` (`DEPRECATED_HONEY_ACTION_TYPES`) — เพิ่ม/ลด exclusion แก้ไฟล์เดียว

ยังไม่ทำ:

- คอลัมน์ `legacyType` **ยังไม่มีใน schema** (มีแค่ใน `///` comment) → Step 1–4 ทั้งหมดยังค้าง

## Runbook — Step 1–4 (ทำเป็นชุดเดียว ตอน coordinate ได้)

> ⚠️ ทุก Step แตะ DB จริง — เบสอนุมัติก่อนรัน migration

### Step 1 — เพิ่มคอลัมน์

```prisma
model HoneyTransaction {
  // ...existing columns...
  legacyType String? // historical type label สำหรับแถว pre-rebalance v2
}
```

### Step 2 — backfill ย้ายค่าเก่า → `legacyType`

```sql
UPDATE "HoneyTransaction"
SET "legacyType" = "type"::text,
    "type" = 'EXPIRED' -- sentinel non-positive
WHERE "type" IN (
  'PORTFOLIO_ADD', 'GIFT_SEND', 'GIFT_RECEIVE', 'LUCKY_DRAW',
  'FIRST_PURCHASE', 'SHARE', 'AFFILIATE'
);
```

`EXPIRED` ปลอดภัยเพราะ non-positive ไม่เข้า multiplier ใดๆ · แถวเป็นประวัติอยู่แล้ว · `amount` คงเดิม

### Step 3 — drop enum members เก่า

หลังไม่มีแถวอ้างค่า deprecated แล้ว ค่อย drop ออกจาก enum ใน schema. Postgres ลบค่า enum ตรงๆ ไม่ได้ ต้องทำ raw SQL: `ALTER TYPE ... RENAME TO` + `CREATE TYPE` (ค่าใหม่) + cast คอลัมน์ + `DROP TYPE` เก่า

### Step 4 — ปรับ read site ใน `/admin/honey`

แถวประวัติแสดงผ่าน [`honey-transaction-list.tsx`](../src/app/admin/honey/honey-transaction-list.tsx) → `getTypeInfo(tx.type)` จาก [`honey-type-labels.ts`](../src/app/admin/honey/honey-type-labels.ts) (page.tsx เป็นแค่ตัว fetch/aggregate)

หมายเหตุ: ค่า deprecated **ไม่ได้อยู่ใน `HONEY_TYPE_MAP` อยู่แล้ว** — ตอนนี้ตกลง FALLBACK "อื่นๆ". หลัง backfill `tx.type` จะกลายเป็น sentinel ฉะนั้นต้องให้ list fallback ไปอ่าน `tx.legacyType` มาโชว์ label จริงแทน

## ทำไมไม่ทำทั้งหมดตอนนี้

M2 จงใจ defer การ migrate — ท่า freeze-only ซื้อความปลอดภัยจาก accidental writes ใหม่ โดยยังไม่ต้องลงงาน schema หนักจนกว่าจะ coordinate การแก้ admin UI กับ migration พร้อมกันได้ ถือ runtime guard ข้างบนเป็น locking mechanism ที่ทำให้ window นั้น schedule ได้ปลอดภัย
