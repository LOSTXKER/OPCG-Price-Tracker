# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-07-03 — **Mobile iOS rollout: Batch 4 — "เพิ่มเติม" เปลี่ยนจาก sheet เป็นหน้าเต็ม `/more`** (เบสถาม "หน้าเต็มดีกว่ามั้ยตามหลัก" → ตอบ: ใช่ ตาม iOS HIG แท็บต้องเป็น destination → ดำเนินการ)

## แหล่งอ้างอิง
- **spec เต็ม:** `doc/mine-multigame-spec.md` · **VISION:** identity §1 (ห้ามเปลี่ยน) + IA §2

## ✅ เสร็จ session นี้ — Batch 4: "เพิ่มเติม" = หน้าเต็ม `/more` (แทน sheet)

ตามหลัก iOS HIG แท็บใน tab bar ต้องเป็น "ที่หมาย" ที่กดแล้วนำทาง ไม่ใช่ปุ่มเปิด overlay — เดิมมีแค่แท็บ "เพิ่มเติม" ตัวเดียวที่เปิด drawer ขวา (มรดก hamburger menu ของเว็บ) ตอนนี้แก้ให้สอดคล้อง:
- **สร้าง `/more`** (`src/app/more/page.tsx` + `more-client.tsx`) — เนื้อหาเดียวกับ sheet ที่เพิ่งทำใน Batch 3 (user card → Browse → Track → บัญชีของฉัน → Preferences → footer → sign out ด้วย `GroupedSection`/`GroupedRow`) แต่เป็นหน้าเต็ม: มี URL จริง (back/refresh/แชร์ได้), large title จาก `PageHeader`, พื้นที่เต็ม 390px, `max-w-2xl` บน desktop · ใช้ `useHeaderData`+`usePublicConfig` ชุดเดียวกับ header เดิม (ไม่มี data path ใหม่) · ตัด prop `active` ทิ้ง (อยู่หน้า `/more` ไม่มีปลายทางอื่น active ได้)
- **`bottom-nav.tsx`**: แท็บ "เพิ่มเติม" เปลี่ยนจาก `<button toggleMenu>` (มี X ตอนเปิด) → `TabLink href="/more"` เหมือนแท็บอื่นทุกประการ (badge ข้อความยังอยู่)
- **ลบ `mobile-menu-sheet.tsx`** (superseded — git history เก็บไว้ที่ commit `ea4b02d`) + ถอด `MobileMenuSheet` ออกจาก `header.tsx` + ลบ `mobileMenuOpen`/`toggleMobileMenu`/`setMobileMenuOpen` ที่ตายแล้วออกจาก ui-store
- `/more` เป็น flat route (ไม่อยู่ใน `GAME_SCOPED_SEGMENTS`) → ไม่โดน middleware redirect · ได้ chrome เต็ม (header/bottom-nav/bottom padding) จาก `PageContent` ปกติ

**verify:** tsc 0 · eslint ไฟล์ที่แตะ 0 · test 56/56 · build ✓ (route `/more` ขึ้น static) · impeccable detect [] · curl `/more` 200 + render "เพิ่มเติม" จริง · `/`,`/portfolio`,`/settings` 200

## เสร็จก่อนหน้าใน session — Batch 3: "More" sheet (bottom-nav) → grouped-inset (ถูกแทนด้วย Batch 4 แล้ว)

