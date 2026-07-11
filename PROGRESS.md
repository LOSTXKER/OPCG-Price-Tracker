# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-07-11 — **UX/UI refactor P0–P3 เสร็จและ verify แล้ว** บน branch `codex/uxui-refactor-work` · รอ commit/push/PR/merge ตามคำสั่งเบส

## ✅ ทำแล้ว

- **P0 — usability blockers:** ปรับ Light contrast, แยกสีกราฟ/ข้อความสถานะ, loading มี success/empty/error/retry/timeout, commerce ไม่ค้าง spinner, dialog/search/form/skip-link/language/ARIA/keyboard semantics ครบขึ้น
- **P1 — interaction kit:** จุดกดมือถือ/แท็บเล็ตหลัก ≥44px, `SegmentedControl` roving tabindex + Arrow/Home/End, `Pagination` กลาง, horizontal affordance และ Admin table มี list fallback ใต้ 640px
- **P2 — dedup/structure:** รวม EmptyState/Kuma, picker, plan comparison, Popover, settings header/skeleton; แยก card detail เป็น model + identity/price/chart/navigation/sticky-buy โดยคงหน้าตาและ behavior
- **P3 — route/polish:** game namespace allowlist, canonical `/opcg/*`, marketplace guards UI/API, canonical internal links, LCP image priority, reduced-motion coverage
- เก็บ regression ที่พบจาก browser จริง: header 768px ล้น, chat 390px ล้น, Admin cards ยาวเกิน, bottom-nav bleed, command dialog focus restore, Blog table fallback และ Recharts SSR warning
- อัปเดต canonical component kit ใน `AGENTS.md`; ไม่เพิ่ม dependency/config/schema/migration

## ✅ หลักฐาน verify ล่าสุด

- `npm run lint` — **0 errors**, 30 warnings เดิม (ส่วนใหญ่ `<img>` ใน admin/proto และ `.codex` scripts)
- `npm run test` — **13 files, 106/106 tests ผ่าน**
- `npx tsc --noEmit` — ผ่าน
- `npm run build` — ผ่าน, Next สร้าง **155 pages**; เหลือ warning เดิมว่า middleware convention deprecated
- Production route smoke — **105/105 non-`/proto` routes ตอบ 200**, ไม่มี 5xx และไม่มี server error log
- Route boundary — `/opcg/admin`, `/pokemon/cards/*`, `/all/cards/*`, `/opcg/pricing` = 404; legacy `/cards/*` และ `/sets/*` redirect ไป canonical; `/opcg/portfolio` redirect กลับ unified `/portfolio`
- Browser matrix — 390×844, 768×1024, 1440×900; Light/Dark; ไม่มี horizontal overflow ในหน้าตัวแทน Home, Card, Messages, Marketplace, Saved, Pricing, More และ Admin tables
- Keyboard/dialog — ArrowRight/Home/End เปลี่ยน segmented selection ถูก; Escape ปิด dialog และคืน focus; dialog ใช้ Base UI focus trap; console error = 0
- Marketplace flag เปิดใน local ระหว่างตรวจ; Saved/Messages มี success/empty/error/retry และไม่เหลือ spinner ค้าง

## ⚠️ ไม่ใช่ blocker ของงานนี้

- Login เต็ม flow ต้องตรวจซ้ำเมื่อปิด auth bypass; local รอบนี้ใช้ session bypass ตามแผน
- `/proto` 10 routes และ export files ถูกตัดออกตาม scope
- Next แนะนำย้าย `middleware.ts` → `proxy.ts`; เป็น convention/config migration แยกงาน ไม่ทำปน refactor นี้
- Lint warnings เดิม 30 จุดยังไม่ใช่ error และส่วนใหญ่ไม่อยู่ใน scope P0–P3

## ⏭️ NEXT

1. Commit และ push branch `codex/uxui-refactor-work`
2. เปิด PR, รอ/ตรวจ CI แล้ว merge เข้า `master` (ห้าม push master ตรง)
3. หลัง deploy ให้ยิง production smoke สั้นอีกครั้ง โดยเฉพาะ auth จริงและ Marketplace flag

## แหล่งอ้างอิง

- แผนแม่บท: `doc/uxui-refactor-plan.md`
- หลักฐาน audit: `doc/uxui-audit-findings-2026-07-04.md`
- Canonical kit: `AGENTS.md` §Component Kit
