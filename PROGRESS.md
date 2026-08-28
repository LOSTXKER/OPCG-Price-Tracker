# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-08-29 (เช้ามืด) — ✅ **หน้าแรกมือถือโฉมใหม่ + แถบล่างปุ่มค้นหากลาง อยู่บน branch `claude/mobile-home-layout-c8d6e8` แล้ว** (verify ครบ · ยังไม่ merge master รอเบสดูก่อน)

## รอบนี้ทำอะไร

เบสถาม "หน้าแรกมือถือจัดให้สวยกว่านี้ได้มั้ย" → ทำหน้าเทียบ `/proto/mobile-home` ให้เลือก (ผ่าน 7 รอบฟีดแบ็ก) → เบสเคาะ **โครงแบบ A "จัดระเบียบ" + แถบล่างแบบ "กลาง 5"** (ปุ่มค้นหานูนกลางแถบล่าง · รายการโปรดขึ้นเป็นไอคอนหัวใจบน navbar) → **ย้ายเข้าโค้ดจริงเสร็จแล้ว**

### สิ่งที่เปลี่ยนบนเว็บจริง (มือถือเท่านั้น · desktop ไม่แตะ)

1. **แถบล่าง** (`bottom-nav.tsx`) — 4 แท็บ + **ปุ่มค้นหาทรงกลมนูนกลางแถบ** (2+FAB+2 ให้อยู่กึ่งกลางเป๊ะ) · FAB เป็น `<button>` เปิด search modal ผ่าน `setSearchOpen` ไม่ใช่ลิงก์ (ไม่พาออกจากหน้าที่อ่านอยู่ · ไม่มี active state) · รายการโปรดออกจากแถบ
2. **navbar มือถือ** (`header-mobile.tsx`) — ถอดปุ่มค้นหา (ย้ายลงล่าง) ใส่ **ไอคอนหัวใจ → `/watchlist`** เสียบช่องเดิม ความกว้างแถวเท่าเดิมเป๊ะ
3. **Hero** (`home-search-hero.tsx` + `lib/seo/copy/home.ts`) — ถอด `px-4` ที่ซ้อน gutter · โปรยยาว 4-5 บรรทัดแตกเป็น **โปรยสั้น + บรรทัด meta** (`3,838 ใบ · 51 ชุด · อัปเดตล่าสุด <วันจริง>`) · เพิ่มฟังก์ชัน `buildHomeHeroMeta` · คง keyword "การ์ดวันพีช"/OPTCG และไม่มีคำสัญญา schedule
4. **แถบชุด** (`home-set-strip.tsx`) — บรรทัดคำอธิบายใต้หัวซ่อนเฉพาะ `<sm` (desktop คงเดิมทุกอย่าง รวมลูกศร)
5. **แถบควบคุม 3→2 แถว** (`home-market-overview.tsx` + `mobile-sort-cluster.tsx` ไฟล์ใหม่) — แถว 1 = เลือกชุด + ตัวกรอง + มุมมอง · **แถวติดหนึบ = ราง grade + ชุดเรียง** (ราคา | เปลี่ยนแปลง + ปุ่มช่วงเวลากดวน 24h→7d→30d แบบ CMC) · แถว period pill เดิมหายทั้งแถว · sticky ใช้ token `z-sticky` แทน `z-10`
6. **ขอบเดียว 20px ทั้งหน้า** — `MarketTable` เพิ่ม prop `mobileFlush` (opt-in `-mx-4` หักล้าง `px-4` ของแถว) หน้าแรกเปิดใช้ · **หน้าค้นหาไม่กระทบ** · Pagination ตามขอบเดียวกัน
7. **โฆษณาลอย** (`floating-bottom-ad.tsx` + `globals.css`) — ยกขึ้น 1.75rem ให้พ้นปุ่มค้นหานูน (เดิมทับกัน) + ปรับ `--floating-ad-clearance` และเพิ่ม breakpoint `md` ที่ไม่มีแถบล่างแล้ว

