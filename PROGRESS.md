# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-07-16 — **รวม Portfolio Hub เข้าหน้ารายละเอียดแล้ว; Search/Watchlist worktree เดิมยังอยู่ครบ**

## ✅ Portfolio gateway → Detail

- `/portfolio` เป็น Server gateway: guest เห็น Login Gate + detail-shaped preview, ผู้ใช้ที่ไม่มีพอร์ตเห็น Empty State จุดเดียว และผู้ใช้ที่มีพอร์ตถูก redirect แบบชั่วคราวไปพอร์ตล่าสุด
- cookie `portfolio-last-active` อายุหนึ่งปีใช้หลังตรวจ ownership เท่านั้น; stale/foreign id fallback ด้วย `updatedAt desc, id desc` และ malformed detail id จบเป็น 404 แทน render loop
- Detail ตัด breadcrumb/back ที่วนกลับ gateway; switcher แสดงชื่อ+privacy โดยไม่ซ้ำยอด Hero และ accessible name บอกสถานะปัจจุบันครบ TH/EN/JP
- mobile/desktop management รวม switch, rename, privacy และ delete ของทุกพอร์ต; public ต้องยืนยัน, failure คงฟอร์ม/rollback และ delete current ใช้ replace ไปพอร์ตข้างเคียงหรือ Empty State
- Create จาก Empty/Switcher ไป `/portfolio/[id]?add=1`, เปิด batch picker ทันทีและล้าง query เมื่อปิด; Add dialog กับ Create dialog คืน focus ไป trigger ที่ยังมองเห็น
- Detail/root loading และ guest preview ใช้ skeleton ทรงเดียวกัน; mobile footer ครอบคลุม `/portfolio/[id]` และ global nav ยังชี้ canonical `/portfolio`
- history request มี revision guard กันข้อมูลพอร์ตเก่าทับพอร์ตใหม่; hide balance persist ข้าม detail/reload และ financial completeness guards เดิมยังอยู่ครบ
- Manager files เดิมถูกถอดจาก runtime แต่ยังไม่ลบตามกฎ repo; ไม่มี schema, migration, dependency หรือ config ใหม่ และงาน Search/Watchlist ไม่ถูกทับ

## ✅ Watchlist Selected-Tab Edge Alignment

- สาเหตุจาก Watchlist TabsList ถูก canonical orientation class บังคับเหลือ 32px แต่ trigger สูง 44px และ underline ยังถูกเลื่อนลง `-5px`; เส้น active จึงลอยต่ำกว่า baseline และดูเป็นเส้นสองชั้น
- แก้เฉพาะ caller Watchlist: ใช้ orientation modifier ที่ตรงกับ base เพื่อให้ `tailwind-merge` แทนความสูงเป็น 44px ใต้ `md` / 36px ตั้งแต่ `md` และย้าย active underline มา `bottom: 0`
- ไม่แก้ canonical `Tabs` กลาง จึงไม่เปลี่ยน default tabs ใน Notification Bell; ไม่เพิ่ม `overflow-hidden` ที่จะตัด focus ring และไม่เปลี่ยน URL/query helper
- เพิ่ม `watchlist-tabs.test.tsx` ล็อกว่า class `h-8`/`bottom-[-5px]` ถูกตัดออกจาก markup จริง และ class responsive/`bottom-0` อยู่ครบ

## ✅ Watchlist Minimal Hierarchy

