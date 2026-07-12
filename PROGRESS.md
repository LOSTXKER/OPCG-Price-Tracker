# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-07-12 — **แก้สัดส่วน Raw/PSA มือถือเสร็จ + สร้าง dev cache ใหม่แก้ API 404 แล้ว**

## ✅ ทำแล้ว

- **หน้าแรกมือถือ:** เลือกชุดอยู่เต็มแถว; Raw/PSA, Filter, List/Grid อยู่แถวเดียวกัน; Sort แยกเป็นแถวที่มีพื้นที่อ่าน label ครบ และไม่มี control ถูกบีบที่ 390px
- **FilterButton กลาง:** ใช้ไอคอน Sliders เดียว, radius/padding/fill เดียว, active/count state เดียว, hit area มือถือ 44px และ `aria-haspopup`/`aria-expanded` สำหรับ FilterModal
- **Filter adoption:** Home, Search, Watchlist, Marketplace, Drop Calculator และ card picker กลางใช้ FilterButton เดียวทั้งหมด
- **Sort adoption:** Home/Search/Watchlist/Public Profile ใช้ ToolbarSortDropdown กลาง; แสดง label ที่เลือกอยู่และใช้ surface muted แบบเดียวกับ utility controls
- **ViewModeControl ใหม่:** รวม table/list/grid icon + คำแปล + radiogroup/roving-tabindex/Arrow/Home/End ไว้จุดเดียว; ใช้ใน Home, Search, Watchlist, Marketplace และ Admin Cards
- **Responsive radius ที่ราก:** segmented track ใช้ outer radius `rounded-xl → lg`; segment และ action อย่าง Filter/Sort ใช้ inner radius `rounded-lg → md`; period/range แบบ pill ยังคง `rounded-full`
- **แก้ Filter ที่ดูเป็นวงกลม:** สาเหตุคือปุ่ม 44×44px ใช้ outer-track radius 16.8px แม้ไม่มี consumer override; ย้าย Filter/Sort กลางมาใช้ action radius 12px บนมือถือและ 9.6px บน desktop โดยไม่เพิ่ม prop/component
- **แก้กรอบ active ไม่ตรง track:** default SegmentedControl มือถือเลิก inset เฉพาะแนวนอน; segment แรก/สุดท้ายใช้ outer-side radius 16.8px ตรงกับกรอบนอก ส่วนมุมด้านในคง 12px และ desktop ยัง inset 4px/radius 9.6px เหมือนเดิม
- **แก้สัดส่วน Raw/PSA:** `PriceModeControl` มือถือใช้ track 160px และแบ่ง 50/50 (79px ต่อฝั่ง) จึงไม่มี active Raw ทรง 44×44px; ตั้งแต่ `sm:` กลับเป็น compact track ราว 125px แต่ยังแบ่งสองฝั่งเท่ากัน
- **ไม่เพิ่ม abstraction ซ้ำ:** ใช้ `fullWidth` ที่ `SegmentedControl` มีอยู่แล้วและจำกัด `w-40 sm:w-auto` ไว้ที่ `PriceModeControl`; ไม่บังคับ segmented control อีก 23 จุดให้กว้างเท่ากัน และไม่สร้าง component/prop/token ใหม่
- **FilterModal actions:** Close ใช้ IconButton; Reset/Apply ใช้ Button canonical จึงได้ focus/tap/disabled state ชุดเดียวกับเว็บ
- **Card picker:** ช่องค้นหา Drop Calculator ย้ายมาใช้ ToolbarSearch ทำให้ search + filter สูง/radius/surface เข้าชุดกัน
- อัปเดต `AGENTS.md` Component Kit ให้ประกาศ `ViewModeControl` เป็น canonical; ไม่เพิ่ม dependency/config/schema/migration
- **วิเคราะห์ Console ApiError 404:** ทำซ้ำได้ที่ Home/Search และ trace ถึง `/api/cards/sparklines`; dev server เดิมคืน HTML 404 ทั้งที่ route อยู่ใน manifest ขณะที่ production build ตอบ JSON 200
- **แก้โดยไม่กลบ error:** cold restart อย่างเดียวไม่พอ จึงหยุด server แล้วย้าย `.next/dev` ที่เสียไปไว้ `/tmp/meecard-next-dev-stale-20260712-160846` ให้ Next สร้าง cache ใหม่; ไม่แตะ `apiFetch`, `useSparklines` หรือ route handler เพราะ production code ถูกต้อง