**ผลที่วัดได้จริง: แถวราคาแรกจาก 608px → 496px (เร็วขึ้น 112px ≈ 2 แถว)** — วัดเทียบ production ปัจจุบันที่ 375×812

### Verify (ครบตาม SPEC discipline)

tsc ผ่าน · `npm run lint` **0 errors** (26 warnings เดิม/นอก scope) · `npm run test` **154 ไฟล์ / 924 ข้อผ่าน** · `npm run build` **214 หน้า** · เปิดจริง 375×812 Dark+Light: ขอบซ้าย 20px ตรงกันทุกบล็อก (h1 · meta · h2 · pill แรก · SetPicker · ราง grade) · ราคาชิดขวา 355 = ป้ายเรียง 354 · sticky dock 56px พอดี · FAB **hit-test ผ่าน** (`elementsFromPoint`) + เปิด modal + โฟกัสช่องพิมพ์จริง · หัวใจ 44px ไป watchlist · console 0 error · Light mode ปุ่มค้นหาใช้สีเดียวกับ CTA หลักของเว็บ (`#73533e` ขาวบนน้ำตาล ผ่าน AA) · desktop 1280px ครบเหมือนเดิม (ตาราง · ราง grade 1 ตัว · chrome มือถือซ่อนหมด)

**เทสต์:** เพิ่ม `src/components/home/mobile-home-layout.test.tsx` (6 ข้อ ล็อก: gutter เดียว · 2 แถว · z-sticky · period อยู่ในชุดเรียง · hero แยก meta + ห้ามสัญญา schedule · strip ซ่อนบรรทัดรองเฉพาะมือถือ) · อัปเดต `header-search-preferences.test.tsx` + `header-catalog-control.test.tsx` ที่เคยล็อกว่าค้นหาต้องอยู่บน header มือถือ → เปลี่ยนเป็นล็อกกติกาใหม่ (ค้นหาอยู่แถบล่างจุดเดียว · หัวใจอยู่ header)

**บทเรียนที่ได้ระหว่างทาง (จากบั๊ก proto):** ทดสอบ floating control ต้องเช็ค `elementsFromPoint` + เผื่อ `safe-area` เสมอ · JS `.click()` ข้าม hit-test จึงให้ผลหลอก · Next.js 16 dev server บล็อก `/_next/*` เมื่อเข้าผ่าน LAN IP (มือถือได้ HTML เปล่า กดอะไรไม่ติด) → ดูบนมือถือต้องใช้ production build หรือเพิ่ม `allowedDevOrigins`

## สถานะ git

- branch `claude/mobile-home-layout-c8d6e8` — **merge `origin/master` เข้ามาแล้ว** (master มี 13 commit ใหม่จากอีก session: navbar แบบ C · แถบชีพจร · popup ค้นหา CMC · แถบชุดหยุดไหล) conflict มีแค่ PROGRESS.md
- ไม่มี schema / dependency / config change
- `/proto/mobile-home` **ยังอยู่** — เก็บไว้ให้ย้อนดูแบบที่ไม่ได้เลือก ลบเมื่อเบสรับงานแล้ว (PLAN: MHOME-07)

## NEXT

1. **เบสดูของจริง** — บนเครื่องนี้เปิด `http://localhost:52861` ได้เลย · ถ้าจะดูบนมือถือต้อง `npm run build && npm run start` แล้วเปิดผ่าน IP (dev server บล็อก JS ข้ามเครื่อง)
2. เบสรับงาน → **เบสสั่ง merge เข้า master เอง** (repo ต่อ Vercel) + ลบ `/proto/mobile-home`
3. ถ้าอยากได้เพิ่มทีหลัง: แถบไฮไลต์ตลาดบนมือถือ (แบบ B ที่ไม่ได้เลือก) โค้ดยังอยู่ที่ `src/app/proto/mobile-home/components/proto-highlight-strip.tsx`
