# Meecard — PLAN (งานโค้ดค้างจริง — ขุดจาก doc/ + เทียบโค้ดแล้ว 2026-06-13)
> งานใหญ่แตกเป็น task ติ๊กได้ · ทำทีละอัน · ติ๊กเมื่อ **verify แล้ว** (ไม่ใช่แค่เขียนเสร็จ)
> ลำดับ milestone = ข้อเสนอ — เบสสลับได้ · แผนธุรกิจ/north star อยู่ `doc/archive/detailed-plan-2026-04-28.md` (archived snapshot) ไม่ใช่ไฟล์นี้

## 🧭 UX/UI Refactor Master Plan (2026-07-04 — แผนคุมงาน UI ทั้งหมดต่อจากนี้)
> จาก audit ทั้งเว็บ (workflow 86 agents · 19 auditors + adversarial verify) ได้ 230 findings — **checklist รายข้อ + กติกา: [doc/uxui-refactor-plan.md](doc/uxui-refactor-plan.md)** · หลักฐานราย finding: [doc/uxui-audit-findings-2026-07-04.md](doc/uxui-audit-findings-2026-07-04.md) · ที่นี่ติ๊กระดับ phase เท่านั้น
> แผนนี้ดูดซับงานค้างเดิม: R1 empty-state → Phase 4 · แตก client ยักษ์ → Phase 2/5 · Declutter Batch 5–6 → Phase 5 (honey/desktop balance)

- [x] **Phase 0** แก้ของพัง/เสี่ยงจริง — **17/17 เสร็จ + verify (tsc0/lint0/test56/build✓ prerender static)** · `SETTINGS-03` แก้แล้ว (เบสอนุมัติ lib qrcode) · `SETS-05`/`CONTENT-03` ย้ายไป Phase 5 (query risk) · branch `fix/uxui-phase-0` รอ merge
- [ ] **Phase 1** ลบของตาย ~3,000+ บรรทัด / orphan 18+ ไฟล์ (⚠️ เบสอนุมัติรายการลบก่อน)
- [ ] **Phase 2** ประกาศ kit ทางการใน AGENTS.md + ยุบของซ้ำ (PriceTag เดียว · search engine เดียวจาก 3 ชุด · auth kit · Switch/QtyStepper/TabBar · AdminDataTable 8 หน้า)
- [ ] **Phase 3** token sweep (hairline เดียว · elevation adoption · radius มาตรฐาน · status 660 จุด · วินัยเขียว/แดง)
- [ ] **Phase 4** states (หน้า 404 · ศูนย์ spinner · loading.tsx ราย segment · empty ทุกจุดมี CTA)
- [ ] **Phase 5** mobile pass ราย surface — เบสเลือกลำดับหน้า (เริ่ม 5.0: tap ≥44px + a11y ที่ atom กลาง)
- [ ] **Phase 6** IA/naming polish (ชื่อ/ไอคอนปลายทางเดียว · palette ครบ destination)
- [ ] **Phase 7** commerce + admin เก็บกวาด (**ก่อนเปิด marketplace flag**)

### UX/UI implementation batch — 2026-07-11
> งานตาม audit responsive 390×844 / 768×1024 / 1440×900 · รักษา espresso+honey/Kanit · ไม่แตะ schema/dependency/config

- [x] **P0 — usability blockers:** contrast light mode, finite loading/error/empty states, dialog/focus/keyboard/search/form accessibility
- [x] **P1 — interaction kit:** mobile tap targets, SegmentedControl keyboard behavior, canonical Pagination, admin table mobile fallbacks
- [x] **P2 — dedup/structure:** canonical empty/picker/plan/popover/settings/loading patterns และแยก card-detail orchestration โดยคง behavior
- [x] **P3 — route/polish:** game namespace allowlist + feature guards, canonical links, LCP image priority, reduced-motion coverage
- [x] **Verification:** test + lint + build + browser smoke 105 routes ที่ไม่ใช่ `/proto` และ visual matrix 390/768/1440 ทั้ง light/dark

## 🎨 Redesign (in-place · ทิศเต็มใน [VISION.md](VISION.md) · **ไม่มีเวอร์ชัน v1/v2**)
> แก้ของเดิมทีละ surface ตาม spine VISION §7 · ทุก surface = adopt atom kit + verify (tsc/lint/build/test) + เปิดดูจริง · ⚠️ ข้อที่แตะ schema = เบสอนุมัติก่อน
> 📌 กฎ design-system: การ์ดใหญ่ = `.panel` · `surface-*`/`hairline` = chip/control/nested · `.hairline` เป็น unlayered → อย่าผสมกับ ring/shadow บน element เดียว

### Foundation — token + atom kit + states (บล็อกทุก surface)
- [x] warm primitive kit + `--p-*` → `globals.css` (dark+light) · proto เหลือแต่ `.proto-root` var
- [x] token motion/elevation: `--dur-fast/base/slow` + `--ease-chrome/spring` + `--elev-flat/raised/overlay` (light+dark) · wire `.ease-chrome`/`.rise` → token · refactor button base → `duration-[var(--dur-base)] ease-[var(--ease-chrome)]` · verify ✓ (เหลือ: ทยอย migrate 20 ไฟล์ที่ยัง hardcode `duration-*` ตอนแตะหน้านั้นๆ)
- [ ] atom kit (สร้าง/รวม): `PriceTag` · `HeroNumber` · `GradeChip`/`GradeRail` · `EditionToggle` · `SourceBadge` · `SellerChip` · `PriceLadder` · `CustodyTimeline` · `EventCard` *(มีแล้ว: ListRow · Surface · AdSlot · Skeleton)*
- [ ] state system: skeleton รูปร่างตาม content ทุก async + `EmptyState`+CTA · ศูนย์ spinner
- [x] **iOS design language tokens** (2026-07-03 · ส่วนหนึ่งของ showcase ด้านล่าง): `.hairline-b` (คู่ `.hairline-t` เดิม) · safe-area utilities (`.pt/pb/pl/pr-safe`) · `.text-large-title` (34px collapsing-nav large title) · `.frost` มีอยู่แล้วนำมาต่อยอด — ไม่แตะของเดิม

### 🍎 iOS Design Language — Showcase ✅ (2026-07-03 · เบส: "ทำ UXUI ทั้งเว็บทันสมัย มือถือแบบ Apple iOS ลองทำตัวอย่างมาดู")
> ทิศ = "iOS grammar × Meecard skin" — เอาไวยากรณ์ iOS (large title collapse, frosted chrome, grouped-inset list, safe-area, tap≥44px) มาทับตัวตน espresso+honey เดิม (VISION §1 ห้ามเปลี่ยน) · scope ใหญ่เกินกวาดทั้งเว็บรอบเดียว → proto-first ที่ `/proto/ios/*` ก่อน (เปิดดูไม่ต้อง login)
- [x] token additions ใน `globals.css` (ดูด้านบน) — ผ่าน Impeccable hook หลัง suppress 2 finding เดิม (`--ease-spring` bounce ที่ VISION.md ตั้งใจ + `.section-heading` side-tab เดิมนอก scope) ด้วย reason ที่บันทึกใน `.impeccable/config.json`
- [x] shell กลาง `src/app/proto/ios/` — `IosShell` (frosted collapsing nav + back-button อัตโนมัติ + bottom tab bar มือถือ/side rail desktop ตรง VISION §2) · atoms `LargeTitle`/`GroupedSection`/`GroupedRow` · mock data กลาง `_data.ts` (การ์ดจริงจาก R2/pokemontcg.io)
- [x] 6 หน้า showcase: ตลาด (home) · portfolio hub · portfolio detail (`SegmentedControl`+sparkline) · card detail (grade chips กดสลับราคา+chart+sticky buy bar เดียวที่ใช้ทอง) · watchlist (pin/alert micro icons) · more/settings (grouped-inset เต็มรูปแบบ) — home เขียนเองเป็น reference แล้ว delegate 5 หน้าที่เหลือให้ subagent ขนาน (ส่ง shell+atoms+mock ที่ล็อกแล้วกันดริฟต์)
- [x] แก้บั๊กที่เจอตอน verify: `react-hooks/set-state-in-effect` ใน shell (lazy initializer แทน setState ใน effect) · RSC serialization error ใน more/page (Server Component ส่ง icon component เข้า client `GroupedRow` ไม่ได้ → เปลี่ยนเป็น `"use client"`) · `next/image` domain ของ `images.pokemontcg.io` ขาดใน `next.config.ts` (เพิ่ม 1 entry) · unify hide-balance เป็น dot `••••` ทั้งหมด (ตรง `MASKED` convention จริง)
- [x] verify: tsc0 · lint0 (34 warning เดิม) · test56 · build✓ (6 route ขึ้นจริง) · impeccable detect [] · curl smoke 200 ทุก route
- [x] **⚠️ เบสเคาะทิศ iOS โอเค แต่สั่งต่อ**: "อยากได้เว็บก็ดี มือถือก็ดี เอา UI ปัจจุบันมาปรับ" → "ทำ proto ก่อนนะ" (ยังไม่ให้ rollout หน้าจริง)
- [x] **Proto v2 — desktop จริง** (2026-07-03) — `IosShell` ตัด side rail (จำลอง iPad) ออก เปลี่ยนเป็น **top header แบบเว็บจริง** (จำลองโครง `header.tsx` จริง: logo·nav links·search·avatar, frost ตอน scroll, active=honey pill) · เพิ่ม desktop composition ต่อจอ (มือถือไม่แตะเลย): ตลาด `lg:grid-cols-6` movers + 7d column · portfolio hub `lg:grid-cols-3` · portfolio detail insights `lg:grid-cols-2` + ปุ่มเพิ่มการ์ดย้ายเข้า header trailing · card detail ห่อ `max-w-6xl` ให้ตรง header (sticky rail offset พอดีกับ header 56px โดยบังเอิญ) · watchlist +7d column · more คงเดิม (max-w-2xl ถูกอยู่แล้ว) · verify: tsc0/lint0/test56/build✓/detect[]/curl smoke ครบ
- [x] **⚠️ เบสถาม-ยืนยันทิศสุดท้าย**: "อยากได้ desktop เดิม แต่มือถือเป็น iOS ทำไม่ได้หรอ" → ยืนยันทำได้ (responsive ปกติ, desktop/มือถือมี markup แยกกันอยู่แล้วหลายจุด) → เบสสั่ง "เริ่มเลย"
- [x] **Rollout หน้าจริง — Batch 0+1 (2026-07-03)**: **desktop คงเดิมเป๊ะทุกจุด · มือถือ (<md) เท่านั้นที่เปลี่ยน**
  - Batch 0: ย้าย `GroupedSection`/`GroupedRow` จาก proto → `src/components/ui/grouped-list.tsx` — `GroupedRow` delegate ไปที่ `ListRow` เดิม (ไม่ duplicate row primitive)
  - Batch 1a chrome มือถือ: `header-mobile.tsx` transparent→frost ตอน scroll (pattern เดียวกับ desktop header) · `page-header.tsx` ใช้ `.text-large-title` (token มี media query ในตัว 34px มือถือ→32px ที่ ≥768px ตรงกับ `.text-h1` เดิมเป๊ะ = desktop ไม่เปลี่ยน) · `bottom-nav.tsx` ใช้ `.pb-safe` แทน arbitrary value
  - Batch 1b home มือถือ: `mobile-card-item.tsx` thumbnail square→portrait `aspect-[63/88]` (ตรง VISION การ์ด=พระเอก) + `min-h-[52px]` — ฟีเจอร์เดิมครบ (rank/sparkline/ราคา/delta) · ตั้งใจข้าม toolbar/tabs ใน `home-market-overview.tsx` (class ใช้ร่วม mobile/desktop ไม่แยกชัด เสี่ยงกระทบ desktop)
  - verify: tsc0/lint0/test56/build✓/detect[]/curl smoke ครบทั้งหน้าจริงและ proto
