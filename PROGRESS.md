# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-07-10 — **master ถึง PR #102 (`4cb48f8`)** · Phase 1/2/3/6 ปิดแล้ว · Phase 4 core states เสร็จ · Phase 5 mobile pass เดินต่ออยู่ · **NEXT = ขออนุมัติแก้ M0 `leaderboard-rewards` cron ก่อน แล้วค่อยกลับ Phase 5**

## ✅ เข้า master แล้ว (#90–#102)
- **#90 Phase 3 ปิด:** status color → semantic token + admin-login espresso; preserve สีข้อมูล/brand · `TOKENS-07` เสร็จแล้ว ห้ามเริ่มซ้ำ
- **#91 Phase 1 ปิด:** audit ใหม่พบ orphan เหลือจริง 3 ไฟล์และลบแล้ว (ก้อน ~3,000 บรรทัดลบไปก่อนหน้าใน #59–60)
- **#92 Phase 4 core:** error ไทย + ทางกลับหน้าแรก + `loading.tsx` 8 dynamic segment; spinner/empty CTA ที่เหลือย้ายไปเก็บราย surface ใน Phase 5
- **#93–#95 Phase 5 foundation:** sort มือถือ · watchlist row/menu · `.tap-safe` ให้ icon button กลาง+ราว 30 จุด · menu-fold บาง surface; dense cluster บางกลุ่มยังเหลือ
- **#96 Phase 6 ปิด:** ชื่อปลายทาง/ไอคอน/command palette/canonical profile URL + `useScrolled()` กลาง + breadcrumb i18n
- **#97–#100 picker/filter:** `CardPickerForm` และ `FilterModal` กลาง · rarity base/P-family · version facet · i18n · watchlist refine เต็มจอมือถือ
- **#102 kit follow-up:** ยุบ `GridCard` → canonical `CardItem` และ migrate grid หน้าแรก/ค้นหา/watchlist · คง `SetCardTile`/`TopCardTile` ที่ต่างจริง
- **#101 ไม่เข้า master:** ปิดเพราะเข้าใจโจทย์ card grid ผิดเป็น empty state — ห้ามนับ/merge กลับ

## ⏭️ NEXT
1. **M0 Honey:** ขออนุมัติแก้ config เพื่อเพิ่ม schedule `/api/cron/leaderboard-rewards` ใน `vercel.json` แล้วตรวจ ledger แบบ read-only ว่าต้อง backfill รางวัล Top 10 เดือนไหนหรือไม่
2. **Phase 5 ต่อราย surface:** เก็บ spinner/empty CTA/state และ mobile UX ที่ยังค้างตาม `doc/uxui-refactor-plan.md` เป็น batch เล็ก + เปิดดูจริง
3. **Phase 7 ก่อนเปิด Marketplace:** เก็บ commerce/admin trust · error/confirm/status flow; คง `marketplaceEnabled=false` จนผ่าน gate

## ⚠️ Gates / ห้ามเคลมเกินจริง
- แก้ `vercel.json` = แตะ config ต้องเบสอนุมัติ · backfill = เขียน DB จริง ต้อง audit period + idempotency และอนุมัติแยกก่อนรัน
- Phase 4 ยังไม่ใช่ “ศูนย์ spinner/empty CTA ครบทุกหน้า” — #92 ปิดเฉพาะ core loading/error; remainder อยู่ Phase 5
- `shared/EmptyState` กับ `kuma/KumaEmptyState` ยังมีสองบทบาท/สองระบบ; งานรวม `STATES-03` ยังไม่เข้า master และ PR #101 ไม่ใช่งานนี้
- Marketplace ยังปิด flag · Prisma drift/HoneyActionType/Pokémon data migration แตะ DB จริงและต้องอนุมัติแยก
- ต้อง eyeball มือถือจริงต่อ: dead-scroll (#88), menu alerts/addresses/billing (#95), picker portfolio/alerts (#98)

## 🔎 Verification ล่าสุด
- HEAD #102 บน branch docs นี้: `npm run test` = **56/56 ผ่าน** · `npm run lint` = **0 error / 32 warnings**
- PR #102: Vercel check/build ผ่าน + browser ตรวจหน้าแรก grid/Raw–PSA10/set link/actions ตาม PR
- ไม่รัน local build ซ้ำเพราะ dev server ทำงานอยู่ (กฎกัน `.next` cache/hydration เพี้ยน); ใช้ Vercel build ของ #102 เป็นหลักฐาน build

## กฎเหล็ก / บทเรียน
- **ห้าม push master ตรง** — branch+PR+merge · self-merge เฉพาะเบสสั่ง "merge" ชัดเจน
- **อย่ารัน `npm run build` ตอน dev server รันอยู่** — ทับ `.next` → hydration mismatch (dev cache, ไม่ใช่บั๊ก) · verify build ตอน dev ปิด หรือ restart dev หลัง build
- **เช็ค UI เอง** ผ่าน browser extension (dev localhost auth bypass) — ไม่โยน eyeball ให้เบสถ้าเข้าเองได้
- migrate = คงพฤติกรรม/data เดิม · adversarial review workflow ก่อน PR · **PRESERVE data color** (rarity/card/tier/legend) ตอนแตะสี

## แหล่งอ้างอิง
- **สถานะ phase ล่าสุด:** `PLAN.md` · **checklist แม่:** `doc/uxui-refactor-plan.md` · **หลักฐาน audit:** `doc/uxui-audit-findings-2026-07-04.md` (230 findings) · **kit canon:** `AGENTS.md` §Component Kit