`mobile-menu-sheet.tsx` (drawer ที่เปิดจากแท็บ "เพิ่มเติม" ใน bottom-nav — surface มือถือแท้ๆ ตัวสุดท้ายที่ยังเป็น flat list) เขียนใหม่เป็น **grouped-inset table view** เต็มรูปแบบตาม `/proto/ios/more`:
- User block เป็นการ์ดของตัวเอง (avatar 44px + email + tier + honey) กดแล้วไป `/settings` · ปุ่ม login/register (logged-out) คงเดิม
- ทุก section (Browse · Track · My Account · Preferences · footer · sign out) → `GroupedSection`/`GroupedRow` พร้อม icon-in-circle สี semantic (`bg-info-soft text-info` ฯลฯ ชุดเดียวกับ proto)
- **พฤติกรรมเดิมครบทุกอย่าง**: auth-gated sections · marketplace flag gating · badge จำนวนข้อความ (ย้ายเข้า trailing slot) · honey pending dot · Select ภาษา/สกุลเงินเดิม · theme toggle (เปลี่ยนจากปุ่มเป็นแถวกดได้ทั้งแถว) · close-on-navigate + close-on-route-change
- ปรับ primitive 3 จุดเล็กๆ ระหว่างทาง (backward-compatible ทั้งหมด):
  - `ListRow`: `href`+`onClick` ใช้ร่วมกันได้แล้ว (Link ที่มี click handler — จำเป็นสำหรับปิด sheet ตอน navigate; เดิม onClick ถูกเมินเงียบๆ ถ้ามี href)
  - `GroupedRow`: เพิ่ม prop `active` (highlight หน้าปัจจุบันใน nav menu — honey tint title+icon)
  - `GroupedSection`: เพิ่ม `className` override (sheet กว้าง 320px ต้องใช้ `px-4` คงที่ ไม่เอา `sm:px-6` bump)
- Sheet พื้นหลังเปลี่ยนเป็น `bg-muted/30` (light) ให้การ์ดขาวลอยแบบ iOS Settings จริง · กว้างขึ้น 300→320px รับ icon circles

**verify:** tsc 0 · eslint 3 ไฟล์ที่แตะ = 0 · test 56/56 · build ✓ · impeccable detect [] · curl smoke `/`,`/settings`,`/watchlist`,`/portfolio` 200 + `/sets`→307→`/opcg/sets` 200 (redirect ปกติของ game namespace)

## เสร็จก่อนหน้าใน session — Batch 2: Settings/More มือถือ → grouped-inset list

`src/app/settings/page.tsx` มือถือ (`md:hidden` เท่านั้น — desktop sidebar+content ไม่แตะเลย): เดิมเป็น flat link list (ไอคอนเทา + ข้อความ) → เปลี่ยนเป็น **grouped-inset table view** จริงตาม `/proto/ios/more` ที่พิสูจน์แล้ว — ใช้ `GroupedSection`/`GroupedRow` ที่ย้ายเข้า production ตั้งแต่ Batch 0:
- Identity row (avatar+ชื่อ+tier badge) ห่อด้วย `GroupedSection` เป็นการ์ดของตัวเอง (เดิมเป็น plain link แถวเดียว)
- 2 กลุ่ม "ทั่วไป"/"เพิ่มเติม" (จาก `SETTINGS_SECTIONS` เดิม ไม่เพิ่ม/ลด section) → `GroupedRow` ต่อแถว (icon-in-circle + chevron + ≥52px tap target แทน icon เทาแบนๆ)
- Title `text-h1` → `.text-large-title` (ใช้เฉพาะ branch มือถือ ไม่ต้องพึ่ง media-query fallback เพราะ desktop เรนเดอร์คนละ branch อยู่แล้ว)
- ไม่เพิ่ม i18n key ใหม่ (ใช้ label เดิมทั้งหมด) · ไม่แตะ logic/data (`useProfileData` เหมือนเดิม)

**verify:** tsc 0 · lint 0 err (34 warning เดิม) · test 56/56 · build ✓ (`/settings` prerender สำเร็จ) · impeccable detect [] (`settings/page.tsx`) · curl smoke `/`,`/settings`,`/watchlist`,`/portfolio`,`/opcg/cards/OP01-001` ทั้งหมด 200