- [x] **⚠️ ยังไม่ได้เปิด browser จริงดู** (tool ไม่พร้อม session นี้) — เบสต้องเช็ค desktop (ต้องเหมือนเดิม) + มือถือ (ต้องเป็น iOS) ก่อนไป batch ถัดไป → เบสถาม "desktop/มือถือควรแยกดีไซน์กันมั้ย" ยืนยันทิศเดิม สั่งไปต่อโดยยังไม่เปิดดูเอง
- [x] **Batch 2 — Settings/More มือถือ (2026-07-03)**: `src/app/settings/page.tsx` มือถือ (`md:hidden` เท่านั้น) — flat link list → **grouped-inset table view** จริง (`GroupedSection`/`GroupedRow`) ตาม `/proto/ios/more` ที่พิสูจน์แล้ว: identity row เป็นการ์ดของตัวเอง + 2 กลุ่ม "ทั่วไป"/"เพิ่มเติม" เป็น `GroupedRow` (icon-circle+chevron+≥52px tap) + title `.text-large-title` · desktop sidebar+content ไม่แตะ · ไม่เพิ่ม i18n key · verify tsc0/lint0/test56/build✓/detect[]/curl smoke ครบ
- [x] **สำรวจ batch ถัดไป (card detail/portfolio/watchlist) → สรุปไม่แตะเพิ่ม**: อ่านโค้ดจริงแล้วพบว่าทั้ง 3 หน้าผ่าน mobile redesign มาแล้ว (P1–P2 + Hub/Detail split + Panel restore) — thumbnail portrait อยู่แล้ว, ได้ large-title/frost header ฟรีจาก Batch 1 (chrome กลาง) · บังคับ `GroupedRow` เข้า watchlist จะตัดฟีเจอร์ checkbox/pin/alert/actions-menu ทิ้ง (ไม่มีที่ใส่ใน primitive navigation-row) · portfolio/card-detail เป็นหน้า data-dense ไม่ใช่ navigation menu จึงไม่เข้ากับ grouped-inset grammar (นั่นสำหรับ Settings-style list เท่านั้น) · รายละเอียดเต็มใน PROGRESS.md
- [x] **Batch 3 — "More" sheet มือถือ (2026-07-03)**: `mobile-menu-sheet.tsx` (drawer จากแท็บ "เพิ่มเติม" ใน bottom-nav) เขียนใหม่เป็น grouped-inset เต็มรูปแบบ — user block เป็นการ์ด (กด→`/settings`) · ทุก section เป็น `GroupedSection`/`GroupedRow` icon-circle สี semantic · พฤติกรรมเดิมครบ (auth gate/flag gate/badge/pending dot/Select ภาษา-สกุลเงิน/theme toggle/close-on-nav) · ปรับ primitive: `ListRow` รองรับ `href`+`onClick` พร้อมกัน, `GroupedRow` +`active`, `GroupedSection` +`className` · sheet bg `bg-muted/30`+กว้าง 320px · verify tsc0/lint0/test56/build✓/detect[]/curl ครบ
- [x] **Batch 4 — "เพิ่มเติม" เป็นหน้าเต็ม `/more` (2026-07-03)**: ตาม iOS HIG (แท็บ = destination ห้ามเปิด overlay — เบสถาม "หน้าเต็มดีกว่ามั้ยตามหลัก" → ใช่) — สร้าง `/more` (เนื้อหา grouped-inset ชุดเดียวกับ sheet Batch 3 · `useHeaderData` เดิม · URL จริง back/refresh ได้) · bottom-nav "เพิ่มเติม" → `TabLink` ปกติ · **ลบ `mobile-menu-sheet.tsx`** (git เก็บที่ `ea4b02d`) + ลบ `mobileMenuOpen`/`toggleMobileMenu` ตายแล้วจาก ui-store · verify tsc0/lint0/test56/build✓ (route ขึ้น static)/detect[]/curl 200
- [x] **`/more` desktop 2-column polish (2026-07-03)**: เบสเปิดจอกว้างเห็น `/more` เป็นคอลัมน์เดียวยืดๆ ถามว่าตามหลักควรทำเป็นหน้าเลยมั้ย → สรุป: ใช่ ตามหลัก responsive ห้าม redirect ตามขนาดจอ, จุดที่ต้องแก้จริงคือ layout ไม่ใช่ยกเลิกการเป็นหน้า — `more-client.tsx`: container `md:max-w-4xl` + section ที่ไม่ใช่ user-card ห่อด้วย `flex flex-col gap-6 md:grid md:grid-cols-2 md:items-start md:gap-x-6` (มือถือ flex คอลัมน์เดียวเป๊ะเหมือนเดิม) + sign-out `md:col-span-2` · verify tsc0/lint0/test56/build✓/detect[]/curl(grep คลาสจริงใน HTML)
- [x] เบสเปิดดูจริง: มือถือ `/more` ไม่เปลี่ยนจากเดิม + desktop กว้างเป็น 2 คอลัมน์แล้ว (ยืนยันผ่าน browser จริงใน audit ด้านล่าง)
- [x] **Mobile UX full audit ด้วย browser จริง (2026-07-03)** — เบสสั่ง "ตรวจสอบให้ครบทุกหน้าทุกส่วนว่ารองรับมือถือหมดรึยัง รวม UX จริง" — เปิด browser ที่ viewport 390×844 ไล่ตรวจ ~30 หน้า (screenshot + DOM overflow-check script + hydration-error watch + กด UX flow จริง: portfolio tabs, add-card dialog, trending/search filter) เจอบั๊กจริง 5 ตัว แก้ครบ:
  - `scroll-to-top.tsx`: regex เช็ค card-detail route เขียนก่อนมี `/[game]/` namespace เลยไม่ match `/opcg/cards/x` + middleware rewrite ทำ server/client เห็นคนละ pathname → hydration mismatch จริง → derive จาก `isGamePrefix()` + gate `useHydrated()`
  - `header-mobile.tsx`: lazy initializer อ่าน `window.scrollY` ตรงๆ เสี่ยง mismatch ถ้า scroll position เหลือตอน mount → gate `useHydrated()` เดียวกัน
  - `portfolio-hub-card.tsx`: `relative z-10` บน div ธรรมดา (name/price, thumbnail row) ลอยทับ stretched-link ทำให้แตะกลางการ์ดไม่นำทาง (ยืนยันจริงด้วยคลิกอัตโนมัติ) → ถอด z-index ที่ไม่จำเป็นออก
  - `trending-tabs.tsx`: segmented control 3 ปุ่ม label ยาวล้น 390px จริง (ทั้งหน้าเลื่อนแนวนอนได้ — แย่กว่า contained scroll) → ห่อ `overflow-x-auto` ตาม pattern tab-scroll เดิม
  - `search-client.tsx`: `SetPicker` ใช้ `flex-1 min-w-0` ในแถว `flex-wrap` ถูกบีบแคบจนข้อความตัดบรรทัดซ้อนทับแทนที่จะ wrap ทั้งก้อน → `basis-full sm:basis-auto`
  - เจอแต่ไม่แก้: `DropdownMenuTrigger` hydration error จาก third-party `@base-ui/react/menu` เอง (เช็คเวอร์ชันใหม่ก่อนแตะ) · hardcoded "Home" breadcrumb ~17 ไฟล์ (อยู่ใน R3 backlog แล้ว) · portfolio best=worst เมื่อมี asset เดียวที่มีต้นทุน (ถูกตาม logic เป็น product call ไม่ใช่บั๊ก)
  - verify: tsc0/lint0/test56/build✓/impeccable detect[]/curl smoke ครบ + **verify ด้วย browser จริงทุกจุด** (screenshot ก่อน/หลัง + คลิกทดสอบยืนยัน fix การ์ดพอร์ต)
  - ยังไม่ครอบคลุม: settings sub อีก 7 หน้า, `/profile`+`/u/[handle]`, `/register`, `/market-overview`, `/about`, `/contact`, `/coming-soon`, `/raffle/winners`, honey sub-tabs — รายละเอียดเต็มใน PROGRESS.md