- เทียบ DOM/geometry กับหน้าแรกแล้วเลือก grammar เดียวกัน: title/action → tabs baseline → browse controls → context/display → flat results; ไม่ยก hero/marketing density ของ Home มาใส่ utility page
- ตัด breadcrumb ที่ซ้ำกับ global navigation, ลด CTA เพิ่มการ์ด/สร้างแจ้งเตือนเป็น outline และคง selected-tab indicator ที่แนบ baseline 44/36px จากรอบก่อน
- Search/Set/Sort/Filter อยู่ browse row เดียวตั้งแต่ `md`; แถวถัดไปรวม count + period icon + List/Grid/Edit และรับ game rail เป็น context ฝั่งซ้ายเมื่อมีหลายเกมจริง
- Watchlist/Alerts ซ่อน game rail เมื่อมีข้อมูลเพียงเกมเดียว เพราะ “ทุกเกม + One Piece + Pokémon เร็ว ๆ นี้” ไม่ได้เป็นตัวเลือกข้อมูลจริง; `demo=multigame` และบัญชีที่มีหลายเกมยังเห็น All/One Piece/Pokémon ครบ
- Desktop list เอา `.panel`, shadow, rounded box และพื้นหัวตารางออก; ลดรูป 56→48px, ไม่แบ่งเส้นทุกแถว และเหลือ Card / Price / Change / Actions บน canvas
- History render เฉพาะเมื่อมี sparkline จริง; status ไม่แสดงขีดว่างและย้าย pin/bell มาอยู่ข้าง More action จึงไม่เสียคอลัมน์ทั้งช่อง
- Mobile คง grouped panel/tap target 44px และ List/Grid/Edit อยู่บรรทัดเดียวที่ 390px; 320px ใช้ local horizontal containment ไม่ทำให้ document overflow
- Loading skeleton และ guest preview mirror โครงใหม่; เพิ่ม `watchlist-list-view.test.tsx` ล็อก flat desktop + conditional history

## ✅ Watchlist Flat Results-First

- รวมหน้าเป็น H1 เดียว + canonical Tabs; `?tab=alerts` รักษา query อื่น และ CTA หัวหน้าเปลี่ยนตามแท็บ/สถานะข้อมูลโดยไม่ซ้ำกับ EmptyState
- Cards เหลือ H1 → Tabs → game rail → controls → results; เอา context/summary Surface, จำนวนการ์ด/แจ้งเตือน/ปักหมุด, มูลค่าราคาอ้างอิง และ mover chips ออกจาก runtime ทั้งก้อน
- Mobile toolbar เป็น Search/Set + Sort/Filter สองแถว; desktop รวมเป็นแถวเดียว; SetPicker เลือกทีละชุดตามเกมและ reset เมื่อชุดไม่อยู่ในเกมใหม่
- Search/Set คงกรอบเด่น; Sort/Filter กลับเป็น canonical soft style และ input Search มี hit area จริง 44px ใต้ `md`
- หัวผลลัพธ์แสดง count จุดเดียว + period 24h/7d/30d; มือถือวาง List/Grid/Edit แถวถัดไป, `sm+` รวมแถวเดียว และ edit mode แทนหัวทั้งหมดด้วย selection bar
- FilterModal ใช้ draft จริง: Apply เท่านั้นที่ commit, Reset ล้าง draft, X/Escape ยกเลิก; movement ใช้ SegmentedControl พร้อม arrow-key semantics
- Mobile List เปิดรายละเอียดจากพื้นที่หลักทั้งแถว; `sm+` เป็น semantic table; Grid เหลือ Compare + More; edit mode มี selection bar จุดเดียว
- แยก error/empty/filtered-empty พร้อม Retry/Clear all และปรับ skeleton/mock ให้ตรง list/table ใหม่
- Alerts ตัดหัว “จัดการแจ้งเตือนราคา”/subtitle ที่ซ้ำออก; Active/History เป็น semantic H2 พร้อม count, game rail ไม่มี count ซ้ำ และ touch target ใต้ `md` ≥44px
- sync เพิ่ม/ลบกับ `watchlist-store`; optimistic rollback คืนทั้งรายการ/store/selection, background refresh ไม่ถอด dialog และ load/mutation guard กัน GET เก่า, skeleton ค้าง และ refresh/DELETE หลังออกจากหน้า
- skeleton/mock mirror layout ใหม่และไม่มี summary value จำลอง; เพิ่ม regression tests สำหรับ period 3 ค่า, selected range, selection replacement และ Alerts H2

## ✅ Canonical compact controls + game rail