## 🔍 สำรวจ batch ถัดไป (card detail / portfolio / watchlist) — สรุป: **ไม่แตะเพิ่มรอบนี้**
อ่านโค้ดจริงทั้ง 3 หน้าก่อนแก้ (กันมั่วดะ) แล้วพบว่า **ต่างจาก Settings ตรงที่ทั้ง 3 หน้านี้ผ่าน mobile-first redesign มาแล้วรอบก่อนๆ (P1–P2 ใน PLAN.md)** ไม่ใช่ flat-list แบบ Settings ที่เพิ่งพบปัญหา:
- **Watchlist** (`watchlist-list-view.tsx`): thumbnail เป็น portrait `aspect-[63/88]` อยู่แล้ว, toolbar เป็น dense data-toolbar (search/sort/filter dropdown/bulk-select) ที่ wrap ได้ดีอยู่แล้ว ไม่ใช่ horizontal-scroll anti-pattern — บังคับเข้า `GroupedRow` primitive จะ**ตัดฟีเจอร์ checkbox/pin/alert/actions-menu ทิ้ง** (ไม่มีที่ใส่ใน `GroupedRow` ซึ่งออกแบบมาสำหรับ navigation row เดียว ไม่ใช่ multi-action row) → เสี่ยง regression ไม่คุ้ม
- **Portfolio hub** (`portfolio-hub-card.tsx`) + **detail** (`portfolio-detail-client.tsx`): thumbnail portrait อยู่แล้ว, มี dashboard hero/switcher/tabs/hero-panel/allocation ครบตาม proto v3 ที่ต้องการอยู่แล้ว (เป็นผลจาก "Hub+Detail split" + "Panel restore" session ก่อนหน้า) — เป็นหน้า data-dense (ตาราง/สถิติ) ไม่ใช่ navigation menu จึง**ไม่เข้ากับ grouped-inset grammar** (นั่นสำหรับ Settings-style list เท่านั้น)
- **Card detail**: ผ่าน "world-class pass" มา 8 รอบแล้ว (ดู PLAN.md §Card detail) เป็นหน้าเทรดที่ซับซ้อนสุดในเว็บ แตะเพิ่มโดยไม่มี browser เปิดดูจริง = เสี่ยงสูงเกินไป
- **สิ่งที่ทั้ง 3 หน้าได้ "ฟรี" ไปแล้วจาก Batch 1**: title ใหญ่แบบ iOS (`PageHeader`→`.text-large-title`) + header โปร่งใส/frost ตอน scroll (`header-mobile.tsx`) เพราะเป็น chrome กลางที่ทุกหน้าใช้ร่วมกัน

**สรุปคือ Settings/More เป็นหน้าเดียวที่มีช่องว่างจริงระหว่าง grammar เดิมกับ iOS grammar** (flat list vs grouped-inset) — หน้าที่เหลือดีอยู่แล้วจากงาน redesign รอบก่อนๆ, บังคับเปลี่ยนต่อจะเป็นการ "ปรับเพราะอยากปรับ" ไม่ใช่แก้ gap จริง

## เสร็จรอบก่อน — Batch 0 (atoms) + Batch 1 (chrome + home มือถือ) บนหน้าจริง
เบสยืนยันแล้ว: **desktop คงของเดิมเป๊ะ (ชอบแล้ว ตามภาพที่ส่ง) · มือถือ (<md) เปลี่ยนเป็น iOS grammar** — เริ่ม rollout จริงบนหน้าเว็บ (ไม่ใช่ proto อีกต่อไป) โดยใช้ประโยชน์จากโครงที่มีอยู่แล้ว (desktop `<table>` vs มือถือ list เป็นคนละ markup อยู่แล้ว, header แยกไฟล์มือถือ/เดสก์ท็อปอยู่แล้ว):

- **Batch 0 — atoms เข้า production**: ย้าย `GroupedSection`/`GroupedRow` จาก proto → `src/components/ui/grouped-list.tsx` — **`GroupedRow` เขียนใหม่ให้ delegate ไปที่ `ListRow` เดิม** (atom ที่มีอยู่แล้วตาม REDESIGN.md §4.3) แทนที่จะ duplicate แถว เพื่อให้แอปมี row primitive เดียว (แค่เพิ่ม icon-circle leading + `destructive` color) · proto 5 ไฟล์ import จากที่ใหม่แทน + ลบไฟล์ proto เดิม
- **Batch 1a — Chrome มือถือ** (ทุกหน้าได้ผลพร้อมกัน, desktop ไม่แตะ):
  - [`header-mobile.tsx`](src/components/layout/header-mobile.tsx): เดิม solid bg ตลอด → เปลี่ยนเป็น **transparent บนสุด → `.frost .hairline-b` ตอน scroll** (pattern เดียวกับ desktop header ที่มีอยู่แล้ว + `/proto/ios` nav bar ที่พิสูจน์แล้ว)
  - [`page-header.tsx`](src/components/layout/page-header.tsx): title ใช้ `.text-large-title` แทน `.text-h1` ตรงๆ — CSS token ใหม่นี้มี **media query ในตัวเอง** (34px มือถือ → 32px ที่ ≥768px ซึ่งตรงกับขนาด `.text-h1` เดิมเป๊ะ) ดังนั้น desktop (`≥md`) หน้าตาเหมือนเดิม 100% ไม่มี regression ส่วนมือถือได้ large-title ใหญ่ขึ้น
  - [`bottom-nav.tsx`](src/components/layout/bottom-nav.tsx): เปลี่ยน `pb-[env(safe-area-inset-bottom)]` → `.pb-safe` utility ใหม่ (ผลลัพธ์เหมือนเดิมทุกประการ แค่สะอาดขึ้น)