- [x] **Breadcrumb มือถือ → iOS back link (2026-07-03)** — เบสถาม "มือถือควรมี breadcrumb มั้ย" → ตามหลัก iOS HIG/NN:g ไม่ควร → แก้ที่ `breadcrumb.tsx` ที่เดียว: desktop trail เต็มเหมือนเดิม (`hidden md:flex`) · มือถือหน้าลูกลึก (items ≥3) ได้ปุ่ม `< หน้าแม่` แบบ settings sub-pages (derive อัตโนมัติจาก items ไม่ต้องแก้ per-page) · หน้าแท็บหลักไม่ render อะไรบนมือถือ · SEO ไม่กระทบ (JSON-LD แยก) · verify tsc0/lint0/test56/build✓/detect[] + browser จริง 4 กรณี (มือถือ deep/top-level/card-detail + desktop)
- [x] **ปุ่มย้อน → iOS pill + card detail ได้ด้วย (2026-07-03 ต่อ)** — pill `rounded-full bg-muted` ≥36px chevron honey กดเข้มขึ้น truncate ได้ · card detail ถอด mobile meta ที่ซ้ำกับ identity chips ทิ้ง เปลี่ยนเป็น pill `< [ชื่อชุด]` กลับหน้า set · verify ครบ + screenshot ทั้ง 2 หน้า
- [x] **ปุ่มย้อนขั้นสุดท้าย: ไอคอนวงกลมล้วน (2026-07-03 เบสเคาะ)** — "ไม่ต้องมีคำอะไร" → วงกลม `size-9` chevron honey เหมือนกันทุกหน้าลูกลึก · ชื่อหน้าแม่ยังอยู่ใน `aria-label`/`title` · verify ครบ + browser จริง
- [x] **Bottom-nav มือถือ: relabel + ตัดเด็ค + ปุ่มค้นหาเด่นกลาง (2026-07-03 เบสสั่งตรงๆ)** — ⚠️ **แก้ IA ที่เคย freeze 5 tab ไว้ตอน P0a** (2026-06-13): "ตลาด"→"หน้าแรก", "เรียกดู"→"ชุดการ์ด", ตัดแท็บ "เด็ค" ออก (หน้า `/decks` ยังอยู่ เข้าถึงผ่าน command search) แทนที่ด้วยปุ่มค้นหา action-only (ไม่ใช่ route) ทรงวงกลมลอยเด่น `bg-primary` เหนือแถบ เรียก `setSearchOpen(true)` เปิด `CommandSearchModal` เดิม · verify tsc0/lint0/test56/build✓/detect[] + browser จริง (screenshot + คลิกทดสอบเปิด search สำเร็จ)
- [x] **ปรับต่อ: ปุ่มค้นหา → รายการโปรดธรรมดา + `/more` ตัด header/footer (2026-07-03 เบสสั่งต่อ)** — เบสปัดปุ่มค้นหาลอยทิ้ง เปลี่ยนกลับเป็น `TabLink` ปกติ (`/watchlist`, Bookmark icon) เหมือนแท็บอื่น · `/more`: เพิ่ม `SiteChrome` component ใน `main-chrome.tsx` (ซ่อน Header+Footer เมื่อ `CHROMELESS_ROUTES` หรือ `NO_HEADER_FOOTER_ROUTES=["/more"]`) แยกจาก `MainChrome` เดิมที่เหลือคุมแค่ `BottomNav` (ซ่อนเฉพาะ chromeless — `/more` ยังโชว์ bottom-nav) · เหตุผล: `/more` มีลิงก์ไปทุกที่ในตัวเองอยู่แล้ว header/footer เว็บซ้ำซ้อน · ⚠️ เจอ dev-server cache ค้าง (ครั้งที่ 3 ใน session) แก้ไม่ขึ้นจนกว่าจะ `rm -rf .next` เต็ม + restart ใหม่ทั้งหมด (ไม่พอแค่ `.next/dev`) · verify tsc0/lint0/test56/build✓/detect[] + browser จริงหลัง restart สะอาด ยืนยัน `/more` ไม่มี header/footer เลย ส่วนหน้าอื่นไม่กระทบ
- [x] **`/more` ตัดหัวข้อ H1 + gutter มือถือทั้งเว็บ 16px→20px (2026-07-03 เบสสั่งต่อ)** — ลบ `<PageHeader title="เพิ่มเติม">` ออกจาก `more-client.tsx` (ซ้ำซ้อนหลังตัด site header ไปแล้ว) · gutter: แก้ต้นทาง `page-container.tsx` (`px-4`→`px-5` มือถือ, md/lg เดิม) + sync จุด `-mx-4`/`px-4` แบบ cancel-then-reapply ทั้งหมด 8 ไฟล์ (`grouped-list.tsx`, `header-mobile.tsx`, `settings/page.tsx`, `trending-tabs.tsx`, `sets-page-client.tsx`, `set-detail-content.tsx`, `market-overview-client.tsx`, profile public page 2 ไฟล์) ให้ตรงฐานใหม่ · verify tsc0/lint0/test56/build✓/detect[] + browser จริงวัด gutter ด้วย `getBoundingClientRect()` ยืนยัน 20px ทุกจุด + overflow-check หน้าที่มีแถวเลื่อนแนวนอนไม่ล้น
- [ ] ต่อ audit หน้าที่เหลือ (list ใน PROGRESS.md) + ตัดสินใจเรื่อง `@base-ui/react/menu` hydration bug (เช็คอัปเดตเวอร์ชันก่อน) + เปิด PR รวม branch `ui/sets-redesign` เข้า master เมื่อเบสพร้อม

