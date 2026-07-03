# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-07-03 — **Bottom-nav มือถือ: relabel + เอาเด็คออก + เพิ่มปุ่มค้นหาเด่นตรงกลาง** (เบสสั่งตรงๆ) ต่อจาก breadcrumb→back-button work ก่อนหน้า

## ✅ เสร็จล่าสุด — Bottom-nav มือถือ: ปรับ label + ตัดแท็บเด็ค + ปุ่มค้นหาเด่นตรงกลาง
เบสสั่ง: "ตลาดเปลี่ยนเป็นหน้าแรก · เรียกดูเปลี่ยนเป็นชุดการ์ด · เอาเด็คออก · เพิ่มปุ่มค้นหาแทนตรงกลางเด่นๆ" — แก้ที่ `src/components/layout/bottom-nav.tsx` ไฟล์เดียว:
- แท็บ 1 (`/`): label `t(lang,"market")`="ตลาด" → `t(lang,"home")`="หน้าแรก" (ใช้ i18n key ที่มีอยู่แล้ว ไม่เพิ่ม key ใหม่)
- แท็บ 2 (`/sets`): label `t(lang,"browse")`="เรียกดู" → `t(lang,"sets")`="ชุดการ์ด" (key มีอยู่แล้ว ใช้ตรงกับ header desktop nav)
- **ตัดแท็บ "เด็ค" (`/decks`) ออกจาก bottom-nav** — ⚠️ นี่คือการแก้ไข IA ที่เคย "freeze 5 tab" ไว้ตอน P0a (2026-06-13) เบสสั่งเปลี่ยนตรงๆ รอบนี้ · หน้า `/decks` เองยังอยู่ปกติ เข้าถึงได้ผ่าน command search/header เหมือนเดิม แค่ไม่ใช่ bottom-nav tab อีกต่อไป
- **เพิ่มปุ่มค้นหาตรงกลาง** แทนที่ตำแหน่งเดิมของเด็ค — ไม่ใช่ `TabLink` (ไม่ใช่หน้า เป็น action) แต่เป็นวงกลม `size-14 bg-primary` ลอยเหนือแถบด้วย `-mt-6` + `shadow-lg` + `ring-4 ring-background` (ตัด edge ให้ดูลอยจริงจากแถบด้านหลัง ไม่ใช่แค่วงกลมแบนอยู่ในแถว) กดแล้วเรียก `setSearchOpen(true)` — ใช้ `CommandSearchModal` ตัวเดียวกับ header (mount ที่ root layout อยู่แล้ว เปิดจากที่ไหนก็ได้ผลเหมือนกัน ไม่มี state/data path ใหม่)
- ลำดับใหม่: หน้าแรก · ชุดการ์ด · **(ค้นหา)** · พอร์ตโฟลิโอ · เพิ่มเติม — ยังคง 5 slot เท่าเดิม (ไม่กระทบ layout width)
**verify:** tsc0/lint0/detect[]/test56/build✓ + browser จริง: screenshot ยืนยันปุ่มค้นหาลอยเด่นสีทองกลางแถบ + คลิกทดสอบจริงเปิด command search สำเร็จ + curl `/opcg/decks` ยังเข้าได้ปกติ (200)

