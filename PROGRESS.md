# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-07-03 — **Mobile UX full audit ครั้งแรกด้วย browser จริง** (เบสสั่ง "ไปตรวจสอบให้ครบทุกหน้าทุกส่วนว่ามันรองรับมือถือหมดรึยัง รวมถึงประสบการณ์การใช้ UX จริงด้วย") — เจอบั๊กจริง 5 ตัว แก้แล้วครบ + เจอ 1 ตัวที่เป็น third-party library (ยังไม่แก้)

## แหล่งอ้างอิง
- **spec เต็ม:** `doc/mine-multigame-spec.md` · **VISION:** identity §1 (ห้ามเปลี่ยน) + IA §2

## ✅ เสร็จ session นี้ — Mobile UX audit ด้วย browser จริง (390×844) + แก้บั๊กที่เจอ

Session ก่อนๆ ทำ iOS chrome rollout (Batch 0–4, ดูสรุปด้านล่าง) โดยไม่มี browser tool เลย — รอบนี้ browser กลับมาใช้ได้ เลยเปิดจริงไล่ตรวจทุกหน้า user-facing (~30 หน้า) ที่ viewport มือถือจริง ผสมการอ่าน DOM ด้วย script (หา horizontal-overflow + จับ hydration error ที่ Next dev overlay เตือน) กับ screenshot สายตา + กด UX flow จริง (สลับแท็บพอร์ต, เปิด add-card dialog, คลิกการ์ดพอร์ต, ทดสอบตัวกรอง trending/search)

**บั๊กจริงที่เจอ + แก้แล้ว (5 ตัว):**
1. **`ScrollToTop` hydration error จริง** (`src/components/shared/scroll-to-top.tsx`) — regex เดิม `/^\/cards\//` เขียนไว้ก่อนมี URL namespace `/[game]/` เลยไม่ match `/opcg/cards/x` อีกต่อไป (ฟีเจอร์ "ซ่อนปุ่มบนมือถือหน้า card detail" เงียบๆ ใช้ไม่ได้มานาน) — ที่ร้ายกว่าคือ middleware **rewrite** (ไม่ใช่ redirect) ทำให้ server เห็น pathname ปลายทางที่ไม่มี prefix ในขณะที่ client เห็น URL จริงที่มี prefix → hydration mismatch จริง แก้โดย derive จาก `isGamePrefix()` ที่มีอยู่แล้ว + gate ด้วย `useHydrated()` ให้ first render ตรงกับ server เป๊ะก่อน แล้วค่อยแก้ไขหลัง mount
2. **`HeaderMobile` hydration error จริง** (`src/components/layout/header-mobile.tsx`) — lazy initializer เดิมอ่าน `window.scrollY` ตรงๆ ตอน render แรกดูปลอดภัยแต่ไม่ใช่: ถ้า browser scroll position เหลือ >8px ตอน mount (back/forward, scroll restoration) client กับ server จะได้คนละค่า — แก้ด้วย `useHydrated()` gate เดียวกัน
3. **Portfolio hub card มี "จุดตายที่แตะไม่ได้"** (`src/components/portfolio/portfolio-hub-card.tsx`) — การ์ดทั้งใบควรเป็น stretched-link แต่ div ที่ห่อชื่อ/ราคา และแถวรูปย่อ มี `relative z-10` ทำให้มันลอยทับ link ที่แท้จริง (`absolute z-0`) — **แตะตรงชื่อ/ราคาแล้วไม่ไปไหนเลย** ยืนยันจริงด้วยคลิกอัตโนมัติ (ครั้งแรก "Click target intercepted" หลังแก้นำทางสำเร็จ) — ถอด `relative z-10` ออกจาก div ธรรมดา (เหลือแค่เมนู "..." ที่ยังต้อง z-20 island เดิม)
4. **`/trending` มือถือ หน้าล้นแนวนอนจริง** — segmented control 3 ปุ่ม (label ยาว "การ์ดที่มีคนดูมากสุด") ไม่พอดี 390px และ **ทั้งหน้าเลื่อนแนวนอนได้จริง** (แย่กว่า scroll แบบมีขอบเขต) — ห่อด้วย `overflow-x-auto` แบบเดียวกับ pattern "tab-scroll" ที่มีอยู่แล้ว (card-detail section tabs, sets type-pills)
5. **`/search` มือถือ ตัวกรอง "ทุกชุด" บีบจนตัวหนังสือตัดบรรทัดซ้อนทับ** — `SetPicker` ใช้ `flex-1 min-w-0` ในแถว `flex-wrap` ร่วมกับตัวกรองอื่น พอพื้นที่ไม่พอมันไม่ยอม wrap ทั้งก้อน กลับถูกบีบจนแคบ — แก้ด้วย `basis-full sm:basis-auto` บังคับเอาทั้งแถวบนมือถือ