### Card detail — trust core ✅ (proto visionary layout · เต็มภาพ · est-labeled fill)
- [x] **rework layout ตรง proto visionary** (เบสเลือก): grid `340px/1fr` · ซ้าย sticky = รูป+identity+EditionToggle+CTA · ขวา = hero + **3-stat box** (Last Sale·Lowest Listing·Sales 30d) + grade chips **outline-selected** + chart card + **tabs** (Comps/Listings/Population/Specs)
- [x] **เติมตัวอย่าง + ติดป้าย est ทุกตัวที่ไม่ใช่ของจริง** (เบสเลือก) — ของจริง (Raw A=Yuyutei · PSA 10=SNKR) ไม่ติดป้าย · per-stat `EstMark` (title+aria) · recent-prices ติด Sold/Listed จาก type จริง
- [x] adopt primitive pass แรก (glow image + sticky desktop + frost bar)
- [x] `GradeRail` (Raw A/B/C · PSA 10/9/8 · BGS) → re-price ทั้งหน้า · `EditionToggle` JP/EN (EN=soon) · atoms ใหม่: `grades.ts` · `grade-value`(PriceTag/Amount/Delta) · `grade-rail` · `edition-toggle` · `recent-sales` · `population-strip`
- [x] stat row: hero (เกรดที่เลือก) + Δ30d + freshness + "est." disclosure (tooltip+aria) — **เลิก fabricate ask, last-sale = ข้อมูลจริงเท่านั้น + source attribution**
- [x] Recent prices feed (ทุกแถวติดป้าย Sold/Listed จาก `type` จริง + เกรดจริงต่อแถว) · chart bound เกรด · population strip (graded, sample-labeled)
- [x] honesty/a11y fix รอบรีวิว: focus ring · aria-pressed (เลิก fake tablist) · `key={card.id}` กัน stale · sticky bar grade-aware · i18n 9 keys ×3 · Delta neutral 0%
- [x] **proto-e UX pass:** production/proto audit → left acquire rail รวมรูป+buy+asks เป็น region เดียว · chart-dominant main · quiet grade rail + JP/EN off-track · hero/triad/chart/recent receipt grade-locked · scrub morphs hero · reconciler/outlier annotations · mobile sticky bar + bottom padding · ลด number repetition บน fold · verify lint+tsc+Browser screenshots
- [x] **world-class card detail pass 2:** mobile breadcrumb → short meta · Raw/Graded/Pop mode + controlled population tab · grade rail filter ตาม mode · price instrument polish (hero/triad/chart/range controls) · sticky buy bar แสดงหลังผ่าน chart zone เท่านั้น · empty asks/action rail ใช้งานได้จริง · i18n TH/EN/JP · verify lint+tsc+Chrome screenshots+console 0
- [x] **world-class card detail pass 3:** mobile first fold กระชับขึ้น · premium/trust left rail · chart latest/high/low markers · CTA wording + empty asks ให้ตัดสินใจง่ายขึ้น · verify lint+tsc+test+Chrome screenshots+console 0
- [x] **world-class card detail pass 4:** ตัด Listings tab ใต้กราฟที่ซ้ำกับ asks rail · ทำ CTA rail ให้คนใหม่เข้าใจทันที · sticky mobile พาไป section ซื้อ/ขายบนหน้าเดียว · verify lint+tsc+test+screenshots
- [x] **world-class card detail pass 5:** เอา desktop image/acquire rail ออกจาก sticky ให้เลื่อนตามหน้า · mobile sticky CTA คงเดิมหลังผ่าน chart · verify lint+tsc+test+Browser screenshots
- [x] **world-class card detail pass 6:** minimal JP/EN edition-first reference price · Raw/PSA10 condition · market evidence จาก source จริงเท่านั้น · CTA มี label ชัด · verify lint+tsc+test+Browser checks
- [x] **world-class card detail pass 7:** แยกใต้กราฟเป็นตั้งขายล่าสุด/ขายล่าสุด · More grades แบบข้อมูลไม่พอสำหรับ PSA 9/8/BGS · ย้าย utility CTA ไปหัวหน้า · left rail เบาลง · verify lint+tsc+test+Browser checks
- [x] **world-class card detail pass 8:** price-first hierarchy จริงขึ้น · ตัด honey glow หลัง hero · left rail เหลือรูปอย่างเดียว · ย้าย market/action/trade หลังกราฟให้เต็มความกว้าง desktop · action strip เบาลงและ label ชัด · verify tsc+lint+test+Browser console/no-scroll checks
- [x] **พอร์ต proto-h (CMC dashboard) เข้าหน้าจริง `/cards/[code]`** (เบสเลือก h · in-place · reuse DB layer) ✅:
  - [x] s0: i18n keys ที่ขาด ×3 ภาษา (gradePrices·referenceSources·marketStats·range30d·volume30d·population·viewSaleHistory·viewAllGrades·medianSources·soldTab·asksTab·buyOnMeecard·cardInfo·midPrice·itemsUnit)
  - [x] s1: export `ScrubChart`/`RANGES`/`dateAtIndex` จาก `card-chart.tsx` (reuse SVG โดยไม่เอา hero wrapper)
  - [x] s2: rewrite `card-detail.tsx` เป็นโครง h — top 3-col (identity·price-instrument+GradeLadder·market-stats rail) → tabs → mid 2-col (chart กว้าง·grade-ledger rail) → แหล่งอ้างอิง(asks/sold)·ขายบน Meecard·ข้อมูลการ์ด·related · mobile sticky buy · selectedGrade(GradeKey) raw-first default แทน raw/psa10 toggle · ของ modeled ติด EstMark ทุกตัว · **raw=Yuyutei-only (กัน SNKRDUNK USD ปนราคา graded)**
  - [x] s3: verify tsc 0 · lint 0 · test 36 pass · hydration 0 (clean restart) · screenshot desktop+mobile เทียบ proto-h fidelity สูง
  - [x] s4: adversarial review workflow (5 มิติ, 16 agents) → confirmed 6/12 → แก้หมด: hero EstMark (modeled grade), `relativeTime` ใน render → `relativeDaysLabel` pure จาก `daysSinceUpdate` + mounted-gate source time, currency guard (hydrated→THB), h1→`.text-h3`, `Parallel`→i18n · +ตาเห็นเอง: source row label = เกรดจริงของแหล่ง (PSA 10) ไม่ใช่เกรดที่เลือก
- [x] **multi-source pricing + เทียบกราฟข้ามตระกูล (chunk A–C)** ✅: ตารางแหล่งราคาเต็มกว้าง (ask/sold native ¥/$ · sort · raw=Yuyutei-only) · hero verb ซื่อสัตย์ (ขายล่าสุด/ราคาตั้งขาย + source) · recent-sales = sold จริงเท่านั้น · กราฟ indexed % (`rebaseToIndex`+test) · **cross-family pill "เทียบกับ PSA 10 ⇄ Raw A"** (chart-only · ไม่แตะ table/hero · stable per-grade color · ปุ่มล้าง · caption %) · verify tsc 0/lint 0/test 40/hydration 0 + CDP screenshot desktop+mobile ทั้ง 2 branch
- [ ] **เปลี่ยน est → ข้อมูลจริง** เมื่อมี schema: Grade enum (Raw A/B/C·PSA 9/8) + edition JP/EN column + `Comp`/population tables (⚠️ เบสอนุมัติ migrate) — โครง UI พร้อม swap แล้ว

### Portfolio — honesty + Robinhood hero ✅ (รื้อใหม่ตาม VISION §5.3 · เบสสั่ง 2026-06-30 · workflow build 7 agent)
- [x] ⚠️ **netInvested** → `PortfolioSnapshot.netInvestedJpy Int?` (additive nullable · apply prod ด้วย `db execute` IF NOT EXISTS + `migrate resolve --applied` ตาม precedent P4.2 · ไม่แตะ drift M5) · cron เขียนไปข้างหน้า · snapshot เก่า null → UI fallback `totalCost`
- [x] hero (`HeroNumber` atom count-up + scrub-bind) + finger-scrub chart (pointer-events, range 1D·1W·1M·3M·1Y·ALL honey-active) + **inflow notch** (honey dot จาก isInflow) · KPI quartet 2×2 hairline · movers (เรียง abs THB swing) · holding detail sheet (tap tile บน collection grid)
- [x] **game-aware** (namespace-ready, ยังไม่แยก URL): API `card.set.game` · `gameBreakdown` ใน hook · `PortfolioGameBreakdown` (collapse เหลือ 1 เกมตอนนี้ → null · ติดเมื่อมีเกม 2) · = โครงหน้ารวม `/all/portfolio` พร้อมเสียบ
- [x] verify: tsc 0 · lint 0 err · test 56/56 · build ✓ · อ่าน component ทุกตัว fix 2 bug (scrub ไม่มี XAxis/YAxis → notch/cursor เพี้ยน + เส้นแบน · KPI ROI leak ทิศตอน hideBalance)
- [ ] ⏭️ **แยก URL `/[game]/portfolio` + `/all/portfolio` aggregate** = milestone ถัดไป (อยู่ §Multi-game + P4.3 ด้านล่าง · ทำตอน Pokémon data มา · component ชุดนี้เสียบเข้าได้เลย)
- [ ] 🧹 orphan: `portfolio-allocation-chart.tsx` (donut เก่า ไม่มี importer แล้วหลัง allocation rewrite เป็น bar) · `portfolio-item.tsx`/`portfolio-summary.tsx` ฯลฯ ที่ลบไปแล้ว — ⚠️ เบสยืนยันก่อนลบ allocation-chart
- [x] **Single-screen redesign** (2026-07-02 · เบส: "สวย ใช้ง่าย ดูโปร") — เลิกแท็บ ภาพรวม|ข้อมูลเชิงลึก → หน้าจอเดียว: money band (hero scrub + chart) → KPI quartet 2×2 (มูลค่า·ต้นทุน·P/L·ROI) → context band (movers chips + game-filter chips) → holdings → insights grid (breakdown+allocation) · `mobile-card` เหลือ 2 บรรทัด · `loading.tsx`+`portfolio-mock-preview` เขียนใหม่ mirror layout · movers เพิ่ม variant `chips` · verify tsc0/lint0/test56/build✓ + Chrome desktop+390px · ไม่แตะ API/schema
- [x] **คืนแท็บ + multi-portfolio discoverable** (2026-07-02 เย็น · เบสสั่งต่อ) — แท็บ ภาพรวม|เชิงลึก กลับมาโดยคงของใหม่ (ภาพรวม = hero สด+KPI+chips+holdings · เชิงลึก = money band scrub+breakdown+movers+allocation) · switcher dropdown เพิ่ม "+ สร้างพอร์ตใหม่" (ชนลิมิต = Lock+PRO badge → upgrade dialog) + ตัวนับ "N/max พอร์ต" · selector ชนลิมิต = upsell block ชัดเจน · i18n ×4 key ใหม่ · verify ครบ + Chrome ทดสอบ upsell flow จริง (FREE 1/1)
- [x] ~~Wow pass — hero showcase~~ (2026-07-02 ค่ำ) — การ์ดพัด+glow+stagger · **เบสปัดตก "ไม่ดีเลย" → รื้อทิ้งหมดในรอบถัดไป**
- [x] **Minimal Editorial rebuild** (2026-07-02 ค่ำ · เบส: "impeccable + minimal เข้ากับหน้าแรก/card detail") — ติดตั้ง Impeccable (`.cursor/skills/impeccable` + PRODUCT.md + eslint ignore) · ลบ hero-showcase · underline tabs (pattern home) · hero บรรทัดเดียว + stat strip แบน (pattern card-detail) · movers inline text · game tabs กลับ toolbar · ตาราง +7d sparkline (CMC) · action icons ghost · insights flat (ถอด Surface movers/allocation) · skeleton+preview ตาม · verify: detect [] + tsc0/lint0/test56/build✓ + Chrome ครบ viewport
- [x] **Panel Layout restore** (2026-07-03 · เบสส่ง screenshot เว็บ live เดิม: "เอาแบบนี้ดีกว่าแบบเดิม แต่ทำให้ดีกว่าเดิม") — Minimal Editorial ถูกปัด กลับไปกู้โครง sidebar+panel จาก commit `09ae7e5` (ก่อนหน้านั้นถูกรื้อไปหลายรอบ) แล้วเสียบฟีเจอร์ใหม่ทั้งหมดเข้าที่เดิม:
  - **checkpoint commit** `6a15bbc` เก็บ Minimal Editorial ไว้เป็นประวัติก่อนรื้อ (กันงานหาย)
  - **โครงกลับมา**: header เต็ม (breadcrumb+h1+desc) · sidebar ซ้าย sticky 280px (panel "ทุกพอร์ต" + panel `PortfolioSidebar`) บน `lg:` · มือถือใช้ `PortfolioSwitcher` pill · แท็บ `SegmentedControl` ภาพรวม/เชิงลึก (กู้จาก `Surface`+`SegmentedControl` เดิม ไม่ใช่ underline)
  - **`portfolio-hero-panel.tsx` กู้คืน** (ไฟล์เคยลบไปตอน Minimal Editorial) — panel เดียว value+delta+4-stat (P/L·ต้นทุน·ดีที่สุด·แย่ที่สุด) · glow มุมยึดหลัก honest money เดิมอยู่แล้ว (ตามทิศ P/L จริง ไม่ใช่สีเกม) — คอมเมนต์เพิ่มอธิบายกฎให้ชัดกันมือถัดไปพลาด
  - **ภาพรวม tab**: hero panel → `PortfolioGameChips` (ย้ายออกจาก toolbar) → `PortfolioAssetsTable` (คงของใหม่ทั้งหมด: sparkline 7d, search/sort/bulk edit, mobile list 2 บรรทัด)
  - **เชิงลึก tab**: money band panel (hero scrub+chart) → แยกตามเกม → มูฟเวอร์ → สัดส่วน (คงเหมือนเดิม ครอบด้วย `Surface` panel)
  - `loading.tsx` + `portfolio-mock-preview.tsx` เขียนใหม่ mirror sidebar+panel (กัน layout jump ทั้ง route-level suspense และ logged-out preview)
  - ไม่แตะ API/hook/Prisma · ไม่มี bottom sheet ใหม่
  - verify: impeccable detect [] · tsc0 · lint 0 err (34 warning เดิม) · test 56/56 · build ✓ · Chrome จริง desktop 1512 (dark+light) + มือถือ 390px (ภาพรวม+เชิงลึก) เทียบ screenshot เว็บ live ตรงกัน
