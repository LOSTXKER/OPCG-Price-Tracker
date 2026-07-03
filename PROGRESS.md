# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-07-03 — **`/more` ตัดหัวข้อ "เพิ่มเติม" ออก + ขยับ gutter มือถือทั้งเว็บ 16px→20px** (เบสบอกเนื้อหาติดขอบจอ)

## ✅ เสร็จล่าสุด — ตัดหัวข้อหน้า `/more` + เพิ่ม gutter มือถือทั้งเว็บ (16px → 20px)
เบสสั่ง 2 อย่าง: "(1) ดูเพิ่มเติมเอาหัวข้อคำว่าเพิ่มเติมออก (2) ทุกหน้าในมุมมือถือรู้สึกว่าควรขยับความกว้างเข้ามาหน่อย มันติดขอบจอไป"

1. **`/more` ตัดหัวข้อ H1 "เพิ่มเติม" ทิ้ง** (`more-client.tsx`) — ลบ `<PageHeader title=.../>` (import ด้วย) แทนที่ด้วย `pt-safe` เฉยๆ (การ์ดแรกเริ่มใกล้ status bar มากขึ้นแต่ยังมี `pt-8` จาก `PageContent` เดิมรองรับอยู่แล้ว ไม่ชนขอบจริง) เหตุผล: หน้านี้ไม่มี site header คลุมอยู่ด้านบนแล้ว (ตัดไปรอบก่อน) หัวข้อซ้ำจึงเป็น noise ไม่ใช่ identity ที่มีประโยชน์
2. **Gutter มือถือทั้งเว็บ 16px (`px-4`) → 20px (`px-5`)** — แก้ที่ต้นทาง `page-container.tsx` (`PageContainer` ตัวเดียวที่ทุกหน้าพึ่งพา) เปลี่ยน `px-4 md:px-6 lg:px-8` → `px-5 md:px-6 lg:px-8` (**เฉพาะมือถือ** md/lg เดิมไม่แตะ) — ตามด้วยจุดที่ hardcode `-mx-4`/`px-4` แบบ "cancel-then-reapply" (breakout pattern สำหรับแถวเลื่อนแนวนอน/full-bleed) ต้องอัปเดตให้ตรงกับฐานใหม่ ไม่งั้นจะเบี้ยว:
   - `grouped-list.tsx` (`GroupedSection`): default `px-4 sm:px-6` → `px-5 sm:px-6` (settings ใช้ pattern นี้)
   - `header-mobile.tsx`: `px-4` → `px-5` (ให้โลโก้/ไอคอน header ชิดกับขอบเนื้อหาด้านล่างพอดี ไม่งั้นจะเยื้องกัน 4px)
   - `settings/page.tsx`: `-mx-4`/`px-4` (h1) → `-mx-5`/`px-5`
   - `trending-tabs.tsx`, `sets-page-client.tsx`, `set-detail-content.tsx`, `market-overview-client.tsx`: แถวเลื่อนแนวนอน (type pills/rarity chips/top-cards) → `-mx-4`/`px-4` → `-mx-5`/`px-5`
   - หน้าโปรไฟล์สาธารณะ (`public-profile-client.tsx` + `profile-tabs-nav.tsx`) มี container อิสระของตัวเอง (ไม่ผ่าน `PageContainer` เพราะเป็น full-width route) ต้องแก้แยกให้ตรงกันด้วย
**verify:** tsc0/lint0(34 warning เดิม)/detect[]/test56/build✓ + browser จริงวัด gutter ตรงๆ ด้วย `getBoundingClientRect()` (ยืนยัน 20px ซ้าย-ขวาบน `/more`, header กับ content เท่ากันที่ 20px) + overflow-check บนหน้าที่มีแถวเลื่อนแนวนอน (`/opcg/trending`, `/opcg/sets`) ยัง `scrollWidth === clientWidth` (ไม่ล้น) + screenshot ยืนยันภาพหลาย ๆ หน้า (`/more`, `/settings`) + curl smoke ทุก route ที่แก้ 200