**เจอแต่ไม่แก้ (นอกขอบเขต/ต้องตัดสินใจเพิ่ม):**
- `DropdownMenuTrigger` hydration error จาก **third-party library** `@base-ui/react/menu` เอง (ไม่ใช่โค้ดเรา) — ขึ้นตอนเปิด `/portfolio` (เมนู "..." บนการ์ด) แนะนำเช็คเวอร์ชันใหม่ของแพ็กเกจก่อนลงมือ ไม่แตะ dependency รอบนี้
- Hardcoded breadcrumb "Home" ภาษาอังกฤษ (เจอซ้ำใน watchlist, trending, และอีก ~15 ไฟล์) — ส่วนหนึ่งของ backlog `R3 — i18n hardening` ที่มีอยู่แล้วใน PLAN.md ไม่ใช่บั๊กใหม่
- Portfolio "ผลงานดีที่สุด/แย่ที่สุด" โชว์การ์ดเดียวกันตอนมีแค่ 1 ใบที่มีต้นทุน (ถูกต้องตาม logic แต่อ่านแปลก — product call ว่าจะซ่อน "แย่ที่สุด" เมื่อ best===worst ดีมั้ย) ไม่ใช่บั๊กคำนวณผิด

**หน้าที่ตรวจแล้วสะอาด:** `/`, card detail, portfolio hub+detail (ครบ tab+dialog), `/watchlist`, `/sets`+`[code]`, `/settings`+account/billing, `/more` (มือถือ+desktop), `/honey`, `/decks`, `/drop-calculator`, `/deck-calculator`, `/compare`, `/pricing`, `/guide`, `/blog`
**หน้าที่ยังไม่ครอบคลุม (รอบหน้าไล่ต่อ):** settings sub อีก ~7 หน้า, `/register`, `/profile` (me+public), `/u/[handle]`, `/market-overview`, `/about`, `/contact`, `/coming-soon`, `/raffle/winners`, honey sub-tabs — `/login` เช็คแล้วพบว่า redirect ผู้ใช้ที่ login อยู่แล้วกลับ `/` ถูกต้องตามที่ตั้งใจ (ไม่ใช่บั๊ก)

**verify:** tsc 0 · lint 0 error (34 warning เดิม) · test 56/56 · build ✓ · impeccable detect [] (5 ไฟล์ที่แตะ) · curl smoke ทุก route ที่แก้ 200 · **verify ด้วย browser จริง** — screenshot ยืนยันภาพก่อน/หลังทุกจุด + คลิกทดสอบจริงยืนยัน fix การ์ดพอร์ต

## 📚 สรุปย่อ session ก่อนๆ (Mobile iOS rollout, Batch 0–4)
เบสยืนยันทิศ: **desktop คงของเดิมเป๊ะ · มือถือ (`<md`) เป็น iOS grammar** (large-title, frosted header, grouped-inset list, tab เป็น destination เสมอ) — rollout ตามลำดับ:
- **Batch 0**: ย้าย `GroupedSection`/`GroupedRow` เข้า production (`src/components/ui/grouped-list.tsx`, delegate ไปที่ `ListRow` เดิม)
- **Batch 1**: chrome มือถือ (`header-mobile.tsx` frost-on-scroll, `page-header.tsx` large-title, `bottom-nav.tsx` safe-area) + home/market thumbnail เป็น portrait
- **Batch 2**: `/settings` มือถือ flat-list → grouped-inset
- **Batch 3→4**: "เพิ่มเติม" จาก right-sheet drawer → **หน้าเต็ม `/more`** (ตามหลัก iOS HIG: tab ต้องนำทาง ไม่เปิด overlay) + จัด layout desktop กว้างเป็น 2 คอลัมน์
- **สำรวจแล้วไม่แตะ**: Watchlist/Portfolio/Card-detail ผ่าน mobile-first redesign มาก่อนหน้านี้แล้ว (P1–P2), ไม่ใช่ gap แบบ Settings — บังคับเข้า grouped-inset จะตัดฟีเจอร์ (checkbox/pin/multi-action) ทิ้งโดยไม่จำเป็น

รายละเอียดเต็มของแต่ละ batch อยู่ใน git log (commits `195f227`..`7b25b0e` บน branch `ui/sets-redesign`)

## ⏭️ NEXT
1. **ต่อ audit ให้ครบ**: หน้าที่ยังไม่ได้ตรวจ (list ด้านบน) — โดยเฉพาะ settings sub อีก 7 หน้า + `/profile` (custom layout เยอะ เสี่ยง overflow) + honey sub-tabs
2. **third-party hydration bug** (`@base-ui/react/menu` → `DropdownMenuTrigger`) — เช็คเวอร์ชันใหม่ก่อนจะลงมือ patch เอง
3. **เบสเปิดเว็บจริงช่วยยืนยัน**: มือถือ `/opcg/trending` (segmented control เลื่อนในกรอบตัวเอง) · `/opcg/search?q=...` (ตัวกรอง "ทุกชุด" เต็มแถว) · การ์ดในหน้า `/portfolio` แตะตรงชื่อ/ราคาได้จริง
4. `/proto/ios/*` ยังเก็บไว้เป็น reference (ยังไม่ลบ — ⚠️ ลบต้องถามเบสก่อน)
5. งานทั้งหมดอยู่บน branch `ui/sets-redesign` ยังไม่ merge เข้า master — ถ้าเบสดูแล้วโอเค ควรเปิด PR