- [x] **Hub + Detail split** (2026-07-03 · เบส: "หน้าแรกเป็นหน้าเลือกพอร์ต+dashboard กดเข้าไปดูเต็ม") — panel-layout รอบก่อนถูกแทนด้วยโครง 2 ชั้นจริง:
  - `use-portfolio-api.ts`: param `activePortfolioId` (sync แบบ render-time adjust กัน lint set-state-in-effect) แทน auto-select-พอร์ตแรก · `toAssetRow`/`buildGameBreakdown` แยกเป็นฟังก์ชันกลาง → ต่อยอด `allAssets`/`allGameBreakdown` (cross-portfolio) · `portfolioMetas` +`previewItems` (thumbnail top 4)
  - `/portfolio` = hub ใหม่ทั้งหมด: dashboard hero (รวมทุกพอร์ต, glow ตาม P/L จริง) → grid การ์ดพอร์ต (`PortfolioHubCard` stretched-link pattern) → แยกตามเกม/มูฟเวอร์ข้ามพอร์ต (read-only — `PortfolioGameBreakdown.onSelect` เป็น optional แล้ว)
  - `/portfolio/[id]` ใหม่ (page + client): breadcrumb+switcher (`router.push` แทน setState) + แท็บเดิมครบ (hero panel/game chips/ตาราง/scrub chart/allocation) · ลบพอร์ตที่ดูอยู่ → เด้ง `/portfolio` · id ผิด → soft not-found + ปุ่มกลับ
  - loading.tsx ×2 + mock-preview ใหม่ตามโครง hub · i18n +4 key ×3
  - **การตัดสินใจเบี่ยงแผน**: ตัดปุ่ม "+เพิ่มการ์ด" ออกจาก hub hero ยกเว้นตอน 0 พอร์ต (กำกวมว่าจะเพิ่มเข้าพอร์ตไหนถ้ามีหลายพอร์ต) — เพิ่มการ์ดทำในหน้า detail แทน
  - verify: tsc0 · lint0 (เจอ+แก้ 1 error `set-state-in-effect`) · test56 · build✓ (route `/portfolio/[id]` ขึ้นจริง) · impeccable detect [] · curl smoke 4 route 200 · **⚠️ ยังไม่ได้เปิด Chrome จริงดู** (browser tool ไม่พร้อม session นี้ — เบสต้องเช็คเอง ดู PROGRESS.md)

### MINE multi-game UX (พอร์ต/แจ้งเตือน/รายการโปรด รองรับหลายเกม · workflow 7-agent + เว็บระดับโลก 2026-07-01 · เบสเคาะ "เริ่มเลย")
> หลักการเดียว: "ของฉัน" = กองเดียวรวมทุกเกมเป็น default · เกม = ป้าย+ตัวกรองในหน้า ไม่ใช่โหมด (Robinhood/Coinbase/Collectr) · header pill = แคตตาล็อกเท่านั้น ห้ามกรอง MINE เงียบๆ (NN/g "devastating")
- [x] **เฟส 1 — trust fixes โครงสร้าง (verify: tsc0/lint0err/test56/build✓)**: chip filter **แยกต่อหน้า** (local `useState` แทน shared `mineGameFilter` ใน ui-store — ลบทิ้ง + comment โกหกที่ว่า "header switcher ก็ขับ") · `useGameFilterReset` hook reset→"ทุกเกม" เมื่อเกม active หลุด data (กัน stale filter หลัง chip ซ่อน / cross-page dead-end) · **coming-soon teaser** ในราง chip (เกม comingSoon → ป้าย "เร็วๆ นี้" กดไป `/coming-soon` · เบสสั่ง)
- [x] **เฟส 1.5 — safe correctness subset (verify: tsc0/lint0/test56/build✓)**: **add-card/alert ค้นข้ามทุกเกม** (`<CardSearch game="all">` ใน watchlist-add-dialog + alert-create-dialog — เลิกล็อก currentGame เงียบๆ · เกมมาจากการ์ดที่เลือก) · **null-game fold** ใน `gameBreakdown` (การ์ดไม่มีเกม → fold เข้า DEFAULT_GAME เหมือน `scopedItems` → ยอด chip ตรงกับ hero)
- [x] **เฟส 2 — mock Pokémon + multi-game UI ที่เห็นได้จริง (verify: tsc0/lint0err/test56/build✓)** — เบสสั่ง "ทำต่อ + ขอ mockdata ก่อน":
  - **mock client-only** `src/lib/mock/multigame-demo.ts` — `?demo=multigame` inject Pokémon เข้า portfolio/watchlist/alerts (useSyncExternalStore · ไม่แตะ DB/schema · ลบง่ายตอนมี data จริง) · **inject เข้าผลลัพธ์ fetch ที่สำเร็จ → ต้อง login ถึงเห็น 2 เกม**
  - **badge เกมทุกแถว** (`GameBadge` กลาง · โชว์เมื่อ ≥2 เกม): portfolio list (desktop-row + mobile-card) · watchlist list · alert-row (grid = ใช้ chip rail แทน)
  - **ป้าย scope บน hero eyebrow** ("· Pokémon") + **ซ่อนกราฟตอนกรองเกม** + note `chartAllGamesOnly` (กราฟ = whole-portfolio history · scope per-game ยังไม่ได้ถ้าไม่แตะ DB — ซ่อนแทนโชว์ผิด) · derive `activeScrub` กัน stale
  - **teaser exclusion** — Pokémon เป็น chip จริงตอน demo → ไม่โชว์ teaser ซ้ำ
- [ ] **⛔ GATED — แตะ schema DB (เบสอนุมัติก่อน)**: (1) กราฟพอร์ต **per-game history จริง** — `PortfolioSnapshot` ไม่มี per-game (ตอนนี้ซ่อนกราฟตอนกรองแทน) · (2) หลาย named watchlist (watchlist ตอนนี้ list เดียว/user)
- [ ] **⏭️ เฟสถัดไป (ไม่เร่ง)**: จัดกลุ่ม alert เกม→set พับได้ · สร้าง alert จากกระดิ่งบนการ์ด (alert สร้างได้อยู่แล้ว) · ยอด sticky scroll (Coinbase) · ตัวเลขกำกับ chip · badge บน grid views · **ลบ mock demo เมื่อ Pokémon data จริงมา**

### Marketplace + escrow (effort สูงสุด · หลังเปิด backend flag)
- [ ] order book ต่อ SKU + 2 CTA (buy now/place bid) · `CustodyTimeline` + held hero · buyer protection · seller behavior badge · dispute flow [schema: MarketSku/Bid/escrow/SellerStats]