- `SegmentedControl` แบบ period/range ใช้ compact visual shell กลางโดยอัตโนมัติ: ใต้ `md` คงพื้นที่กด 44px และตั้งแต่ `md` จึงยุบเป็น 28px; Pricing cadence opt out เพราะตั้งใจเป็น control เด่น
- `ViewModeControl` ใช้ icon 16px และกรอบ active 36×36px ภายใน hit area 44×44px; icon-only ไม่ render hidden label flex child ที่เคยดัน SVG ซ้าย 2px แต่ยังมีชื่อครบผ่าน `aria-label`, ส่วน `showLabels` ยัง render ข้อความตามเดิม
- Watchlist period 24h/7d/30d ใช้ `TrendingUpDown` นำหน้าเหมือน Home/Search/Trending/Set; mock/skeleton ปรับสัดส่วนตาม โดยไม่เปลี่ยนค่าเริ่มต้น 7d หรือ behavior การกรอง
- `ToolbarSortDropdown`/`FilterButton` ใต้ `md` ใช้ hit target 44px + painted frame 36px เหมือนกัน และล็อกข้อความไม่ให้แตกสองบรรทัดช่วง 640–767px
- `GameFilterChips` กลางยังแสดง “ทุกเกม” + เกมจริงตั้งแต่มีข้อมูลเกมแรกและรองรับ teaser/keyboard ครบ; รอบ minimal เปลี่ยนเฉพาะ Watchlist/Alerts caller ให้ mount component นี้เมื่อมีหลายเกมจริงเท่านั้น
- หน้ารายละเอียดการ์ดเปลี่ยนช่วงกราฟ 7D/1M/3M/1Y/All มาใช้ component กลาง; Compare/Portfolio จำกัด overflow ไว้ในแถว control เองเพื่อไม่ดันทั้งหน้า
- Pricing ที่ตั้งใจใช้ pill เด่นยังคง hit target 44px จนถึง `md`; Portfolio empty range เลื่อนได้และ radio ทั้ง 6 ค่า disabled จริงแทนปุ่มหลอก
- mock/skeleton Watchlist สะท้อนสัดส่วนใหม่ และเพิ่ม regression tests ของ period default, view/toolbar geometry, single/multi/zero-game rail, keyboard และชื่อจาก config

## ✅ Search worktree ที่รักษาไว้

- เพิ่ม `appearance="outline"` แบบ opt-in ให้ `FilterButton` และ `ToolbarSortDropdown`: กรอบใช้ semantic `border-border`, พื้น `bg-background`, ข้อความเต็ม `text-foreground` และ icon Sort ใช้ `text-muted-foreground`
- เปิด outline เฉพาะ `/opcg/search`: Filter + Sort ใน toolbar ผลค้นหา และ Sort ของ mobile list; default ของ component กลางยังเป็น soft จึงไม่เปลี่ยน toolbar หน้า Home/Watchlist/Portfolio/Marketplace
- `MarketTable` รับ `mobileSortAppearance` โดย default เป็น `soft`; Search เป็น caller ที่เลือก `outline` เอง ป้องกัน shared component เปลี่ยนหน้าตาเงียบๆ ในอนาคต
- คง geometry compact เดิม: มือถือ hitbox 44px / visual frame 36px; ตั้งแต่ `sm:` ขึ้นไปยังใช้ความสูง desktop เดิม
- เพิ่ม `toolbar.test.tsx` 4 tests ล็อก default soft, outline frame, active filter/count และ Sort outline
- เอา `overflow-hidden` ออกจาก controls Surface ของ Search เพียงตัวเดียว เพื่อให้ SetPicker popup `z-30` ยื่นเหนือผลลัพธ์ได้; เพิ่ม `rounded-b-lg` ที่ toolbar row เพื่อรักษามุมล่างเดิม และไม่แตะ table Surface ที่ยังต้อง clip แถว/หัวตาราง
- งาน facet Search + game scope + multicolor gradient จากรอบก่อนยังอยู่ใน working tree เดียวกันและผ่าน verification ร่วมกัน

## ✅ หลักฐาน verify ล่าสุด