## ✅ เสร็จล่าสุด — ปรับ bottom-nav กลับเป็นแท็บธรรมดา + `/more` ไม่มี header/footer
เบสสั่ง: "เอาค้นหาออกดีกว่าเปลี่ยนเป็นปุ่มรายการโปรดธรรมดา ส่วนดูเพิ่มเติมเอา header ออก และ footer ออก" — 2 จุด:
1. **`bottom-nav.tsx`**: ถอดปุ่มค้นหาลอยเด่น (`SearchButton`) ที่เพิ่งทำไปทิ้ง แทนที่ด้วย `TabLink` ปกติ href `/watchlist` label `t(lang,"watchlistNav")`="รายการโปรด" icon `Bookmark` — หน้าตา/พฤติกรรมเหมือนแท็บอื่นทุกอย่าง (active state, ขนาดเท่ากัน ไม่มีการลอย) ลำดับใหม่: หน้าแรก · ชุดการ์ด · รายการโปรด · พอร์ตโฟลิโอ · เพิ่มเติม
2. **`/more` ตัด header+footer ทิ้ง** (คง bottom-nav ไว้ เพราะยังเป็นปลายทางของแท็บ) — refactor `main-chrome.tsx`: เดิม `MainChrome` เป็นตัวเดียวคุมทั้ง Header/Footer/BottomNav (all-or-nothing ตาม `CHROMELESS_ROUTES`) ต้องแยกออก:
   - เพิ่ม `SiteChrome` (component ใหม่) — ซ่อนเมื่อ `CHROMELESS_ROUTES` **หรือ** `NO_HEADER_FOOTER_ROUTES` (list ใหม่ = `["/more"]`) → ใช้ห่อ `<Header />` และ `<Footer />` ใน `layout.tsx`
   - `MainChrome` เดิมเหลือห่อแค่ `<BottomNav />` — ซ่อนเฉพาะ `CHROMELESS_ROUTES` เท่านั้น (ไม่โดน `/more` เพราะยังต้องโชว์)
   - เหตุผล: `/more` มีลิงก์ไปทุกที่อยู่แล้วในตัวมันเอง (Browse/Track/บัญชี ฯลฯ) + มี `PageHeader` title ของตัวเองอยู่แล้ว → header/footer ของเว็บซ้ำซ้อนจริง
   - หน้าอื่นทั้งหมดไม่กระทบ (ยังมี header+footer+bottomnav ครบเหมือนเดิม)
- ⚠️ **เจอปัญหา dev server cache อีกรอบ** (ครั้งที่ 3 ใน session นี้) — แก้โค้ดแล้ว curl/browser ยังเห็นของเก่า ทั้งที่ compile log บอกว่า compile ผ่าน สงสัยว่า root `layout.tsx`/shared chrome ไฟล์ HMR ไม่ reliable เท่าไฟล์ระดับ page → แก้โดย **`rm -rf .next` (ทั้งโฟลเดอร์ ไม่ใช่แค่ `.next/dev`) + restart dev server ใหม่ทั้งหมด** ถึงจะเห็นผลถูกต้อง — ถ้าเจอ pattern นี้อีกให้ทำตามนี้ทันที ไม่ต้องเสียเวลาสืบโค้ด
**verify:** tsc0/lint0(34 warning เดิม)/detect[]/test56/build✓ (`/more` prerender static) + browser จริงหลัง restart สะอาด: `/more` มือถือ**ไม่มี**หัวเว็บ/ท้ายเว็บเลย (screenshot ยืนยัน) มีแค่ bottom-nav + เนื้อหาของหน้า · `/more` desktop เหมือนกัน (ไม่มี header/footer แต่ bottom-nav ก็ไม่โชว์เพราะเป็น `md:hidden` เดิม — desktop ไม่มีทางเข้า `/more` อยู่แล้วไม่กระทบใคร) · หน้าแรก `/` มือถือ+desktop ยังมี header/footer/bottom-nav ครบเหมือนเดิม (ไม่ regression) · curl smoke ทุก route ที่แก้ 200

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