### Chat / Profile / Reputation
- [ ] sticky context card · offer/order → `EventCard` · accept = confirm sheet · inbox split (ซื้อ/ขาย/อัปเดต) · tier badge + stats sheet + auto-feedback cron

### PLAY — deck / meta / tier
- [ ] deck editor จอเดียว (ฆ่า modal-per-add) + stepper ≥44px + cost curve · deck cost → own/need → "ซื้อที่ขาด" → marketplace
- [ ] tier visual default (S/A/B/C leader art) + meta momentum · archetype "build this deck" funnel · `GameConfig`-parameterized

### Ads polish
- [ ] AdSlot `size`+skeleton (CLS 0) · AD_ZONES allowlist + ban-list **unit test** · `shouldRenderAdAt` cadence · promoted-listing governance (floor+cap+dedup)

### Multi-game (Pokémon)
- [ ] `GameConfig` (1 ไฟล์) + `/[game]/` middleware + switcher (สลับแล้วอยู่ feature เดิม) + per-game tint + all-games portfolio aggregate [schema: Game +fields · gameId NOT NULL]

## 🔴 M0 — บั๊ก/ของหลุดที่เจอจากการ audit (เร็ว ควรเก็บก่อน)
- [ ] **cron `leaderboard-rewards` ไม่ถูก schedule ใน `vercel.json`** — route มีจริง (`/api/cron/leaderboard-rewards`) แต่ไม่เคยรันอัตโนมัติ → Top-10 monthly payout อาจไม่เคยจ่าย · เพิ่ม schedule (เสนอ: วันที่ 1 ของเดือน หลัง draw-raffle) + ตรวจย้อนหลังว่าต้อง backfill รางวัลไหม
- [ ] งานใน working tree ค้าง commit (15 ไฟล์ raffle/header/i18n) — เก็บงานให้จบแล้ว commit

## 🎨 R — Refactor ทั้งระบบก่อน redesign (เบสสั่ง 2026-06-13 · "Refactor ก่อน เดี๋ยวค่อยปรับ Design")
> ผล audit 2026-06-13: conventions ส่วนใหญ่ดีแล้ว (apiHandler ครบ ยกเว้น webhook/cron ที่มี guard ของตัวเอง · Zod 57/64 mutation routes · ไม่มี desktop-first override · typography token ใช้แล้ว 823 จุด) — น้ำหนัก refactor จริงอยู่ที่โครง client code + convention ตกค้าง + i18n · ส่วนการเปลี่ยน IA/หน้าตา รอเฟส redesign

### R0 — Convention fixes (refactor-safe ไม่เปลี่ยน design)
- [x] เพิ่ม `/forgot-password` `/reset-password` เข้า `CHROMELESS_ROUTES` ใน `main-chrome.tsx` (ตอนนี้ได้ chrome เต็ม ขัดกับ login/register)
- [x] ตาราง drop-rate dialog `sets/[setCode]/set-page-client.tsx` — เพิ่ม list fallback ใต้ sm + hoist rows ใช้ร่วม table/list
- [x] ไล่เช็ค `overflow-x-auto` ~30 จุด non-admin แล้ว: ที่เหลือเป็น tab-scroll/carousel/prose ที่ตั้งใจ + ตารางมี `hidden sm:block` fallback อยู่แล้ว (trending-tabs, home-market-overview) — ไม่ต้องแก้เพิ่ม

### R1 — UI consistency (mechanical — กวาดทีเดียวจบ)
- [x] **Typography full sweep (workflow audit 2026-06-29 · 15 โซน · 91 findings · เบสสั่ง "ทำหมด")** ✅ 205 edits / 92 ไฟล์ · verify lint 0 err + test 56/56 + build ✓ · **แก้ครบ 91/91** (รวม 4 judgement-call ที่เบสเคาะ "แก้หมดให้จบ": badge→`.text-micro` · faq/related h2→h3 · reviews heading h5→h4 · settings title h2→h1) · **ยังไม่ commit** (กัน portfolio WIP อีกทีม) — ดึง role ที่ใช้ซ้ำกลับเข้า semantic token ทั้งเว็บ (ไม่รื้อดีไซน์):
  - 🔴 3 จุดแดง (อ่านออก/ลำดับชั้น): marketplace `listing-card:108` ชื่อจางกว่าคนขาย → `.text-h5` · blog `[slug]:174` `prose-sm`→`prose` · profile `reviews-preview` prose 13→15px + วันที่ 10→13px
  - 🟠 systemic: form label→`.text-label` (auth/seller/marketplace/admin/alert) · item title→`.text-h5` (honey/admin) · badge→`.text-micro` · section heading→`.text-h3` · price→`.font-price` · column header→`.text-eyebrow`
  - 🔵 primitives: Card/Dialog/Sheet title→`.text-h4` (weight unify) · button `text-[0.8rem]`→`text-sm` (arbitrary+inversion) · input→`text-base md:text-sm` (iOS-zoom guard)
  - ⚠️ ข้าม judgement-call (audit เอง flag "confirm intent/อาจตั้งใจ") + ห้ามแตะ `src/{components,app}/portfolio/`
  - verify: lint 0 + test pass + build ✓ ก่อนเคลมเสร็จ
- [x] typography residuals → token แล้ว: badge/pill `text-[10px]` → `.text-micro` (9 จุด) · overlay 9px → `.text-overlay` · auth hero `<h2>` → `.text-h1` (2) · ตัด weight ซ้ำ token (1) — ที่เหลือเป็นตัวเลข KPI ที่กติกาอนุญาต plain size (display token = 36-42px ใหญ่กว่าที่ design ใช้ ปล่อยไว้รอเฟส redesign เคาะ) · `portfolio-share-card` จงใจ style เองเพราะ export เป็นรูป — ไม่แตะ
- [x] **lint errors ทั้ง repo: 29 → 0** (พังมาก่อน refactor — rule react-hooks v6) · วิธีที่ใช้: mounted-flag → `useHydrated()` ใหม่ (`src/hooks/use-hydrated.ts`, useSyncExternalStore) · countdown/URL-sync/localStorage read → setState ใน timeout-0/rAF callback · latest-value ref → อัปเดตใน effect · `PrivacyFeedback` hoist เป็น module component · conditional hooks ใน `set-detail-content` hoist เหนือ early return · `Date.now()` ใน render → `daysSince`/`daysUntil` ใน `lib/utils/time.ts` · `window.location.href=` → `.assign()` · prefer-const ×2
- [ ] lint **warnings** เหลือ 81 (exhaustive-deps / unused-vars ส่วนใหญ่ในไฟล์เก่า) — ไล่เก็บเป็น batch แยก ก่อนตั้ง CI gate `--max-warnings 0`
- [ ] รวม empty-state: `shared/empty-state` + `kuma/kuma-empty-state` → ระบบเดียวมี variant (admin แยกไว้ได้)

### R2 — โครง client code (ลด friction ก่อน redesign)
- [x] สร้าง client fetch helper กลาง `src/lib/api/client.ts` (`apiFetch`/`apiGet`/`apiPost`/`apiPatch`/`apiDelete` + `ApiError(status)` + `apiTry`) คู่กับ `adminJsonFetch` เดิม · เพิ่ม `src/lib/api/shared-resource.ts` แทน module-cache ที่ copy-paste 4 สำเนา
- [x] migrate hooks ครบ 9 ตัวที่มี fetch: portfolio-api, header-data, settings, public-config, marketplace-fees, rank-tiers (→ useSyncExternalStore), honey-data (19 จุด), compare-data, market-cards — คงพฤติกรรม 401→signOut / 403→limitReached / AbortError เดิม
- [ ] migrate fetch ใน components ทีละ feature (~70 จุด): honey components → portfolio dialogs → marketplace → ที่เหลือ · **เริ่มแล้ว**: `profile/section-addresses.tsx` (reference pattern: JSON CRUD → apiGet/apiPost/apiPatch/apiDelete + apiTry) · ⚠️ FormData upload (cover/avatar) คง raw fetch ไว้ · auth-critical (profile-data-context 401→signOut) migrate ระวังเป็นพิเศษ
- [ ] รวม empty-state — **ทบทวนแล้ว: ไม่ทำในเฟส refactor** · `shared/EmptyState` (functional) กับ `kuma/KumaEmptyState` (branded emoji+motion+preset) ตั้งใจแยกบทบาทตาม doc comment · การยุบ = งาน design รอเฟส redesign
- [ ] แตก client components ยักษ์ แยก data hook ออกจาก presentation: `portfolio-client` 661 · `today-card` 645 · `compare-client` 629 · `price-hub` 567 · `honey-sidebar` 500 บรรทัด
- [ ] ลบ `src/lib/notifications.ts` (71 บรรทัด, 0 importer — superseded by `notify/dispatch`) ⚠️ เบสยืนยันก่อนลบ
- [ ] ยุบ re-export shims `tier.ts`/`tier-features.ts`/`plan-features.ts` (รวม 14 บรรทัด) ให้เหลือทางเข้าเดียว

### R3 — i18n hardening (ใหญ่ — ทำเป็น batch ราย feature)
- [ ] กวาด hardcoded ไทย + ternary `language === "TH" ? ...` ใน **152 ไฟล์** → `t()` keys (key parity 3 ภาษาเป๊ะ 1406 — อย่าให้พัง) · ลำดับ: layout → messages → marketplace → ที่เหลือ
- [ ] บังคับใช้ `utils/currency` formatting ทุกที่ (JPY/THB/USD — ห้าม format มือ)