- Browser `/portfolio`:
  - root redirect ไป `/portfolio/1`; Back จาก gateway กลับ `/watchlist` ทันทีโดยไม่วน และ global nav บน detail ยัง active ที่ canonical `/portfolio`
  - `/portfolio/foo` แสดง Not Found หนึ่งครั้ง, URL นิ่งและไม่มี console error; switcher อ่านว่า “สลับพอร์ต: Test, สาธารณะ”
  - `?add=1` เปิด picker อัตโนมัติ, Escape ล้าง query และปิด dialog; เปิดด้วยปุ่มแล้ว focus กลับ “เพิ่มการ์ด”
  - switcher trigger ไม่มีมูลค่าซ้ำ, management menu 44×44px, rename form/Upgrade dialog/delete guard เปิดและคืน focus ถูกต้องโดยไม่แก้ข้อมูลจริง
  - 390/640/768/1440px ไม่มี horizontal overflow; footer ซ่อนใต้ `md`, Add target ≥44px ใต้ `md`, TH/EN/JP และ Light/Dark ผ่าน runtime
  - hide balance อยู่ข้าม reload และคืนค่าเดิมแล้ว; console มี 0 error (เหลือ warning รูป logo เดิม 1 จุด)
  - บัญชี browser เป็น Free 1/1 จึงล็อก create-success, multi-switch และ delete current/last ด้วย unit/component tests แทนการเปลี่ยนข้อมูลจริง

- Browser `/watchlist` minimal hierarchy:
  - Cards list ที่ 390/640/768/1440px ทั้ง Light/Dark ไม่มี horizontal overflow/console error; result เริ่ม y≈354px ใต้ `md` และ y≈331px ตั้งแต่ `md` (เดิมภาพผู้ใช้ desktop ≈418px, mobile ≈458px)
  - Desktop table เป็น canvas จริง ไม่มี panel/หัวสี; runtime ที่ไม่มี sparkline เหลือ Card / Price / Change / Actions และ pin/bell รวมอยู่ใน action cell
  - เกมเดียวไม่ render game rail; `?demo=multigame` ที่ 390/640/768/1440px แสดง All/One Piece/Pokémon ครบ, ไม่มี overflow และ result เริ่ม y≈406px ใต้ `md` / 331px ตั้งแต่ `md`
  - Grid ที่ 390/1440px แสดงแทน table ถูกต้องและเริ่มระดับเดียวกับ List; Alerts normal/multigame ที่ 390/1440px ทั้ง Light/Dark ไม่มี overflow/console error
  - controls ที่มองเห็นทั้งหมดใต้ `md` ≥44×44px; edit selection bar 4 ปุ่มสูง 44px, FilterModal เปิด/Escape/คืน focus ถูกต้อง และ ArrowRight เปลี่ยน period 7d→30d
  - selected tab ยังได้ list=trigger 44px ใต้ `md` / 36px ตั้งแต่ `md`; period icon และ ViewMode alignment จากรอบก่อนยังอยู่ครบ

- Browser representative shared callers:
  - Home และ Search: ViewMode 44px ที่ 390/640px, ยุบเป็น 28px ที่ 768px และไม่มี horizontal overflow; Home icon-only center delta 0px และ Search `showLabels` ยังแสดง “ตาราง/กริด” ครบ
  - Card Detail: range 7D/1M/3M/1Y/All สูง 44px ที่ 390px, 28px ที่ 768px; ArrowRight เปลี่ยน 1M→3M ได้
  - Pricing: monthly/yearly สูง 44px ที่ 640px และยุบเป็น 28px ที่ 768px โดยไม่มี overflow

- Browser `/opcg/search?q=op13`:
  - 390px Light/Dark: Filter 90×44px, mobile Sort 160×44px, visual frame 36px, ไม่มี horizontal overflow
  - 768px Light/Dark: Filter/Sort ยังคงสูง 32px; Dark = พื้น `#100C09` + border warm-white 12%, Light = พื้นขาว + border `#E5D9CE`
  - 1440px Light/Dark: controls แสดงครบและ document ไม่ล้นแนวนอน
  - Filter modal และ Sort menu เปิดได้; Escape ปิดและคืน `aria-expanded=false`