## ✅ หลักฐาน verify ล่าสุด

- `npm run lint` — **0 errors**, 30 warnings เดิม
- `npm run test` — **19 files, 131/131 tests ผ่าน**
- `npx tsc --noEmit` — ผ่าน
- `npm run build` — ผ่าน, Next สร้าง **155 pages**
- Browser Home **390×844 / 768×1024 / 1440×900** ทั้ง Light/Dark — ไม่มี horizontal overflow; mobile control สูง 44px, track radius 16.8px และ segment/filter/sort radius 12px
- ที่ 768/1440: track radius กลับเป็น 12px และ segment/filter/sort 9.6px จึงคง density ของ desktop เดิม
- Browser spot-check ที่ 390px: Search, Watchlist, Marketplace, Drop Calculator card picker และ Admin Cards — control อยู่ในกลุ่มถูกต้อง ใช้ responsive radius ชุดเดียว และไม่ล้นจอ
- Interaction: Filter modal เปิด/ปิดด้วย Escape; ViewMode สลับด้วย Arrow; Watchlist sort menu แสดง active label และ Escape ปิดได้
- Fresh render หลังสร้าง `.next/dev` ใหม่: hydration mismatch หาย; console error = **0** ตลอด flow ที่ตรวจ
- Review-only ของ responsive-radius diff: ไม่พบ finding; mobile-first breakpoint และ pill behavior ถูกคงไว้
- หลังสร้าง cache ใหม่และ build/restart: Home ตอบ HTML 200; `sparklines`, `config/public`, `honey/ranks` และ `messages/unread-count` ตอบ JSON 200
- Browser หลังแก้ action shape: Home 390/768 และ Search/Watchlist/Marketplace 390 ใช้ hierarchy เดียวกัน, ไม่ล้นจอ และ console error = 0
- Browser active-edge: สลับ Raw↔PSA และ List↔Grid ที่ 390 แล้วขอบซ้าย/ขวาตรง track; เทียบ 768 แล้ว desktop geometry ไม่เปลี่ยน, no overflow และ console error = 0
- Browser price-mode proportion: ที่ 390 track = 160px และ Raw/PSA = 79/79px ทั้งสองสถานะ; ที่ 640/768 กลับเป็น compact track ราว 125px และแต่ละฝั่งราว 58px; ไม่มี horizontal overflow และ console error = 0
- Dev server ปกติรันอยู่ที่ `http://localhost:3001` หลัง verification

## ⚠️ ขอบเขตการตรวจ

- ไม่ได้รัน full 105-route smoke ซ้ำ เพราะการเปลี่ยนรอบนี้อยู่ที่ toolbar primitives + 8 consumer files; production build ครบ 155 pages และเปิดดูทุก surface ที่ migrate แล้วแบบ representative
- Browser ยังรายงาน warning เดิมเรื่อง `/meecard.png` aspect ratio และ LCP image บาง viewport; ไม่ใช่ error และอยู่นอก scope toolbar รอบนี้
- Build ยังมี warning เดิมเรื่อง `middleware` convention deprecated; lint warnings เดิม 30 จุดเป็นงานแยก
- 404 รอบล่าสุดเป็น stale Turbopack/dev route registry ไม่ใช่ API regression; production build route เดียวกันตอบ 200 จึงไม่เพิ่ม code/test ที่จะเพียงซ่อนอาการ

## ⏭️ NEXT

1. หลัง merge เข้า `master` ให้ตรวจ production deployment/smoke เมื่อ deployment พร้อม
2. งานแยกภายหลัง: image aspect/LCP warning, `middleware.ts` → `proxy.ts` และ lint warnings เดิม

## แหล่งอ้างอิง

- แผนแม่บท: `doc/uxui-refactor-plan.md`
- หลักฐาน audit: `doc/uxui-audit-findings-2026-07-04.md`
- Canonical kit: `AGENTS.md` §Component Kit