### R4 — client→server pages (performance มือถือ — ท้ายสุด)
- [ ] หน้า client ล้วนที่ควรเป็น server-first: `settings/*` 9 หน้า · `saved` · `orders` · `seller/*` (เน้นหน้า first paint ช้าบน 4G)

## ✅ Redesign — เฟสแรก (เสร็จ + merge แล้ว · เก็บเป็น record)
> ป้าย P0–P4 = **ของเก่า ไม่ใช้ต่อ** · redesign รอบใหม่ = in-place (ดู §🎨 Redesign ด้านบน + [VISION.md](VISION.md)) · รายละเอียดเต็มใน git history + [doc/archive/REDESIGN.md](doc/archive/REDESIGN.md) · เก็บ checklist ข้างล่างไว้ดูว่าอะไรทำไปแล้ว

### P0 — Foundation (chrome / nav / tokens / primitives) · บล็อกทุก phase
**P0a — Nav IA foundation** ✅ verified, PR #7 เปิดแล้ว (branch `redesign/p0-nav-foundation`)
- [x] ui-store: เพิ่ม `currentGame` (+ partialize) — game-context พื้นฐาน (UI switcher จริงไว้ P4)
- [x] i18n: +6 keys ×3 ภาษา parity (browse/decksAndTools/deckBuilder/myDecks/metaCards/tierList · more/decks/market มีอยู่แล้ว)
- [x] bottom-nav: **freeze 5 tab** (Market·Browse·Decks·Portfolio·More) เลิก ternary marketplaceEnabled · ย้าย Search ออก (อยู่ header แล้ว) · badge → Portfolio
- [x] `/decks` hub page — tool grid (deck/drop calc, compare) + meta/tier/builder disabled "coming soon" + My Decks placeholder
- [x] header desktop: NAV_LINKS → Market/Browse/Decks · ตัด Tools dropdown (ย้ายเข้า hub) · marketplace append เมื่อ flag เปิด
- [x] mobile-menu-sheet: Tools section → ลิงก์เดียว "Decks & Tools" → /decks

**P0b — AdSlot + Consent** ✅ verified (branch `redesign/p0b-ads-consent`)
- [x] `<AdSlot placement>` — FREE-only + route-excluded (`src/components/ads/placements.ts`) + house-ad (Upgrade-to-Pro) · returns null เมื่อซ่อน (ไม่เหลือช่องว่าง) · AdSense path dormant จนตั้ง `NEXT_PUBLIC_ADSENSE_CLIENT`
- [x] `ConsentBanner` + `adConsent` ใน ui-store (persist) — dormant จน env ตั้ง (กัน nag ก่อน ads live) · ใช้ `useHydrated()`
- [x] billing/features: key `adFree` (PRO) + `featAdFree` i18n · migrate HomeAdCard → AdSlot · + mobile home AdSlot (แก้ ad lg:-only)

**P0c — polish** ✅ verified (branch `redesign/p0c-polish`)
- [x] command palette: เพิ่ม "Pages" nav shortcuts (Market/Browse/Decks/Portfolio/Watchlist/Trending/Compare/Honey/Settings) — ค้นหน้าได้ ไม่ใช่แค่การ์ด · keyboard nav รองรับ
- [x] footer มือถือเข้าถึงได้ (เลิก `hidden md:block` + pb clear bottom-nav)
- [x] design-token pass: `.text-price`/`.text-price-lg` (numeric mono) + `--game-accent` hook (default → primary, GameSwitcher set ตอน P4) — **adopt บน PriceTag ตอน P1**

→ **P0 จบครบ** (P0a nav + P0b ads + P0c polish)

### P1 — Core pages (doc/archive/REDESIGN.md §7) · เริ่มจากหน้าแย่สุด (card-detail)
**P1.1 — card-detail mobile** ✅ verified (branch `redesign/p1-card-detail`)
- [x] ย่อรูปการ์ดบนมือถือ (`max-w-[240px] sm:[320px] lg:none`) — ไม่กินทั้งจอแรก
- [x] reorder: image → header/actions/price/info → siblings (full-width) → related (เลิกดัน actions ใต้ siblings)
- [x] AdSlot `card-detail-mid` (หลัง price-hub, FREE only)
- [x] tap target primary CTA `h-11` บนมือถือ
**P1.2 — card-detail sticky bar** ✅ verified (branch `redesign/p1-card-detail-2`)
- [x] sticky action bar มือถือ (`CardDetailStickyBar`) — ราคา + Add-to-Portfolio ลอยเหนือ bottom-nav เสมอ · desktop ใช้ inline actions
- [~] **defer มีเหตุผล**: chart-collapse (quick-view ราคาอยู่บนสุดแล้ว + Recharts ใน collapsed เสี่ยง 0-width) · adopt `.text-price` (PriceDisplay มี size system อยู่แล้ว, force-swap = regress) → ทำตอนสร้าง price surface ใหม่
**P1.3 — ListRow primitive** ✅ verified (branch `redesign/p1-listrow`)
- [x] `src/components/ui/list-row.tsx` — interactive row primitive (`min-h-14` tap target, focus-visible ring, leading/title/subtitle/trailing/chevron slots, Link/button/div)
- [x] adopt ใน `CardListRow` (CardTable mobile fallback) → ได้ทั่ว cards/sets/trending ทันที
- note: `MobileAssetCard` (PnL+notes+edit) / `OrderCard` (status header + actions footer) เป็น multi-section card จริง — คงเป็น bespoke (ไม่ force เข้า row primitive)
**P1.4 — cards browse (HomeMarketOverview)** ✅ verified (branch `redesign/p1-cards-browse`)
- หมายเหตุ: `/cards` redirect → `/` · การ browse จริงคือ `HomeMarketOverview` บนหน้าแรก
- [x] filter → **bottom sheet** (เลิก inline horizontal-scroll bar ที่กินความกว้างมือถือ — AGENTS anti-pattern) · chips wrap · ปุ่ม "ดูผลลัพธ์"
- [x] AdSlot `browse-in-feed` ใน mobile list (กลาง list, FREE only)
- [x] i18n +1 (applyFilters) parity 1493
- [ ] (option) set-picker บนมือถือ (ตอนนี้ `hidden sm:block`) → ใส่ใน filter sheet · grid view AdSlot

**P1.5 — sets page** ✅ verified (branch `redesign/p1-sets`)
- หมายเหตุ: sets page ออกแบบดีอยู่แล้ว (type pills tab-scroll, grid mobile-first, SetCard) — ปรับเฉพาะจุด
- [x] adopt `ListRow` ใน most-valuable list (reuse primitive: tap target + focus ring + leading rank/thumb)
- [x] AdSlot `browse-in-feed` คั่นระหว่าง most-valuable กับ grouped sets
- note: type pills (horizontal scroll) เป็น tab-scroll ที่ตั้งใจ (ไม่ใช่ anti-pattern) — คงไว้

→ **P1 ครอบคลุมหน้าหลักแล้ว** (card-detail, cards-browse, sets) · เหลือ polish ปลีกย่อย

### P2 — Portfolio & tools (doc/archive/REDESIGN.md §7)
**P2.1 — portfolio** ✅ verified (branch `redesign/p2-portfolio`)
- หมายเหตุ: portfolio ผ่าน single-screen redesign แล้ว (2026-07-02 · เลิกแท็บ → หน้าจอเดียว money band → KPI → context → holdings → insights · ดู §Portfolio ด้านบน)
- [x] PortfolioHero stat row (PnL/cost/best/worst) **ยุบ default บนมือถือ** + ปุ่ม "ดูรายละเอียด" · value+PnL pill โชว์เสมอ · desktop กางเต็ม (holdings เร็วขึ้นตาม audit)
**P2.2 — tools tap targets** ✅ verified (branch `redesign/p2-tools`)
- หมายเหตุ: drop-calc มี mobile tabs (cards/results) + lg grid อยู่แล้ว, deck-calc ใช้ list — mobile-structured พอควร (audit "form-heavy table" ไม่ตรงโค้ดจริง)
- [x] drop-calc purchase-config quantity stepper `size-7→size-9` + input `h-7→h-9` (fat-finger fix ตาม audit)
- [x] want-list remove button `p-0.5→p-1.5` + aria-label
- [ ] (option) watchlist / saved / compare review · card-picker rarity chips py-1→py-1.5

→ **P2 ครอบคลุมแล้ว** (portfolio + tools) · core mobile UI redesign (P0+P1+P2) เสร็จเป็นกอบเป็นกำ

### P4 — Multi-game / Pokémon (doc/archive/REDESIGN.md §5.1) · เบสเคาะ: per-game · ขยาย enum · อนุมัติ schema
**P4.1 — GameSwitcher + Pokémon stub** ✅ verified (branch `redesign/p4-game-switcher`) — โค้ดล้วน ไม่แตะ DB
- [x] `pokemon.ts` stub (comingSoon) + register ใน GAME_CONFIGS · `getActiveGameConfigs()` · GameConfig +flags (shortName/comingSoon/supports*/deckRules)
- [x] `GameSwitcher` pill ใน header (มือถือ+desktop) — OPCG active, Pokémon disabled "เร็วๆ นี้" · ใช้ `currentGame` (persist) · i18n chooseGame