- Browser SetPicker `/opcg/search?q=op13`:
  - ก่อนแก้: popup สูง 183px (`z-index: 30`) แต่ controls Surface จบที่ y=346 พร้อม `overflow:hidden`; hit-test ใต้ขอบไม่เจอ popup
  - หลังแก้ 320/390/768px ทั้ง Light/Dark: hit-test ใต้ Surface เจอ element ใน popup, trigger/popup กว้างเท่ากัน, popup อยู่เหนือผลลัพธ์ และ toolbar ยังมี radius 12px
  - เลือก OP13 แล้ว popup ปิด/กรองต่อได้; คลิกนอกแล้วปิด; table Surface ยังมี `overflow-hidden`; console 0 errors
- `npm run lint` — ผ่านด้วย **0 errors**, เหลือ warning เดิม 30 จุด
- `npm run test` — **52 files, 270/270 tests ผ่าน**
- `npx tsc --noEmit` — ผ่าน
- `npm run build` — ผ่าน, Next.js 16.2.1 สร้าง **156/156 pages**
- `git diff --check` — ผ่าน

## ⚠️ ขอบเขตการตรวจ

- รอบ Gateway ไม่แตะ Prisma schema/migration, dependency, config หรือสูตรหน่วยเงิน; การคำนวณ average cost เมื่อเพิ่มสำเนาซ้ำยังเป็นงานบัญชีแยก
- history snapshot เดิมไม่มี price/cost coverage จึงตั้งใจไม่คำนวณ historical P/L ตอน scrub; งานเพิ่ม coverage ใน snapshot/weekly digest เป็น scope แยก
- รอบ alignment follow-up แตะเฉพาะ explicit `label: null` ของ icon-only ViewMode, conditional label wrapper ใน `SegmentedControl`, Watchlist period icon และ mock/skeleton/tests; ไม่แตะ API, schema, migration, dependency หรือ config
- รอบ canonical-control แตะเฉพาะ `SegmentedControl`, `ViewModeControl`, `GameFilterChips`, game label config และ caller ที่เกี่ยวข้อง; ไม่แตะ API, Prisma schema/migration, dependency, config หรือ Search behavior
- ไม่แก้ `Button` กลาง, schema, migration, dependency หรือ config
- สี/กรอบใหม่เป็น opt-in เฉพาะ Search; default soft ถูกล็อกด้วย regression test
- ไม่ทำ portal และไม่แก้ SetPicker กลาง เพราะสาเหตุเป็น clipping เฉพาะ Search; overflow 2px ที่ 320px มีเท่ากันตอน popup เปิด/ปิด จึงเป็น layout เดิมและไม่ได้เกิดจาก SF5
- warning เดิมเรื่อง `middleware` convention deprecated เป็นงานแยก
- Browser Gateway/Detail ผ่าน TH/EN/JP, Light/Dark, keyboard/focus และ console 0 errors; create-success/multi/delete-last ใช้ regression tests เพราะบัญชี browser เต็ม Free quota
- รอบ selected-tab แตะเฉพาะ geometry class ใน Watchlist caller + regression test; ไม่แก้ canonical Tabs, API, schema, migration, dependency หรือ config
- รอบ Watchlist minimal แตะเฉพาะ route composition/caller/list presentation/loading-preview/tests; ไม่แก้ canonical GameFilterChips/SegmentedControl/ViewMode, API, schema, migration, dependency หรือ config และไม่ทับ Portfolio worktree
- Vercel CLI ในเครื่องยังเป็น 55.0.0; แนะนำอัปเกรดเป็น 56.2.1+ ก่อน deploy รอบถัดไปด้วย `npm i -g vercel@latest` (ยังไม่ได้รันเพราะเป็น global dependency)

## ⏭️ NEXT

1. เบสรีวิว `/portfolio` ที่ root และ detail ว่า flow รวมหน้าแล้วตรงใจหรือยัง; งานยังไม่ได้ stage, commit หรือ push
2. ก่อน deploy อัปเกรด Vercel CLI `55.0.0 → 56.2.1+` ด้วย `npm i -g vercel@latest` แล้ว smoke `/portfolio` และ `/watchlist` บน deployment จริง

## แหล่งอ้างอิง

- แผนแม่บท: `doc/uxui-refactor-plan.md`
- หลักฐาน audit: `doc/uxui-audit-findings-2026-07-04.md`
- Canonical kit: `AGENTS.md` §Component Kit