- **Batch 1b — Home/Market มือถือ** ([`mobile-card-item.tsx`](src/components/home/mobile-card-item.tsx) — ใช้ร่วมกันทั้ง home และ `/sets`, market table ทุกที่): thumbnail จาก square `size-11` → **portrait `aspect-[63/88] w-11`** (สัดส่วนการ์ดจริง ตรง VISION "การ์ด=พระเอก") + เพิ่ม `hairline` ring + `min-h-[52px]` explicit tap target — โครงสร้าง rank/ชื่อ/code/sparkline/ราคา/delta เดิมทั้งหมดคงไว้ครบ (ไม่เสียฟีเจอร์) · skeleton ปรับให้ตรงชนิดเดียวกัน (กัน layout shift)
- **จงใจไม่แตะ**: toolbar/tabs ใน `home-market-overview.tsx` — โค้ดใช้ class ร่วมกันระหว่าง mobile/desktop โดยไม่มี `md:hidden` แยกชัดเจนในหลายจุด เสี่ยงกระทบ desktop โดยไม่ตั้งใจ + ของเดิมอ่านได้ดีอยู่แล้ว (underline tabs, icon-only filter บนมือถือ) จึงข้ามในรอบนี้

**verify:** tsc0 · lint0 (34 warning เดิม) · test56 · build✓ · impeccable detect [] (ทุกไฟล์ที่แตะ) · curl smoke ทั้งหน้าจริง (`/`, `/settings`, `/watchlist`, `/portfolio`, `/opcg/sets`, `/opcg/cards/OP01-001`) และ proto (`/proto/ios/*`) 200 ไม่มี server error

## ⚠️ ยังไม่ได้ทำ — เบสต้องเปิดดูเอง
เครื่องมือเปิด browser จริงไม่พร้อมใช้งาน session นี้เหมือนรอบก่อนๆ — verify จำกัดแค่ build/lint/test/curl **ยังไม่เห็นภาพจริงทั้งมือถือและเดสก์ท็อป**

## ⏭️ NEXT
1. **สำคัญที่สุด**: เบสเปิดเว็บจริงเช็ค:
   - **มือถือ (390px)**: กดแท็บ "เพิ่มเติม" → ต้อง**นำทางไปหน้า `/more`** (ไม่ใช่ drawer เด้งจากขวาแล้ว) เห็น large title + grouped card list · `/settings` เห็น grouped list · `/`,`/watchlist`,`/portfolio` เห็น large-title + frost header
   - **Desktop (≥1024px)** ต้องเหมือนเดิมทุกจุด (bottom-nav เป็น `md:hidden` — desktop ใช้ header menu เดิม · `/more` เปิดบน desktop ได้เป็นคอลัมน์แคบกลางจอ ไม่มีลิงก์ชี้ไปจาก desktop)
2. **มือถือ iOS rollout ครบทุก surface ที่มี gap จริงแล้ว** (chrome + home + Settings + `/more` page) — Watchlist/Portfolio/Card-detail สำรวจแล้วไม่ต้องแตะ (เหตุผลด้านล่าง) เว้นแต่เบสเห็นจุดเฉพาะหลังเปิดดูจริง
3. `/proto/ios/*` ยังเก็บไว้เป็น reference (ยังไม่ลบ — ⚠️ ลบต้องถามเบสก่อน)