## ✅ เสร็จล่าสุด (ต่อ) — ปุ่มย้อนมือถือ = ไอคอนวงกลมล้วน (เบสเคาะขั้นสุดท้าย)
วิวัฒนาการ 3 ขั้นตามที่เบสเคาะทีละรอบ: text link → pill มีชื่อหน้าแม่ → **ไอคอนล้วน** ("ใช้เป็นปุ่มย้อนให้หมดเลยเหมือนกัน แล้วไม่ต้องมีคำอะไร"):
- ปุ่มสุดท้าย: วงกลม `size-9 rounded-full` + chevron สี honey ไม่มีข้อความ — **หน้าตาเหมือนกันทุกหน้าลูกลึก** (portfolio detail → `/portfolio`, card detail → หน้า set, set detail → `/sets`, blog post → `/blog` ฯลฯ derive อัตโนมัติจาก breadcrumb items) · รอบสุดท้ายเบสบอก "กลืนพื้นหลัง" → ยกขึ้นเป็น `bg-card` + hairline border + `shadow-sm` (ลอยจากพื้นครีมแบบเดียวกับ icon button อื่นในแอป)
- ⚠️ ระหว่างทางเจอ **dev server เก่า (เปิดค้างตั้งแต่ 20 มิ.ย.) watcher ตาย ไม่ compile ไฟล์ที่แก้** — เบสเห็นปุ่มเวอร์ชันเก่าทั้งที่โค้ดใหม่แล้ว · แก้โดย restart dev server + `rm -rf .next/dev` (server ใหม่รันเป็น background job แล้ว)
- ชื่อหน้าแม่ยังอยู่ใน `aria-label`+`title` (screen reader + long-press ยังรู้ว่าย้อนไปไหน)
- card detail: ถอด mobile meta `OP01 · OP01-001 · L` ที่ซ้ำกับ identity chips ใต้ชื่อการ์ดทิ้งไปแล้วในรอบก่อน
- desktop ไม่เปลี่ยนทุกรอบ — trail เต็มเหมือนเดิม
**verify:** tsc0/lint0/detect[]/test56/build✓ + browser จริง: screenshot card detail เห็นวงกลม chevron สะอาด · portfolio detail ยืนยัน DOM (36×36, ไม่มี text, aria-label ถูก, href ถูก) · desktop trail เต็ม

## ✅ เสร็จก่อนหน้า — Breadcrumb: ซ่อนบนมือถือ + ปุ่มย้อนแบบ iOS สำหรับหน้าลูกลึก

แก้ที่ `src/components/shared/breadcrumb.tsx` ที่เดียว (ทุกหน้าที่ใช้ ~30 จุดได้ผลพร้อมกัน):
- **Desktop (≥md)**: เส้นทางเต็ม Home > Section > Current เหมือนเดิมเป๊ะ
- **มือถือ (<md)**: ไม่มีเส้นทางอีกต่อไป (iOS ไม่มี breadcrumb · NN/g ชี้ว่าเปลืองพื้นที่แนวตั้งบนจอเล็ก · bottom-nav บอก section อยู่แล้ว) — หน้าลูกลึก (≥3 ชั้น เช่น `/portfolio/[id]`, `/sets/[code]`, blog post) ได้ **ปุ่มย้อน `< หน้าแม่`** ตัวเดียวแบบเดียวกับที่ settings sub-pages ใช้อยู่แล้ว · หน้าแท็บหลัก (Home > X แค่ 2 ชั้น) ไม่ render อะไรเลยบนมือถือ
- ตัดสินใจเรื่องปุ่มย้อน: **มีเฉพาะหน้าลูกลึก** — derive อัตโนมัติจาก items (≥3 → ลิงก์ไป items[len-2]) ไม่ต้องแก้ per-page · settings sub-pages มี back ของตัวเองอยู่แล้ว (breadcrumb ของมันมี 2 ชั้น เลยไม่ซ้ำ)
- `card-detail.tsx`: ขยับ boundary ของ breadcrumb/meta ตัวเอง `sm:`→`md:` ให้ตรงกับ chrome boundary ของ Breadcrumb ใหม่ (มือถือคงโชว์ compact meta `OP01 · OP01-001 · L` ที่มีประโยชน์กว่า back link บนหน้าเทรด)
- ห่อทั้งคู่ใน `<div>` เดียว (ไม่ใช่ fragment) กัน `space-y-*` ของ parent เห็น 2 children แล้ว margin เบิ้ล
- SEO ไม่กระทบ — rich result ใช้ `BreadcrumbList` JSON-LD ที่ฉีดแยก ไม่ผูกกับ markup ที่มองเห็น

**verify:** tsc 0 · eslint 0 · impeccable detect [] · test 56/56 · build ✓ · **browser จริงครบ 4 กรณี**: มือถือ `/portfolio/1` เห็นปุ่ม `< พอร์ตโฟลิโอ` (screenshot ยืนยัน) · มือถือ `/watchlist` ไม่มีทั้ง trail และ back (ถูกต้อง — เป็นแท็บหลัก) · มือถือ card detail คงเห็น compact meta · desktop `/watchlist` เห็น trail เต็มเหมือนเดิม

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