**P4.2 — schema migration (additive, prod-safe)** ✅ code verified · 🔵 deploy (เบสเลือก C: ผม run migrate deploy)
- [x] `gameId Int?` (nullable) + FK SetNull + index บน **Card / Portfolio / Deck / Listing / YuyuteiMapping / SnkrdunkMapping** · Game back-relations
- [x] migration `20260614000000_add_game_scoping` (ADD COLUMN + INDEX + FK ล้วน, transaction-safe) · `prisma generate` + build ✓
- [~] **defer ไป P4.3** (ลด prod risk): `CardType` enum ขยาย (ALTER TYPE รันใน tx ไม่ได้) · backfill gameId · NOT NULL + `@@unique([gameId,cardCode])` — ทำหลัง Pokémon data
- [x] **deployed เข้า Supabase prod แล้ว** (2026-06-14) — apply ผ่าน `prisma db execute` + `migrate resolve --applied` (option 1: ไม่แตะ drift) · verify gameId มีครบ 6 ตาราง

**P4.3 — `/[game]/` URL namespace (เบสสั่ง 2026-06-30 "URL แยกเกมทั้งแอป · ทำ UI ก่อน")**
- [x] **routing core (Phase 1)** ✅ — กลยุทธ์ middleware-rewrite + cookie/header resolver (mirror `getServerLanguage` · ไม่ย้าย 102 route จริง · ไม่แก้ 180 ลิงก์): `src/lib/game/{constants,server}.ts` (GAME_COOKIE/HEADER · GAME_SCOPED_SEGMENTS allowlist · `getServerGame()`) · middleware: `/opcg/x` rewrite→flat `/x` + inject `x-game` + cookie · legacy `/x` redirect→`/{currentGame}/x` (ลิงก์เก่าใช้ได้หมด · namespace ทั้งแอปทันที) · `updateSession` refactor backward-compat รองรับ rewrite (auth ไม่พัง) · GameSwitcher นำทาง swap segment
- [x] **verify (Phase 1)** ✅ — build ✓ · live curl matrix 2 รอบ (bypass on/off): `/portfolio`→307→`/opcg/portfolio` · `/opcg/portfolio`→200 · `/all/portfolio`→200 · `/sets`→307→`/opcg/sets` · `/messages`→302→login (auth ไม่พัง) · `/settings`/`/honey`/`/api`/`/` flat ไม่แตะ · ไม่มี loop · `kuma-game` cookie set ถูก
- [~] **Phase 2 (per-page scoping)** — **portfolio ✅**: `useGameScope()` อ่าน game จาก URL · `usePortfolioApi(scope)` filter assets/stats/allocation ตามเกม (gameBreakdown คง cross-game) · `/all/portfolio`=รวมทุกเกม+breakdown · `/opcg`=scope เกมเดียว · `/pokemon`=empty state · verify lint0/tsc/test56/build + curl 4 route 200 · **เหลือ:** sets/cards/search/trending/compare/watchlist/decks อ่าน `getServerGame()` (server) · sitemap/canonical → prefixed · 307→308 ตอน stable · rename `middleware.ts`→`proxy.ts` (Next16)
- [ ] **DEFER (data)** — backfill `Card.gameId` (จาก set.game) + NOT NULL + `@@unique([gameId,cardCode])` · ขยาย CardType enum · Pokémon sets/rarities/pull-rate + scraper (ต้องหาแหล่งข้อมูล Pokémon ก่อน)

## 🧹 Declutter audit (screenshot ทุกหน้า mobile+desktop ผ่าน 2 workflows) — เบสเลือก B (live pages ก่อน, marketplace=P3 ทีหลัง)
> ผล: 10 high + 48 med · card-detail/drop-calc สะอาด (5/5) · home รกสุด (2/5) · JSON: /tmp/{mobile,desktop}-findings.json
- [x] **Batch 1 — Home declutter** (branch `redesign/declutter-home`): market-overview toolbar wrap 2-row มือถือ · featured-card stack · mini-table tap (min-h-11) · hero-search submit px-4 sm:px-6 · verify ✓
- [x] **Batch 2 — Toolbar pattern: ตรวจแล้ว set-detail/trending/watchlist wrap (flex-col/flex-wrap) ดีอยู่แล้ว** — agent over-flag จากภาพแน่น แต่โค้ดถูก · ไม่แก้ (home ตัวเดียวที่ต้องแก้ = batch 1 แล้ว)
- [x] **Batch 3+4 — tap target + token sweep** (branch `redesign/declutter-sweep`): compare X 32→36px · related-pages/faq h2 → `.text-h2` · blog badge → `.text-micro` · login labels → `.text-label` · ข้าม 15px=15px swap ที่ไม่เปลี่ยนภาพ · verify ✓
- [ ] **Batch 5 — Honey declutter (มือถือ)**: status cards ยุบ 1 บรรทัด
- [ ] **Batch 6 — Desktop balance**: card-detail price-hub · drop-calc sidebar · login left-panel · guide featured
- [ ] (เก็บตก) decks + deck-calc 2 หน้า mobile review schema พลาด — รีวิวซ้ำ

## 🔧 M5 — Prisma migration drift (เก็บกวาด, ไม่เร่ง แต่ควรเคลียร์)
> เจอตอน P4.2 deploy · drift มีมาก่อน ไม่ใช่จาก redesign
- [ ] DB มี `20260422000000_add_saved_profile` แต่ไม่มีในโฟลเดอร์ repo · repo มี `20260429000000_drop_watchlist_note_target` ที่ DB ยังไม่ mark applied
- [ ] สืบ + `migrate resolve` ให้ตรงความจริง DB (น่าจะ resolve --applied drop_watchlist ถ้า column ถูก drop จริงแล้ว · เพิ่ม/หา add_saved_profile migration) → ให้ `migrate status` สะอาด
- [ ] ⚠️ แตะ DB จริง — ทำตอนมีเวลา + backup

### ค้างจาก audit (ทำตอน redesign แต่ละหน้า)
- Honey nav มือถือ: 7 แท็บไอคอนล้วนไม่มี label (`honey-tab-nav.tsx:159`) + scroll แนวนอน (→ P5)
- card-detail หนาแน่น/ปุ่มใต้ fold (→ P1) · portfolio scroll ลึก (→ P2)

## M1 — Honey: เก็บงานค้างจาก rebalance v2 (`doc/honey-economy-rebalance.md` §9)
- [ ] Achievement unlock toast — ยังไม่มี component แจ้งตอนปลดล็อก
- [ ] Physical prize fulfillment — flow เก็บที่อยู่จัดส่งผู้ชนะ raffle (ผูก `ShippingAddress` ที่มีอยู่แล้วได้)
- [ ] Featured-slot curation UI ใน `/admin/honey` — API พร้อมแล้ว (`featuredUntil`) แต่ไม่มีหน้า admin
- [ ] (future) Anti-abuse score model

## M2 — HoneyActionType migration (`doc/honey-action-type-migration.md` — ค้าง phase 4 ทั้งก้อน ทำเป็นชุดเดียว)
> ตอนนี้ freeze ด้วย runtime guard เท่านั้น enum เก่ายังอยู่ใน schema
- [ ] Step 1: เพิ่มคอลัมน์ `legacyType String?` บน `HoneyTransaction`
- [ ] Step 2: backfill SQL ย้ายค่าเก่า → `legacyType`
- [ ] Step 3: drop enum members เก่า (raw SQL ALTER TYPE)
- [ ] Step 4: ปรับ read site ใน `/admin/honey` ให้ fallback ไป `legacyType`
- [ ] ⚠️ ทั้งชุดแตะ DB จริง — เบสอนุมัติก่อนรัน migration

## M3 — Marketplace launch prep (โค้ดเสร็จแล้ว ปิด flag อยู่ · ค้างจาก `doc/MARKETPLACE_OVERHAUL.md`)
- [ ] ตัดสินใจ: เปิด `marketplaceEnabled` เมื่อไหร่ + เกณฑ์พร้อม (งานธุรกิจ — เบสเคาะ)
- [ ] auto-complete order: DELIVERED → COMPLETED หลัง X วัน (ตรวจว่ามี cron หรือยัง — น่าจะยังไม่มี)
- [ ] `OrderEvent` model — audit log การเปลี่ยน status ของ order
- [ ] DISPUTED status + mediation flow
- [ ] Escrow release จริง (เงินเข้าผู้ขายเมื่อ COMPLETED — ต้อง Stripe Connect)
- [ ] (optional) `/checkout/[orderId]` แยกหน้า + Cart ซื้อหลายใบร้านเดียว

## M4 — สุขภาพ docs (กัน AI/คนอ่านแล้วหลงทาง)
- [ ] อัปเดต `doc/data-pipeline.md`: รูปขึ้น **Cloudflare R2** แล้ว (ไม่ใช่ Supabase Storage) + เพิ่มส่วน SNKRDUNK pipeline + ชี้ cron จริงใน vercel.json
- [ ] ตัดสินใจชะตา `data/cards-official/` (5.1MB ไม่มีโค้ดอ้าง — snapshot เก่า?) — เบสเคาะ: ลบ หรือเก็บเป็น archive

## ถัดไป (north star — ยังไม่เริ่ม อย่าหยิบเองโดยเบสไม่สั่ง)
- [ ] แหล่งราคาเพิ่ม (Mercari/eBay JP) · Multi-TCG (seed-games.ts พร้อมแล้ว) · PWA · Lifetime deal
